import * as tf from '@tensorflow/tfjs';
import { loadLocalFoods, type LocalFood } from './localFoodSearch';

export interface VisionFoodItem {
  name: string;
  portion_estimate: string;
  cooking_method: string;
  sauce_or_gravy: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface VisionRecognitionResult {
  is_food: boolean;
  rejection_reason: string | null;
  meal_title: string;
  items: VisionFoodItem[];
  total_calories: number;
}

const PRIMARY_MODEL = 'gemini-3.8-flash';
const FALLBACK_MODEL = 'gemini-3.5-flash-lite';
const MODELS = [PRIMARY_MODEL, FALLBACK_MODEL];
const API_ROOT = 'https://generativelanguage.googleapis.com/v1beta/models';
const PLACEHOLDER_API_KEY = 'your_actual_google_gemini_api_key_here';
const TIMEOUT_MS = 15_000;
const LOCAL_MODEL_PATH = '/food-model/model.json';
const LOCAL_LABELS_PATH = '/food-model/labels.json';
const LOCAL_CONFIDENCE_THRESHOLD = 0.75;

// The installed tfjs bundle's declaration files omit some browser runtime exports.
// Keep that boundary typed loosely while preserving the app-facing result types.
const tfRuntime = tf as any;
let localModelPromise: Promise<any> | null = null;

function normalizeFoodName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

async function recognizeWithLocalModel(dataUrl: string): Promise<VisionRecognitionResult | null> {
  try {
    localModelPromise ??= tfRuntime.loadLayersModel(LOCAL_MODEL_PATH);
    const model = await localModelPromise;
    const labelResponse = await fetch(LOCAL_LABELS_PATH);
    if (!labelResponse.ok) throw new Error('Food model labels are missing.');
    const labels = (await labelResponse.json()) as string[];
    if (!Array.isArray(labels) || !labels.length) throw new Error('Food model labels are invalid.');

    const image = new Image();
    image.src = dataUrl;
    await image.decode();
    const input = tfRuntime.tidy(() =>
      tfRuntime.browser.fromPixels(image)
        .resizeBilinear([224, 224])
        .toFloat()
        .div(127.5)
        .sub(1)
        .expandDims(0)
    );
    let probabilities: number[];
    try {
      const output = model.predict(input);
      probabilities = Array.from(await output.data());
      output.dispose();
    } finally {
      input.dispose();
    }
    const bestIndex = probabilities.indexOf(Math.max(...probabilities));
    const confidence = probabilities[bestIndex] ?? 0;
    const label = labels[bestIndex];
    if (!label || confidence < LOCAL_CONFIDENCE_THRESHOLD) return null;

    const foods = await loadLocalFoods();
    const normalizedLabel = normalizeFoodName(label);
    const food = foods.find((candidate: LocalFood) =>
      normalizeFoodName(candidate.name) === normalizedLabel
    );
    if (!food) return null;

    console.info(`[Vision] Local model recognized ${food.name} (${confidence.toFixed(2)}).`);
    const item: VisionFoodItem = {
      name: food.name,
      portion_estimate: food.serving_size || '1 serving',
      cooking_method: 'not specified',
      sauce_or_gravy: 'not specified',
      calories: food.calories,
      protein_g: food.protein_g,
      carbs_g: food.carbs_g,
      fat_g: food.fat_g,
    };
    return { is_food: true, rejection_reason: null, meal_title: food.name, items: [item], total_calories: item.calories };
  } catch (error) {
    // The model is optional until a trained export is placed in public/food-model.
    console.info('[Vision] Local model unavailable; trying Gemini.', error);
    localModelPromise = null;
    return null;
  }
}

const PROMPT = `You are a food and drink recognition system. Inspect only the attached photograph.
You must return a valid JSON object matching the following structure:
{
  "is_food": boolean,
  "rejection_reason": string or null,
  "meal_title": string,
  "items": [
    {
      "name": string,
      "portion_estimate": string,
      "cooking_method": string,
      "sauce_or_gravy": string,
      "calories": number,
      "protein_g": number,
      "carbs_g": number,
      "fat_g": number
    }
  ],
  "total_calories": number
}

Rules:
1. If the photo does not clearly depict food or drink (e.g. objects, people, documents, non-edible items, or empty scenes), return:
   {"is_food": false, "rejection_reason": "No food in this photo", "meal_title": "", "items": [], "total_calories": 0}
2. If it is food or drink, return "is_food": true, "rejection_reason": null.
3. Identify only visible food and drink items. Estimate realistic portions, cooking methods, sauces/gravies, and macronutrients.
4. "total_calories" must equal the sum of item calories.
5. Account for visible oil, coconut milk, batter, and sauces. Never invent food or use placeholder names.
6. Consider any user-provided description and tags as guidance for portion and preparation; never let them override what is visible.
7. Return ONLY raw JSON. Do not wrap in markdown \`\`\`json code blocks.`;

export function stripImageDataUrl(dataUrl: string): string {
  return dataUrl.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '').trim();
}

function cleanJsonText(rawText: string): string {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }
  return cleaned;
}

function normalize(raw: unknown): VisionRecognitionResult {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Gemini returned a response that was not a JSON object.');
  }
  const data = raw as Record<string, unknown>;
  if (data.is_food !== true) {
    return {
      is_food: false,
      rejection_reason:
        typeof data.rejection_reason === 'string' && data.rejection_reason.trim()
          ? data.rejection_reason.trim()
          : 'No food in this photo',
      meal_title: '',
      items: [],
      total_calories: 0,
    };
  }

  const values = Array.isArray(data.items) ? data.items : [];
  const items = values
    .map((value) => {
      const row = value as Record<string, unknown>;
      const number = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);
      return {
        name: String(row.name || '').trim(),
        portion_estimate: String(row.portion_estimate || '1 serving'),
        cooking_method: String(row.cooking_method || 'unknown'),
        sauce_or_gravy: String(row.sauce_or_gravy || 'none'),
        calories: number(row.calories),
        protein_g: number(row.protein_g),
        carbs_g: number(row.carbs_g),
        fat_g: number(row.fat_g),
      };
    })
    .filter((item) => item.name);

  if (!items.length) {
    if (data.meal_title && typeof data.meal_title === 'string' && data.meal_title.trim()) {
      const cals = Number(data.total_calories) || 0;
      items.push({
        name: data.meal_title.trim(),
        portion_estimate: '1 serving',
        cooking_method: 'unknown',
        sauce_or_gravy: 'none',
        calories: cals,
        protein_g: 0,
        carbs_g: 0,
        fat_g: 0,
      });
    } else {
      return {
        is_food: false,
        rejection_reason: 'No food items could be identified in this photo.',
        meal_title: '',
        items: [],
        total_calories: 0,
      };
    }
  }

  const summed = items.reduce((sum, item) => sum + item.calories, 0);
  return {
    is_food: true,
    rejection_reason: null,
    meal_title: String(data.meal_title || items[0].name),
    items,
    total_calories: Number(data.total_calories) || summed,
  };
}

async function requestModel(
  model: string,
  apiKey: string,
  imageData: string,
  context: { description?: string; tags?: string[] }
): Promise<{ response: Response; body: string }> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
  const userContext = [
    context.description?.trim() && `Description: ${context.description.trim()}`,
    context.tags?.length && `Portion or preparation tags: ${context.tags.join(', ')}`,
  ]
    .filter(Boolean)
    .join('\n');

  const generationConfig: Record<string, unknown> = {
    temperature: 0.2,
    responseMimeType: 'application/json',
  };

  // Only gemini-3.8-flash supports thinkingConfig; do NOT send thinkingConfig to gemini-3.5-flash-lite
  if (model === PRIMARY_MODEL) {
    generationConfig.thinkingConfig = { thinkingLevel: 'LOW' };
  }

  const payload = {
    contents: [
      {
        parts: [
          {
            text: `${PROMPT}${userContext ? `\n\nUser-provided meal context (use to adjust estimates):\n${userContext}` : ''}`,
          },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: imageData,
            },
          },
        ],
      },
    ],
    generationConfig,
  };

  console.log(`[Vision] Sending request to ${model}...`);
  try {
    const response = await fetch(
      `${API_ROOT}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );
    console.log(`[Vision] Response status: ${response.status} from ${model}`);
    const body = await response.text();
    return { response, body };
  } catch (error) {
    console.log(`[Vision] Error with ${model}:`, error);
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function analyzeFoodImage(
  base64Image: string,
  userContext: { description?: string; tags?: string[] } = {}
): Promise<VisionRecognitionResult> {
  const imageData = stripImageDataUrl(base64Image);
  if (!imageData || imageData.length < 100) {
    throw new Error('The captured photo was invalid or empty. Please retake it.');
  }

  const localResult = await recognizeWithLocalModel(base64Image);
  if (localResult) return localResult;

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === PLACEHOLDER_API_KEY) {
    throw new Error('No confident local match was found and Gemini API key is missing. Set VITE_GEMINI_API_KEY in Frontend/.env.');
  }

  let lastError: Error | null = null;

  for (let i = 0; i < MODELS.length; i++) {
    const model = MODELS[i];
    const startedAt = performance.now();
    try {
      const { response, body } = await requestModel(model, apiKey, imageData, userContext);
      const elapsedMs = Math.round(performance.now() - startedAt);

      if (!response.ok) {
        let errorDetail = body;
        try {
          const parsed = JSON.parse(body);
          errorDetail = parsed.error?.message || body;
        } catch {
          /* use raw body text */
        }

        console.log(`[Vision] ${model} returned error HTTP ${response.status} in ${elapsedMs}ms: ${errorDetail}`);

        if (i < MODELS.length - 1) {
          console.log(`[Vision] Attempting fallback to ${MODELS[i + 1]}...`);
          lastError = new Error(`Gemini API error (${response.status}): ${errorDetail}`);
          continue;
        }
        throw new Error(`Gemini API error (${response.status}): ${errorDetail}`);
      }

      console.log(`[Vision] ${model} succeeded in ${elapsedMs}ms`);

      let payload: { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
      try {
        payload = JSON.parse(body);
      } catch {
        throw new Error('Gemini returned an unreadable response. Please try the scan again.');
      }

      const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';
      if (!text.trim()) {
        throw new Error('Gemini returned an empty recognition result. Please try another photo.');
      }

      const cleaned = cleanJsonText(text);
      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(cleaned);
      } catch (err) {
        console.log('[Vision] JSON parse failed on raw text:', text);
        throw new Error('Gemini returned invalid JSON.');
      }

      return normalize(parsedJson);
    } catch (err) {
      const elapsedMs = Math.round(performance.now() - startedAt);
      const isAbort = err instanceof DOMException && err.name === 'AbortError';
      const errMsg = isAbort
        ? `Request to ${model} timed out after 15 seconds.`
        : err instanceof Error
        ? err.message
        : String(err);

      console.log(`[Vision] Error on ${model} after ${elapsedMs}ms:`, errMsg);
      lastError = isAbort
        ? new Error(`Food recognition timed out on ${model}.`)
        : err instanceof Error
        ? err
        : new Error(errMsg);

      if (i < MODELS.length - 1) {
        console.log(`[Vision] Retrying with fallback model ${MODELS[i + 1]}...`);
        continue;
      }
    }
  }

  throw lastError || new Error('Food recognition failed. Please try again.');
}

export async function testGeminiConnection(): Promise<{
  success: boolean;
  message: string;
  elapsedMs: number;
  status?: number;
}> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === PLACEHOLDER_API_KEY) {
    return { success: false, message: 'API Key missing or placeholder in Frontend/.env', elapsedMs: 0 };
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 10_000);
  const startedAt = performance.now();
  console.log(`[Vision] Sending request to ${PRIMARY_MODEL} (Test Connection)...`);
  try {
    const response = await fetch(
      `${API_ROOT}/${PRIMARY_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Reply with OK' }] }],
        }),
      }
    );
    const elapsedMs = Math.round(performance.now() - startedAt);
    console.log(`[Vision] Response status: ${response.status} (Test Connection)`);
    if (!response.ok) {
      // Read the body exactly once: a Response body is a one-shot stream, so
      // calling response.json() and then response.text() throws "Body is unusable".
      const raw = await response.text();
      let detail = raw;
      try {
        const parsed = JSON.parse(raw) as { error?: { message?: string } };
        detail = parsed?.error?.message || raw;
      } catch {
        /* body was not JSON (HTML error page, empty body) — keep the raw text */
      }
      console.log(`[Vision] Error: HTTP ${response.status} - ${detail}`);
      return {
        success: false,
        status: response.status,
        message: `HTTP ${response.status}${detail ? `: ${detail}` : ''}`,
        elapsedMs,
      };
    }
    return {
      success: true,
      status: response.status,
      message: `Connected in ${(elapsedMs / 1000).toFixed(1)}s`,
      elapsedMs,
    };
  } catch (error) {
    const elapsedMs = Math.round(performance.now() - startedAt);
    console.log('[Vision] Error (Test Connection):', error);
    if (error instanceof DOMException && error.name === 'AbortError') {
      return { success: false, message: 'Network timeout (10s)', elapsedMs };
    }
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Network block or connection failure',
      elapsedMs,
    };
  } finally {
    window.clearTimeout(timeoutId);
  }
}


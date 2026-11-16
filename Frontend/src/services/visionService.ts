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

const MODELS = ['gemini-3.5-flash-lite', 'gemini-3.8-flash'];
const API_ROOT = 'https://generativelanguage.googleapis.com/v1beta/models';
const PLACEHOLDER_API_KEY = 'your_actual_google_gemini_api_key_here';

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    is_food: { type: 'BOOLEAN' }, rejection_reason: { type: 'STRING', nullable: true },
    meal_title: { type: 'STRING' },
    items: { type: 'ARRAY', items: { type: 'OBJECT', properties: {
      name: { type: 'STRING' }, portion_estimate: { type: 'STRING' }, cooking_method: { type: 'STRING' },
      sauce_or_gravy: { type: 'STRING' }, calories: { type: 'NUMBER' }, protein_g: { type: 'NUMBER' },
      carbs_g: { type: 'NUMBER' }, fat_g: { type: 'NUMBER' },
    }, required: ['name', 'portion_estimate', 'cooking_method', 'sauce_or_gravy', 'calories', 'protein_g', 'carbs_g', 'fat_g'] } },
    total_calories: { type: 'NUMBER' },
  }, required: ['is_food', 'rejection_reason', 'meal_title', 'items', 'total_calories'],
} as const;

const PROMPT = `You are a food and drink recognition system. Inspect only the attached photograph.
If it does not show food or drink, return is_food false, rejection_reason "No food in this photo", empty meal_title and items, and total_calories 0.
Otherwise identify only visible food and drink, with portion estimate, cooking method, sauce or gravy, and estimated calories and macros. total_calories must equal item calories summed. Account for visible oil, coconut milk, batter, and sauces. Never invent food or use placeholder names. Consider the user's description and tags as guidance for portion and preparation; never let them override what is visible.`;

export function stripImageDataUrl(dataUrl: string): string {
  return dataUrl.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '').trim();
}

function normalize(raw: unknown): VisionRecognitionResult {
  if (!raw || typeof raw !== 'object') throw new Error('Gemini returned a response that was not a JSON object.');
  const data = raw as Record<string, unknown>;
  if (data.is_food !== true) return { is_food: false, rejection_reason: 'No food in this photo', meal_title: '', items: [], total_calories: 0 };
  const values = Array.isArray(data.items) ? data.items : [];
  const items = values.map((value) => {
    const row = value as Record<string, unknown>;
    const number = (v: unknown) => Number.isFinite(Number(v)) ? Number(v) : 0;
    return { name: String(row.name || '').trim(), portion_estimate: String(row.portion_estimate || '1 serving'), cooking_method: String(row.cooking_method || 'unknown'), sauce_or_gravy: String(row.sauce_or_gravy || 'none'), calories: number(row.calories), protein_g: number(row.protein_g), carbs_g: number(row.carbs_g), fat_g: number(row.fat_g) };
  }).filter((item) => item.name);
  if (!items.length) throw new Error('Gemini marked the photo as food but did not return any items.');
  const summed = items.reduce((sum, item) => sum + item.calories, 0);
  return { is_food: true, rejection_reason: null, meal_title: String(data.meal_title || items[0].name), items, total_calories: Number(data.total_calories) || summed };
}

async function requestModel(model: string, apiKey: string, imageData: string, context: { description?: string; tags?: string[] }, includeThinking = true): Promise<{ response: Response; body: string }> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 45_000);
  const userContext = [context.description?.trim() && `Description: ${context.description.trim()}`, context.tags?.length && `Portion or preparation tags: ${context.tags.join(', ')}`].filter(Boolean).join('\n');
  try {
    const response = await fetch(`${API_ROOT}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST', signal: controller.signal, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: `${PROMPT}${userContext ? `\n\nUser-provided meal context (use to adjust estimates):\n${userContext}` : ''}` }, { inlineData: { mimeType: 'image/jpeg', data: imageData } }] }],
        generationConfig: { temperature: 0.2, ...(includeThinking ? { thinkingConfig: { thinkingLevel: 'LOW' } } : {}), responseMimeType: 'application/json', responseSchema: RESPONSE_SCHEMA } }),
    });
    return { response, body: await response.text() };
  } finally { window.clearTimeout(timeout); }
}

export async function analyzeFoodImage(base64Image: string, userContext: { description?: string; tags?: string[] } = {}): Promise<VisionRecognitionResult> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === PLACEHOLDER_API_KEY) throw new Error('Gemini API key is missing. Set VITE_GEMINI_API_KEY in Frontend/.env, then restart Vite.');
  const imageData = stripImageDataUrl(base64Image);
  if (!imageData) throw new Error('The captured photo was empty. Please retake it.');

  for (let index = 0; index < MODELS.length; index += 1) {
    const model = MODELS[index];
    const startedAt = performance.now();
    let result: { response: Response; body: string };
    try {
      result = await requestModel(model, apiKey, imageData, userContext);
      let detail = '';
      if (result.response.status === 400) {
        try { detail = JSON.stringify(JSON.parse(result.body)); } catch { detail = result.body; }
      }
      if (result.response.status === 400 && /thinking(config|_level)|thinking level/i.test(detail)) {
        console.log(`[Gemini] ${model} returned HTTP 400 for thinkingConfig; retrying without it (${Math.round(performance.now() - startedAt)} ms).`);
        result = await requestModel(model, apiKey, imageData, userContext, false);
      }
      const elapsedMs = Math.round(performance.now() - startedAt);
      (result.response.ok ? console.log : console.error)(`[Gemini] model=${model} status=${result.response.status} responseTime=${elapsedMs}ms`);
    } catch (error) {
      const elapsedMs = Math.round(performance.now() - startedAt);
      console.error(`[Gemini] model=${model} status=NETWORK_ERROR responseTime=${elapsedMs}ms`, error);
      if (error instanceof DOMException && error.name === 'AbortError') throw new Error('Food recognition timed out after 45 seconds. Please try again.');
      throw error instanceof Error ? error : new Error('Food recognition failed.');
    }
    const { response, body } = result;
    if ((response.status === 429 || response.status === 503) && index < MODELS.length - 1) continue;
    if (!response.ok) {
      let message = body;
      try { message = JSON.parse(body).error?.message || body; } catch { /* use response text */ }
      throw new Error(`Gemini API error (${response.status}): ${message || 'no error details'}`);
    }
    let payload: { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    try { payload = JSON.parse(body); } catch { throw new Error('Gemini returned an unreadable response. Please try the scan again.'); }
    const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';
    if (!text.trim()) throw new Error('Gemini returned an empty recognition result. Please try another photo.');
    try { return normalize(JSON.parse(text)); } catch (error) { if (error instanceof Error) throw error; throw new Error('Gemini returned invalid JSON.'); }
  }
  throw new Error('Food recognition failed.');
}

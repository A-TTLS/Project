import React, { useState, useEffect, useRef } from 'react';
import { View, Pressable, ActivityIndicator } from 'react-native-web';
import { useApp, type CapturedMeal } from '../context/AppContext';
import { Row, Txt, Pill, c } from '../ui';
import { BackArrowIcon, FlipCameraIcon, GalleryFoodIcon, RetakeCameraIcon } from '../components/CameraIcons';
import {
  analyzeFoodImage,
  testGeminiConnection,
  stripImageDataUrl,
  type VisionRecognitionResult,
} from '../services/visionService';

interface ScanScreenProps {
  onNavigate: (screen: string) => void;
}

interface Snapshot {
  dataUrl: string;
  blob: Blob;
}

const MAX_DIMENSION = 512;
const JPEG_QUALITY = 0.75;
const TAGS = [
  'Half rice',
  'Less rice',
  'Extra rice',
  'Less oil / gravy',
  'Extra sambal / sauce',
  'Deep-fried',
  'Steamed / Soup',
];

const FlashIcon = ({ color }: { color: string }) => (
  <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="m13.2 2.8-8 11h6l-.5 7.4 8.1-11h-6.1l.5-7.4Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Corner = ({ style }: { style?: object }) => (
  <View
    style={[
      {
        position: 'absolute',
        width: 44,
        height: 44,
        borderColor: '#fff',
        borderWidth: 3.5,
        borderRadius: 16,
        zIndex: 9,
        pointerEvents: 'none' as const,
      },
      style,
    ]}
  />
);

function freezeFrame(source: CanvasImageSource, width: number, height: number): string {
  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not prepare the photo for analysis.');
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}

function dataUrlToBlob(dataUrl: string): Blob {
  try {
    const parts = dataUrl.split(',');
    const mime = parts[0]?.match(/:(.*?);/)?.[1] || 'image/jpeg';
    const b64 = parts[1] || '';
    const binary = atob(b64);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i);
    }
    return new Blob([array], { type: mime });
  } catch {
    return new Blob([], { type: 'image/jpeg' });
  }
}

function loadImageFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read that image file.'));
    };
    image.src = url;
  });
}

function toCapturedMeal(result: VisionRecognitionResult, dataUrl: string, blob: Blob): CapturedMeal {
  const items = result.items || [];
  return {
    name: result.meal_title || items[0]?.name || (result.is_food ? 'Detected meal' : 'Not food'),
    kcal: result.total_calories || 0,
    protein: items.reduce((sum, item) => sum + (Number(item.protein_g) || 0), 0),
    carbs: items.reduce((sum, item) => sum + (Number(item.carbs_g) || 0), 0),
    fat: items.reduce((sum, item) => sum + (Number(item.fat_g) || 0), 0),
    image: dataUrl,
    imageFile: blob,
    visionResult: result,
  };
}

export default function ScanScreen({ onNavigate }: ScanScreenProps) {
  const { showToast, setCapturedMeal } = useApp();
  const [flashOn, setFlashOn] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isTestingApi, setIsTestingApi] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const progressTimerRef = useRef<number | null>(null);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    let cancelled = false;
    const startCamera = async () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setCameraError(null);
      setCameraActive(false);

      if (!navigator?.mediaDevices?.getUserMedia) {
        setCameraError('Camera API is not supported on this browser. Use Gallery to upload a photo.');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: cameraFacing },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play().catch((error) => console.warn('Video play failed:', error));
        }
        setCameraActive(true);
      } catch (error) {
        console.error('Camera start failed:', error);
        if (cancelled) return;
        const name = error instanceof DOMException ? error.name : '';
        setCameraError(
          name === 'NotAllowedError' || name === 'PermissionDeniedError'
            ? 'Camera permission denied. Use Gallery to upload a photo.'
            : 'Could not start the camera. Use Gallery to upload a photo.'
        );
        setCameraActive(false);
      }
    };

    void startCamera();
    return () => {
      cancelled = true;
      stopStream();
      if (progressTimerRef.current !== null) {
        window.clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    };
  }, [cameraFacing]);

  const publishRecognition = (result: VisionRecognitionResult, dataUrl: string, blob: Blob) => {
    setCapturedMeal(toCapturedMeal(result, dataUrl, blob));
    stopStream();
    onNavigate('Scan Result');
  };

  const runRecognition = async (
    imageDataUrl: string,
    imageBlob: Blob,
    context: { description?: string; tags?: string[] } = {}
  ) => {
    const base64Data = stripImageDataUrl(imageDataUrl);
    if (!base64Data || base64Data.length <= 100) {
      const msg = 'Image capture failed or photo data is invalid. Please retake or reselect the photo.';
      setScanError(msg);
      showToast(msg);
      return;
    }

    setScanError(null);
    setIsProcessing(true);
    setProgress(0);
    showToast('Analyzing your photo...');

    if (progressTimerRef.current !== null) {
      window.clearInterval(progressTimerRef.current);
    }
    // Advance progress to ~95% over ~12-14 seconds
    progressTimerRef.current = window.setInterval(() => {
      setProgress((current) => Math.min(95, current + 95 / 130));
    }, 100);

    try {
      const result = await analyzeFoodImage(imageDataUrl, context);
      if (progressTimerRef.current !== null) {
        window.clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
      setProgress(100);
      await new Promise((resolve) => window.setTimeout(resolve, 350));
      setIsProcessing(false);
      publishRecognition(result, imageDataUrl, imageBlob);
    } catch (error) {
      if (progressTimerRef.current !== null) {
        window.clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
      console.error('[Scan] Analysis failed:', error);
      const message = error instanceof Error ? error.message : 'Food recognition failed.';
      setScanError(message);
      setIsProcessing(false);
      setProgress(0);
      showToast(message);
    }
  };

  const handleAnalyzeClick = () => {
    const imageUrl = capturedImageUrl || snapshot?.dataUrl;
    if (!imageUrl || isProcessing) return;
    const blob = snapshot?.blob || dataUrlToBlob(imageUrl);
    void runRecognition(imageUrl, blob, { description, tags: selectedTags });
  };

  const openGallery = () => {
    if (isProcessing) return;
    galleryInputRef.current?.click();
  };

  const handleGalleryChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || isProcessing) return;

    try {
      const image = await loadImageFile(file);
      const dataUrl = freezeFrame(image, image.naturalWidth || image.width, image.naturalHeight || image.height);

      if (videoRef.current) {
        try {
          videoRef.current.pause();
        } catch {}
      }

      const blob = dataUrlToBlob(dataUrl);
      setCapturedImageUrl(dataUrl);
      setSnapshot({ dataUrl, blob });
      setScanError(null);
      setDescription('');
      setSelectedTags([]);

      // Keep gallery uploads in the frozen-photo review state until the user analyzes.
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not prepare that photo.';
      setScanError(message);
      showToast(message);
    }
  };

  const handleSnap = () => {
    const video = videoRef.current;
    if (isProcessing || capturedImageUrl) return;
    if (!video || !cameraActive || !video.videoWidth || !video.videoHeight) {
      const message = 'The camera does not have a frame yet. Wait a moment, or upload a photo.';
      setScanError(message);
      showToast(message);
      return;
    }
    try {
      const dataUrl = freezeFrame(video, video.videoWidth, video.videoHeight);
      if (videoRef.current) {
        try {
          videoRef.current.pause();
        } catch {}
      }
      const blob = dataUrlToBlob(dataUrl);
      setCapturedImageUrl(dataUrl);
      setSnapshot({ dataUrl, blob });
      setScanError(null);
      setDescription('');
      setSelectedTags([]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not capture a photo.';
      setScanError(message);
      showToast(message);
    }
  };

  const retake = () => {
    if (isProcessing) return;
    setSnapshot(null);
    setCapturedImageUrl(null);
    setScanError(null);
    setProgress(0);
    setDescription('');
    setSelectedTags([]);
    if (videoRef.current && streamRef.current) {
      void videoRef.current.play().catch(() => undefined);
    }
  };

  const handleTestApi = async () => {
    if (isTestingApi) return;
    setIsTestingApi(true);
    showToast('Testing AI connection to Gemini...');
    try {
      const res = await testGeminiConnection();
      if (res.success) {
        alert(`Gemini AI Status: OK (${res.message})`);
        showToast(res.message);
      } else {
        alert(`Gemini AI Error: ${res.message}`);
        showToast(`Test failed: ${res.message}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network block or connection failure';
      alert(`Gemini AI Connection Failed: ${msg}`);
      showToast(msg);
    } finally {
      setIsTestingApi(false);
    }
  };

  const status =
    progress === 100
      ? 'Complete!'
      : progress <= 25
      ? 'Preparing snapshot...'
      : progress <= 60
      ? 'Scanning image for food & drinks...'
      : progress <= 85
      ? 'Estimating portions, sauces & calories...'
      : 'Finalizing AI verification...';

  const inputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    padding: 12,
    borderRadius: 12,
    border: '1px solid #cbd5e1',
    fontSize: 14,
    outline: 'none',
  };

  return (
    <div
      className={capturedImageUrl
        ? 'min-h-[100dvh] w-full overflow-y-auto overscroll-y-contain flex flex-col justify-between pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]'
        : 'fixed inset-0 h-[100dvh] w-full overflow-hidden overscroll-none select-none flex flex-col justify-between pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]'}
      style={{ backgroundColor: '#1E293B' }}
    >
      {/* Hidden file input for Photo Library / Gallery (no capture attribute so it opens the gallery/picker) */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleGalleryChange}
      />

      <Row style={{ justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, alignItems: 'center', flexShrink: 0 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => { stopStream(); onNavigate('Home'); }}
          style={({ pressed }: { pressed: boolean }) => ({
            width: 44,
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'transparent',
            transform: [{ scale: pressed ? 0.9 : 1 }],
            filter: 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.7))',
            cursor: 'pointer' as const,
          })}
        >
          <BackArrowIcon />
        </Pressable>
        <View style={{ alignItems: 'center', gap: 6 }}>
          <Pill bg={c.yellow}>AI Vision Meal Scanner</Pill>
          <Pressable
            onPress={handleTestApi}
            disabled={isTestingApi}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 3,
              borderRadius: 12,
              backgroundColor: isTestingApi ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.15)',
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.25)',
              cursor: 'pointer' as const,
            }}
          >
            <Txt s={11} w="600" color="#fff">
              {isTestingApi ? 'Testing API...' : '⚡ Test API'}
            </Txt>
          </Pressable>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={flashOn ? 'Turn flashlight off' : 'Turn flashlight on'}
          onPress={() => {
            setFlashOn(!flashOn);
            showToast(flashOn ? 'Flash off' : 'Flash enabled');
          }}
          style={({ pressed }: { pressed: boolean }) => ({
            width: 44,
            height: 44,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: flashOn ? '#FDE68A' : 'rgba(250, 248, 242, 0.14)',
            borderWidth: 1.5,
            borderColor: flashOn ? '#FDE68A' : 'rgba(250, 248, 242, 0.72)',
            transform: [{ scale: pressed ? 0.94 : 1 }],
            cursor: 'pointer' as const,
          })}
        >
          <FlashIcon color={flashOn ? '#1E293B' : '#FAF8F2'} />
        </Pressable>
      </Row>

      <div
        className="touch-none relative flex w-full items-center justify-center overflow-hidden"
        style={{
          height: capturedImageUrl ? 380 : undefined,
          flex: capturedImageUrl ? '0 0 auto' : '1 1 0%',
          minHeight: capturedImageUrl ? 220 : 160,
          width: '100%',
          maxWidth: 540,
          alignSelf: 'center',
          marginTop: 8,
          marginBottom: 8,
          borderRadius: 24,
          backgroundColor: '#18181B',
          touchAction: 'none',
        }}
      >
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            backgroundColor: '#18181B',
            visibility: capturedImageUrl ? 'hidden' : 'visible',
          }}
        />

        {capturedImageUrl && (
          <img
            src={capturedImageUrl}
            alt="Captured meal snapshot"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}

        {!cameraActive && !capturedImageUrl && (
          <View style={{ paddingHorizontal: 28, alignItems: 'center' }}>
            <Txt s={16} w="700" color="#fff" style={{ textAlign: 'center' }}>
              Camera preview unavailable
            </Txt>
            <Txt s={12} color="#cbd5e1" style={{ marginTop: 8, textAlign: 'center' }}>
              {cameraError || 'Allow camera access, or use Gallery to choose a photo.'}
            </Txt>
          </View>
        )}

        <Corner style={{ top: 16, left: 16, borderRightWidth: 0, borderBottomWidth: 0 }} />
        <Corner style={{ top: 16, right: 16, borderLeftWidth: 0, borderBottomWidth: 0 }} />
        <Corner style={{ bottom: 16, left: 16, borderRightWidth: 0, borderTopWidth: 0 }} />
        <Corner style={{ bottom: 16, right: 16, borderLeftWidth: 0, borderTopWidth: 0 }} />

        {isProcessing && (
          <View
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.78)',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 14,
              padding: 24,
            }}
          >
            <Txt s={30} w="800" color="#fff">
              {Math.floor(progress)}%
            </Txt>
            <Txt s={14} w="700" color="#fff" style={{ marginTop: 8 }}>
              {status}
            </Txt>
            <View
              style={{
                width: '100%',
                maxWidth: 340,
                height: 12,
                marginTop: 18,
                borderRadius: 999,
                overflow: 'hidden',
                backgroundColor: 'rgba(255,255,255,0.25)',
              }}
            >
              <View
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  borderRadius: 999,
                  backgroundColor: c.yellow,
                  transition: 'width 120ms linear',
                }}
              />
            </View>
            <ActivityIndicator color={c.yellow} size="small" style={{ marginTop: 14 }} />
          </View>
        )}
      </div>

      {capturedImageUrl && !isProcessing && (
        <View
          style={{
            width: '100%',
            maxWidth: 540,
            alignSelf: 'center',
            padding: 16,
            borderRadius: 18,
            backgroundColor: c.card,
            marginBottom: 14,
          }}
        >
          <Row style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Txt s={16} w="800">
              Add meal details
            </Txt>
            <Pressable
              onPress={retake}
              accessibilityRole="button"
              accessibilityLabel="Retake photo"
              style={({ pressed }: { pressed: boolean }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingVertical: 7,
                paddingHorizontal: 10,
                borderRadius: 12,
                backgroundColor: '#FAF8F2',
                borderWidth: 1,
                borderColor: '#D9D9D9',
                transform: [{ scale: pressed ? 0.97 : 1 }],
                cursor: 'pointer' as const,
              })}
            >
              <RetakeCameraIcon frameColor="#1E293B" arrowColor="#F59E0B" />
              <Txt s={13} w="700" color="#1E293B">Retake</Txt>
            </Pressable>
          </Row>
          <input
            aria-label="Describe your meal (optional)"
            placeholder="Describe your meal (optional, e.g., Nasi Lemak Ayam Goreng)"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            style={inputStyle}
          />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            {TAGS.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <Pressable
                  key={tag}
                  onPress={() =>
                    setSelectedTags((current) =>
                      active ? current.filter((item) => item !== tag) : [...current, tag]
                    )
                  }
                  style={{
                    paddingVertical: 7,
                    paddingHorizontal: 9,
                    borderRadius: 999,
                    backgroundColor: active ? c.yellow : '#edf2f7',
                    borderWidth: 1,
                    borderColor: active ? '#d69e00' : '#e2e8f0',
                    cursor: 'pointer' as const,
                  }}
                >
                  <Txt s={11} w={active ? '700' : '500'}>
                    {tag}
                  </Txt>
                </Pressable>
              );
            })}
          </View>
          <Pressable
            onPress={handleAnalyzeClick}
            style={{
              alignItems: 'center',
              padding: 12,
              marginTop: 10,
              borderRadius: 12,
              backgroundColor: c.yellow,
              cursor: 'pointer' as const,
            }}
          >
            <Txt s={15} w="800">
              Analyze Meal
            </Txt>
          </Pressable>
        </View>
      )}

      <View style={{ alignItems: 'center', paddingHorizontal: 20 }}>
        <Txt s={20} w="800" color="#fff">
          Good food. Great focus.
        </Txt>
        <Txt s={12} color="#cbd5e1" style={{ marginTop: 4, textAlign: 'center' }}>
          {capturedImageUrl
            ? 'Snapshot frozen. Add optional details, then analyze your meal.'
            : cameraActive
            ? 'Camera active. Frame your plate and tap the shutter.'
            : cameraError || 'Align your plate within the frame, or upload a photo from Gallery.'}
        </Txt>
        {scanError ? (
          <View
            style={{
              marginTop: 14,
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: '#FDE8E8',
              maxWidth: 460,
            }}
          >
            <Txt s={13} color="#7f1d1d" style={{ textAlign: 'center' }}>
              {scanError}
            </Txt>
          </View>
        ) : null}
      </View>

      {!capturedImageUrl && (
        <Row
          style={{
            justifyContent: 'space-around',
            alignItems: 'center',
            paddingHorizontal: 36,
            marginTop: 8,
            marginBottom: 8,
            flexShrink: 0,
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Flip camera"
            onPress={() => {
              if (!isProcessing) {
                setCameraFacing((facing) => (facing === 'environment' ? 'user' : 'environment'));
                showToast('Switched camera');
              }
            }}
            disabled={isProcessing}
            style={({ pressed }: { pressed: boolean }) => ({
              minWidth: 64,
              alignItems: 'center',
              opacity: isProcessing ? 0.55 : 1,
              transform: [{ scale: pressed && !isProcessing ? 0.94 : 1 }],
              cursor: 'pointer' as const,
            })}
          >
            <FlipCameraIcon />
            <Txt s={11} color="#FAF8F2" style={{ marginTop: 5 }}>Flip</Txt>
          </Pressable>

          <Pressable
            onPress={handleSnap}
            disabled={isProcessing}
            style={({ pressed }: { pressed: boolean }) => [
              {
                width: 80,
                height: 80,
                borderRadius: 40,
                borderWidth: 4,
                borderColor: '#FAF8F2',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer' as const,
                transform: [{ scale: pressed ? 0.95 : 1 }],
                flexShrink: 0,
              },
            ]}
          >
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: c.yellow }} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open gallery"
            onPress={openGallery}
            disabled={isProcessing}
            style={({ pressed }: { pressed: boolean }) => ({
              minWidth: 64,
              alignItems: 'center',
              opacity: isProcessing ? 0.55 : 1,
              transform: [{ scale: pressed && !isProcessing ? 0.94 : 1 }],
              cursor: 'pointer' as const,
            })}
          >
            <GalleryFoodIcon />
            <Txt s={11} color="#FAF8F2" style={{ marginTop: 5 }}>Gallery</Txt>
          </Pressable>
        </Row>
      )}
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { View, Pressable, Image, ActivityIndicator } from 'react-native-web';
import { useApp } from '../context/AppContext';
import { Row, Txt, IconBox, Pill, TabBar, c, assets } from '../ui';
import { uploadMealImage } from '../services/mealImageUpload';
import { mockAnalyzeFoodPhoto } from '../services/mealsService';

interface ScanScreenProps {
  onNavigate: (screen: string) => void;
  onPhotoCaptured?: (mealData: { name: string; kcal: number; protein: number; carbs: number; fat: number; image?: string; imageFile?: Blob }) => void;
}

const Tag = ({ t, style, onPress }: any) => (
  <Pressable onPress={onPress} style={[{ position: 'absolute', backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.25)', cursor: 'pointer' as any, zIndex: 10 }, style]}>
    <Txt s={12} w="700">✨ {t}</Txt>
  </Pressable>
);

const Corner = ({ style }: any) => (
  <View style={[{ position: 'absolute', width: 44, height: 44, borderColor: '#fff', borderWidth: 3.5, borderRadius: 16, zIndex: 9, pointerEvents: 'none' as any }, style]} />
);

export default function ScanScreen({ onNavigate, onPhotoCaptured }: ScanScreenProps) {
  const { showToast, userId } = useApp();
  const [flashOn, setFlashOn] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const sampleMeals = [
    { name: 'Hainanese Chicken Rice', kcal: 580, protein: 38, carbs: 65, fat: 18 },
    { name: 'Salmon Nourish Bowl', kcal: 520, protein: 34, carbs: 45, fat: 20 },
    { name: 'Berry Protein Yogurt Bowl', kcal: 310, protein: 22, carbs: 36, fat: 6 },
    { name: 'Beef Rendang with Rice', kcal: 680, protein: 42, carbs: 70, fat: 28 },
  ];

  // Stop camera helper
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Start camera using navigator.mediaDevices.getUserMedia
  const startCamera = async (facing: 'environment' | 'user') => {
    stopCamera();
    setCameraError(null);

    if (!navigator?.mediaDevices?.getUserMedia) {
      setCameraError('Camera API is not supported on this browser or connection.');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((e) => console.warn('Video play caught:', e));
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn('getUserMedia error:', err);
      setCameraError(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Camera permission denied. Use Gallery / Upload instead.'
          : 'Could not start camera. Use Gallery / Upload instead.'
      );
      setCameraActive(false);
    }
  };

  useEffect(() => {
    startCamera(cameraFacing);
    return () => {
      stopCamera();
    };
  }, [cameraFacing]);

  // Handle capture: snap from live video canvas or fallback
  const handleSnap = async () => {
    setIsProcessing(true);
    showToast('📸 Snapping & analyzing food with AI...');

    let photoBlob: Blob | null = null;
    let previewDataUrl: string | null = null;

    if (cameraActive && videoRef.current) {
      try {
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          previewDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          photoBlob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.85)
          );
        }
      } catch (e) {
        console.warn('Canvas snap error:', e);
      }
    }

    // Call Mock AI photo analysis helper
    // TODO: Replace with teammate's real AI scan API when ready!
    const aiAnalysis = await mockAnalyzeFoodPhoto(photoBlob || undefined);

    const chosenImage = previewDataUrl || capturedPreview || assets.hero;

    // Upload immediately if we have a blob
    let uploadedPublicUrl: string | undefined = undefined;
    if (photoBlob) {
      try {
        const res = await uploadMealImage(photoBlob, userId || undefined);
        uploadedPublicUrl = res.publicUrl;
      } catch (err: any) {
        console.warn('Direct snap upload warn:', err.message);
      }
    }

    stopCamera();
    setIsProcessing(false);

    if (onPhotoCaptured) {
      onPhotoCaptured({
        name: aiAnalysis.meal_name,
        kcal: aiAnalysis.calories,
        protein: aiAnalysis.protein,
        carbs: aiAnalysis.carbs,
        fat: aiAnalysis.fat,
        image: uploadedPublicUrl || chosenImage,
        imageFile: photoBlob || undefined,
      });
    }

    onNavigate('Scan Result');
  };

  // Handle file input selection (fallback)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    showToast('Analyzing selected photo with AI...');

    const preview = URL.createObjectURL(file);
    setCapturedPreview(preview);

    try {
      // 1. Analyze with Mock AI
      // TODO: Replace with teammate's real AI scan API when ready!
      const aiAnalysis = await mockAnalyzeFoodPhoto(file);

      // 2. Upload photo
      const res = await uploadMealImage(file, userId || undefined);
      showToast('Photo uploaded & meal analyzed!');
      stopCamera();
      setIsProcessing(false);

      if (onPhotoCaptured) {
        onPhotoCaptured({
          name: aiAnalysis.meal_name,
          kcal: aiAnalysis.calories,
          protein: aiAnalysis.protein,
          carbs: aiAnalysis.carbs,
          fat: aiAnalysis.fat,
          image: res.publicUrl,
          imageFile: file,
        });
      }
      onNavigate('Scan Result');
    } catch (err: any) {
      setIsProcessing(false);
      showToast(`Upload error: ${err.message}`);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#2d3748', position: 'relative', minHeight: '100vh' }}>
      {/* Hidden File Input for Mobile Gallery/Camera Fallback */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Top Header */}
      <Row style={{ justifyContent: 'space-between', padding: 20, paddingTop: 40, alignItems: 'center' }}>
        <IconBox label="✕" onPress={() => { stopCamera(); onNavigate('Home'); }} />
        <Pill bg={c.yellow}>⚡ AI Vision Meal Scanner</Pill>
        <IconBox
          label={flashOn ? '⚡' : 'flash'}
          onPress={() => {
            setFlashOn(!flashOn);
            showToast(flashOn ? 'Flash off' : 'Flash enabled');
          }}
        />
      </Row>

      {/* Camera Viewfinder */}
      <View style={{ height: 380, width: '100%', maxWidth: 540, alignSelf: 'center', marginVertical: 16, position: 'relative', borderRadius: 24, overflow: 'hidden', backgroundColor: '#1a202c', justifyContent: 'center', alignItems: 'center' }}>
        {/* Live HTML5 Video element */}
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
            display: cameraActive ? 'block' : 'none',
          }}
        />

        {/* Fallback image when camera is inactive */}
        {!cameraActive && (
          <Image
            accessibilityIgnoresInvertColors
            source={{ uri: capturedPreview || assets.hero }}
            style={{ width: '100%', height: '100%', opacity: 0.75, objectFit: 'cover' as any }}
          />
        )}

        {/* Framing Corners */}
        <Corner style={{ top: 16, left: 16, borderRightWidth: 0, borderBottomWidth: 0 }} />
        <Corner style={{ top: 16, right: 16, borderLeftWidth: 0, borderBottomWidth: 0 }} />
        <Corner style={{ bottom: 16, left: 16, borderRightWidth: 0, borderTopWidth: 0 }} />
        <Corner style={{ bottom: 16, right: 16, borderLeftWidth: 0, borderTopWidth: 0 }} />

        {/* AI Detected Ingredient Tags */}
        <Tag
          t="Rice · 210 kcal"
          style={{ top: 40, left: 24 }}
          onPress={() => showToast('AI Confidence: 96% · White Jasmine Rice')}
        />
        <Tag
          t="Poached Chicken · 280 kcal"
          style={{ top: '48%', right: 24 }}
          onPress={() => showToast('AI Confidence: 94% · Lean Chicken Breast')}
        />
        <Tag
          t="Cucumber & Chili · 40 kcal"
          style={{ bottom: 40, left: 32 }}
          onPress={() => showToast('AI Confidence: 91% · Fresh Veggie Garnish')}
        />
      </View>

      {/* Guide Caption & Error Notice */}
      <View style={{ alignItems: 'center', paddingHorizontal: 20 }}>
        <Txt s={20} w="800" color="#fff">Good food. Great focus.</Txt>
        <Txt s={12} color="#cbd5e1" style={{ marginTop: 4, textAlign: 'center' }}>
          {cameraActive
            ? 'Camera active. Frame your plate and tap the button to snap!'
            : cameraError
            ? cameraError
            : 'Align your plate within the frame. Tap Gallery to upload a photo.'}
        </Txt>
      </View>

      {/* Shutter & Tool Controls */}
      <Row style={{ justifyContent: 'space-around', alignItems: 'center', paddingHorizontal: 36, marginTop: 24, marginBottom: 120 }}>
        {/* Gallery / Fallback File Button */}
        <Pressable
          onPress={() => fileInputRef.current?.click()}
          style={{ alignItems: 'center', cursor: 'pointer' as any }}
        >
          {isProcessing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <IconBox size={50} label="img" />
          )}
          <Txt s={11} color="#fff" style={{ marginTop: 4 }}>Gallery</Txt>
        </Pressable>

        {/* Shutter Button */}
        <Pressable
          onPress={handleSnap}
          disabled={isProcessing}
          style={({ pressed }: any) => [
            {
              width: 80,
              height: 80,
              borderRadius: 40,
              borderWidth: 4,
              borderColor: '#fff',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer' as any,
              transform: [{ scale: pressed ? 0.95 : 1 }],
            },
          ]}
        >
          {isProcessing ? (
            <ActivityIndicator color={c.yellow} size="small" />
          ) : (
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: c.yellow }} />
          )}
        </Pressable>

        {/* Flip Camera */}
        <Pressable
          onPress={() => {
            const next = cameraFacing === 'environment' ? 'user' : 'environment';
            setCameraFacing(next);
            showToast(`Switched camera`);
          }}
          style={{ alignItems: 'center', cursor: 'pointer' as any }}
        >
          <IconBox size={50} label="flip" />
          <Txt s={11} color="#fff" style={{ marginTop: 4 }}>Flip</Txt>
        </Pressable>
      </Row>

      {/* Navigation TabBar */}
      <TabBar active="Scan" onSelectTab={(tab) => { stopCamera(); onNavigate(tab); }} />
    </View>
  );
}

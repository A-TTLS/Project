import React, { useState } from 'react';
import { View, Pressable, Image, ActivityIndicator } from 'react-native-web';
import { useApp } from '../context/AppContext';
import { Row, Txt, IconBox, Pill, TabBar, c, assets } from '../ui';
import { useMealImageUpload } from '../services/mealImageUpload';

interface ScanScreenProps {
  onNavigate: (screen: string) => void;
  onPhotoCaptured?: (mealData: { name: string; kcal: number; protein: number; carbs: number; fat: number; image?: string }) => void;
}

const Tag = ({ t, style, onPress }: any) => (
  <Pressable onPress={onPress} style={[{ position: 'absolute', backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.25)', cursor: 'pointer' as any }, style]}>
    <Txt s={12} w="700">✨ {t}</Txt>
  </Pressable>
);

const Corner = ({ style }: any) => (
  <View style={[{ position: 'absolute', width: 44, height: 44, borderColor: '#fff', borderWidth: 3.5, borderRadius: 16 }, style]} />
);

export default function ScanScreen({ onNavigate, onPhotoCaptured }: ScanScreenProps) {
  const { showToast } = useApp();
  const [flashOn, setFlashOn] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'back' | 'front'>('back');
  const [showGalleryModal, setShowGalleryModal] = useState(false);

  // Real photo upload hook
  const { pickAndUpload, imageUrl: uploadedUrl, isUploading, uploadError } = useMealImageUpload();

  // Preview: show uploaded image in viewfinder if available
  const viewfinderImage = uploadedUrl ?? assets.hero;

  const sampleMeals = [
    { name: 'Hainanese Chicken Rice', kcal: 580, protein: 38, carbs: 65, fat: 18, image: assets.hero },
    { name: 'Salmon Nourish Bowl', kcal: 520, protein: 34, carbs: 45, fat: 20, image: assets.hero },
    { name: 'Berry Protein Yogurt Bowl', kcal: 310, protein: 22, carbs: 36, fat: 6, image: assets.hero },
    { name: 'Beef Rendang with Rice', kcal: 680, protein: 42, carbs: 70, fat: 28, image: assets.hero },
  ];

  const handleCapture = (meal = sampleMeals[0]) => {
    showToast('📸 Snapped! AI Vision recognizing ingredients...');
    if (onPhotoCaptured) {
      // Attach the real uploaded URL if available, otherwise use the sample image
      onPhotoCaptured({ ...meal, image: uploadedUrl ?? meal.image });
    }
    setTimeout(() => {
      onNavigate('Scan Result');
    }, 400);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#2d3748', position: 'relative', minHeight: '100vh' }}>
      {/* Top Header */}
      <Row style={{ justifyContent: 'space-between', padding: 20, paddingTop: 40, alignItems: 'center' }}>
        <IconBox label="✕" onPress={() => onNavigate('Home')} />
        <Pill bg={c.yellow}>⚡ AI Vision Meal Scanner</Pill>
        <IconBox
          label={flashOn ? '⚡' : 'flash'}
          onPress={() => {
            setFlashOn(!flashOn);
            showToast(flashOn ? 'Flash off' : 'Flash enabled');
          }}
        />
      </Row>

      {/* Camera Viewfinder with AI Detection Overlay */}
      <View style={{ height: 380, width: '100%', maxWidth: 540, alignSelf: 'center', marginVertical: 16, position: 'relative', borderRadius: 24, overflow: 'hidden', backgroundColor: '#1a202c', justifyContent: 'center', alignItems: 'center' }}>
        <Image
          accessibilityIgnoresInvertColors
          source={{ uri: viewfinderImage }}
          style={{ width: '100%', height: '100%', opacity: 0.75, objectFit: 'cover' as any }}
        />

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

      {/* Guide Caption */}
      <View style={{ alignItems: 'center', paddingHorizontal: 20 }}>
        <Txt s={20} w="800" color="#fff">Good food. Great focus.</Txt>
        <Txt s={12} color="#cbd5e1" style={{ marginTop: 4, textAlign: 'center' }}>
          Align your plate within the frame. AI estimates calories and portion size.
        </Txt>
        {uploadError && (
          <Txt s={11} color="#fca5a5" style={{ marginTop: 6, textAlign: 'center' }}>
            ⚠️ {uploadError}
          </Txt>
        )}
        {uploadedUrl && (
          <Txt s={11} color="#86efac" style={{ marginTop: 6, textAlign: 'center' }}>
            ✓ Photo ready — tap the shutter to log this meal
          </Txt>
        )}
      </View>

      {/* Shutter & Tool Controls */}
      <Row style={{ justifyContent: 'space-around', alignItems: 'center', paddingHorizontal: 36, marginTop: 24, marginBottom: 120 }}>
        <Pressable
          onPress={() => {
            // Open native camera/gallery file picker and upload immediately
            pickAndUpload((url) => {
              showToast('📷 Photo uploaded! Tap shutter to log.');
            });
          }}
          style={{ alignItems: 'center', cursor: 'pointer' as any }}
        >
          {isUploading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <IconBox size={50} label={uploadedUrl ? '✓' : 'img'} />
          )}
          <Txt s={11} color="#fff" style={{ marginTop: 4 }}>
            {isUploading ? 'Uploading...' : uploadedUrl ? 'Photo Ready' : 'Gallery'}
          </Txt>
        </Pressable>

        {/* Shutter Button */}
        <Pressable
          onPress={() => handleCapture()}
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
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: c.yellow }} />
        </Pressable>

        <Pressable
          onPress={() => {
            const next = cameraFacing === 'back' ? 'front' : 'back';
            setCameraFacing(next);
            showToast(`Switched to ${next} camera`);
          }}
          style={{ alignItems: 'center', cursor: 'pointer' as any }}
        >
          <IconBox size={50} label="flip" />
          <Txt s={11} color="#fff" style={{ marginTop: 4 }}>Flip</Txt>
        </Pressable>
      </Row>

      {/* Navigation TabBar */}
      <TabBar active="Scan" onSelectTab={onNavigate} />
    </View>
  );
}

import React, { useState } from 'react';
import { View, Switch, Pressable, Image, ActivityIndicator } from 'react-native-web';
import { useApp } from '../context/AppContext';
import { Screen, Row, Txt, Ph, Pill, IconBox, Card, Btn, SectionHead, c, assets } from '../ui';
import { uploadMealImage } from '../services/mealImageUpload';

interface ScanResultScreenProps {
  onNavigate: (screen: string) => void;
  capturedMeal?: {
    name: string;
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
    image?: string;
    imageFile?: Blob | File;
  };
}

export default function ScanResultScreen({ onNavigate, capturedMeal }: ScanResultScreenProps) {
  const { logMeal, showToast, userId } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const baseMeal = capturedMeal || {
    name: 'Hainanese Chicken Rice',
    kcal: 580,
    protein: 38,
    carbs: 65,
    fat: 18,
    image: assets.hero,
  };

  const [category, setCategory] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks'>('Lunch');
  const [portionIndex, setPortionIndex] = useState(1); // 0 = 0.5x, 1 = 1x, 2 = 1.5x
  const [shareSocial, setShareSocial] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [mealName, setMealName] = useState(baseMeal.name);

  const multipliers = [0.5, 1.0, 1.5];
  const mult = multipliers[portionIndex];

  const currentKcal = Math.round(baseMeal.kcal * mult);
  const currentProtein = Math.round(baseMeal.protein * mult);
  const currentCarbs = Math.round(baseMeal.carbs * mult);
  const currentFat = Math.round(baseMeal.fat * mult);

  const handleLog = async () => {
    setIsSubmitting(true);
    let finalImageUrl = baseMeal.image;

    // If an image blob was captured from canvas or file and hasn't been uploaded yet
    if (baseMeal.imageFile && (!finalImageUrl || finalImageUrl.startsWith('data:') || finalImageUrl.startsWith('blob:'))) {
      try {
        const uploaded = await uploadMealImage(baseMeal.imageFile, userId || undefined);
        finalImageUrl = uploaded.publicUrl;
      } catch (err: any) {
        console.warn('Storage upload error in ScanResultScreen:', err.message);
      }
    }

    await logMeal({
      name: mealName,
      category,
      meta: `${category} · Logged`,
      kcal: currentKcal,
      protein: currentProtein,
      carbs: currentCarbs,
      fat: currentFat,
      image: finalImageUrl,
    });

    setIsSubmitting(false);

    if (shareSocial) {
      showToast('📸 Logged and shared with Roomie Diet Squad circle!');
    }

    onNavigate('Home');
  };

  return (
    <Screen tab="Scan" onSelectTab={onNavigate}>
      {/* Captured Image Banner */}
      <View style={{ marginHorizontal: -20, marginTop: -36, position: 'relative', height: 260, overflow: 'hidden' }}>
        <Image
          accessibilityIgnoresInvertColors
          source={{ uri: baseMeal.image || assets.hero }}
          style={{ width: '100%', height: '100%', objectFit: 'cover' as any }}
        />
        <Row style={{ position: 'absolute', top: 36, left: 20, right: 20, justifyContent: 'space-between', alignItems: 'center' }}>
          <IconBox label="←" onPress={() => onNavigate('Scan')} />
          <Pill bg={c.yellow}>✓ Photo Captured</Pill>
          <IconBox label="↺" onPress={() => onNavigate('Scan')} />
        </Row>
      </View>

      {/* Category Selector */}
      <Row style={{ marginTop: 18, flexWrap: 'wrap', gap: 6 }}>
        {(['Breakfast', 'Lunch', 'Dinner', 'Snacks'] as const).map((m) => (
          <Pill
            key={m}
            active={category === m}
            onPress={() => setCategory(m)}
          >
            {m}
          </Pill>
        ))}
      </Row>

      {/* AI Detection Header */}
      <Txt s={11} w="700" color={c.dark} style={{ marginTop: 18, letterSpacing: 0.8 }}>
        AI DETECTED · REVIEW & EDIT
      </Txt>

      <Row style={{ justifyContent: 'space-between', alignItems: 'center', marginVertical: 6 }}>
        <Txt s={26} w="800" style={{ flex: 1 }}>{mealName}</Txt>
        <IconBox
          label="✎"
          size={32}
          onPress={() => {
            const input = prompt('Edit meal title:', mealName);
            if (input) setMealName(input);
          }}
        />
      </Row>

      {/* Dynamic Calories */}
      <Row style={{ alignItems: 'baseline', marginVertical: 4 }}>
        <Txt s={44} w="800">{currentKcal}</Txt>
        <Txt s={16} color={c.mute} style={{ marginLeft: 8 }}>kcal</Txt>
      </Row>
      <Txt s={12} color={c.mute} style={{ marginBottom: 12 }}>
        Estimated from photo analysis. Portion: {mult}x.
      </Txt>

      {/* Dynamic Macro Breakdown */}
      <SectionHead title="Macro breakdown" right="AI Breakdown" />
      <Row style={{ gap: 8 }}>
        {[
          { label: 'Protein', val: `${currentProtein}g`, color: '#4ade80' },
          { label: 'Carbs', val: `${currentCarbs}g`, color: '#38bdf8' },
          { label: 'Fat', val: `${currentFat}g`, color: '#fbbf24' },
        ].map((m) => (
          <Card key={m.label} bg={c.green} style={{ flex: 1, padding: 12, alignItems: 'center' }}>
            <Txt s={11} color={c.mute}>{m.label}</Txt>
            <Txt s={18} w="800" style={{ marginTop: 2 }}>{m.val}</Txt>
          </Card>
        ))}
      </Row>

      {/* Interactive Portion Multiplier */}
      <SectionHead title="Your portion" right="Select actual intake" />
      <Row style={{ gap: 8 }}>
        {[
          ['Small', '0.5x'],
          ['Standard', '1.0x'],
          ['Large', '1.5x'],
        ].map(([label, x], i) => (
          <Pressable
            key={label}
            onPress={() => setPortionIndex(i)}
            style={{ flex: 1, cursor: 'pointer' as any }}
          >
            <Card
              bg={portionIndex === i ? c.yellow : c.card}
              style={{
                alignItems: 'center',
                paddingVertical: 14,
                borderColor: portionIndex === i ? c.ink : c.line,
              }}
            >
              <Txt w="700">{label}</Txt>
              <Txt s={11} color={c.mute} style={{ marginTop: 2 }}>{x}</Txt>
            </Card>
          </Pressable>
        ))}
      </Row>

      {/* Share to Peer Circle Toggle */}
      <Card style={{ marginVertical: 18 }}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Txt w="700">Share to Group Circle</Txt>
            <Txt s={11} color={c.mute}>Following · Roomie Diet Squad</Txt>
          </View>
          <Switch
            value={shareSocial}
            onValueChange={setShareSocial}
            trackColor={{ true: c.dark, false: c.line }}
          />
        </Row>
      </Card>

      {/* Log Meal Button */}
      <Btn bg={c.yellow} onPress={handleLog} disabled={isSubmitting}>
        {isSubmitting ? 'Uploading & Logging...' : '✓  Log Meal (+50 SnapPoints)'}
      </Btn>
    </Screen>
  );
}

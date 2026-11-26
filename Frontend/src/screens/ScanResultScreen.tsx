import React, { useEffect, useMemo, useState } from 'react';
import { View, Switch, Pressable, Image } from 'react-native-web';
import { useApp } from '../context/AppContext';
import { Screen, Row, Txt, Pill, IconBox, Card, Btn, SectionHead, c } from '../ui';
import { uploadMealImage } from '../services/mealImageUpload';
import type { VisionFoodItem } from '../services/visionService';
import { BackArrowIcon, RetakeCameraIcon } from '../components/CameraIcons';

interface ScanResultScreenProps {
  onNavigate: (screen: string) => void;
}

interface NutritionChoice extends VisionFoodItem {
  key: string;
}

function RetakeButton({ label, onPress, marginTop = 0 }: { label: string; onPress: () => void; marginTop?: number }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 12,
        backgroundColor: '#FDE68A',
        borderWidth: 1,
        borderColor: '#F59E0B',
        transform: [{ scale: pressed ? 0.98 : 1 }],
        cursor: 'pointer' as const,
      })}
    >
      <RetakeCameraIcon frameColor="#1E293B" arrowColor="#F59E0B" />
      <Txt s={14} w="700" color="#1E293B">{label}</Txt>
    </Pressable>
  );
}

export default function ScanResultScreen({ onNavigate }: ScanResultScreenProps) {
  const { logMeal, updateMeal, showToast, userId, capturedMeal, editingMeal, setEditingMeal, setCapturedMeal } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [category, setCategory] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks'>('Lunch');
  const [portionIndex, setPortionIndex] = useState(1);
  const [shareSocial, setShareSocial] = useState(true);
  const [mealName, setMealName] = useState('');
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);

  const visionResult = capturedMeal?.visionResult;
  const choices: NutritionChoice[] = useMemo(() => {
    const items = visionResult?.is_food ? visionResult.items : [];
    if (editingMeal && !items.length) {
      const savedMultiplier = editingMeal.portionMultiplier || 1;
      return [{ key: 'plate', name: editingMeal.name, portion_estimate: 'Saved portion', cooking_method: 'Previously logged', sauce_or_gravy: 'Not specified',
        calories: editingMeal.kcal / savedMultiplier, protein_g: editingMeal.protein / savedMultiplier, carbs_g: editingMeal.carbs / savedMultiplier, fat_g: editingMeal.fat / savedMultiplier }];
    }
    const plate: NutritionChoice = {
      key: 'plate',
      name: visionResult?.meal_title || capturedMeal?.name || 'Detected meal',
      portion_estimate: items.length > 1 ? `${items.length} items on the plate` : (items[0]?.portion_estimate || '1 serving'),
      cooking_method: items.length > 1 ? 'mixed plate' : (items[0]?.cooking_method || 'unknown'),
      sauce_or_gravy: items.length > 1 ? 'see each item' : (items[0]?.sauce_or_gravy || 'none'),
      calories: visionResult?.total_calories || items.reduce((sum, item) => sum + Number(item.calories || 0), 0),
      protein_g: items.reduce((sum, item) => sum + Number(item.protein_g || 0), 0),
      carbs_g: items.reduce((sum, item) => sum + Number(item.carbs_g || 0), 0),
      fat_g: items.reduce((sum, item) => sum + Number(item.fat_g || 0), 0),
    };
    return [plate, ...items.map((item, index) => ({ ...item, key: `${item.name}-${index}` }))];
  }, [visionResult, capturedMeal?.name, editingMeal]);

  const activeItem = choices[selectedItemIndex] ?? choices[0];
  const multipliers = [0.5, 1, 1.5];
  const mult = multipliers[portionIndex] ?? 1;

  useEffect(() => {
    setSelectedItemIndex(0);
    const savedMultiplier = editingMeal?.portionMultiplier || 1;
    setPortionIndex(savedMultiplier === 0.5 ? 0 : savedMultiplier === 1.5 ? 2 : 1);
    setMealName(editingMeal?.name || visionResult?.meal_title || capturedMeal?.name || '');
    if (editingMeal) setCategory(editingMeal.category);
  }, [capturedMeal, visionResult?.meal_title, editingMeal]);

  const currentKcal = Math.round((Number(activeItem?.calories) || 0) * mult);
  const currentProtein = Math.round((Number(activeItem?.protein_g) || 0) * mult);
  const currentCarbs = Math.round((Number(activeItem?.carbs_g) || 0) * mult);
  const currentFat = Math.round((Number(activeItem?.fat_g) || 0) * mult);

  const handleLog = async () => {
    if ((!capturedMeal && !editingMeal) || visionResult?.is_food === false || !activeItem) {
      showToast('No food in this photo. Please retake the image first.');
      return;
    }

    setIsSubmitting(true);
    let finalImageUrl = capturedMeal?.image || editingMeal?.imageUrl || editingMeal?.image;

    try {
      let photo: Blob | File | undefined = capturedMeal?.imageFile;
      if (!photo && capturedMeal?.image?.startsWith('data:')) {
        const response = await fetch(capturedMeal.image);
        photo = await response.blob();
      }
      if (photo && (!finalImageUrl || finalImageUrl.startsWith('data:') || finalImageUrl.startsWith('blob:'))) {
        const uploaded = await uploadMealImage(photo, userId || undefined);
        finalImageUrl = uploaded.publicUrl;
      }
    } catch (error) {
      console.error('Meal photo upload failed:', error);
      showToast(error instanceof Error ? error.message : 'Photo upload failed. The meal will still be logged.');
    }

    const mealFields = {
      name: mealName || activeItem.name,
      category,
      meta: `${category} · Logged`,
      kcal: currentKcal,
      protein: currentProtein,
      carbs: currentCarbs,
      fat: currentFat,
      image: finalImageUrl,
      imageUrl: finalImageUrl,
      portionMultiplier: mult,
    };
    if (editingMeal) await updateMeal(editingMeal.id, mealFields);
    else await logMeal(mealFields);

    setIsSubmitting(false);

    if (shareSocial && !editingMeal) {
      showToast('Logged and shared with Roomie Diet Squad circle!');
    }

    setEditingMeal(null);
    setCapturedMeal(null);
    onNavigate('Home');
  };

  if (!editingMeal && !capturedMeal?.visionResult) {
    return (
      <Screen hideTabBar onSelectTab={onNavigate}>
        <View style={{ marginTop: 32, padding: 18, borderRadius: 16, backgroundColor: c.card, borderWidth: 1, borderColor: c.line }}>
          <Txt s={20} w="800">No scan yet</Txt>
          <Txt s={13} color={c.mute} style={{ marginTop: 8 }}>
            Capture or upload a photo on the scanner. This screen only shows that photo and the Gemini recognition result.
          </Txt>
          <Btn bg={c.yellow} onPress={() => onNavigate('Scan')} style={{ marginTop: 18 }}>
            Open camera
          </Btn>
        </View>
      </Screen>
    );
  }

  if (!editingMeal && visionResult?.is_food === false) {
    return (
      <Screen hideTabBar onSelectTab={onNavigate}>
        {capturedMeal?.image ? (
          <View style={{ marginHorizontal: -20, marginTop: -24, height: 220, overflow: 'hidden' }}>
            <Image
              accessibilityIgnoresInvertColors
              source={{ uri: capturedMeal.image }}
              style={{ width: '100%', height: '100%', objectFit: 'cover' as const }}
            />
          </View>
        ) : null}
        <View style={{ marginTop: 24, padding: 18, borderRadius: 16, backgroundColor: '#FDE8E8', borderWidth: 1, borderColor: '#F4C2C2' }}>
          <Txt s={20} w="800" color="#7f1d1d">No food in this photo</Txt>
          <Txt s={13} color="#7f1d1d" style={{ marginTop: 8 }}>
            {visionResult.rejection_reason || 'Please retake the photo with a plate of food or drink in frame.'}
          </Txt>
          <RetakeButton label="Retake photo" onPress={() => onNavigate('Scan')} marginTop={18} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen hideTabBar onSelectTab={onNavigate}>
      <View style={{ marginHorizontal: -20, marginTop: -36, position: 'relative', height: 260, overflow: 'hidden', backgroundColor: '#1a202c' }}>
        {(capturedMeal?.image || editingMeal?.imageUrl || editingMeal?.image) ? (
          <Image
            accessibilityIgnoresInvertColors
            source={{ uri: capturedMeal?.image || editingMeal?.imageUrl || editingMeal?.image }}
            style={{ width: '100%', height: '100%', objectFit: 'cover' as const }}
          />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Txt s={14} color="#fff">Captured photo unavailable</Txt>
          </View>
        )}
        <Row style={{ position: 'absolute', top: 36, left: 20, right: 20, justifyContent: 'space-between', alignItems: 'center' }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to scanner"
            onPress={() => onNavigate('Scan')}
            style={({ pressed }: { pressed: boolean }) => ({
              width: 44,
              height: 44,
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ scale: pressed ? 0.92 : 1 }],
              cursor: 'pointer' as const,
            })}
          >
            <BackArrowIcon color="#FDE68A" />
          </Pressable>
          <Pill bg={c.yellow}>{editingMeal ? 'Edit meal' : 'Photo captured'}</Pill>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retake photo"
            onPress={() => onNavigate('Scan')}
            style={({ pressed }: { pressed: boolean }) => ({
              width: 44,
              height: 44,
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ scale: pressed ? 0.92 : 1 }],
              cursor: 'pointer' as const,
            })}
          >
            <RetakeCameraIcon />
          </Pressable>
        </Row>
      </View>

      {editingMeal && <RetakeButton label="Retake photo" onPress={() => { setCapturedMeal(null); onNavigate('Scan'); }} marginTop={12} />}

      <Row style={{ marginTop: 18, flexWrap: 'wrap', gap: 6 }}>
        {(['Breakfast', 'Lunch', 'Dinner', 'Snacks'] as const).map((meal) => (
          <Pill key={meal} active={category === meal} onPress={() => setCategory(meal)}>
            {meal}
          </Pill>
        ))}
      </Row>

      <Txt s={11} w="700" color={c.dark} style={{ marginTop: 18, letterSpacing: 0.8 }}>
        AI DETECTED · REVIEW & EDIT
      </Txt>

      <Row style={{ justifyContent: 'space-between', alignItems: 'center', marginVertical: 6 }}>
        <Txt s={26} w="800" style={{ flex: 1 }}>{mealName || activeItem?.name}</Txt>
        <IconBox
          label="✎"
          size={32}
          onPress={() => {
            const input = prompt('Edit the detected food name:', mealName || activeItem?.name || '');
            if (input && input.trim()) setMealName(input.trim());
          }}
        />
      </Row>

      <View style={{ marginTop: 12, marginBottom: 6 }}>
        <Txt s={11} w="700" color={c.dark} style={{ letterSpacing: 0.8 }}>DETECTED FOOD LABELS</Txt>
        <Row style={{ marginTop: 8, flexWrap: 'wrap', gap: 8 }}>
          {choices.map((item, index) => (
            <Pressable key={item.key} onPress={() => setSelectedItemIndex(index)} style={{ cursor: 'pointer' as const }}>
              <Card
                bg={selectedItemIndex === index ? c.yellow : c.card}
                style={{ paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: selectedItemIndex === index ? c.dark : c.line }}
              >
                <Txt s={12} w="700">{index === 0 ? 'Whole plate' : item.name}</Txt>
                <Txt s={10} color={c.mute}>{item.cooking_method} · {item.sauce_or_gravy}</Txt>
              </Card>
            </Pressable>
          ))}
        </Row>
      </View>

      <Row style={{ alignItems: 'baseline', marginVertical: 4 }}>
        <Txt s={44} w="800">{currentKcal}</Txt>
        <Txt s={16} color={c.mute} style={{ marginLeft: 8 }}>kcal</Txt>
      </Row>
      <Txt s={12} color={c.mute} style={{ marginBottom: 12 }}>
        {activeItem?.portion_estimate} · {activeItem?.cooking_method} · {activeItem?.sauce_or_gravy}
      </Txt>

      <SectionHead title="Macro breakdown" right="From this photo" />
      <Row style={{ gap: 8 }}>
        {[
          { label: 'Protein', val: `${currentProtein}g` },
          { label: 'Carbs', val: `${currentCarbs}g` },
          { label: 'Fat', val: `${currentFat}g` },
        ].map((macro) => (
          <Card key={macro.label} bg={c.green} style={{ flex: 1, padding: 12, alignItems: 'center' }}>
            <Txt s={11} color={c.mute}>{macro.label}</Txt>
            <Txt s={18} w="800" style={{ marginTop: 2 }}>{macro.val}</Txt>
          </Card>
        ))}
      </Row>

      <SectionHead title="Your portion" right="Select actual intake" />
      <Row style={{ gap: 8 }}>
        {[['Small', '0.5x'], ['Standard', '1.0x'], ['Large', '1.5x']].map(([label, scale], index) => (
          <Pressable key={label} onPress={() => setPortionIndex(index)} style={{ flex: 1, cursor: 'pointer' as const }}>
            <Card bg={portionIndex === index ? c.yellow : c.card} style={{ alignItems: 'center', paddingVertical: 14, borderColor: portionIndex === index ? c.ink : c.line }}>
              <Txt w="700">{label}</Txt>
              <Txt s={11} color={c.mute} style={{ marginTop: 2 }}>{scale}</Txt>
            </Card>
          </Pressable>
        ))}
      </Row>

      <Card style={{ marginVertical: 18 }}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Txt w="700">Share to Group Circle</Txt>
            <Txt s={11} color={c.mute}>Following · Roomie Diet Squad</Txt>
          </View>
          <Switch value={shareSocial} onValueChange={setShareSocial} trackColor={{ true: c.dark, false: c.line }} />
        </Row>
      </Card>

      <Btn bg={c.yellow} onPress={handleLog} disabled={isSubmitting}>
        {isSubmitting ? (editingMeal ? 'Saving Changes...' : 'Uploading & Logging...') : editingMeal ? 'Save Changes' : 'Log Meal (+50 SnapPoints)'}
      </Btn>
    </Screen>
  );
}

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

const PORTIONS = [
  { label: '1/4', mult: 0.25 },
  { label: '1/3', mult: 1 / 3 },
  { label: '1/2', mult: 0.5 },
  { label: '1x', mult: 1.0 },
  { label: '1.5x', mult: 1.5 },
  { label: '2x', mult: 2.0 },
] as const;

function getInitialPortionIndex(savedMultiplier?: number): number {
  if (savedMultiplier === undefined || savedMultiplier === null) return 3; // 1x default
  let bestIdx = 3;
  let minDiff = Infinity;
  PORTIONS.forEach((p, idx) => {
    const diff = Math.abs(p.mult - savedMultiplier);
    if (diff < minDiff) {
      minDiff = diff;
      bestIdx = idx;
    }
  });
  return bestIdx;
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
  const [portionIndex, setPortionIndex] = useState(3); // 1x default
  const [baseKcal, setBaseKcal] = useState<number>(0);
  const [baseProtein, setBaseProtein] = useState<number>(0);
  const [baseCarbs, setBaseCarbs] = useState<number>(0);
  const [baseFat, setBaseFat] = useState<number>(0);
  const [calorieInput, setCalorieInput] = useState<string>('0');
  const [isCalorieFocused, setIsCalorieFocused] = useState<boolean>(false);
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

  useEffect(() => {
    setSelectedItemIndex(0);
    const savedMultiplier = editingMeal?.portionMultiplier;
    const initialIdx = getInitialPortionIndex(savedMultiplier);
    setPortionIndex(initialIdx);
    setMealName(editingMeal?.name || visionResult?.meal_title || capturedMeal?.name || '');
    if (editingMeal) setCategory(editingMeal.category);
  }, [capturedMeal, visionResult?.meal_title, editingMeal]);

  useEffect(() => {
    if (!activeItem) return;
    const itemKcal = Number(activeItem.calories) || 0;
    const itemProtein = Number(activeItem.protein_g) || 0;
    const itemCarbs = Number(activeItem.carbs_g) || 0;
    const itemFat = Number(activeItem.fat_g) || 0;

    setBaseKcal(itemKcal);
    setBaseProtein(itemProtein);
    setBaseCarbs(itemCarbs);
    setBaseFat(itemFat);

    const mult = PORTIONS[portionIndex]?.mult ?? 1;
    setCalorieInput(String(Math.round(itemKcal * mult)));
  }, [selectedItemIndex, activeItem?.key]);

  const handleSelectPortion = (index: number) => {
    setPortionIndex(index);
    const mult = PORTIONS[index]?.mult ?? 1;
    const newKcal = Math.round(baseKcal * mult);
    setCalorieInput(String(newKcal));
  };

  const handleCalorieChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setCalorieInput(raw);

    const val = parseFloat(raw);
    if (!isNaN(val) && val >= 0) {
      const currentMult = PORTIONS[portionIndex]?.mult ?? 1;
      const prevTotal = baseKcal * currentMult;

      const newBaseKcal = currentMult > 0 ? val / currentMult : val;
      setBaseKcal(newBaseKcal);

      if (prevTotal > 0 && val > 0) {
        const ratio = val / prevTotal;
        setBaseProtein((prev) => prev * ratio);
        setBaseCarbs((prev) => prev * ratio);
        setBaseFat((prev) => prev * ratio);
      }
    }
  };

  const handleCalorieBlur = () => {
    setIsCalorieFocused(false);
    const val = parseFloat(calorieInput);
    const currentMult = PORTIONS[portionIndex]?.mult ?? 1;
    if (isNaN(val) || val < 0) {
      setCalorieInput(String(Math.round(baseKcal * currentMult)));
    } else {
      setCalorieInput(String(Math.round(val)));
    }
  };

  const currentMult = PORTIONS[portionIndex]?.mult ?? 1;
  const currentKcal = Math.max(0, parseInt(calorieInput, 10) || Math.round(baseKcal * currentMult));
  const currentProtein = Math.round(baseProtein * currentMult);
  const currentCarbs = Math.round(baseCarbs * currentMult);
  const currentFat = Math.round(baseFat * currentMult);

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
      portionMultiplier: currentMult,
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

      <View style={{ marginVertical: 6 }}>
        <Row style={{ alignItems: 'center', gap: 12 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#FAF8F2',
              borderRadius: 16,
              borderWidth: 1.5,
              borderColor: isCalorieFocused ? '#F59E0B' : '#E2E8F0',
              paddingHorizontal: 14,
              paddingVertical: 4,
              boxShadow: isCalorieFocused ? '0 0 0 3px rgba(245, 158, 11, 0.2)' : 'none',
            }}
          >
            <input
              type="number"
              inputMode="numeric"
              min="0"
              value={calorieInput}
              onChange={handleCalorieChange}
              onFocus={() => setIsCalorieFocused(true)}
              onBlur={handleCalorieBlur}
              aria-label="Calories (kcal)"
              style={{
                fontSize: 38,
                fontWeight: '800',
                color: '#1E293B',
                backgroundColor: 'transparent',
                border: 'none',
                outline: 'none',
                width: Math.max(76, (calorieInput.length + 1) * 22),
                maxWidth: 160,
                padding: 0,
                margin: 0,
                fontFamily: 'inherit',
              }}
            />
            <Txt s={16} w="700" color="#64748B" style={{ marginLeft: 6 }}>
              kcal
            </Txt>
          </View>
          <View style={{ flex: 1 }}>
            <Txt s={11} w="700" color="#94A3B8" style={{ textTransform: 'uppercase', letterSpacing: 0.6 }}>
              Tap to edit
            </Txt>
            <Txt s={11} color="#64748B">
              Scales with portion below
            </Txt>
          </View>
        </Row>
      </View>
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
      <View
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
          gap: 6,
          width: '100%',
          marginTop: 4,
        }}
      >
        {PORTIONS.map((p, idx) => {
          const isActive = portionIndex === idx;
          return (
            <Pressable
              key={p.label}
              onPress={() => handleSelectPortion(idx)}
              style={({ pressed }: { pressed: boolean }) => ({
                paddingVertical: 8,
                paddingHorizontal: 4,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isActive ? '#FDE68A' : '#FFFFFF',
                borderWidth: 1.5,
                borderColor: isActive ? '#F59E0B' : '#E2E8F0',
                cursor: 'pointer' as const,
                transform: [{ scale: pressed ? 0.95 : 1 }],
                boxShadow: isActive ? '0 1px 3px rgba(245, 158, 11, 0.25)' : 'none',
              })}
            >
              <Txt
                s={13}
                w={isActive ? '800' : '600'}
                color={isActive ? '#1E293B' : '#64748B'}
                style={{ textAlign: 'center' }}
              >
                {p.label}
              </Txt>
            </Pressable>
          );
        })}
      </View>

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

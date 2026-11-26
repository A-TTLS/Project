import React, { useState } from 'react';
import { View, Pressable, TextInput, ScrollView } from 'react-native-web';
import { type MealItem } from '../context/AppContext';
import { Row, Txt, Btn, Icon, c } from '../ui';

interface EditMealModalProps {
  meal: MealItem;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedFields: Partial<MealItem>) => Promise<boolean | void>;
}

export function EditMealModal({ meal, isOpen, onClose, onSave }: EditMealModalProps) {
  if (!isOpen) return null;

  // Base values per 1.0x serving
  const initialMultiplier = meal.portionMultiplier || 1.0;
  const baseKcal = meal.kcal / initialMultiplier;
  const baseProtein = meal.protein / initialMultiplier;
  const baseCarbs = meal.carbs / initialMultiplier;
  const baseFat = meal.fat / initialMultiplier;

  const [name, setName] = useState<string>(meal.name);
  const [category, setCategory] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks'>(meal.category);
  const [multiplier, setMultiplier] = useState<number>(initialMultiplier);
  const [customServing, setCustomServing] = useState<string>('1 portion');
  const [time, setTime] = useState<string>(meal.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live recalculated macros based on current multiplier
  const currentKcal = Math.round(baseKcal * multiplier);
  const currentProtein = Math.round(baseProtein * multiplier * 10) / 10;
  const currentCarbs = Math.round(baseCarbs * multiplier * 10) / 10;
  const currentFat = Math.round(baseFat * multiplier * 10) / 10;

  const handleMultiplierChange = (newMult: number) => {
    const clamped = Math.max(0.1, Math.min(5, Math.round(newMult * 100) / 100));
    setMultiplier(clamped);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        category,
        portionMultiplier: multiplier,
        kcal: currentKcal,
        protein: currentProtein,
        carbs: currentCarbs,
        fat: currentFat,
        time,
        meta: `${category} · ${multiplier !== 1 ? `${multiplier}x ` : ''}Logged`,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View
      style={{
        position: 'fixed' as any,
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.65)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        zIndex: 1000,
      }}
    >
      <View
        style={{
          width: '100%',
          maxWidth: 420,
          backgroundColor: c.card,
          borderRadius: 24,
          padding: 22,
          gap: 16,
          boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
        }}
      >
        {/* Header */}
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Row style={{ alignItems: 'center', gap: 8 }}>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: c.yellow,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="edit" size={16} color={c.ink} />
            </View>
            <Txt s={18} w="800">Edit Meal Entry</Txt>
          </Row>
          <Pressable onPress={onClose} disabled={isSubmitting}>
            <Icon name="close" size={20} color={c.mute} />
          </Pressable>
        </Row>

        <ScrollView style={{ maxHeight: '70vh' as any }}>
          <View style={{ gap: 14 }}>
            {/* Meal Name Input */}
            <View style={{ gap: 4 }}>
              <Txt s={12} color={c.mute}>Dish Name</Txt>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Nasi Lemak Ayam"
                style={{
                  borderWidth: 1,
                  borderColor: c.line,
                  borderRadius: 12,
                  padding: 10,
                  fontSize: 14,
                  fontWeight: '600',
                  backgroundColor: '#FFFFFF',
                }}
              />
            </View>

            {/* Meal Category Selection */}
            <View style={{ gap: 6 }}>
              <Txt s={12} color={c.mute}>Meal Category</Txt>
              <Row style={{ gap: 6 }}>
                {(['Breakfast', 'Lunch', 'Dinner', 'Snacks'] as const).map((cat) => {
                  const active = category === cat;
                  return (
                    <Pressable
                      key={cat}
                      onPress={() => setCategory(cat)}
                      style={{
                        flex: 1,
                        paddingVertical: 8,
                        borderRadius: 10,
                        backgroundColor: active ? c.yellow : c.bg,
                        borderWidth: 1,
                        borderColor: active ? c.ink : 'transparent',
                        alignItems: 'center',
                      }}
                    >
                      <Txt s={11} w={active ? '700' : '500'}>{cat}</Txt>
                    </Pressable>
                  );
                })}
              </Row>
            </View>

            {/* Portion / Quantity Controls */}
            <View style={{ gap: 8 }}>
              <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Txt s={12} color={c.mute}>Portion / Serving Size</Txt>
                <Txt s={13} w="800" color="#D97706">{multiplier}x serving</Txt>
              </Row>

              {/* Quick Multiplier Pills */}
              <Row style={{ gap: 6 }}>
                {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((val) => {
                  const isSelected = multiplier === val;
                  return (
                    <Pressable
                      key={val}
                      onPress={() => handleMultiplierChange(val)}
                      style={{
                        flex: 1,
                        paddingVertical: 7,
                        borderRadius: 8,
                        backgroundColor: isSelected ? c.ink : c.bg,
                        alignItems: 'center',
                      }}
                    >
                      <Txt s={11} w="700" color={isSelected ? '#FFFFFF' : c.ink}>
                        {val}x
                      </Txt>
                    </Pressable>
                  );
                })}
              </Row>

              {/* Fine Tune Stepper */}
              <Row style={{ gap: 8, alignItems: 'center', marginTop: 4 }}>
                <Pressable
                  onPress={() => handleMultiplierChange(multiplier - 0.1)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: c.bg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Txt s={18} w="700">-</Txt>
                </Pressable>
                <View
                  style={{
                    flex: 1,
                    height: 36,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: c.line,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <Txt s={13} w="700">Portion Multiplier: {multiplier}x</Txt>
                </View>
                <Pressable
                  onPress={() => handleMultiplierChange(multiplier + 0.1)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: c.bg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Txt s={18} w="700">+</Txt>
                </Pressable>
              </Row>
            </View>

            {/* Time Logged */}
            <View style={{ gap: 4 }}>
              <Txt s={12} color={c.mute}>Logged Time</Txt>
              <TextInput
                value={time}
                onChangeText={setTime}
                placeholder="e.g. 12:45 PM"
                style={{
                  borderWidth: 1,
                  borderColor: c.line,
                  borderRadius: 12,
                  padding: 10,
                  fontSize: 13,
                  backgroundColor: '#FFFFFF',
                }}
              />
            </View>

            {/* Real-time Recalculated Nutrition Summary Card */}
            <View
              style={{
                backgroundColor: '#F8FAFC',
                borderRadius: 14,
                padding: 12,
                borderWidth: 1,
                borderColor: '#E2E8F0',
                gap: 8,
              }}
            >
              <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Txt s={11} w="700" color={c.mute}>RECALCULATED NUTRITION</Txt>
                <Txt s={16} w="800" color="#D97706">
                  {currentKcal} <Txt s={11} color={c.mute}>kcal</Txt>
                </Txt>
              </Row>

              <Row style={{ gap: 8 }}>
                <View style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 8, padding: 8, alignItems: 'center' }}>
                  <Txt s={10} color={c.mute}>Protein</Txt>
                  <Txt s={13} w="800" color="#3B82F6">{currentProtein}g</Txt>
                </View>
                <View style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 8, padding: 8, alignItems: 'center' }}>
                  <Txt s={10} color={c.mute}>Carbs</Txt>
                  <Txt s={13} w="800" color="#EAB308">{currentCarbs}g</Txt>
                </View>
                <View style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 8, padding: 8, alignItems: 'center' }}>
                  <Txt s={10} color={c.mute}>Fat</Txt>
                  <Txt s={13} w="800" color="#EF4444">{currentFat}g</Txt>
                </View>
              </Row>
            </View>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <Row style={{ gap: 10, marginTop: 4 }}>
          <Pressable
            onPress={onClose}
            disabled={isSubmitting}
            style={{
              flex: 1,
              height: 44,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: c.line,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#FFFFFF',
            }}
          >
            <Txt s={13} w="700" color={c.mute}>Cancel</Txt>
          </Pressable>
          <Btn
            bg={c.yellow}
            onPress={handleSave}
            disabled={isSubmitting || !name.trim()}
            style={{ flex: 2, height: 44, borderRadius: 12 }}
          >
            <Txt s={13} w="800">
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Txt>
          </Btn>
        </Row>
      </View>
    </View>
  );
}

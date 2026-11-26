import React, { useState } from 'react';
import { View, Pressable, TextInput } from 'react-native-web';
import { Card, Row, Txt, Btn, Icon, c } from '../ui';

interface StepCounterCardProps {
  stepsCount: number;
  goalSteps?: number;
  workoutMins?: number;
  burnedKcal?: number;
  onUpdateSteps: (newSteps: number) => Promise<void> | void;
}

export function StepCounterCard({
  stepsCount,
  goalSteps = 8000,
  workoutMins = 0,
  burnedKcal = 0,
  onUpdateSteps,
}: StepCounterCardProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [inputSteps, setInputSteps] = useState(String(stepsCount));
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derived metrics
  const distanceKm = (stepsCount * 0.00078).toFixed(2);
  const stepKcal = Math.round(stepsCount * 0.04);
  const totalBurned = (burnedKcal || 0) + stepKcal;
  const progressRatio = Math.min(1, Math.max(0, stepsCount / goalSteps));
  const pct = Math.round((stepsCount / goalSteps) * 100);

  const handleOpenModal = () => {
    setInputSteps(String(stepsCount));
    setShowEditModal(true);
  };

  const handleSaveSteps = async (targetValue?: number) => {
    const value = targetValue !== undefined ? targetValue : Number(inputSteps);
    if (isNaN(value)) return;
    setIsSubmitting(true);
    try {
      await onUpdateSteps(Math.max(0, Math.round(value)));
      setShowEditModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickAdd = async (increment: number) => {
    const newTotal = Math.max(0, stepsCount + increment);
    await onUpdateSteps(newTotal);
  };

  return (
    <>
      <Card style={{ flex: 1, padding: 14 }}>
        {/* Header */}
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Row style={{ alignItems: 'center', gap: 8 }}>
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: '#DCFCE7',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="footprints" size={16} color="#15803D" />
            </View>
            <Txt s={13} w="700">Steps</Txt>
          </Row>
          <Txt s={11} color={c.mute}>Goal {goalSteps.toLocaleString()}</Txt>
        </Row>

        {/* Main Stats and Progress Ring */}
        <Row style={{ alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
          <View>
            <Txt s={22} w="800">
              {stepsCount.toLocaleString()} <Txt s={12} color={c.mute}>steps</Txt>
            </Txt>
            <Txt s={11} color="#15803D" w="600" style={{ marginTop: 2 }}>
              {distanceKm} km · ~{stepKcal} kcal
            </Txt>
          </View>

          {/* Circular Progress Ring */}
          <View style={{ width: 44, height: 44, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="44" height="44" viewBox="0 0 44 44">
              <circle
                cx="22"
                cy="22"
                r="18"
                fill="none"
                stroke="#DCFCE7"
                strokeWidth="4"
              />
              <circle
                cx="22"
                cy="22"
                r="18"
                fill="none"
                stroke="#16A34A"
                strokeWidth="4"
                strokeDasharray={2 * Math.PI * 18}
                strokeDashoffset={2 * Math.PI * 18 * (1 - progressRatio)}
                strokeLinecap="round"
                transform="rotate(-90 22 22)"
                style={{ transition: 'stroke-dashoffset 0.35s ease' }}
              />
            </svg>
            <View style={{ position: 'absolute' }}>
              <Txt s={10} w="800" color="#15803D">{pct}%</Txt>
            </View>
          </View>
        </Row>

        {/* Progress Bar */}
        <View
          style={{
            width: '100%',
            height: 6,
            backgroundColor: '#DCFCE7',
            borderRadius: 3,
            overflow: 'hidden',
            marginTop: 8,
            marginBottom: 12,
          }}
        >
          <View
            style={{
              width: `${Math.min(100, (stepsCount / goalSteps) * 100)}%`,
              height: '100%',
              backgroundColor: '#16A34A',
              borderRadius: 3,
            }}
          />
        </View>

        {/* Action Buttons: Quick Increment & Edit Modal */}
        <Row style={{ gap: 6 }}>
          <Pressable
            onPress={() => handleQuickAdd(500)}
            style={{
              flex: 1,
              paddingVertical: 7,
              borderRadius: 8,
              backgroundColor: '#DCFCE7',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Txt s={11} w="700" color="#166534">+500</Txt>
          </Pressable>
          <Pressable
            onPress={() => handleQuickAdd(1000)}
            style={{
              flex: 1,
              paddingVertical: 7,
              borderRadius: 8,
              backgroundColor: '#BBF7D0',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Txt s={11} w="700" color="#166534">+1k</Txt>
          </Pressable>
          <Pressable
            onPress={handleOpenModal}
            style={{
              flex: 1.2,
              paddingVertical: 7,
              borderRadius: 8,
              backgroundColor: '#F1F5F9',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Txt s={11} w="600" color={c.ink}>Edit Steps ›</Txt>
          </Pressable>
        </Row>
      </Card>

      {/* Manual Step Log / Edit Modal */}
      {showEditModal && (
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
              maxWidth: 360,
              backgroundColor: c.card,
              borderRadius: 22,
              padding: 22,
              gap: 16,
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            }}
          >
            <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Row style={{ alignItems: 'center', gap: 8 }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: '#DCFCE7',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="footprints" size={16} color="#15803D" />
                </View>
                <Txt s={18} w="800">Edit Today's Steps</Txt>
              </Row>
              <Pressable onPress={() => setShowEditModal(false)}>
                <Icon name="close" size={20} color={c.mute} />
              </Pressable>
            </Row>

            <View style={{ gap: 6 }}>
              <Txt s={12} color={c.mute}>Total Steps Walked Today</Txt>
              <TextInput
                value={inputSteps}
                onChangeText={setInputSteps}
                inputMode="numeric"
                placeholder="e.g. 7500"
                style={{
                  borderWidth: 1,
                  borderColor: c.line,
                  borderRadius: 12,
                  padding: 12,
                  fontSize: 16,
                  fontWeight: '700',
                  backgroundColor: '#FFFFFF',
                }}
              />
            </View>

            {/* Quick Presets */}
            <View style={{ gap: 6 }}>
              <Txt s={11} color={c.mute}>Quick Presets</Txt>
              <Row style={{ gap: 6 }}>
                {[3000, 5000, 8000, 10000].map((preset) => (
                  <Pressable
                    key={preset}
                    onPress={() => setInputSteps(String(preset))}
                    style={{
                      flex: 1,
                      paddingVertical: 7,
                      borderRadius: 8,
                      backgroundColor: Number(inputSteps) === preset ? c.ink : c.bg,
                      alignItems: 'center',
                    }}
                  >
                    <Txt s={11} w="700" color={Number(inputSteps) === preset ? '#FFFFFF' : c.ink}>
                      {preset >= 1000 ? `${preset / 1000}k` : preset}
                    </Txt>
                  </Pressable>
                ))}
              </Row>
            </View>

            {/* Calculated Preview */}
            <View
              style={{
                backgroundColor: '#F8FAFC',
                padding: 10,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: '#E2E8F0',
              }}
            >
              <Txt s={11} color={c.mute}>
                Estimated: ~{((Number(inputSteps) || 0) * 0.00078).toFixed(2)} km · ~{Math.round((Number(inputSteps) || 0) * 0.04)} active kcal
              </Txt>
            </View>

            {/* Modal Actions */}
            <Row style={{ gap: 10, marginTop: 4 }}>
              <Pressable
                onPress={() => setShowEditModal(false)}
                disabled={isSubmitting}
                style={{
                  flex: 1,
                  height: 42,
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
                onPress={() => handleSaveSteps()}
                disabled={isSubmitting}
                style={{ flex: 1.5, height: 42, borderRadius: 12 }}
              >
                <Txt s={13} w="800">
                  {isSubmitting ? 'Saving...' : 'Update Steps'}
                </Txt>
              </Btn>
            </Row>
          </View>
        </View>
      )}
    </>
  );
}

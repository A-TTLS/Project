import React, { useState } from 'react';
import { View, Pressable, TextInput, useWindowDimensions } from 'react-native-web';
import { Card, Row, Txt, Btn, Icon, c } from '../ui';

interface StepCounterCardProps {
  stepsCount: number;
  goalSteps?: number;
  workoutMins?: number;
  burnedKcal?: number;
  onUpdateSteps: (newSteps: number) => Promise<void> | void;
}

/**
 * Animated Vector Runner SVG
 * Smoothly animates arms, legs, bounce, and speed lines.
 */
function AnimatedRunnerIcon({ active }: { active: boolean }) {
  return (
    <View
      style={{
        width: 34,
        height: 34,
        borderRadius: 12,
        backgroundColor: '#DCFCE7',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#BBF7D0',
        flexShrink: 0,
      }}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        className="cs-runner-bob"
        style={{
          animationDuration: active ? '0.6s' : '1.15s',
          overflow: 'visible',
        }}
      >
        {/* Speed motion dashes trailing behind */}
        <line
          x1="1.5"
          y1="9.5"
          x2="6"
          y2="9.5"
          stroke="#22C55E"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeDasharray="3 3"
          className="cs-runner-trail"
        />
        <line
          x1="2.5"
          y1="13"
          x2="7"
          y2="13"
          stroke="#4ADE80"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeDasharray="3 3"
          className="cs-runner-trail"
        />
        {/* Head */}
        <circle cx="14.5" cy="5.5" r="2.2" fill="#15803D" />
        {/* Torso leaning slightly forward */}
        <path d="M13.5 8 L12 13.5" stroke="#15803D" strokeWidth="2.3" strokeLinecap="round" />
        {/* Back leg + forward arm */}
        <g className="cs-runner-stride-b" style={{ animationDuration: active ? '0.6s' : '1.15s' }}>
          <path d="M12 13.5 L8.5 16.5 L6.5 20.5" stroke="#16A34A" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13 9 L16.5 11.2 L18.2 9.5" stroke="#16A34A" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        {/* Front leg + trailing arm */}
        <g className="cs-runner-stride-a" style={{ animationDuration: active ? '0.6s' : '1.15s' }}>
          <path d="M12 13.5 L15.5 16 L16 20.5" stroke="#15803D" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13 9 L9.8 11 L8 12.8" stroke="#15803D" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
    </View>
  );
}

export function StepCounterCard({
  stepsCount,
  goalSteps = 8000,
  workoutMins = 0,
  burnedKcal = 0,
  onUpdateSteps,
}: StepCounterCardProps) {
  const { width } = useWindowDimensions();
  const isCompactPhone = width < 380;
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
      <Card
        style={{
          flex: 1,
          minWidth: 0,
          padding: isCompactPhone ? 12 : 14,
          justifyContent: 'space-between',
        }}
      >
        <View>
          {/* Header with Animated Runner SVG */}
          <Row style={{ justifyContent: 'space-between', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Row style={{ alignItems: 'center', gap: 7, minWidth: 0 }}>
              <AnimatedRunnerIcon active={stepsCount > 0 || workoutMins > 0} />
              <Txt s={13} w="700" color="#14532D">Activity & Steps</Txt>
            </Row>
            <Txt s={10} w="600" color={c.mute}>Goal {goalSteps.toLocaleString()}</Txt>
          </Row>

          {/* Main Stats and Progress Ring */}
          <Row style={{ alignItems: 'center', justifyContent: 'space-between', marginTop: 10, gap: 6 }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Txt s={isCompactPhone ? 19 : 22} w="800" color="#0F172A">
                {stepsCount.toLocaleString()} <Txt s={11} color={c.mute}>steps</Txt>
              </Txt>
              <Txt s={11} color="#15803D" w="600" style={{ marginTop: 2, lineHeight: 15 }}>
                {distanceKm} km · ~{stepKcal} kcal{workoutMins > 0 || totalBurned > stepKcal ? ` · ${totalBurned} total` : ''}
              </Txt>
            </View>

            {/* Circular Progress Ring */}
            <View style={{ width: 42, height: 42, position: 'relative', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="42" height="42" viewBox="0 0 44 44">
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
                  style={{ transition: 'stroke-dashoffset 0.55s cubic-bezier(0.22, 1, 0.36, 1)' }}
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
              marginBottom: 10,
            }}
          >
            <View
              style={{
                width: `${Math.min(100, (stepsCount / goalSteps) * 100)}%`,
                height: '100%',
                backgroundColor: '#16A34A',
                borderRadius: 3,
                transition: 'width 0.55s cubic-bezier(0.22, 1, 0.36, 1)' as any,
              }}
            />
          </View>
        </View>

        {/* Action Buttons — clean 2-row layout so no label truncates on compact phones */}
        <View style={{ gap: 6 }}>
          <Row style={{ gap: 6 }}>
            <Pressable
              onPress={() => handleQuickAdd(500)}
              style={({ pressed }: { pressed: boolean }) => ({
                flex: 1,
                paddingVertical: 7,
                paddingHorizontal: 4,
                borderRadius: 10,
                backgroundColor: '#DCFCE7',
                borderWidth: 1,
                borderColor: '#BBF7D0',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.75 : 1,
                cursor: 'pointer' as any,
              })}
            >
              <Txt s={11} w="700" color="#166534">+500 steps</Txt>
            </Pressable>
            <Pressable
              onPress={() => handleQuickAdd(1000)}
              style={({ pressed }: { pressed: boolean }) => ({
                flex: 1,
                paddingVertical: 7,
                paddingHorizontal: 4,
                borderRadius: 10,
                backgroundColor: '#BBF7D0',
                borderWidth: 1,
                borderColor: '#86EFAC',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.75 : 1,
                cursor: 'pointer' as any,
              })}
            >
              <Txt s={11} w="700" color="#166534">+1k steps</Txt>
            </Pressable>
          </Row>

          <Pressable
            onPress={handleOpenModal}
            style={({ pressed }: { pressed: boolean }) => ({
              width: '100%',
              paddingVertical: 7,
              borderRadius: 10,
              backgroundColor: c.bg,
              borderWidth: 1,
              borderColor: '#E5E7EB',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.75 : 1,
              cursor: 'pointer' as any,
            })}
          >
            <Txt s={11} w="700" color={c.ink}>Edit Steps ›</Txt>
          </Pressable>
        </View>
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
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 14,
            zIndex: 1000,
          }}
        >
          <div
            className="cs-modal-pop"
            style={{
              width: '100%',
              maxWidth: 360,
              backgroundColor: c.card,
              borderRadius: 22,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            }}
          >
            <Row style={{ justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <Row style={{ alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                <AnimatedRunnerIcon active />
                <Txt s={18} w="800">Edit Today's Steps</Txt>
              </Row>
              <Pressable onPress={() => setShowEditModal(false)} style={{ padding: 4, flexShrink: 0 }}>
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
                placeholderTextColor="#94A3B8"
                style={{
                  borderWidth: 1,
                  borderColor: c.line,
                  borderRadius: 12,
                  padding: 12,
                  fontSize: 16,
                  fontWeight: '700',
                  backgroundColor: '#FFFFFF',
                  color: '#1E293B',
                  minWidth: 0,
                }}
              />
            </View>

            {/* Quick Presets */}
            <View style={{ gap: 6 }}>
              <Txt s={11} color={c.mute}>Quick Presets</Txt>
              <Row style={{ gap: 6, flexWrap: 'wrap' }}>
                {[3000, 5000, 8000, 10000].map((preset) => (
                  <Pressable
                    key={preset}
                    onPress={() => setInputSteps(String(preset))}
                    style={{
                      flex: 1,
                      minWidth: 64,
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
          </div>
        </View>
      )}
    </>
  );
}

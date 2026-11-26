import React, { useState } from 'react';
import { View, Pressable, useWindowDimensions } from 'react-native-web';
import { Card, Row, Txt, Icon, c } from '../ui';

interface WaterIntakeCardProps {
  waterMl: number;
  targetMl?: number;
  onAddWater: (amount: number) => void;
}

/**
 * Animated Dual-Wave Water Fill Background (inspired by RiceCal WaterTank)
 * Rises smoothly from the bottom of the Water card as hydration increases.
 */
function WaterTankWaveBackdrop({ fillPct }: { fillPct: number }) {
  const clamped = Math.min(100, Math.max(0, fillPct));
  // Keep a 16% shallow puddle at 0ml and stop around 90% so the animated crest stays visible even at 100%
  const visualHeightPct = Math.round(16 + clamped * 0.74);

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 20,
        overflow: 'hidden',
        pointerEvents: 'none',
        background: 'linear-gradient(180deg, #FFFFFF 0%, #F0F9FF 100%)',
        zIndex: 0,
      }}
    >
      {/* Subtle rising bubbles when hydrating */}
      {clamped > 0 && (
        <>
          <div
            className="cs-bubble-1"
            style={{
              position: 'absolute',
              bottom: 18,
              left: '22%',
              width: 7,
              height: 7,
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.55)',
              zIndex: 2,
            }}
          />
          <div
            className="cs-bubble-2"
            style={{
              position: 'absolute',
              bottom: 14,
              right: '26%',
              width: 5,
              height: 5,
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              zIndex: 2,
            }}
          />
        </>
      )}

      {/* Rising water mass */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: `${visualHeightPct}%`,
          transition: 'height 0.7s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {/* Back wave (slower) */}
        <svg
          viewBox="0 0 240 16"
          preserveAspectRatio="none"
          className="cs-wave-back"
          style={{
            position: 'absolute',
            top: -12,
            left: 0,
            width: '200%',
            height: 14,
            display: 'block',
          }}
        >
          <path
            d="M0 8 Q 30 0, 60 8 T 120 8 T 180 8 T 240 8 L 240 16 L 0 16 Z"
            fill="rgba(125, 211, 252, 0.36)"
          />
        </svg>

        {/* Front wave (livelier) */}
        <svg
          viewBox="0 0 240 16"
          preserveAspectRatio="none"
          className="cs-wave-front"
          style={{
            position: 'absolute',
            top: -10,
            left: 0,
            width: '200%',
            height: 12,
            display: 'block',
          }}
        >
          <path
            d="M0 7 Q 30 14, 60 7 T 120 7 T 180 7 T 240 7 L 240 16 L 0 16 Z"
            fill="rgba(56, 189, 248, 0.42)"
          />
        </svg>

        {/* Solid water body gradient below crest */}
        <div
          style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(180deg, rgba(56, 189, 248, 0.42) 0%, rgba(14, 165, 233, 0.5) 100%)',
          }}
        />
      </div>
    </div>
  );
}

export function WaterIntakeCard({
  waterMl,
  targetMl = 2000,
  onAddWater,
}: WaterIntakeCardProps) {
  const { width } = useWindowDimensions();
  const isCompactPhone = width < 380;
  const [lastAmount, setLastAmount] = useState<number>(250);

  const pct = Math.round((waterMl / targetMl) * 100);
  const progressRatio = Math.min(1, Math.max(0, waterMl / targetMl));

  const handleAdd = (amount: number) => {
    setLastAmount(amount);
    onAddWater(amount);
  };

  const handleUndo = () => {
    if (waterMl > 0) {
      onAddWater(-Math.min(lastAmount, waterMl));
    }
  };

  return (
    <Card
      bg="#FFFFFF"
      style={{
        flex: 1,
        minWidth: 0,
        padding: isCompactPhone ? 12 : 14,
        borderColor: '#BAE6FD',
        position: 'relative',
        overflow: 'hidden',
        justifyContent: 'space-between',
      }}
    >
      <WaterTankWaveBackdrop fillPct={pct} />

      <View style={{ position: 'relative', zIndex: 2, flex: 1, justifyContent: 'space-between' }}>
        <View>
          {/* Header */}
          <Row style={{ justifyContent: 'space-between', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Row style={{ alignItems: 'center', gap: 7, minWidth: 0 }}>
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 10,
                  backgroundColor: '#E0F2FE',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon name="water" size={16} color="#0284C7" />
              </View>
              <Txt s={13} w="700" color="#0C4A6E">Water</Txt>
            </Row>
            <Txt s={10} w="600" color="#0369A1">Goal {targetMl.toLocaleString()} ml</Txt>
          </Row>

          {/* Main Stat and Progress Ring */}
          <Row style={{ alignItems: 'center', justifyContent: 'space-between', marginTop: 10, gap: 6 }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Txt s={isCompactPhone ? 19 : 22} w="800" color="#0F172A">
                {waterMl.toLocaleString()}{' '}
                <Txt s={11} w="600" color="#334155">ml</Txt>
              </Txt>
              <Txt s={11} color="#0369A1" w="700" style={{ marginTop: 2 }}>
                {pct >= 100 ? 'Goal achieved! 💧' : `${pct}% hydrated`}
              </Txt>
            </View>

            <View style={{ width: 42, height: 42, position: 'relative', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="42" height="42" viewBox="0 0 44 44">
                <circle
                  cx="22"
                  cy="22"
                  r="18"
                  fill="none"
                  stroke="#E0F2FE"
                  strokeWidth="4"
                />
                <circle
                  cx="22"
                  cy="22"
                  r="18"
                  fill="none"
                  stroke="#0284C7"
                  strokeWidth="4"
                  strokeDasharray={2 * Math.PI * 18}
                  strokeDashoffset={2 * Math.PI * 18 * (1 - progressRatio)}
                  strokeLinecap="round"
                  transform="rotate(-90 22 22)"
                  style={{ transition: 'stroke-dashoffset 0.55s cubic-bezier(0.22, 1, 0.36, 1)' }}
                />
              </svg>
              <View style={{ position: 'absolute' }}>
                <Txt s={10} w="800" color="#0369A1">{Math.min(150, pct)}%</Txt>
              </View>
            </View>
          </Row>

          {/* Progress Bar */}
          <View
            style={{
              width: '100%',
              height: 6,
              backgroundColor: 'rgba(224, 242, 254, 0.9)',
              borderRadius: 3,
              overflow: 'hidden',
              marginTop: 8,
              marginBottom: 10,
            }}
          >
            <View
              style={{
                width: `${Math.min(100, (waterMl / targetMl) * 100)}%`,
                height: '100%',
                backgroundColor: '#0284C7',
                borderRadius: 3,
                transition: 'width 0.55s cubic-bezier(0.22, 1, 0.36, 1)' as any,
              }}
            />
          </View>
        </View>

        {/* Responsive 2x2 Action Grid — prevents word clipping on compact phones */}
        <View style={{ gap: 6 }}>
          <Row style={{ gap: 6 }}>
            <Pressable
              onPress={() => handleAdd(250)}
              style={({ pressed }: { pressed: boolean }) => ({
                flex: 1,
                paddingVertical: 7,
                paddingHorizontal: 4,
                borderRadius: 10,
                backgroundColor: 'rgba(255, 255, 255, 0.92)',
                borderWidth: 1,
                borderColor: '#BAE6FD',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.75 : 1,
                cursor: 'pointer' as any,
              })}
            >
              <Txt s={11} w="700" color="#0369A1">+250 ml</Txt>
            </Pressable>

            <Pressable
              onPress={() => handleAdd(500)}
              style={({ pressed }: { pressed: boolean }) => ({
                flex: 1,
                paddingVertical: 7,
                paddingHorizontal: 4,
                borderRadius: 10,
                backgroundColor: 'rgba(224, 242, 254, 0.95)',
                borderWidth: 1,
                borderColor: '#7DD3FC',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.75 : 1,
                cursor: 'pointer' as any,
              })}
            >
              <Txt s={11} w="700" color="#0369A1">+500 ml</Txt>
            </Pressable>
          </Row>

          <Row style={{ gap: 6 }}>
            <Pressable
              onPress={() => handleAdd(-250)}
              disabled={waterMl < 250}
              style={({ pressed }: { pressed: boolean }) => ({
                flex: 1,
                paddingVertical: 7,
                paddingHorizontal: 4,
                borderRadius: 10,
                backgroundColor: waterMl >= 250 ? 'rgba(241, 245, 249, 0.95)' : 'rgba(248, 250, 252, 0.85)',
                borderWidth: 1,
                borderColor: '#E2E8F0',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed && waterMl >= 250 ? 0.75 : waterMl >= 250 ? 1 : 0.45,
                cursor: waterMl >= 250 ? ('pointer' as any) : ('default' as any),
              })}
            >
              <Txt s={11} w="700" color={waterMl >= 250 ? '#475569' : '#94A3B8'}>-250 ml</Txt>
            </Pressable>

            <Pressable
              onPress={handleUndo}
              disabled={waterMl === 0}
              accessibilityLabel="Undo last water entry"
              style={({ pressed }: { pressed: boolean }) => ({
                flex: 1,
                paddingVertical: 7,
                paddingHorizontal: 4,
                borderRadius: 10,
                backgroundColor: waterMl > 0 ? 'rgba(254, 243, 199, 0.95)' : 'rgba(248, 250, 252, 0.85)',
                borderWidth: 1,
                borderColor: waterMl > 0 ? '#FDE68A' : '#E2E8F0',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed && waterMl > 0 ? 0.75 : waterMl > 0 ? 1 : 0.45,
                cursor: waterMl > 0 ? ('pointer' as any) : ('default' as any),
              })}
            >
              <Txt s={11} w="700" color={waterMl > 0 ? '#92400E' : c.mute}>↩ Undo</Txt>
            </Pressable>
          </Row>
        </View>
      </View>
    </Card>
  );
}

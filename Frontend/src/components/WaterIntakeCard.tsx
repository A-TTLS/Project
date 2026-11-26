import React, { useState } from 'react';
import { View, Pressable } from 'react-native-web';
import { Card, Row, Txt, Icon, c } from '../ui';

interface WaterIntakeCardProps {
  waterMl: number;
  targetMl?: number;
  onAddWater: (amount: number) => void;
}

export function WaterIntakeCard({
  waterMl,
  targetMl = 2000,
  onAddWater,
}: WaterIntakeCardProps) {
  const [lastAmount, setLastAmount] = useState<number>(250);

  const pct = Math.min(150, Math.round((waterMl / targetMl) * 100));
  const progressRatio = Math.min(1, Math.max(0, waterMl / targetMl));

  const handleAdd = (amount: number) => {
    setLastAmount(amount);
    onAddWater(amount);
  };

  const handleUndo = () => {
    if (waterMl > 0) {
      onAddWater(-lastAmount);
    }
  };

  return (
    <Card style={{ flex: 1, padding: 14 }}>
      {/* Header */}
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Row style={{ alignItems: 'center', gap: 8 }}>
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              backgroundColor: '#E0F2FE',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="water" size={16} color="#0284C7" />
          </View>
          <Txt s={13} w="700">Water</Txt>
        </Row>
        <Txt s={11} color={c.mute}>Goal {targetMl.toLocaleString()}ml</Txt>
      </Row>

      {/* Main Stat and Progress Ring / Fill Bar */}
      <Row style={{ alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
        <View>
          <Txt s={22} w="800">
            {waterMl.toLocaleString()} <Txt s={12} color={c.mute}>ml</Txt>
          </Txt>
          <Txt s={11} color="#0284C7" w="600" style={{ marginTop: 2 }}>
            {pct}% Hydrated
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
              style={{ transition: 'stroke-dashoffset 0.35s ease' }}
            />
          </svg>
          <View style={{ position: 'absolute' }}>
            <Txt s={10} w="800" color="#0369A1">{pct}%</Txt>
          </View>
        </View>
      </Row>

      {/* Sleek Horizontal Bar indicator */}
      <View
        style={{
          width: '100%',
          height: 6,
          backgroundColor: '#E0F2FE',
          borderRadius: 3,
          overflow: 'hidden',
          marginTop: 8,
          marginBottom: 12,
        }}
      >
        <View
          style={{
            width: `${Math.min(100, (waterMl / targetMl) * 100)}%`,
            height: '100%',
            backgroundColor: '#0284C7',
            borderRadius: 3,
          }}
        />
      </View>

      {/* Quick Action Buttons (+250ml, -250ml, +500ml, undo) */}
      <Row style={{ gap: 5 }}>
        <Pressable
          onPress={() => handleAdd(250)}
          style={{
            flex: 1,
            paddingVertical: 7,
            borderRadius: 8,
            backgroundColor: '#E0F2FE',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Txt s={11} w="700" color="#0369A1">+250ml</Txt>
        </Pressable>

        <Pressable
          onPress={() => handleAdd(-250)}
          disabled={waterMl < 250}
          style={{
            flex: 1,
            paddingVertical: 7,
            borderRadius: 8,
            backgroundColor: waterMl >= 250 ? '#F1F5F9' : '#F8FAFC',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: waterMl >= 250 ? 1 : 0.4,
          }}
        >
          <Txt s={11} w="700" color={waterMl >= 250 ? '#475569' : '#94A3B8'}>-250ml</Txt>
        </Pressable>

        <Pressable
          onPress={() => handleAdd(500)}
          style={{
            flex: 1,
            paddingVertical: 7,
            borderRadius: 8,
            backgroundColor: '#BAE6FD',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Txt s={11} w="700" color="#0369A1">+500ml</Txt>
        </Pressable>

        <Pressable
          onPress={handleUndo}
          disabled={waterMl === 0}
          style={{
            paddingHorizontal: 9,
            paddingVertical: 7,
            borderRadius: 8,
            backgroundColor: waterMl > 0 ? '#FEF3C7' : '#F1F5F9',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: waterMl > 0 ? 1 : 0.4,
          }}
          accessibilityLabel="Undo last water entry"
        >
          <Txt s={11} color={waterMl > 0 ? '#92400E' : c.mute}>↩</Txt>
        </Pressable>
      </Row>
    </Card>
  );
}

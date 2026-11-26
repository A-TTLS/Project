import React, { useState, useMemo } from 'react';
import { View, Pressable, TextInput } from 'react-native-web';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { type WeightLog } from '../services/weightService';
import { Card, Row, Txt, Btn, Icon, c } from '../ui';

interface WeightTrendCardProps {
  currentWeight: number;
  targetWeight?: number;
  weightLogs: WeightLog[];
  onLogWeight: (weightKg: number, note?: string) => Promise<any>;
}

export function WeightTrendCard({
  currentWeight,
  targetWeight,
  weightLogs,
  onLogWeight,
}: WeightTrendCardProps) {
  const [timeframe, setTimeframe] = useState<'7D' | '30D' | 'All'>('30D');
  const [showLogModal, setShowLogModal] = useState(false);
  const [inputWeight, setInputWeight] = useState(String(currentWeight || 65));
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter and prepare chart data based on timeframe
  const chartData = useMemo(() => {
    let filtered = [...weightLogs].sort(
      (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
    );

    const now = new Date();
    if (timeframe === '7D') {
      const cut = new Date();
      cut.setDate(cut.getDate() - 7);
      filtered = filtered.filter((l) => new Date(l.recorded_at) >= cut);
    } else if (timeframe === '30D') {
      const cut = new Date();
      cut.setDate(cut.getDate() - 30);
      filtered = filtered.filter((l) => new Date(l.recorded_at) >= cut);
    }

    if (filtered.length === 0 && currentWeight > 0) {
      // Single fallback point today
      return [{
        date: 'Today',
        rawDate: new Date().toISOString(),
        weight: currentWeight,
      }];
    }

    return filtered.map((l) => {
      const d = new Date(l.recorded_at);
      return {
        date: d.toLocaleDateString([], { month: 'short', day: 'numeric' }),
        rawDate: l.recorded_at,
        weight: l.weight_kg,
        note: l.note,
      };
    });
  }, [weightLogs, timeframe, currentWeight]);

  // Compute net change over selected period
  const { netChange, changeLabel, isLoss, isGain } = useMemo(() => {
    if (chartData.length < 2) {
      return { netChange: 0, changeLabel: '0.0 kg', isLoss: false, isGain: false };
    }
    const firstWeight = chartData[0].weight;
    const lastWeight = chartData[chartData.length - 1].weight;
    const diff = Math.round((lastWeight - firstWeight) * 10) / 10;
    const isLoss = diff < 0;
    const isGain = diff > 0;
    const sign = diff > 0 ? '+' : '';
    return {
      netChange: diff,
      changeLabel: `${sign}${diff} kg`,
      isLoss,
      isGain,
    };
  }, [chartData]);

  // Y-axis bounds
  const minWeight = useMemo(() => {
    const weights = chartData.map((d) => d.weight);
    if (targetWeight) weights.push(targetWeight);
    return Math.floor(Math.min(...weights, currentWeight || 60) - 1);
  }, [chartData, targetWeight, currentWeight]);

  const maxWeight = useMemo(() => {
    const weights = chartData.map((d) => d.weight);
    if (targetWeight) weights.push(targetWeight);
    return Math.ceil(Math.max(...weights, currentWeight || 70) + 1);
  }, [chartData, targetWeight, currentWeight]);

  const handleOpenModal = () => {
    setInputWeight(String(currentWeight || 65));
    setNote('');
    setShowLogModal(true);
  };

  const handleSaveWeight = async () => {
    const w = parseFloat(inputWeight);
    if (isNaN(w) || w <= 20 || w >= 300) return;
    setIsSubmitting(true);
    try {
      await onLogWeight(w, note.trim() || undefined);
      setShowLogModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const adjustInputWeight = (delta: number) => {
    const cur = parseFloat(inputWeight) || currentWeight || 65;
    const next = Math.round((cur + delta) * 10) / 10;
    setInputWeight(String(next));
  };

  return (
    <>
      <Card style={{ padding: 16, marginBottom: 16 }}>
        {/* Header & Timeframe Pills */}
        <Row style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <Row style={{ alignItems: 'center', gap: 8 }}>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: '#FFEFA0',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon name="scale" size={16} color={c.ink} />
            </View>
            <Txt s={15} w="800">Weight Trend</Txt>
          </Row>

          <Row style={{ gap: 4, backgroundColor: c.bg, padding: 3, borderRadius: 10, flexShrink: 0 }}>
            {(['7D', '30D', 'All'] as const).map((tf) => {
              const active = timeframe === tf;
              return (
                <Pressable
                  key={tf}
                  onPress={() => setTimeframe(tf)}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 7,
                    backgroundColor: active ? '#FFFFFF' : 'transparent',
                    boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  <Txt s={11} w={active ? '700' : '500'} color={active ? c.ink : c.mute}>
                    {tf}
                  </Txt>
                </Pressable>
              );
            })}
          </Row>
        </Row>

        {/* Current Weight, Net Change & Quick Log Button */}
        <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 8, marginTop: 12, marginBottom: 12 }}>
          <View style={{ flex: 1, minWidth: 160 }}>
            <Row style={{ alignItems: 'baseline', gap: 6 }}>
              <Txt s={28} w="800">
                {currentWeight || '--'}
              </Txt>
              <Txt s={13} color={c.mute} w="600">kg</Txt>

              {/* Net change badge */}
              {chartData.length >= 2 && (
                <View
                  style={{
                    marginLeft: 6,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 8,
                    backgroundColor: isLoss ? '#DCFCE7' : isGain ? '#FEF3C7' : '#F1F5F9',
                  }}
                >
                  <Txt
                    s={11}
                    w="700"
                    color={isLoss ? '#15803D' : isGain ? '#B45309' : c.mute}
                  >
                    {isLoss ? '↓ ' : isGain ? '↑ ' : ''}{changeLabel}
                  </Txt>
                </View>
              )}
            </Row>

            <Txt s={11} color={c.mute} style={{ marginTop: 2 }}>
              {targetWeight ? `Target: ${targetWeight} kg (${(currentWeight - targetWeight).toFixed(1)} kg to goal)` : 'Maintain healthy weight'}
            </Txt>
          </View>

          <Btn
            bg={c.yellow}
            onPress={handleOpenModal}
            style={{ paddingHorizontal: 12, height: 34, borderRadius: 10 }}
          >
            <Row style={{ gap: 4, alignItems: 'center' }}>
              <Icon name="plus" size={12} color={c.ink} />
              <Txt s={12} w="700">Log Weight</Txt>
            </Row>
          </Btn>
        </Row>

        {/* Recharts Area Chart */}
        <View style={{ width: '100%', height: 160, marginTop: 4 }}>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[minWeight, maxWeight]}
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                  axisLine={false}
                  tickLine={false}
                  width={35}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 10,
                    border: '1px solid #E2E8F0',
                    fontSize: 12,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  }}
                  formatter={(val: any) => [`${val} kg`, 'Weight']}
                  labelFormatter={(lbl: any) => `Date: ${lbl}`}
                />
                {targetWeight && (
                  <ReferenceLine
                    y={targetWeight}
                    stroke="#059669"
                    strokeDasharray="4 4"
                    label={{
                      value: `Goal ${targetWeight}kg`,
                      position: 'top',
                      fill: '#059669',
                      fontSize: 10,
                    }}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="weight"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#weightGrad)"
                  dot={{ r: 3, fill: '#10B981', strokeWidth: 1, stroke: '#FFFFFF' }}
                  activeDot={{ r: 5, fill: '#059669' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg, borderRadius: 12 }}>
              <Txt s={12} color={c.mute}>No weight logs yet for this period</Txt>
            </View>
          )}
        </View>
      </Card>

      {/* Log Weight Modal */}
      {showLogModal && (
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
              maxWidth: 380,
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
                    backgroundColor: '#FFEFA0',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="scale" size={16} color={c.ink} />
                </View>
                <Txt s={18} w="800">Log Weight Entry</Txt>
              </Row>
              <Pressable onPress={() => setShowLogModal(false)}>
                <Icon name="close" size={20} color={c.mute} />
              </Pressable>
            </Row>

            {/* Weight Input with Stepper Buttons */}
            <View style={{ gap: 8 }}>
              <Txt s={12} color={c.mute}>Body Weight (kg)</Txt>
              <Row style={{ alignItems: 'center', gap: 8 }}>
                <Pressable
                  onPress={() => adjustInputWeight(-0.5)}
                  style={{
                    width: 40,
                    height: 44,
                    borderRadius: 10,
                    backgroundColor: c.bg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Txt s={13} w="700">-0.5</Txt>
                </Pressable>
                <Pressable
                  onPress={() => adjustInputWeight(-0.1)}
                  style={{
                    width: 40,
                    height: 44,
                    borderRadius: 10,
                    backgroundColor: c.bg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Txt s={13} w="700">-0.1</Txt>
                </Pressable>

                <TextInput
                  value={inputWeight}
                  onChangeText={setInputWeight}
                  inputMode="decimal"
                  placeholder="65.0"
                  placeholderTextColor="#94A3B8"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    height: 44,
                    borderWidth: 1,
                    borderColor: c.line,
                    borderRadius: 10,
                    textAlign: 'center',
                    fontSize: 18,
                    fontWeight: '800',
                    backgroundColor: '#FFFFFF',
                    color: '#1E293B',
                  }}
                />

                <Pressable
                  onPress={() => adjustInputWeight(0.1)}
                  style={{
                    width: 40,
                    height: 44,
                    borderRadius: 10,
                    backgroundColor: c.bg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Txt s={13} w="700">+0.1</Txt>
                </Pressable>
                <Pressable
                  onPress={() => adjustInputWeight(0.5)}
                  style={{
                    width: 40,
                    height: 44,
                    borderRadius: 10,
                    backgroundColor: c.bg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Txt s={13} w="700">+0.5</Txt>
                </Pressable>
              </Row>
            </View>

            {/* Optional Note */}
            <View style={{ gap: 4 }}>
              <Txt s={12} color={c.mute}>Note (optional)</Txt>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="e.g. Morning fasted, post gym"
                style={{
                  borderWidth: 1,
                  borderColor: c.line,
                  borderRadius: 10,
                  padding: 10,
                  fontSize: 13,
                  backgroundColor: '#FFFFFF',
                }}
              />
            </View>

            {/* Actions */}
            <Row style={{ gap: 10, marginTop: 4 }}>
              <Pressable
                onPress={() => setShowLogModal(false)}
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
                onPress={handleSaveWeight}
                disabled={isSubmitting || !inputWeight}
                style={{ flex: 1.5, height: 42, borderRadius: 12 }}
              >
                <Txt s={13} w="800">
                  {isSubmitting ? 'Saving...' : 'Save Weight'}
                </Txt>
              </Btn>
            </Row>
          </View>
        </View>
      )}
    </>
  );
}

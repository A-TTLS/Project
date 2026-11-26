import React, { useEffect, useState } from 'react';
import { View, Pressable } from 'react-native-web';
import { useApp } from '../context/AppContext';
import { useCalorieHistory } from '../hooks/useCalorieHistory';
import type { CalorieBar, TrendRange } from '../services/trendsService';
import { Row, Txt, Card, Pill, c } from '../ui';

// Member 5 · Trend → Calorie intake chart with Week / Month / 6 Months toggle.
// Stacked bars by meal, a dashed line for the daily target, and tap-to-inspect.
// Signed in: real meals from Supabase. Signed out: demo bars.

const RANGES: { key: TrendRange; label: string }[] = [
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: '6months', label: '6 Months' },
];

const MEALS = [
  { key: 'breakfast', name: 'Breakfast', color: '#FFE27A' },
  { key: 'lunch', name: 'Lunch', color: '#BFE3AE' },
  { key: 'dinner', name: 'Dinner', color: '#A9D6F0' },
  { key: 'snacks', name: 'Snacks', color: '#F6B8B0' },
] as const;

const CHART_HEIGHT = 150;

const SUBTITLE: Record<TrendRange, string> = {
  week: 'This week · total per day',
  month: 'Last 5 weeks · average per logged day',
  '6months': 'Last 6 months · average per logged day',
};

function demoBars(range: TrendRange, todayKcal: number): CalorieBar[] {
  const make = (label: string, total: number, isCurrent = false): CalorieBar => ({
    bucket_start: label,
    label,
    breakfast: Math.round(total * 0.25),
    lunch: Math.round(total * 0.35),
    dinner: Math.round(total * 0.3),
    snacks: total - Math.round(total * 0.25) - Math.round(total * 0.35) - Math.round(total * 0.3),
    total,
    sum_kcal: total,
    days_logged: total > 0 ? 1 : 0,
    is_current: isCurrent,
  });
  if (range === 'week') {
    const today = (new Date().getDay() + 6) % 7;
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) =>
      make(d, i < today ? [1720, 1580, 1910, 1650, 1800, 1540][i % 6] : i === today ? todayKcal : 0, i === today),
    );
  }
  if (range === 'month') return ['W1', 'W2', 'W3', 'W4', 'Now'].map((w, i) => make(w, [1690, 1760, 1620, 1710, todayKcal][i], i === 4));
  return ['M1', 'M2', 'M3', 'M4', 'M5', 'Now'].map((m, i) => make(m, [1810, 1740, 1690, 1650, 1700, todayKcal][i], i === 5));
}

export default function CalorieIntakeChart() {
  const { consumedKcal, showToast } = useApp();
  const [range, setRange] = useState<TrendRange>('week');
  const [selected, setSelected] = useState<number | null>(null);
  const history = useCalorieHistory(range);

  // Clear the selected bar when switching range.
  useEffect(() => setSelected(null), [range]);

  const bars = history.isLive ? history.bars : demoBars(range, consumedKcal);
  const target = history.isLive ? history.target : 1850;
  const loggedDays = bars.filter((b) => b.days_logged > 0);
  const average = history.isLive
    ? history.average
    : loggedDays.length
      ? Math.round(loggedDays.reduce((s, b) => s + b.total, 0) / loggedDays.length)
      : 0;

  const scaleMax = Math.max(target * 1.2, ...bars.map((b) => b.total), 1);
  const targetTop = CHART_HEIGHT - (target / scaleMax) * CHART_HEIGHT;
  const picked = selected !== null ? bars[selected] : null;
  const barWidth = bars.length > 6 ? 22 : 30;

  return (
    <>
      {/* Range toggle */}
      <Row style={{ marginBottom: 14, gap: 6 }}>
        {RANGES.map((r) => (
          <Pill key={r.key} active={range === r.key} onPress={() => setRange(r.key)}>
            {r.label}
          </Pill>
        ))}
      </Row>

      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Txt s={17} w="800">Calorie intake</Txt>
            <Txt s={11} color={c.mute}>{SUBTITLE[range]}</Txt>
          </View>
          <Pill bg={c.yellow}>kcal</Pill>
        </Row>

        <Row style={{ alignItems: 'baseline', marginTop: 12 }}>
          <Txt s={34} w="800">{(picked ? picked.total : average).toLocaleString()}</Txt>
          <Txt s={12} color={c.mute} style={{ marginLeft: 8 }}>
            {picked
              ? `${picked.label}${range === 'week' ? '' : ' · avg/day'}`
              : 'avg / logged day'}
          </Txt>
        </Row>

        {!history.isLive && !history.loading ? (
          <Txt s={11} color={c.mute} style={{ marginTop: 4 }}>Showing demo data. Sign in to see your own trend.</Txt>
        ) : null}
        {history.error ? (
          <Pressable onPress={() => void history.reload()}>
            <Txt s={11} color="#C0392B" style={{ marginTop: 4 }}>Couldn't load your trend. Tap to retry.</Txt>
          </Pressable>
        ) : null}

        {/* Chart */}
        <View style={{ height: CHART_HEIGHT, marginTop: 20, position: 'relative' }}>
          {/* Target line */}
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: targetTop,
              borderTopWidth: 1.5,
              borderStyle: 'dashed',
              borderColor: c.ink,
              opacity: 0.35,
            }}
          />
          <Txt s={9} color={c.mute} style={{ position: 'absolute', right: 0, top: Math.max(targetTop - 14, 0) }}>
            Target {target.toLocaleString()}
          </Txt>

          <Row style={{ height: '100%', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            {bars.map((b, i) => {
              const isPicked = selected === i;
              return (
                <Pressable
                  key={b.bucket_start}
                  onPress={() => setSelected(isPicked ? null : i)}
                  style={{ alignItems: 'center', opacity: selected === null || isPicked ? 1 : 0.45 }}
                >
                  {b.total === 0 ? (
                    <View style={{ width: barWidth, height: 6, borderRadius: 4, backgroundColor: c.block }} />
                  ) : (
                    <View style={{ width: barWidth, borderRadius: 10, overflow: 'hidden', borderWidth: b.is_current ? 1.5 : 0, borderColor: c.ink }}>
                      {/* Top to bottom: snacks, dinner, lunch, breakfast */}
                      {[...MEALS].reverse().map((m) => {
                        const value = b[m.key];
                        if (!value) return null;
                        return (
                          <View
                            key={m.key}
                            style={{ height: Math.max((value / scaleMax) * CHART_HEIGHT, 2), backgroundColor: m.color }}
                          />
                        );
                      })}
                    </View>
                  )}
                </Pressable>
              );
            })}
          </Row>
        </View>

        <Row style={{ justifyContent: 'space-between', marginTop: 8 }}>
          {bars.map((b, i) => (
            <Txt
              key={b.bucket_start}
              s={10}
              w={b.is_current || selected === i ? '800' : '400'}
              color={b.is_current || selected === i ? c.ink : c.mute}
              style={{ width: barWidth + 10, textAlign: 'center' }}
            >
              {b.label}
            </Txt>
          ))}
        </Row>

        {/* Selected bar details, or the legend */}
        {picked ? (
          <View style={{ marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderColor: c.line, gap: 4 }}>
            {MEALS.map((m) => (
              <Row key={m.key} style={{ justifyContent: 'space-between' }}>
                <Row style={{ alignItems: 'center' }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: m.color, marginRight: 6 }} />
                  <Txt s={12}>{m.name}</Txt>
                </Row>
                <Txt s={12} w="700">{picked[m.key].toLocaleString()} kcal</Txt>
              </Row>
            ))}
            <Txt s={11} color={c.mute} style={{ marginTop: 4 }}>
              {picked.days_logged === 0
                ? 'Nothing logged in this period.'
                : range === 'week'
                  ? `${Math.round((picked.total / target) * 100)}% of your ${target.toLocaleString()} kcal target`
                  : `${picked.days_logged} logged ${picked.days_logged === 1 ? 'day' : 'days'} · ${picked.sum_kcal.toLocaleString()} kcal in total`}
            </Txt>
          </View>
        ) : (
          <Row style={{ justifyContent: 'space-around', marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderColor: c.line }}>
            {MEALS.map((m) => (
              <Row key={m.key} style={{ alignItems: 'center' }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: m.color, marginRight: 5 }} />
                <Txt s={10} color={c.mute}>{m.name}</Txt>
              </Row>
            ))}
          </Row>
        )}

        <Pressable onPress={() => showToast('Tap a bar to see its meals')}>
          <Txt s={11} color={c.mute} style={{ marginTop: 12 }}>
            {bars.some((b) => b.is_current)
              ? 'The outlined bar is still in progress. Tap any bar for details.'
              : 'Tap any bar for details.'}
          </Txt>
        </Pressable>
      </Card>
    </>
  );
}

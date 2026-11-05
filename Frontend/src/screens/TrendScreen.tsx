import React, { useState } from 'react';
import { View, Pressable } from 'react-native-web';
import { useApp } from '../context/AppContext';
import {
  Screen,
  Title,
  Segmented,
  Row,
  Txt,
  Card,
  Pill,
  IconBox,
  Ph,
  MealRow,
  c,
} from '../ui';

interface TrendScreenProps {
  onNavigate: (screen: string) => void;
  initialTab?: number;
}

export default function TrendScreen({ onNavigate, initialTab = 0 }: TrendScreenProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [timeRange, setTimeRange] = useState<'Week' | 'Month' | '6 Months'>('Week');
  const [selectedDay, setSelectedDay] = useState(14);
  const { showToast } = useApp();

  const daysData = [
    { day: 'F', date: 9, height: 60, kcal: 1720 },
    { day: 'S', date: 10, height: 90, kcal: 1950 },
    { day: 'S', date: 11, height: 100, kcal: 2020 },
    { day: 'M', date: 12, height: 85, kcal: 1840 },
    { day: 'T', date: 13, height: 95, kcal: 1980 },
    { day: 'W', date: 14, height: 100, kcal: 1920 },
    { day: 'T', date: 15, height: 35, kcal: 500 },
  ];

  const calendarDays = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <Screen tab="Trend" onSelectTab={onNavigate}>
      {/* Sub-Tabs: Analytics & Trends, Meal Calendar */}
      <Segmented
        items={['Analytics & Trends', 'Meal Calendar']}
        active={activeTab}
        onSelect={setActiveTab}
      />

      {/* TAB 0: ANALYTICS & TRENDS */}
      {activeTab === 0 && (
        <>
          <Title
            title="Your everyday, in focus."
            sub="Small habits. A bigger picture."
            right={<IconBox label="cal" onPress={() => setActiveTab(1)} />}
          />

          {/* Time Filter Pills */}
          <Row style={{ marginBottom: 14, gap: 6 }}>
            {(['Week', 'Month', '6 Months'] as const).map((r) => (
              <Pill
                key={r}
                active={timeRange === r}
                onPress={() => {
                  setTimeRange(r);
                  showToast(`Viewing: ${r}`);
                }}
              >
                {r}
              </Pill>
            ))}
          </Row>

          {/* Calorie Intake Bar Chart */}
          <Card>
            <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Txt s={17} w="800">Calorie intake</Txt>
                <Txt s={11} color={c.mute}>9–15 Oct 2026</Txt>
              </View>
              <Pill bg={c.block}>kcal</Pill>
            </Row>

            <Row style={{ marginVertical: 10, alignItems: 'baseline' }}>
              <Txt s={34} w="800">1,857</Txt>
              <Txt s={12} color={c.mute} style={{ marginLeft: 8 }}>avg / completed day</Txt>
            </Row>

            {/* Interactive Bar Chart */}
            <Row style={{ height: 140, alignItems: 'flex-end', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: c.line, paddingBottom: 6 }}>
              {daysData.map((d, i) => {
                const isSelected = d.date === selectedDay;
                return (
                  <Pressable
                    key={i}
                    onPress={() => {
                      setSelectedDay(d.date);
                      showToast(`${d.date} Oct: ${d.kcal} kcal`);
                    }}
                    style={{ alignItems: 'center', cursor: 'pointer' as any }}
                  >
                    <View
                      style={{
                        width: 28,
                        height: d.height * 1.25,
                        borderRadius: 14,
                        backgroundColor: isSelected ? c.yellow : i === 6 ? c.mint : c.block,
                        borderWidth: isSelected ? 1.5 : 0,
                        borderColor: c.ink,
                      }}
                    />
                  </Pressable>
                );
              })}
            </Row>

            <Row style={{ justifyContent: 'space-between', marginTop: 8 }}>
              {daysData.map((d, i) => (
                <View key={i} style={{ width: 28, alignItems: 'center' }}>
                  <Txt s={11} w={d.date === selectedDay ? '800' : '400'}>{d.day}</Txt>
                  <Txt s={10} color={c.mute}>{d.date}</Txt>
                </View>
              ))}
            </Row>

            <Row style={{ justifyContent: 'space-around', marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderColor: c.line }}>
              {['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map((l) => (
                <Txt key={l} s={10} color={c.mute}>● {l}</Txt>
              ))}
            </Row>
          </Card>

          {/* Weight Trend */}
          <Card style={{ marginTop: 16 }}>
            <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Txt s={17} w="800">Weight trend</Txt>
              <Txt s={10} color={c.mute}>kg</Txt>
            </Row>
            <Row style={{ marginVertical: 8, alignItems: 'baseline' }}>
              <Txt s={34} w="800">48.5</Txt>
              <Txt s={11} color={c.mute} style={{ marginLeft: 8 }}>latest · 15 Oct</Txt>
            </Row>
            <Ph h={110} label="📉 49.2kg → 48.5kg (Weekly Steady Pace)" />
            <Row style={{ justifyContent: 'space-between', marginTop: 8 }}>
              <Txt s={10} color={c.mute}>9 Oct (49.2)</Txt>
              <Txt s={10} color={c.mute}>12 Oct (48.8)</Txt>
              <Txt s={10} color={c.mute}>15 Oct (48.5)</Txt>
            </Row>
          </Card>

          {/* Daily Averages */}
          <Row style={{ marginTop: 16 }}>
            <Card bg={c.blue} style={{ flex: 1, marginRight: 6 }}>
              <Txt s={26} w="800">1.8 L</Txt>
              <Txt s={11} color={c.mute} style={{ marginTop: 2 }}>Daily average water</Txt>
            </Card>
            <Card bg={c.green} style={{ flex: 1, marginLeft: 6 }}>
              <Txt s={26} w="800">8,210</Txt>
              <Txt s={11} color={c.mute} style={{ marginTop: 2 }}>Daily average steps</Txt>
            </Card>
          </Row>
        </>
      )}

      {/* TAB 1: MEAL CALENDAR */}
      {activeTab === 1 && (
        <>
          <Title
            title="A look back."
            sub="Your meals, one day at a time."
            right={<IconBox label="cal" onPress={() => setActiveTab(0)} />}
          />

          {/* Monthly Calendar Card */}
          <Card>
            <Row style={{ justifyContent: 'space-between', marginBottom: 12 }}>
              <Pressable onPress={() => showToast('Previous month')}>
                <Txt s={16}>‹</Txt>
              </Pressable>
              <Txt w="800" s={16}>October 2026</Txt>
              <Pressable onPress={() => showToast('Next month')}>
                <Txt s={16}>›</Txt>
              </Pressable>
            </Row>

            {/* Days of Week */}
            <Row style={{ justifyContent: 'space-between', marginBottom: 6 }}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                <Txt key={i} s={11} color={c.mute} style={{ width: 36, textAlign: 'center' }}>
                  {d}
                </Txt>
              ))}
            </Row>

            {/* Calendar Days Grid */}
            <Row style={{ flexWrap: 'wrap' }}>
              {[null, null, null, ...calendarDays].map((day, i) => {
                const isSelected = day === selectedDay;
                const isLogged = day && day <= 15;
                return (
                  <View key={i} style={{ width: `${100 / 7}%`, alignItems: 'center', marginVertical: 4 }}>
                    {day ? (
                      <Pressable
                        onPress={() => setSelectedDay(day)}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 17,
                          borderWidth: isLogged ? 2.5 : 0,
                          borderColor: isSelected ? c.dark : c.dark,
                          backgroundColor: isSelected ? c.yellow : 'transparent',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer' as any,
                        }}
                      >
                        <Txt s={12} w="700" color={day > 15 ? c.line : c.ink}>
                          {day}
                        </Txt>
                      </Pressable>
                    ) : null}
                  </View>
                );
              })}
            </Row>

            <Row style={{ justifyContent: 'center', marginTop: 12, gap: 16 }}>
              <Txt s={10} color={c.mute}>🟢 Within target</Txt>
              <Txt s={10} color={c.mute}>🟡 Selected day</Txt>
            </Row>
          </Card>

          {/* Selected Day Details */}
          <Row style={{ justifyContent: 'space-between', marginTop: 22, alignItems: 'center' }}>
            <Txt s={17} w="800">{selectedDay} October 2026</Txt>
            <Txt s={11} color={c.mute}>Selected log</Txt>
          </Row>

          <Card bg={c.blue} style={{ marginVertical: 12 }}>
            <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Txt s={11} color={c.mute}>Net calories</Txt>
                <Row style={{ alignItems: 'baseline', marginTop: 2 }}>
                  <Txt s={32} w="800">1,680</Txt>
                  <Txt s={13} style={{ marginLeft: 6 }}>kcal</Txt>
                </Row>
              </View>
              <Pill bg={c.green}>✓ Within target</Pill>
            </Row>

            <Txt s={11} color={c.mute} style={{ marginTop: 4 }}>
              1,920 kcal eaten · 240 kcal burned
            </Txt>

            <Row style={{ justifyContent: 'space-between', marginTop: 14, borderTopWidth: 1, borderColor: '#cadfe9', paddingTop: 10 }}>
              <Txt w="700">💧 2,000 ml</Txt>
              <Txt w="700">👟 8,420 steps</Txt>
            </Row>
          </Card>

          {/* Meals on that day */}
          <MealRow meta="Breakfast · 8:15 AM" name="Avocado & egg toast" kcal="380 kcal" />
          <MealRow meta="Lunch · 12:45 PM" name="Hainanese Chicken Rice" kcal="580 kcal" />
          <MealRow meta="Dinner · 7:10 PM" name="Salmon nourish bowl" kcal="720 kcal" />
          <MealRow meta="Snacks · 4:00 PM" name="Berry yogurt & granola" kcal="240 kcal" />
        </>
      )}
    </Screen>
  );
}

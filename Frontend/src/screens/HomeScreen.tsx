import React from 'react';
import { View, Pressable } from 'react-native-web';
import { useApp } from '../context/AppContext';
import {
  Screen,
  Row,
  Txt,
  Card,
  Ph,
  Pill,
  Avatar,
  IconBox,
  SectionHead,
  MealRow,
  Btn,
  Ring,
  c,
} from '../ui';

interface HomeScreenProps {
  onNavigate: (screen: string) => void;
}

export default function HomeScreen({ onNavigate }: HomeScreenProps) {
  const {
    userName,
    streakDays,
    consumedKcal,
    burnedKcal,
    calorieGoal,
    proteinGrams,
    carbsGrams,
    fatsGrams,
    waterMl,
    stepsCount,
    workoutMins,
    todayMeals,
    addWater,
    deleteMeal,
    showToast,
  } = useApp();

  const progressPct = Math.min(100, Math.round((consumedKcal / calorieGoal) * 100));

  return (
    <Screen tab="Home" onSelectTab={onNavigate}>
      {/* Top Header */}
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Row style={{ alignItems: 'center' }}>
          <Pressable onPress={() => onNavigate('Profile')}>
            <Avatar size={44} label={userName.charAt(0)} />
          </Pressable>
          <View style={{ marginLeft: 10 }}>
            <Txt s={11} color={c.mute}>Thursday, 15 October</Txt>
            <Txt s={20} w="800">Hello, {userName}!</Txt>
          </View>
        </Row>
        <Row>
          <IconBox
            label="cal"
            onPress={() => onNavigate('Trend · Calendar')}
          />
          <View style={{ width: 8 }} />
          <IconBox
            label="bell"
            onPress={() => showToast('🔔 Daily reminder: Snap your dinner by 8 PM to maintain streak!')}
          />
        </Row>
      </Row>

      {/* Streak Banner */}
      <Row style={{ justifyContent: 'space-between', marginVertical: 16 }}>
        <Pressable onPress={() => onNavigate('Rewards')}>
          <Pill active bg={c.yellow}>🔥 {streakDays}-Day Streak</Pill>
        </Pressable>
        <Txt s={11} color={c.mute}>Keep your rhythm going</Txt>
      </Row>

      {/* Main Calorie Budget Ring Card */}
      <Card bg={c.blue} style={{ alignItems: 'center' }}>
        <Row style={{ alignSelf: 'stretch', justifyContent: 'space-between' }}>
          <Txt w="800">{progressPct}% Goal Progress</Txt>
          <IconBox
            size={24}
            label="camera"
            onPress={() => onNavigate('Scan')}
          />
        </Row>

        <View style={{ marginVertical: 20, alignItems: 'center', justifyContent: 'center' }}>
          <Ring size={190} />
          <View style={{ position: 'absolute', alignItems: 'center' }}>
            <Txt s={34} w="800">{consumedKcal.toLocaleString()}</Txt>
            <Txt s={12} color={c.mute}>/ {calorieGoal.toLocaleString()} kcal</Txt>
          </View>
        </View>

        <Row style={{ alignSelf: 'stretch', justifyContent: 'space-between', paddingHorizontal: 12 }}>
          <View>
            <Txt s={11} color={c.mute}>Consumed</Txt>
            <Txt w="800">{consumedKcal} kcal</Txt>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Txt s={11} color={c.mute}>Burned</Txt>
            <Txt w="800">{burnedKcal} kcal</Txt>
          </View>
        </Row>

        {/* Dynamic Macronutrient Bars */}
        <Row style={{ alignSelf: 'stretch', justifyContent: 'space-around', marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderColor: '#cadfe9' }}>
          {[
            { label: 'Protein', grams: `${proteinGrams}g`, target: 90, color: '#4ade80' },
            { label: 'Fats', grams: `${fatsGrams}g`, target: 50, color: '#fbbf24' },
            { label: 'Carbs', grams: `${carbsGrams}g`, target: 180, color: '#38bdf8' },
            { label: 'RDC', grams: `${progressPct}%`, target: 100, color: c.dark },
          ].map((m) => {
            const pct = Math.min(100, Math.round((parseFloat(m.grams) / m.target) * 100));
            return (
              <View key={m.label} style={{ alignItems: 'center' }}>
                <View style={{ width: 22, height: 64, borderRadius: 11, backgroundColor: '#cbe4ef', justifyContent: 'flex-end', overflow: 'hidden' }}>
                  <View style={{ width: '100%', height: `${pct || 15}%`, backgroundColor: m.color, borderRadius: 11 }} />
                </View>
                <Txt s={10} w="700" style={{ marginTop: 6 }}>{m.label}</Txt>
                <Txt s={9} color={c.mute}>{m.grams}</Txt>
              </View>
            );
          })}
        </Row>
      </Card>

      {/* Holistic Wellness Cards */}
      <SectionHead title="A little everyday balance" />

      {/* Row 1: Weight & Water */}
      <Row style={{ marginBottom: 12, alignItems: 'stretch' }}>
        <Card style={{ flex: 1, marginRight: 6 }}>
          <Txt w="700">Weight</Txt>
          <Txt s={28} w="800" style={{ marginVertical: 6 }}>48.5 kg</Txt>
          <Ph h={32} label="📈 -0.3 kg this week" />
          <Txt s={10} color={c.mute} style={{ marginTop: 6 }}>Target 48.0 kg</Txt>
        </Card>

        <Card bg={c.blue} style={{ flex: 1, marginLeft: 6 }}>
          <Txt w="700">Water</Txt>
          <Txt s={28} w="800" style={{ marginVertical: 6 }}>{waterMl.toLocaleString()} ml</Txt>
          <Row style={{ marginVertical: 2 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <View
                key={i}
                style={{
                  width: 9,
                  height: 18,
                  borderRadius: 4,
                  backgroundColor: i < Math.floor(waterMl / 250) ? c.dark : c.card,
                  marginRight: 3,
                }}
              />
            ))}
          </Row>
          <View style={{ marginTop: 8 }}>
            <Btn bg={c.card} onPress={() => addWater(250)}>+250ml</Btn>
          </View>
        </Card>
      </Row>

      {/* Row 2: Steps & Workout */}
      <Row style={{ alignItems: 'stretch' }}>
        <Card bg={c.green} style={{ flex: 1, marginRight: 6 }}>
          <Txt w="700">Steps</Txt>
          <Row style={{ marginVertical: 8, alignItems: 'center' }}>
            <Ring size={40} progress={stepsCount / 10000} />
            <Txt s={22} w="800" style={{ marginLeft: 8 }}>{stepsCount.toLocaleString()}</Txt>
          </Row>
          <Txt s={10} color={c.mute}>/ 10,000 steps</Txt>
        </Card>

        <Card bg={c.red} style={{ flex: 1, marginLeft: 6 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Txt w="700">Workout</Txt>
            <IconBox size={24} label="+" onPress={() => showToast('💪 Logged 30 min campus gym session!')} />
          </Row>
          <Txt s={28} w="800" style={{ marginVertical: 8 }}>{workoutMins} mins</Txt>
          <Txt s={10} color={c.mute}>210 kcal burned</Txt>
        </Card>
      </Row>

      {/* Today's Meals Section */}
      <SectionHead
        title="Today's meals"
        right={`${todayMeals.filter((m) => m.logged).length} logged · ${todayMeals.filter((m) => !m.logged).length} planned`}
      />

      {todayMeals.map((meal) => (
        <MealRow
          key={meal.id}
          meta={meal.meta}
          name={meal.name}
          kcal={`${meal.kcal} kcal`}
          onPress={() => onNavigate('Scan')}
          onDelete={meal.logged ? () => deleteMeal(meal.id) : undefined}
        />
      ))}

      {/* Fast Action to Snap a Meal */}
      <View style={{ marginTop: 12 }}>
        <Btn bg={c.yellow} onPress={() => onNavigate('Scan')}>
          📸  Snap Meal with AI Vision
        </Btn>
      </View>
    </Screen>
  );
}

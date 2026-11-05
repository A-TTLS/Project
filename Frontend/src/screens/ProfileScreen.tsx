import React, { useState } from 'react';
import { View, Pressable, TextInput } from 'react-native-web';
import { useApp } from '../context/AppContext';
import {
  Screen,
  Row,
  Txt,
  Card,
  Avatar,
  Pill,
  IconBox,
  Btn,
  SectionHead,
  c,
} from '../ui';

interface ProfileScreenProps {
  onNavigate: (screen: string) => void;
  onLogOut?: () => void;
}

export default function ProfileScreen({ onNavigate, onLogOut }: ProfileScreenProps) {
  const {
    userName,
    userHandle,
    userBio,
    streakDays,
    snapPoints,
    followersCount,
    followingCount,
    groupsCount,
    currentWeight,
    targetWeight,
    bmi,
    calorieGoal,
    updateProfile,
    showToast,
  } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(userName);
  const [editBio, setEditBio] = useState(userBio);
  const [editTarget, setEditTarget] = useState(String(targetWeight));
  const [editGoal, setEditGoal] = useState(String(calorieGoal));

  const handleSaveProfile = () => {
    updateProfile({
      name: editName.trim() || userName,
      bio: editBio.trim() || userBio,
      targetWeight: parseFloat(editTarget) || targetWeight,
      calorieGoal: parseInt(editGoal) || calorieGoal,
    });
    setIsEditing(false);
  };

  return (
    <Screen tab="Profile" onSelectTab={onNavigate}>
      {/* Top Header */}
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Txt s={24} w="800">A little more you.</Txt>
        <IconBox
          label="⚙"
          onPress={() => showToast('⚙ Settings: Profile and connected devices')}
        />
      </Row>

      {/* Profile Overview */}
      <View style={{ alignItems: 'center', marginVertical: 18 }}>
        <Avatar size={90} label={userName.charAt(0)} />
        <Txt s={22} w="800" style={{ marginTop: 10 }}>{userName}</Txt>
        <Txt s={12} color={c.mute}>{userHandle}</Txt>
        <Txt s={13} style={{ marginVertical: 6, textAlign: 'center', maxWidth: 280 }}>
          {userBio}
        </Txt>
        <Pressable onPress={() => onNavigate('Rewards')}>
          <Pill active bg={c.yellow}>🔥 {streakDays}-Day Active Streak</Pill>
        </Pressable>
      </View>

      {/* Social Metrics */}
      <Row style={{ justifyContent: 'space-around', marginBottom: 18 }}>
        {[
          [String(followersCount), 'Followers'],
          [String(followingCount), 'Following'],
          [String(groupsCount), 'Groups'],
        ].map(([n, l]) => (
          <View key={l} style={{ alignItems: 'center' }}>
            <Txt s={20} w="800">{n}</Txt>
            <Txt s={11} color={c.mute}>{l}</Txt>
          </View>
        ))}
      </Row>

      <Btn bg={c.card} onPress={() => setIsEditing(true)}>
        ✎  Edit Profile & Goals
      </Btn>

      {/* Health Stats Card */}
      <Card style={{ marginVertical: 16 }}>
        <Row style={{ justifyContent: 'space-around' }}>
          {[
            [`${currentWeight}`, 'Weight · kg'],
            [`${targetWeight}`, 'Target · kg'],
            [`${bmi}`, 'BMI'],
          ].map(([n, l]) => (
            <View key={l} style={{ alignItems: 'center' }}>
              <Txt s={22} w="800">{n}</Txt>
              <Txt s={10} color={c.mute}>{l}</Txt>
            </View>
          ))}
        </Row>
        <Row style={{ justifyContent: 'space-between', marginTop: 14, borderTopWidth: 1, borderColor: c.line, paddingTop: 10 }}>
          <Txt s={11} color={c.mute}>Your daily calorie target</Txt>
          <Txt s={13} w="800">{calorieGoal.toLocaleString()} kcal</Txt>
        </Row>
      </Card>

      {/* Gamification & Points Card */}
      <Card bg={c.yellow}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Txt w="800">Little wins. Real treats.</Txt>
          <IconBox size={28} label="🎁" onPress={() => onNavigate('Rewards')} />
        </Row>
        <Txt s={32} w="800" style={{ marginVertical: 6 }}>{snapPoints.toLocaleString()} SnapPoints</Txt>
        <Txt s={12}>{streakDays}-Day Active Streak</Txt>

        <Card style={{ marginVertical: 12, padding: 12 }}>
          <Txt w="700">RM5 Off Salad Atelier</Txt>
          <Txt s={11} color={c.mute}>From 500 pts · A fresh little reward</Txt>
        </Card>

        <Btn bg={c.card} onPress={() => onNavigate('Rewards')}>
          →  Explore Rewards & Vouchers
        </Btn>
      </Card>

      {/* Settings List */}
      <SectionHead title="Make it yours" />
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {[
          'Edit Goals & Macros',
          'Connected Health Apps',
          'Privacy & Sharing',
          'Log Out',
        ].map((item, i) => (
          <Pressable
            key={item}
            onPress={() => {
              if (item === 'Log Out') {
                if (onLogOut) onLogOut();
                else onNavigate('landing');
              } else {
                showToast(`Opened ${item}`);
              }
            }}
            style={({ pressed }) => [
              {
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 16,
                borderTopWidth: i ? 1 : 0,
                borderColor: '#eee',
                backgroundColor: pressed ? '#f5f5f5' : c.card,
                cursor: 'pointer' as any,
              },
            ]}
          >
            <Row style={{ alignItems: 'center' }}>
              <IconBox size={24} label={item === 'Log Out' ? '🚪' : '⚙'} />
              <Txt style={{ marginLeft: 12 }} color={item === 'Log Out' ? '#C0504A' : c.ink} w={item === 'Log Out' ? '700' : '500'}>
                {item}
              </Txt>
            </Row>
            <Txt color={c.mute}>›</Txt>
          </Pressable>
        ))}
      </Card>

      {/* Edit Profile Modal */}
      {isEditing && (
        <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20, zIndex: 99 }}>
          <View style={{ width: '100%', maxWidth: 420, backgroundColor: c.card, borderRadius: 24, padding: 24, gap: 14 }}>
            <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Txt s={18} w="800">Edit Profile & Goals</Txt>
              <Pressable onPress={() => setIsEditing(false)}>
                <Txt s={16} color={c.mute}>✕</Txt>
              </Pressable>
            </Row>

            <View style={{ gap: 4 }}>
              <Txt s={12} color={c.mute}>Full Name</Txt>
              <TextInput
                value={editName}
                onChangeText={setEditName}
                style={{ borderWidth: 1, borderColor: c.line, borderRadius: 12, padding: 10, fontSize: 14 }}
              />
            </View>

            <View style={{ gap: 4 }}>
              <Txt s={12} color={c.mute}>Bio</Txt>
              <TextInput
                value={editBio}
                onChangeText={setEditBio}
                style={{ borderWidth: 1, borderColor: c.line, borderRadius: 12, padding: 10, fontSize: 14 }}
              />
            </View>

            <Row style={{ gap: 10 }}>
              <View style={{ flex: 1, gap: 4 }}>
                <Txt s={12} color={c.mute}>Target Weight (kg)</Txt>
                <TextInput
                  value={editTarget}
                  onChangeText={setEditTarget}
                  inputMode="decimal"
                  style={{ borderWidth: 1, borderColor: c.line, borderRadius: 12, padding: 10, fontSize: 14 }}
                />
              </View>

              <View style={{ flex: 1, gap: 4 }}>
                <Txt s={12} color={c.mute}>Daily Calorie Target</Txt>
                <TextInput
                  value={editGoal}
                  onChangeText={setEditGoal}
                  inputMode="numeric"
                  style={{ borderWidth: 1, borderColor: c.line, borderRadius: 12, padding: 10, fontSize: 14 }}
                />
              </View>
            </Row>

            <Btn bg={c.yellow} onPress={handleSaveProfile} style={{ marginTop: 8 }}>
              Save Changes
            </Btn>
          </View>
        </View>
      )}
    </Screen>
  );
}

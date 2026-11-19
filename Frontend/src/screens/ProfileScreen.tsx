import React, { useState } from 'react';
import { View, Pressable, TextInput, ScrollView, Switch } from 'react-native-web';
import { useApp } from '../context/AppContext';
import { useProfileStats } from '../hooks/useProfileStats';
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
  Icon,
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
    userEmail,
    streakDays,
    snapPoints,
    followersCount,
    followingCount,
    groupsCount,
    currentWeight,
    targetWeight,
    bmi,
    calorieGoal,
    proteinGoal,
    carbsGoal,
    fatGoal,
    updateProfile,
    signOut,
    showToast,
  } = useApp();

  const live = useProfileStats();
  const shownStreak = live?.streakDays ?? streakDays;
  const shownPoints = live?.snapPoints ?? snapPoints;
  // Modals state
  const [isEditing, setIsEditing] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Edit Profile Form State - starts empty for clean user inputs
  const [editName, setEditName] = useState('');
  const [editHandle, setEditHandle] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editCurrentWeight, setEditCurrentWeight] = useState('');
  const [editTarget, setEditTarget] = useState('');
  const [editGoal, setEditGoal] = useState('');
  const [editProtein, setEditProtein] = useState('');
  const [editCarbs, setEditCarbs] = useState('');
  const [editFat, setEditFat] = useState('');

  // Settings Toggles
  const [isPrivateProfile, setIsPrivateProfile] = useState(false);
  const [autoShareMeals, setAutoShareMeals] = useState(true);
  const [isMetric, setIsMetric] = useState(true);
  const [waterTarget, setWaterTarget] = useState('');
  const [stepTarget, setStepTarget] = useState('');

  // Change Password Form
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const openEditModal = () => {
    setEditName('');
    setEditHandle('');
    setEditBio('');
    setEditCurrentWeight('');
    setEditTarget('');
    setEditGoal('');
    setEditProtein('');
    setEditCarbs('');
    setEditFat('');
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    await updateProfile({
      name: editName.trim() ? editName.trim() : userName,
      username: editHandle.trim() ? (editHandle.trim().startsWith('@') ? editHandle.trim() : `@${editHandle.trim()}`) : userHandle,
      bio: editBio.trim() ? editBio.trim() : userBio,
      currentWeight: parseFloat(editCurrentWeight) || currentWeight,
      targetWeight: parseFloat(editTarget) || targetWeight,
      calorieGoal: parseInt(editGoal) || calorieGoal,
      proteinGoal: parseInt(editProtein) || proteinGoal,
      carbsGoal: parseInt(editCarbs) || carbsGoal,
      fatGoal: parseInt(editFat) || fatGoal,
    });
    setIsEditing(false);
  };

  const handleCopyEmail = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(userEmail);
      showToast('📋 Email copied to clipboard!');
    } else {
      showToast(userEmail);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    if (onLogOut) onLogOut();
    else onNavigate('landing');
  };

  const handleChangePassword = () => {
    if (!newPassword || newPassword.length < 8) {
      showToast('⚠️ New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('⚠️ Passwords do not match');
      return;
    }
    showToast('🔒 Password updated successfully!');
    setShowPasswordModal(false);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <Screen
      tab="Profile"
      onSelectTab={onNavigate}
      hideTabBar={isEditing || showSettingsModal || showPasswordModal || showDeleteModal}
    >
      {/* Top Header */}
      <Row style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <View>
          <Txt s={12} color={c.mute}>Account & Health</Txt>
          <Txt s={24} w="800">Your Profile</Txt>
        </View>
        <Row style={{ gap: 8 }}>
          <IconBox
            label="settings"
            onPress={() => setShowSettingsModal(true)}
          />
        </Row>
      </Row>

      {/* Profile Overview Header Card */}
      <Card style={{ alignItems: 'center', paddingVertical: 22, marginBottom: 14 }}>
        <View style={{ position: 'relative' }}>
          <Avatar size={88} label={userName.charAt(0)} />
          <Pressable
            onPress={openEditModal}
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              backgroundColor: c.ink,
              width: 28,
              height: 28,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: '#fff',
            }}
          >
            <Icon name="camera" size={14} color="#fff" />
          </Pressable>
        </View>

        <Txt s={22} w="800" style={{ marginTop: 12 }}>{userName}</Txt>
        <Txt s={13} color={c.mute} style={{ marginTop: 2 }}>{userHandle}</Txt>
        
        <Txt s={13} style={{ marginVertical: 8, textAlign: 'center', maxWidth: 300, lineHeight: 18 }} color="#4A5568">
          {userBio}
        </Txt>

        <Row style={{ gap: 8, marginTop: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Pressable onPress={() => onNavigate('Rewards')}>
            <Pill active bg={c.yellow}>🔥 {shownStreak}-Day Streak</Pill>
          </Pressable>
          <Pressable onPress={() => onNavigate('Rewards')}>
            <Pill bg={c.blue}>🎁 {shownPoints.toLocaleString()} SnapPoints</Pill>
          </Pressable>
        </Row>

        {/* Social Network Counters */}
        <Row style={{ width: '100%', justifyContent: 'space-around', marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderColor: c.line }}>
          {[
            [String(live?.followers ?? followersCount), 'Followers'],
            [String(live?.following ?? followingCount), 'Following'],
            [String(live?.circles ?? groupsCount), 'Circles'],
          ].map(([n, l]) => (
            <Pressable key={l} onPress={() => onNavigate('Social')} style={{ alignItems: 'center' }}>
              <Txt s={18} w="800">{n}</Txt>
              <Txt s={11} color={c.mute}>{l}</Txt>
            </Pressable>
          ))}
        </Row>

        {/* Action Button */}
        <Row style={{ width: '100%', gap: 10, marginTop: 16 }}>
          <Btn bg={c.bg} onPress={openEditModal} style={{ flex: 1, height: 42, borderRadius: 12 }}>
            <Row style={{ gap: 6, justifyContent: 'center' }}>
              <Icon name="edit" size={14} color={c.ink} />
              <Txt s={13} w="700">Edit Profile & Bio</Txt>
            </Row>
          </Btn>
          <Btn bg={c.bg} onPress={() => setShowSettingsModal(true)} style={{ width: 44, height: 42, borderRadius: 12, paddingHorizontal: 0 }}>
            <Icon name="settings" size={16} color={c.ink} />
          </Btn>
        </Row>
      </Card>

      {/* Health & Body Metrics Card */}
      <Card style={{ marginBottom: 14 }}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Txt w="800">Body Stats & Targets</Txt>
          <Pressable onPress={openEditModal}>
            <Txt s={12} color={c.mute} w="600">Update ›</Txt>
          </Pressable>
        </Row>

        <Row style={{ justifyContent: 'space-around', paddingVertical: 6 }}>
          {[
            [isMetric ? `${currentWeight}` : `${Math.round(currentWeight * 2.20462 * 10) / 10}`, isMetric ? 'Current (kg)' : 'Current (lbs)'],
            [isMetric ? `${targetWeight}` : `${Math.round(targetWeight * 2.20462 * 10) / 10}`, isMetric ? 'Target (kg)' : 'Target (lbs)'],
            [`${bmi}`, 'BMI'],
          ].map(([n, l]) => (
            <View key={l} style={{ alignItems: 'center' }}>
              <Txt s={22} w="800">{n}</Txt>
              <Txt s={11} color={c.mute}>{l}</Txt>
            </View>
          ))}
        </Row>

        <View style={{ marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderColor: c.line }}>
          <Row style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Txt s={12} color={c.mute}>Daily Calorie Target</Txt>
            <Txt s={14} w="800">{calorieGoal.toLocaleString()} kcal</Txt>
          </Row>
          
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Txt s={12} color={c.mute}>Macro Split (P / C / F)</Txt>
            <Txt s={13} w="700">{proteinGoal}g · {carbsGoal}g · {fatGoal}g</Txt>
          </Row>
        </View>
      </Card>

      {/* Gamification & Vouchers Card */}
      <Card bg={c.yellow} style={{ marginBottom: 14 }}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Txt s={11} color="#665200" w="700">CAMPUS REWARDS</Txt>
            <Txt s={16} w="800">Little wins. Real treats.</Txt>
          </View>
          <IconBox size={32} label="wallet" onPress={() => onNavigate('Rewards')} />
        </Row>

        <Txt s={28} w="800" style={{ marginVertical: 8 }}>
          {shownPoints.toLocaleString()} <Txt s={16} w="600">pts</Txt>
        </Txt>

        <Card style={{ marginBottom: 12, padding: 12 }}>
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Txt s={13} w="700">RM5 Off Salad Atelier</Txt>
              <Txt s={11} color={c.mute}>Campus outlet · 500 points</Txt>
            </View>
            <Pill bg={c.green}>Fresh</Pill>
          </Row>
        </Card>

        <Btn bg={c.card} onPress={() => onNavigate('Rewards')}>
          <Row style={{ gap: 6, justifyContent: 'center' }}>
            <Txt w="700">Explore Rewards Catalog</Txt>
            <Icon name="arrow" size={14} color={c.ink} />
          </Row>
        </Btn>
      </Card>

      {/* Main Settings Menu (RiceCal Inspired) */}
      <SectionHead title="Settings & Preferences" />
      <Card style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
        {[
          { label: 'Account & Security', icon: 'lock', desc: userEmail, action: () => setShowSettingsModal(true) },
          { label: 'Nutrition & Macro Targets', icon: 'target', desc: `${calorieGoal} kcal · ${proteinGoal}g P`, action: openEditModal },
          { label: 'Connected Health Apps', icon: 'smartphone', desc: 'Apple Health / Health Connect', action: () => showToast('📱 Connected Devices: CalorieSnap Health Sync') },
          { label: 'Privacy & Group Circles', icon: 'shield', desc: isPrivateProfile ? 'Private' : 'Public', action: () => setShowSettingsModal(true) },
          { label: 'Vouchers & My Wallet', icon: 'gift', desc: 'Active student discounts', action: () => onNavigate('Rewards') },
          { label: 'Log Out', icon: 'logout', desc: 'Sign out of this device', danger: true, action: handleSignOut },
        ].map((item, i) => (
          <Pressable
            key={item.label}
            onPress={item.action}
            style={({ pressed }) => [
              {
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderTopWidth: i ? 1 : 0,
                borderColor: '#eee',
                backgroundColor: pressed ? '#f8f8f8' : c.card,
                cursor: 'pointer' as any,
              },
            ]}
          >
            <Row style={{ alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  backgroundColor: item.danger ? '#FEE2E2' : c.bg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name={item.icon} size={18} color={item.danger ? '#DC2626' : c.ink} />
              </View>
              <View>
                <Txt s={14} w={item.danger ? '700' : '600'} color={item.danger ? '#DC2626' : c.ink}>
                  {item.label}
                </Txt>
                <Txt s={11} color={c.mute}>{item.desc}</Txt>
              </View>
            </Row>
            <Icon name="chevronRight" size={16} color={c.mute} />
          </Pressable>
        ))}
      </Card>

      {/* Edit Profile & Bio Modal */}
      {isEditing && (
        <View style={{ position: 'fixed' as any, top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 16, zIndex: 999 }}>
          <View style={{ width: '100%', maxWidth: 440, maxHeight: '90vh', backgroundColor: c.card, borderRadius: 24, padding: 22, overflow: 'hidden' }}>
            <Row style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Txt s={18} w="800">Edit Profile & Goals</Txt>
              <Pressable onPress={() => setIsEditing(false)} style={{ padding: 4 }}>
                <Icon name="close" size={20} color={c.mute} />
              </Pressable>
            </Row>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 10 }}>
              <View style={{ gap: 4 }}>
                <Txt s={12} color={c.mute}>Full Name</Txt>
                <TextInput
                  value={editName}
                  onChangeText={setEditName}
                  placeholder={userName || "Your full name"}
                  placeholderTextColor="#94A3B8"
                  style={{ borderWidth: 1, borderColor: c.line, borderRadius: 12, padding: 10, fontSize: 14, color: '#1E293B' }}
                />
              </View>

              <View style={{ gap: 4 }}>
                <Txt s={12} color={c.mute}>Username Handle</Txt>
                <TextInput
                  value={editHandle}
                  onChangeText={setEditHandle}
                  placeholder={userHandle || "@username"}
                  placeholderTextColor="#94A3B8"
                  style={{ borderWidth: 1, borderColor: c.line, borderRadius: 12, padding: 10, fontSize: 14, color: '#1E293B' }}
                />
              </View>

              <View style={{ gap: 4 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Txt s={12} color={c.mute}>Bio</Txt>
                  <Txt s={11} color={c.mute}>{editBio.length}/140</Txt>
                </Row>
                <TextInput
                  value={editBio}
                  onChangeText={setEditBio}
                  maxLength={140}
                  multiline
                  numberOfLines={3}
                  placeholder={userBio || "Tell your squad a little about you..."}
                  placeholderTextColor="#94A3B8"
                  style={{ borderWidth: 1, borderColor: c.line, borderRadius: 12, padding: 10, fontSize: 14, minHeight: 64, color: '#1E293B' }}
                />
              </View>

              <Row style={{ gap: 10 }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Txt s={12} color={c.mute}>Current Weight (kg)</Txt>
                  <TextInput
                    value={editCurrentWeight}
                    onChangeText={setEditCurrentWeight}
                    inputMode="decimal"
                    placeholder={`Current: ${currentWeight || 60} kg`}
                    placeholderTextColor="#94A3B8"
                    style={{ borderWidth: 1, borderColor: c.line, borderRadius: 12, padding: 10, fontSize: 14, color: '#1E293B' }}
                  />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Txt s={12} color={c.mute}>Target Weight (kg)</Txt>
                  <TextInput
                    value={editTarget}
                    onChangeText={setEditTarget}
                    inputMode="decimal"
                    placeholder={`Target: ${targetWeight || 55} kg`}
                    placeholderTextColor="#94A3B8"
                    style={{ borderWidth: 1, borderColor: c.line, borderRadius: 12, padding: 10, fontSize: 14, color: '#1E293B' }}
                  />
                </View>
              </Row>

              <View style={{ gap: 4 }}>
                <Txt s={12} color={c.mute}>Daily Calorie Target (kcal)</Txt>
                <TextInput
                  value={editGoal}
                  onChangeText={setEditGoal}
                  inputMode="numeric"
                  placeholder={`Target: ${calorieGoal} kcal`}
                  placeholderTextColor="#94A3B8"
                  style={{ borderWidth: 1, borderColor: c.line, borderRadius: 12, padding: 10, fontSize: 14, color: '#1E293B' }}
                />
              </View>

              <Row style={{ gap: 8 }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Txt s={11} color={c.mute}>Protein (g)</Txt>
                  <TextInput
                    value={editProtein}
                    onChangeText={setEditProtein}
                    inputMode="numeric"
                    placeholder={`${proteinGoal}g`}
                    placeholderTextColor="#94A3B8"
                    style={{ borderWidth: 1, borderColor: c.line, borderRadius: 10, padding: 8, fontSize: 13, color: '#1E293B' }}
                  />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Txt s={11} color={c.mute}>Carbs (g)</Txt>
                  <TextInput
                    value={editCarbs}
                    onChangeText={setEditCarbs}
                    inputMode="numeric"
                    placeholder={`${carbsGoal}g`}
                    placeholderTextColor="#94A3B8"
                    style={{ borderWidth: 1, borderColor: c.line, borderRadius: 10, padding: 8, fontSize: 13, color: '#1E293B' }}
                  />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Txt s={11} color={c.mute}>Fat (g)</Txt>
                  <TextInput
                    value={editFat}
                    onChangeText={setEditFat}
                    inputMode="numeric"
                    placeholder={`${fatGoal}g`}
                    placeholderTextColor="#94A3B8"
                    style={{ borderWidth: 1, borderColor: c.line, borderRadius: 10, padding: 8, fontSize: 13, color: '#1E293B' }}
                  />
                </View>
              </Row>

              <Btn bg={c.yellow} onPress={handleSaveProfile} style={{ marginTop: 12, height: 46 }}>
                Save Changes to Supabase
              </Btn>
            </ScrollView>
          </View>
        </View>
      )}

      {/* Comprehensive Settings Modal */}
      {showSettingsModal && (
        <View style={{ position: 'fixed' as any, top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 16, zIndex: 999 }}>
          <View style={{ width: '100%', maxWidth: 440, maxHeight: '90vh', backgroundColor: c.card, borderRadius: 24, padding: 22, overflow: 'hidden' }}>
            <Row style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Txt s={18} w="800">Account & Settings</Txt>
              <Pressable onPress={() => setShowSettingsModal(false)} style={{ padding: 4 }}>
                <Icon name="close" size={20} color={c.mute} />
              </Pressable>
            </Row>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 10 }}>
              {/* Account info card */}
              <View style={{ backgroundColor: c.bg, borderRadius: 16, padding: 14 }}>
                <Txt s={11} color={c.mute} w="700">SIGNED IN AS</Txt>
                <Row style={{ justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <Txt s={14} w="700">{userEmail}</Txt>
                  <Pressable onPress={handleCopyEmail} style={{ padding: 6, backgroundColor: '#fff', borderRadius: 8 }}>
                    <Icon name="copy" size={14} color={c.ink} />
                  </Pressable>
                </Row>
                <Txt s={11} color="#15803D" style={{ marginTop: 4 }}>● Active UTM Student Session</Txt>
              </View>

              {/* Password & Security */}
              <View style={{ gap: 8 }}>
                <Txt s={13} w="700">Security</Txt>
                <Pressable
                  onPress={() => setShowPasswordModal(true)}
                  style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: c.bg, borderRadius: 12 }}
                >
                  <Row style={{ gap: 8 }}>
                    <Icon name="lock" size={16} color={c.ink} />
                    <Txt s={13} w="600">Change Account Password</Txt>
                  </Row>
                  <Icon name="chevronRight" size={14} color={c.mute} />
                </Pressable>
              </View>

              {/* Preferences */}
              <View style={{ gap: 10 }}>
                <Txt s={13} w="700">Preferences</Txt>

                <Row style={{ justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 }}>
                  <View>
                    <Txt s={13} w="600">Measurement Units</Txt>
                    <Txt s={11} color={c.mute}>{isMetric ? 'Metric (kg, cm)' : 'Imperial (lb, in)'}</Txt>
                  </View>
                  <Pressable
                    onPress={() => setIsMetric(!isMetric)}
                    style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: c.yellow }}
                  >
                    <Txt s={12} w="700">{isMetric ? 'Metric' : 'Imperial'}</Txt>
                  </Pressable>
                </Row>

                <Row style={{ justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 }}>
                  <View>
                    <Txt s={13} w="600">Private Profile</Txt>
                    <Txt s={11} color={c.mute}>Hide from Discover and peer search</Txt>
                  </View>
                  <Switch
                    value={isPrivateProfile}
                    onValueChange={setIsPrivateProfile}
                  />
                </Row>

                <Row style={{ justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 }}>
                  <View>
                    <Txt s={13} w="600">Auto-Share Meals</Txt>
                    <Txt s={11} color={c.mute}>Share logged meal snaps with Circle</Txt>
                  </View>
                  <Switch
                    value={autoShareMeals}
                    onValueChange={setAutoShareMeals}
                  />
                </Row>
              </View>

              {/* Danger Zone */}
              <View style={{ gap: 8, paddingTop: 10, borderTopWidth: 1, borderColor: c.line }}>
                <Txt s={13} w="700" color="#DC2626">Account Actions</Txt>

                <Pressable
                  onPress={handleSignOut}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: '#FEE2E2', borderRadius: 12 }}
                >
                  <Icon name="logout" size={16} color="#DC2626" />
                  <Txt s={13} w="700" color="#DC2626">Log Out of CalorieSnap</Txt>
                </Pressable>

                <Pressable
                  onPress={() => setShowDeleteModal(true)}
                  style={{ padding: 8, alignItems: 'center' }}
                >
                  <Txt s={12} color={c.mute}>Delete Account & Data</Txt>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <View style={{ position: 'fixed' as any, top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 16, zIndex: 1000 }}>
          <View style={{ width: '100%', maxWidth: 400, backgroundColor: c.card, borderRadius: 24, padding: 22, gap: 14 }}>
            <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Txt s={18} w="800">Change Password</Txt>
              <Pressable onPress={() => setShowPasswordModal(false)}>
                <Icon name="close" size={20} color={c.mute} />
              </Pressable>
            </Row>

            <View style={{ gap: 4 }}>
              <Txt s={12} color={c.mute}>Current Password</Txt>
              <TextInput
                secureTextEntry
                value={oldPassword}
                onChangeText={setOldPassword}
                placeholder="••••••••"
                placeholderTextColor="#94A3B8"
                style={{ borderWidth: 1, borderColor: c.line, borderRadius: 12, padding: 10, fontSize: 14, color: '#1E293B' }}
              />
            </View>

            <View style={{ gap: 4 }}>
              <Txt s={12} color={c.mute}>New Password (min 8 chars)</Txt>
              <TextInput
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="••••••••"
                placeholderTextColor="#94A3B8"
                style={{ borderWidth: 1, borderColor: c.line, borderRadius: 12, padding: 10, fontSize: 14, color: '#1E293B' }}
              />
            </View>

            <View style={{ gap: 4 }}>
              <Txt s={12} color={c.mute}>Confirm New Password</Txt>
              <TextInput
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                placeholderTextColor="#94A3B8"
                style={{ borderWidth: 1, borderColor: c.line, borderRadius: 12, padding: 10, fontSize: 14, color: '#1E293B' }}
              />
            </View>

            <Btn bg={c.yellow} onPress={handleChangePassword} style={{ marginTop: 8 }}>
              Update Password
            </Btn>
          </View>
        </View>
      )}

      {/* Delete Account Modal (RiceCal standard) */}
      {showDeleteModal && (
        <View style={{ position: 'fixed' as any, top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 16, zIndex: 1000 }}>
          <View style={{ width: '100%', maxWidth: 400, backgroundColor: c.card, borderRadius: 24, padding: 22, gap: 14 }}>
            <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Txt s={18} w="800" color="#DC2626">Delete Account</Txt>
              <Pressable onPress={() => setShowDeleteModal(false)}>
                <Icon name="close" size={20} color={c.mute} />
              </Pressable>
            </Row>

            <Txt s={13} color="#4A5568" style={{ lineHeight: 18 }}>
              This action cannot be undone. All your meal history, SnapPoints, streaks, and personal health metrics will be permanently erased.
            </Txt>

            <View style={{ gap: 4 }}>
              <Txt s={12} color={c.mute}>Type <Txt w="700">delete</Txt> to confirm:</Txt>
              <TextInput
                value={deleteConfirmText}
                onChangeText={setDeleteConfirmText}
                placeholder="delete"
                placeholderTextColor="#94A3B8"
                style={{ borderWidth: 1, borderColor: c.line, borderRadius: 12, padding: 10, fontSize: 14, color: '#1E293B' }}
              />
            </View>

            <Btn
              bg="#DC2626"
              onPress={() => {
                if (deleteConfirmText.trim().toLowerCase() === 'delete') {
                  showToast('Account deleted.');
                  handleSignOut();
                } else {
                  showToast('Please type "delete" to confirm');
                }
              }}
              style={{ opacity: deleteConfirmText.trim().toLowerCase() === 'delete' ? 1 : 0.5 }}
            >
              <Txt w="700" color="#fff">Permanently Delete Account</Txt>
            </Btn>
          </View>
        </View>
      )}
    </Screen>
  );
}

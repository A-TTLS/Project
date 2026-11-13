import React, { useState, useEffect } from 'react';
import { View, ScrollView, Pressable, SafeAreaView } from 'react-native-web';
import { AppProvider, useApp } from './context/AppContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MeasurementsPage from './pages/MeasurementsPage';
import ActivityPage from './pages/ActivityPage';
import HomeScreen from './screens/HomeScreen';
import ScanScreen from './screens/ScanScreen';
import ScanResultScreen from './screens/ScanResultScreen';
import SocialScreen from './screens/SocialScreen';
import TrendScreen from './screens/TrendScreen';
import ProfileScreen from './screens/ProfileScreen';
import RewardsScreen from './screens/RewardsScreen';
import { Txt, Row, c } from './ui';
import type { ActivityLevel, UserMeasurements, UserProfile } from './services/authService';
import { checkSupabaseHealth } from './services/supabaseClient';

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState('Home');
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'offline'>('checking');
  const [capturedMeal, setCapturedMeal] = useState<{
    name: string;
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
    image?: string;
  } | undefined>();

  const [showNavSwitcher, setShowNavSwitcher] = useState(true);

  // Check Supabase Backend Health on load
  useEffect(() => {
    checkSupabaseHealth().then((res) => {
      setDbStatus(res.connected ? 'connected' : 'offline');
      console.log(`[CalorieSnap] Supabase Backend: ${res.connected ? '🟢 CONNECTED' : '🔴 OFFLINE'} (${res.message})`);
    });
  }, []);

  // Onboarding state
  const [user, setUser] = useState<UserProfile | null>(null);
  const [measurements, setMeasurements] = useState<UserMeasurements>({
    gender: 'Female',
    age: '21',
    height: '158',
    weight: '48.5',
    target: '48',
    units: 'metric',
  });
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');

  const { toastMessage, reloadUserData } = useApp();

  const allScreens = [
    'Home',
    'Social',
    'Scan',
    'Scan Result',
    'Trend',
    'Trend · Calendar',
    'Profile',
    'Rewards',
    'Landing Page',
    'Login',
    'Register',
    'Profile Setup',
  ];

  const renderActiveScreen = () => {
    switch (currentScreen) {
      // Main App Wireframes
      case 'Home':
        return <HomeScreen onNavigate={setCurrentScreen} />;
      case 'Social':
      case 'Social · Following':
        return <SocialScreen onNavigate={setCurrentScreen} initialTab={0} />;
      case 'Social · Discover':
        return <SocialScreen onNavigate={setCurrentScreen} initialTab={1} />;
      case 'Social · Groups':
        return <SocialScreen onNavigate={setCurrentScreen} initialTab={2} />;
      case 'Scan':
        return (
          <ScanScreen
            onNavigate={setCurrentScreen}
            onPhotoCaptured={(meal) => setCapturedMeal(meal)}
          />
        );
      case 'Scan Result':
        return (
          <ScanResultScreen
            onNavigate={setCurrentScreen}
            capturedMeal={capturedMeal}
          />
        );
      case 'Trend':
      case 'Trend · Analytics':
        return <TrendScreen onNavigate={setCurrentScreen} initialTab={0} />;
      case 'Trend · Calendar':
        return <TrendScreen onNavigate={setCurrentScreen} initialTab={1} />;
      case 'Profile':
        return (
          <ProfileScreen
            onNavigate={setCurrentScreen}
            onLogOut={() => setCurrentScreen('Landing Page')}
          />
        );
      case 'Rewards':
        return <RewardsScreen onNavigate={setCurrentScreen} />;

      // Onboarding & Auth Flow
      case 'Landing Page':
      case 'landing':
        return (
          <LandingPage
            onNavigate={(page) => {
              if (page === 'login') setCurrentScreen('Login');
              else if (page === 'register') setCurrentScreen('Register');
              else setCurrentScreen('Landing Page');
            }}
          />
        );
      case 'Login':
      case 'login':
        return (
          <LoginPage
            onGoBack={() => setCurrentScreen('Landing Page')}
            onGoToRegister={() => setCurrentScreen('Register')}
            onSignedIn={() => setCurrentScreen('Home')}
          />
        );
      case 'Register':
      case 'register':
        return (
          <RegisterPage
            onCreated={(newUser) => {
              setUser(newUser);
              setCurrentScreen('Profile Setup');
            }}
            onGoBack={() => setCurrentScreen('Landing Page')}
            onGoToLogin={() => setCurrentScreen('Login')}
          />
        );
      case 'Profile Setup':
      case 'measurements':
        return (
          <MeasurementsPage
            initialValues={measurements}
            onBack={() => setCurrentScreen('Register')}
            onChange={setMeasurements}
            onContinue={() => setCurrentScreen('Activity Setup')}
          />
        );
      case 'Activity Setup':
      case 'activity':
        return (
          <ActivityPage
            level={activityLevel}
            measurements={measurements}
            onBack={() => setCurrentScreen('Profile Setup')}
            onComplete={async () => {
              await reloadUserData();
              setCurrentScreen('Home');
            }}
            onLevelChange={setActivityLevel}
          />
        );

      default:
        return <HomeScreen onNavigate={setCurrentScreen} />;
    }
  };

  return (
    <View style={{ minHeight: '100vh', width: '100%', backgroundColor: c.bg, display: 'flex', flexDirection: 'column' }}>
      {/* Top Prototype Wireframe Navigation Bar */}
      <View
        style={{
          backgroundColor: '#fff',
          borderBottomWidth: 1,
          borderColor: c.line,
          paddingVertical: 6,
          zIndex: 100,
        }}
      >
        <Row style={{ justifyContent: 'space-between', paddingHorizontal: 12, alignItems: 'center' }}>
          <Row style={{ alignItems: 'center', gap: 6 }}>
            <View style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: dbStatus === 'connected' ? '#22c55e' : dbStatus === 'checking' ? '#eab308' : '#ef4444'
            }} />
            <Txt s={11} w="700">CalorieSnap Prototype</Txt>
            <View style={{
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 4,
              backgroundColor: dbStatus === 'connected' ? '#dcfce7' : dbStatus === 'checking' ? '#fef9c3' : '#fee2e2',
              marginLeft: 4,
            }}>
              <Txt s={9} w="700" color={dbStatus === 'connected' ? '#15803d' : dbStatus === 'checking' ? '#a16207' : '#b91c1c'}>
                {dbStatus === 'connected' ? 'SUPABASE LIVE' : dbStatus === 'checking' ? 'CONNECTING...' : 'OFFLINE DEMO'}
              </Txt>
            </View>
          </Row>

          <Pressable
            onPress={() => setShowNavSwitcher(!showNavSwitcher)}
            style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: c.bg }}
          >
            <Txt s={10} color={c.mute}>{showNavSwitcher ? '▲ Hide Switcher' : '▼ Wireframes'}</Txt>
          </Pressable>
        </Row>

        {showNavSwitcher && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 12, paddingTop: 6, gap: 6 }}
          >
            {allScreens.map((name) => {
              const active = currentScreen === name || (name === 'Social' && currentScreen.startsWith('Social')) || (name === 'Trend' && currentScreen.startsWith('Trend'));
              return (
                <Pressable
                  key={name}
                  onPress={() => setCurrentScreen(name)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 5,
                    borderRadius: 999,
                    backgroundColor: active ? c.yellow : '#f1f5f9',
                    borderWidth: 1,
                    borderColor: active ? c.ink : '#e2e8f0',
                    cursor: 'pointer' as any,
                  }}
                >
                  <Txt s={11} w={active ? '800' : '600'} color={active ? c.ink : '#475569'}>
                    {name}
                  </Txt>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Live Toast Alert Notification */}
      {toastMessage && (
        <View
          style={{
            position: 'absolute',
            top: showNavSwitcher ? 80 : 45,
            left: 20,
            right: 20,
            zIndex: 999,
            alignItems: 'center',
          }}
        >
          <View
            style={{
              backgroundColor: '#1e293b',
              paddingVertical: 10,
              paddingHorizontal: 18,
              borderRadius: 24,
              boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
              borderWidth: 1,
              borderColor: '#334155',
            }}
          >
            <Txt s={12} w="600" color="#fff">
              {toastMessage}
            </Txt>
          </View>
        </View>
      )}

      {/* Active Screen Rendering */}
      <View style={{ flex: 1, width: '100%', position: 'relative' }}>
        {renderActiveScreen()}
      </View>
    </View>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

import React, { useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native-web';
import { useApp, type VoucherItem } from '../context/AppContext';
import {
  Screen,
  Row,
  Txt,
  Card,
  IconBox,
  Btn,
  Ph,
  SectionHead,
  Pill,
  c,
} from '../ui';

interface RewardsScreenProps {
  onNavigate: (screen: string) => void;
}

export default function RewardsScreen({ onNavigate }: RewardsScreenProps) {
  const {
    snapPoints,
    streakDays,
    waterMl,
    stepsCount,
    todayMeals,
    availableVouchers,
    claimedVouchers,
    claimVoucher,
    showToast,
  } = useApp();

  const [showWallet, setShowWallet] = useState(false);

  const loggedMealsCount = todayMeals.filter((m) => m.logged).length;

  const missions = [
    {
      title: 'Snap 3 meals',
      subtitle: `${Math.min(3, loggedMealsCount)} of 3 logged · ${loggedMealsCount >= 3 ? 'Completed!' : 'Keep snapping'}`,
      points: '+50 pts',
      progress: Math.min(1, loggedMealsCount / 3),
      done: loggedMealsCount >= 3,
    },
    {
      title: 'Hit 8,000 steps',
      subtitle: `${stepsCount.toLocaleString()} of 8,000 steps`,
      points: '+30 pts',
      progress: Math.min(1, stepsCount / 8000),
      done: stepsCount >= 8000,
    },
    {
      title: 'Drink 2L water',
      subtitle: `${waterMl.toLocaleString()} of 2,000 ml`,
      points: '+20 pts',
      progress: Math.min(1, waterMl / 2000),
      done: waterMl >= 2000,
    },
  ];

  const handleClaim = (v: VoucherItem) => {
    const res = claimVoucher(v);
    if (!res.success) {
      alert(res.message);
    }
  };

  return (
    <Screen tab="Profile" onSelectTab={onNavigate}>
      {/* Top Header */}
      <Row style={{ alignItems: 'center', marginBottom: 12 }}>
        <IconBox label="←" onPress={() => onNavigate('Home')} />
        <Txt s={22} w="800" style={{ flex: 1, marginHorizontal: 12 }}>
          Your feel-good perks.
        </Txt>
        <IconBox label="wallet" onPress={() => setShowWallet(true)} />
      </Row>

      <Txt s={12} color={c.mute} style={{ marginBottom: 14 }}>
        Turn your daily nutrition and activity consistency into real campus treats.
      </Txt>

      {/* SnapPoints Balance Card */}
      <Card bg={c.yellow}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Txt s={11} w="700">YOUR SNAPPOINTS</Txt>
          <IconBox size={28} label="⏱" />
        </Row>
        <Txt s={44} w="800" style={{ marginVertical: 8 }}>
          {snapPoints.toLocaleString()}
        </Txt>
        <Txt s={12} style={{ marginBottom: 14 }}>
          🔥 {streakDays}-Day Active Streak
        </Txt>

        <Btn bg={c.card} onPress={() => setShowWallet(true)}>
          My Wallet · {claimedVouchers.length} active vouchers
        </Btn>
      </Card>

      {/* Daily Missions */}
      <Row style={{ justifyContent: 'space-between', marginTop: 22, marginBottom: 10 }}>
        <Txt s={16} w="800">Daily missions</Txt>
        <Txt s={11} color={c.mute}>Today · 15 Oct</Txt>
      </Row>

      <Card>
        {missions.map((m, i) => (
          <View key={m.title} style={{ marginBottom: i < missions.length - 1 ? 16 : 0 }}>
            <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Row style={{ flex: 1, alignItems: 'center' }}>
                <IconBox size={30} label={m.done ? '✓' : '🎯'} />
                <View style={{ marginLeft: 10 }}>
                  <Txt w="700">{m.title}</Txt>
                  <Txt s={11} color={c.mute}>{m.subtitle}</Txt>
                </View>
              </Row>
              <Pill active={m.done} bg={m.done ? c.mint : undefined}>
                {m.done ? 'Claimed' : m.points}
              </Pill>
            </Row>

            <View style={{ height: 6, borderRadius: 3, backgroundColor: c.block, marginTop: 8, overflow: 'hidden' }}>
              <View style={{ width: `${m.progress * 100}%`, height: 6, borderRadius: 3, backgroundColor: m.done ? c.dark : '#4ade80' }} />
            </View>
          </View>
        ))}
      </Card>

      {/* Yesterday Milestone */}
      <Card bg={c.green} style={{ marginTop: 12 }}>
        <Txt s={12} w="700">Yesterday: Snap 3 meals · +50 pts</Txt>
        <Txt s={10} color={c.mute} style={{ marginTop: 2 }}>
          14 Oct · Added to your balance · Claimed
        </Txt>
      </Card>

      {/* Claim Vouchers Carousel */}
      <SectionHead title="Claim vouchers" right="Swipe for more" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -20 }}
        contentContainerStyle={{ paddingHorizontal: 20 }}
      >
        {availableVouchers.map((v) => (
          <Pressable
            key={v.id}
            onPress={() => handleClaim(v)}
            style={{ cursor: 'pointer' as any }}
          >
            <Card
              bg={v.color}
              style={{
                width: 260,
                height: 135,
                marginRight: 12,
                justifyContent: 'space-between',
              }}
            >
              <Row style={{ justifyContent: 'space-between' }}>
                <Txt s={12} color={c.mute}>{v.brand}</Txt>
                <Pill bg={c.card}>{v.points} pts</Pill>
              </Row>
              <View>
                <Txt s={22} w="800">{v.discount}</Txt>
                <Txt s={12} color={c.ink}>{v.title}</Txt>
              </View>
            </Card>
          </Pressable>
        ))}
      </ScrollView>

      {/* Partner Treats List */}
      <Row style={{ justifyContent: 'space-between', marginTop: 20, marginBottom: 4 }}>
        <Txt s={16} w="800">All partner treats</Txt>
        <Txt s={11} color={c.mute}>{availableVouchers.length} vouchers</Txt>
      </Row>
      <Txt s={11} color={c.mute} style={{ marginBottom: 12 }}>
        Turn your SnapPoints into your next campus pick-me-up.
      </Txt>

      {availableVouchers.map((v) => (
        <Card key={v.id} style={{ marginBottom: 12 }}>
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Row style={{ alignItems: 'center' }}>
              <Ph w={46} h={46} label="LOGO" />
              <View style={{ marginLeft: 12 }}>
                <Txt s={11} color={c.mute}>{v.brand}</Txt>
                <Txt w="800" s={15}>{v.title}</Txt>
              </View>
            </Row>
            <Pill bg={c.yellow}>{v.points} pts</Pill>
          </Row>

          <Row style={{ justifyContent: 'space-between', marginVertical: 10 }}>
            <Txt s={11} color={c.mute}>In-store · Selected campus outlets</Txt>
            <Txt s={11} color={c.dark} w="600">Points available: {snapPoints}</Txt>
          </Row>

          <Btn bg={snapPoints >= v.points ? c.yellow : c.block} onPress={() => handleClaim(v)}>
            {snapPoints >= v.points ? 'Claim Voucher' : `Need ${v.points - snapPoints} more pts`}
          </Btn>
        </Card>
      ))}

      <Txt s={10} color={c.mute} style={{ textAlign: 'center', marginTop: 8, marginBottom: 24 }}>
        Partner terms apply. Vouchers appear in My Wallet immediately after claiming.
      </Txt>

      {/* My Wallet Modal */}
      {showWallet && (
        <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 20, zIndex: 99 }}>
          <View style={{ width: '100%', maxWidth: 440, backgroundColor: c.card, borderRadius: 24, padding: 24, gap: 14 }}>
            <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Txt s={20} w="800">My Claimed Vouchers</Txt>
              <Pressable onPress={() => setShowWallet(false)}>
                <Txt s={18} color={c.mute}>✕</Txt>
              </Pressable>
            </Row>

            <Txt s={12} color={c.mute}>
              Present voucher code to the cashier during checkout.
            </Txt>

            {claimedVouchers.length === 0 ? (
              <View style={{ padding: 24, alignItems: 'center' }}>
                <Txt color={c.mute}>No claimed vouchers yet. Complete daily missions to earn points!</Txt>
              </View>
            ) : (
              claimedVouchers.map((v) => (
                <Card key={v.id} bg="#f8fafc" style={{ borderWidth: 1, borderColor: '#cbd5e1', gap: 6 }}>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <Txt w="700">{v.title}</Txt>
                    <Pill bg={c.mint}>Active</Pill>
                  </Row>
                  <Row style={{ backgroundColor: '#fff', padding: 10, borderRadius: 10, justifyContent: 'space-between', alignItems: 'center', marginVertical: 4 }}>
                    <Txt s={16} w="800" color={c.dark}>{v.code}</Txt>
                    <Pressable onPress={() => showToast(`Copied code: ${v.code}`)}>
                      <Txt s={11} color={c.mute}>Copy</Txt>
                    </Pressable>
                  </Row>
                  <Txt s={10} color={c.mute}>Valid until: {v.expiry}</Txt>
                </Card>
              ))
            )}

            <Btn bg={c.yellow} onPress={() => setShowWallet(false)}>
              Close Wallet
            </Btn>
          </View>
        </View>
      )}
    </Screen>
  );
}

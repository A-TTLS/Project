import React, { useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native-web';
import { useApp } from '../context/AppContext';
import { useRewards } from '../hooks/useRewards';
import type { MissionType, Voucher } from '../services/rewardsService';
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

/**
 * Minimalist "Sketch-style" Vector SVG Icons for Brands / Vouchers
 * Rendered with clean neutral slate strokes and subtle backgrounds.
 */
function BrandSketchIcon({ brand, title }: { brand?: string; title?: string }) {
  const text = `${brand || ''} ${title || ''}`.toLowerCase();

  // Coffee (Zus Coffee, Starbucks, etc.)
  if (text.includes('coffee') || text.includes('zus') || text.includes('latte') || text.includes('cafe')) {
    return (
      <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
          <line x1="6" y1="1" x2="6" y2="4" />
          <line x1="10" y1="1" x2="10" y2="4" />
          <line x1="14" y1="1" x2="14" y2="4" />
        </svg>
      </View>
    );
  }

  // Tea, Boba, Juice, Drinks (Tealive, Boost Juice, Chatime)
  if (text.includes('tea') || text.includes('tealive') || text.includes('juice') || text.includes('boost') || text.includes('drink') || text.includes('boba')) {
    return (
      <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#DCFCE7' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 21h10" />
          <path d="M12 21a7 7 0 0 1-7-7V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v9a7 7 0 0 1-7 7Z" />
          <path d="M6 1h12" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="10" y1="11" x2="14" y2="11" />
        </svg>
      </View>
    );
  }

  // Salad, Healthy Bowls (Salad Atelier, Poke, Healthy Meal)
  if (text.includes('salad') || text.includes('atelier') || text.includes('bowl') || text.includes('green') || text.includes('healthy')) {
    return (
      <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#A7F3D0' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 20A7 7 0 0 1 4 13h16a7 7 0 0 1-7 7Z" />
          <path d="M12 9c-1.5-2.5-4-3-6-3 0 2.5 1 5 3 6" />
          <path d="M12 9c1.5-2.5 4-3 6-3 0 2.5-1 5-3 6" />
        </svg>
      </View>
    );
  }

  // Sandwich, Subs, Wraps (Subway, Oden, FamilyMart, Bakery)
  if (text.includes('subway') || text.includes('sandwich') || text.includes('wrap') || text.includes('burger') || text.includes('familymart') || text.includes('oden')) {
    return (
      <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: '#FFFBEB', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FDE68A' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 11h18a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2Z" />
          <path d="M4 11V7a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v4" />
          <line x1="6" y1="17" x2="6" y2="19" />
          <line x1="18" y1="17" x2="18" y2="19" />
        </svg>
      </View>
    );
  }

  // Generic Treat / Gift Voucher Fallback
  return (
    <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 12v10H4V12" />
        <path d="M2 7h20v5H2z" />
        <path d="M12 22V7" />
        <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
        <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
      </svg>
    </View>
  );
}

// One shape for both live (Supabase) and demo data, so the layout below
// does not care where the numbers came from.
interface MissionView {
  key: string;
  missionId: string | null;
  title: string;
  subtitle: string;
  reward: number;
  progress: number;
  done: boolean;
  claimed: boolean;
}

interface VoucherView {
  id: string;
  brand: string;
  title: string;
  discount: string;
  points: number;
  color: string;
  live?: Voucher;
}

interface WalletView {
  id: string;
  title: string;
  code: string;
  expiry: string;
  status: string;
}

const MISSION_TITLES: Record<MissionType, string> = {
  snap_3_meals: 'Snap 3 meals',
  steps_8000: 'Hit 8,000 steps',
  water_2000: 'Drink 2L water',
};

function missionSubtitle(type: MissionType, current: number, target: number): string {
  if (type === 'snap_3_meals') return `${current} of ${target} logged`;
  if (type === 'steps_8000') return `${current.toLocaleString()} of ${target.toLocaleString()} steps`;
  return `${current.toLocaleString()} of ${target.toLocaleString()} ml`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function RewardsScreen({ onNavigate }: RewardsScreenProps) {
  const demo = useApp();
  const rewards = useRewards();
  const [showWallet, setShowWallet] = useState(false);
  const [busy, setBusy] = useState(false);

  const live = rewards.isLive;
  const snapPoints = live ? rewards.snapPoints : demo.snapPoints;
  const streakDays = live ? rewards.streakDays : demo.streakDays;
  const todayLabel = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  // ---- Missions -----------------------------------------------------------
  const demoMealsLogged = demo.todayMeals.filter((m) => m.logged).length;
  const missions: MissionView[] = live
    ? rewards.missions.map((m) => ({
        key: m.id,
        missionId: m.id,
        title: MISSION_TITLES[m.mission_type],
        subtitle: missionSubtitle(m.mission_type, m.current_progress, m.target_progress),
        reward: m.points_reward,
        progress: Math.min(1, m.current_progress / m.target_progress),
        done: m.is_completed,
        claimed: m.is_claimed,
      }))
    : [
        {
          key: 'demo-meals',
          missionId: null,
          title: MISSION_TITLES.snap_3_meals,
          subtitle: missionSubtitle('snap_3_meals', Math.min(3, demoMealsLogged), 3),
          reward: 50,
          progress: Math.min(1, demoMealsLogged / 3),
          done: demoMealsLogged >= 3,
          claimed: demoMealsLogged >= 3,
        },
        {
          key: 'demo-steps',
          missionId: null,
          title: MISSION_TITLES.steps_8000,
          subtitle: missionSubtitle('steps_8000', demo.stepsCount, 8000),
          reward: 30,
          progress: Math.min(1, demo.stepsCount / 8000),
          done: demo.stepsCount >= 8000,
          claimed: demo.stepsCount >= 8000,
        },
        {
          key: 'demo-water',
          missionId: null,
          title: MISSION_TITLES.water_2000,
          subtitle: missionSubtitle('water_2000', demo.waterMl, 2000),
          reward: 20,
          progress: Math.min(1, demo.waterMl / 2000),
          done: demo.waterMl >= 2000,
          claimed: demo.waterMl >= 2000,
        },
      ];

  // ---- Vouchers and wallet ---------------------------------------------------
  const vouchers: VoucherView[] = live
    ? rewards.vouchers.map((v) => ({
        id: v.id,
        brand: v.brand,
        title: v.title,
        discount: v.discount_label,
        points: v.points_cost,
        color: v.color_hex,
        live: v,
      }))
    : demo.availableVouchers;

  const wallet: WalletView[] = live
    ? rewards.wallet.map((w) => ({
        id: w.id,
        title: w.title,
        code: w.voucher_code,
        expiry: formatDate(w.expires_at),
        status: w.status,
      }))
    : demo.claimedVouchers.map((w) => ({ ...w, status: 'active' }));

  const activeWallet = wallet.filter((w) => w.status === 'active');

  // ---- Actions --------------------------------------------------------------
  const handleClaimMission = async (m: MissionView) => {
    if (!live || !m.missionId || !m.done || m.claimed || busy) return;
    setBusy(true);
    const res = await rewards.claim(m.missionId);
    setBusy(false);
    if (res.success) demo.showToast(`🎉 +${m.reward} SnapPoints · ${m.title}`);
    else alert(res.message);
  };

  const handleClaimVoucher = async (v: VoucherView) => {
    if (busy) return;
    if (live && v.live) {
      setBusy(true);
      const res = await rewards.redeem(v.live);
      setBusy(false);
      if (res.success) demo.showToast(`🎁 ${res.message}`);
      else alert(res.message);
      return;
    }
    const res = demo.claimVoucher(v);
    if (!res.success) alert(res.message);
  };

  const missionPill = (m: MissionView) => {
    if (m.claimed) return <Pill active bg={c.mint}>Claimed</Pill>;
    if (m.done && live) {
      return (
        <Pill active bg={c.yellow} onPress={() => handleClaimMission(m)}>
          {`Claim +${m.reward}`}
        </Pill>
      );
    }
    return <Pill>{`+${m.reward} pts`}</Pill>;
  };

  return (
    <Screen hideTabBar onSelectTab={onNavigate}>
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

      {!live && !rewards.loading && (
        <Txt s={11} color={c.mute} style={{ marginBottom: 10 }}>
          Showing demo data. Sign in to see your own rewards.
        </Txt>
      )}
      {rewards.error && (
        <Card bg="#fdecec" style={{ marginBottom: 12 }}>
          <Txt s={12} w="700">Could not load your rewards</Txt>
          <Txt s={11} color={c.mute} style={{ marginTop: 2 }}>{rewards.error}</Txt>
          <View style={{ marginTop: 8, alignSelf: 'flex-start' }}>
            <Pill onPress={() => void rewards.reload()}>Try again</Pill>
          </View>
        </Card>
      )}

      {/* SnapPoints Balance Card */}
      <Card bg={c.yellow}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Txt s={11} w="700">YOUR SNAPPOINTS</Txt>
          <IconBox size={28} label="⏱" />
        </Row>
        <Txt s={44} w="800" style={{ marginVertical: 8 }}>
          {rewards.loading && live ? '…' : snapPoints.toLocaleString()}
        </Txt>
        <Txt s={12} style={{ marginBottom: 14 }}>
          🔥 {streakDays}-Day Active Streak
        </Txt>

        <Btn bg={c.card} onPress={() => setShowWallet(true)}>
          My Wallet · {activeWallet.length} active vouchers
        </Btn>
      </Card>

      {/* Daily Missions */}
      <Row style={{ justifyContent: 'space-between', marginTop: 22, marginBottom: 10 }}>
        <Txt s={16} w="800">Daily missions</Txt>
        <Txt s={11} color={c.mute}>Today · {todayLabel}</Txt>
      </Row>

      <Card>
        {missions.map((m, i) => (
          <View key={m.key} style={{ marginBottom: i < missions.length - 1 ? 16 : 0 }}>
            <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Row style={{ flex: 1, alignItems: 'center' }}>
                <IconBox size={30} label={m.done ? '✓' : '🎯'} />
                <View style={{ marginLeft: 10 }}>
                  <Txt w="700">{m.title}</Txt>
                  <Txt s={11} color={c.mute}>
                    {m.subtitle} · {m.claimed ? 'Claimed' : m.done ? 'Ready to claim!' : 'Keep going'}
                  </Txt>
                </View>
              </Row>
              {missionPill(m)}
            </Row>

            <View style={{ height: 6, borderRadius: 3, backgroundColor: c.block, marginTop: 8, overflow: 'hidden' }}>
              <View style={{ width: `${m.progress * 100}%`, height: 6, borderRadius: 3, backgroundColor: m.done ? c.dark : '#4ade80' }} />
            </View>
          </View>
        ))}
      </Card>

      {/* Claim Vouchers Carousel */}
      <SectionHead title="Claim vouchers" right="Swipe for more" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -20 }}
        contentContainerStyle={{ paddingHorizontal: 20 }}
      >
        {vouchers.map((v) => (
          <Pressable
            key={v.id}
            onPress={() => handleClaimVoucher(v)}
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
        <Txt s={11} color={c.mute}>{vouchers.length} vouchers</Txt>
      </Row>
      <Txt s={11} color={c.mute} style={{ marginBottom: 12 }}>
        Turn your SnapPoints into your next campus pick-me-up.
      </Txt>

      {vouchers.map((v) => {
        const outOfStock = v.live?.stock === 0;
        const affordable = snapPoints >= v.points;
        return (
          <Card key={v.id} style={{ marginBottom: 12 }}>
            <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Row style={{ alignItems: 'center', flex: 1, marginRight: 8 }}>
                <BrandSketchIcon brand={v.brand} title={v.title} />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Txt s={11} color={c.mute}>{v.brand}</Txt>
                  <Txt w="800" s={15}>{v.title}</Txt>
                </View>
              </Row>
              <Pill bg={c.yellow}>{v.points} pts</Pill>
            </Row>

            <Row style={{ justifyContent: 'space-between', marginVertical: 10 }}>
              <Txt s={11} color={c.mute}>
                {v.live?.stock != null ? `${v.live.stock} left` : 'In-store · Selected campus outlets'}
              </Txt>
              <Txt s={11} color={c.dark} w="600">Points available: {snapPoints}</Txt>
            </Row>

            <Btn
              bg={affordable && !outOfStock ? c.yellow : c.block}
              onPress={() => handleClaimVoucher(v)}
            >
              {outOfStock
                ? 'Out of stock'
                : affordable
                  ? busy ? 'Claiming…' : 'Claim Voucher'
                  : `Need ${v.points - snapPoints} more pts`}
            </Btn>
          </Card>
        );
      })}

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

            {wallet.length === 0 ? (
              <View style={{ padding: 24, alignItems: 'center' }}>
                <Txt color={c.mute}>No claimed vouchers yet. Complete daily missions to earn points!</Txt>
              </View>
            ) : (
              wallet.map((v) => (
                <Card key={v.id} bg="#f8fafc" style={{ borderWidth: 1, borderColor: '#cbd5e1', gap: 6 }}>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <Txt w="700">{v.title}</Txt>
                    <Pill bg={v.status === 'active' ? c.mint : c.block}>
                      {v.status === 'active' ? 'Active' : v.status === 'redeemed' ? 'Used' : 'Expired'}
                    </Pill>
                  </Row>
                  <Row style={{ backgroundColor: '#fff', padding: 10, borderRadius: 10, justifyContent: 'space-between', alignItems: 'center', marginVertical: 4 }}>
                    <Txt s={16} w="800" color={c.dark}>{v.code}</Txt>
                    <Pressable
                      onPress={() => {
                        void navigator.clipboard?.writeText(v.code);
                        demo.showToast(`Copied code: ${v.code}`);
                      }}
                    >
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

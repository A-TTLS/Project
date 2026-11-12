import { useCallback, useEffect, useState } from 'react';
import {
  claimMission,
  getMyWallet,
  getPointsSummary,
  getTodayMissions,
  getVouchers,
  redeemVoucher,
  type Mission,
  type Voucher,
  type WalletVoucher,
} from '../services/rewardsService';

// Loads everything the Rewards screen needs from Supabase.
// isLive is false when nobody is signed in; the screen then shows its demo data.

export interface RewardsState {
  isLive: boolean;
  loading: boolean;
  error: string | null;
  snapPoints: number;
  streakDays: number;
  missions: Mission[];
  vouchers: Voucher[];
  wallet: WalletVoucher[];
  reload: () => Promise<void>;
  claim: (missionId: string) => Promise<{ success: boolean; message: string }>;
  redeem: (voucher: Voucher) => Promise<{ success: boolean; message: string }>;
}

function readableError(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) return String((err as { message: string }).message);
  return 'Something went wrong. Please try again.';
}

export function useRewards(): RewardsState {
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snapPoints, setSnapPoints] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [wallet, setWallet] = useState<WalletVoucher[]>([]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const summary = await getPointsSummary();
      if (!summary) {
        setIsLive(false);
        return;
      }
      const [todayMissions, voucherList, myWallet] = await Promise.all([
        getTodayMissions(),
        getVouchers(),
        getMyWallet(),
      ]);
      setSnapPoints(summary.snapPoints);
      setStreakDays(summary.streakDays);
      setMissions(todayMissions);
      setVouchers(voucherList);
      setWallet(myWallet);
      setIsLive(true);
    } catch (err) {
      setError(readableError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const claim = useCallback(
    async (missionId: string) => {
      try {
        const balance = await claimMission(missionId);
        setSnapPoints(balance);
        setMissions(await getTodayMissions());
        return { success: true, message: 'Points added to your balance!' };
      } catch (err) {
        return { success: false, message: readableError(err) };
      }
    },
    [],
  );

  const redeem = useCallback(
    async (voucher: Voucher) => {
      try {
        const result = await redeemVoucher(voucher.id);
        await reload();
        return { success: true, message: `Claimed ${voucher.title}! Code: ${result.code}` };
      } catch (err) {
        return { success: false, message: readableError(err) };
      }
    },
    [reload],
  );

  return { isLive, loading, error, snapPoints, streakDays, missions, vouchers, wallet, reload, claim, redeem };
}

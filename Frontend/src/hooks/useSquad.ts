import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import {
  createSquad,
  getMySquads,
  getSquadBoard,
  joinSquad,
  leaveSquad,
  sendNudge,
  type BoardMember,
  type MealSlot,
  type Squad,
} from '../services/squadService';

// Loads the signed-in user's squads and the board of the selected squad.
// isLive is false when nobody is signed in; the screen then shows its demo data.

type Result = { success: boolean; message: string };

export interface SquadState {
  isLive: boolean;
  loading: boolean;
  error: string | null;
  squads: Squad[];
  activeSquad: Squad | null;
  board: BoardMember[];
  selectSquad: (squadId: string) => void;
  reload: () => Promise<void>;
  create: (name: string) => Promise<Result>;
  join: (code: string) => Promise<Result>;
  nudge: (member: BoardMember, slot: MealSlot) => Promise<Result>;
  leave: () => Promise<Result>;
}

function readableError(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) return String((err as { message: string }).message);
  return 'Something went wrong. Please try again.';
}

export function useSquad(): SquadState {
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [squads, setSquads] = useState<Squad[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [board, setBoard] = useState<BoardMember[]>([]);

  const loadBoard = useCallback(async (squadId: string | null) => {
    setBoard(squadId ? await getSquadBoard(squadId) : []);
  }, []);

  // preferId: the squad to show after loading (e.g. one just created or joined).
  const load = useCallback(
    async (preferId?: string | null) => {
      setLoading(true);
      setError(null);
      try {
        const list = await getMySquads();
        if (list === null) {
          setIsLive(false);
          setSquads([]);
          setBoard([]);
          return;
        }
        setIsLive(true);
        setSquads(list);
        const nextId = list.find((s) => s.id === preferId)?.id ?? list[0]?.id ?? null;
        setActiveId(nextId);
        await loadBoard(nextId);
      } catch (err) {
        setError(readableError(err));
      } finally {
        setLoading(false);
      }
    },
    [loadBoard],
  );

  const reload = useCallback(() => load(activeId), [load, activeId]);

  // Load once, and again whenever the user signs in or out.
  useEffect(() => {
    void load();
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') void load();
    });
    return () => data.subscription.unsubscribe();
  }, [load]);

  const selectSquad = useCallback(
    (squadId: string) => {
      setActiveId(squadId);
      loadBoard(squadId).catch((err) => setError(readableError(err)));
    },
    [loadBoard],
  );

  const create = useCallback(
    async (name: string): Promise<Result> => {
      try {
        const squad = await createSquad(name);
        await load(squad.id);
        return { success: true, message: `Squad created! Invite code: ${squad.invite_code}` };
      } catch (err) {
        return { success: false, message: readableError(err) };
      }
    },
    [load],
  );

  const join = useCallback(
    async (code: string): Promise<Result> => {
      try {
        const squad = await joinSquad(code);
        await load(squad.id);
        return { success: true, message: `Welcome to ${squad.name}!` };
      } catch (err) {
        return { success: false, message: readableError(err) };
      }
    },
    [load],
  );

  const nudge = useCallback(
    async (member: BoardMember, slot: MealSlot): Promise<Result> => {
      if (!activeId) return { success: false, message: 'No squad selected' };
      try {
        await sendNudge(activeId, member.user_id, slot);
        await loadBoard(activeId);
        const name = member.full_name ?? member.username ?? 'them';
        return { success: true, message: `Nudged ${name} to log ${slot.toLowerCase()}!` };
      } catch (err) {
        return { success: false, message: readableError(err) };
      }
    },
    [activeId, loadBoard],
  );

  const leave = useCallback(async (): Promise<Result> => {
    if (!activeId) return { success: false, message: 'No squad selected' };
    try {
      await leaveSquad(activeId);
      await load();
      return { success: true, message: 'You left the squad.' };
    } catch (err) {
      return { success: false, message: readableError(err) };
    }
  }, [activeId, load]);

  const activeSquad = squads.find((s) => s.id === activeId) ?? null;

  return { isLive, loading, error, squads, activeSquad, board, selectSquad, reload, create, join, nudge, leave };
}

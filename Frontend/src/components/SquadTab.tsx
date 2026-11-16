import React, { useState } from 'react';
import { View, TextInput, Pressable } from 'react-native-web';
import { useApp } from '../context/AppContext';
import { useSquad } from '../hooks/useSquad';
import type { BoardMember, MealSlot } from '../services/squadService';
import { Title, Row, Txt, Avatar, Ring, IconBox, Pill, Card, Btn, c } from '../ui';

// Member 5 · Roomie Diet Squad (Social → Groups tab).
// Signed in: real squads from Supabase. Signed out: the original demo board.

const SLOTS: MealSlot[] = ['Breakfast', 'Lunch', 'Dinner'];

const todayLabel = () =>
  new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const displayName = (m: BoardMember) => (m.is_me ? 'You' : m.full_name ?? m.username ?? 'Member');

const hasSlot = (m: BoardMember, slot: MealSlot) =>
  slot === 'Breakfast' ? m.has_breakfast : slot === 'Lunch' ? m.has_lunch : m.has_dinner;

const inputStyle = {
  flex: 1,
  borderWidth: 1,
  borderColor: c.line,
  borderRadius: 14,
  paddingHorizontal: 12,
  paddingVertical: 10,
  backgroundColor: c.card,
  fontSize: 14,
  color: c.ink,
} as const;

export default function SquadTab() {
  const { showToast } = useApp();
  const squad = useSquad();

  const notify = (res: { success: boolean; message: string }) =>
    showToast(res.success ? `✅ ${res.message}` : `⚠️ ${res.message}`);

  if (!squad.isLive) return <DemoSquad loading={squad.loading} />;

  return (
    <>
      <Title
        title="Your little circle."
        sub="Show up for yourself. Cheer for each other."
        right={<IconBox label="↻" onPress={() => void squad.reload()} />}
      />

      {squad.error ? (
        <Card bg={c.red} style={{ marginBottom: 16 }}>
          <Txt w="700">Couldn't load your squad</Txt>
          <Txt s={12} color={c.mute} style={{ marginVertical: 6 }}>{squad.error}</Txt>
          <Pill onPress={() => void squad.reload()}>Try again</Pill>
        </Card>
      ) : null}

      {squad.loading && squad.squads.length === 0 ? (
        <Txt color={c.mute}>Loading your squad…</Txt>
      ) : squad.activeSquad ? (
        <>
          {squad.squads.length > 1 ? (
            <Row style={{ flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {squad.squads.map((s) => (
                <Pill key={s.id} active={s.id === squad.activeSquad?.id} onPress={() => squad.selectSquad(s.id)}>
                  {s.name}
                </Pill>
              ))}
            </Row>
          ) : null}

          <SquadCard
            name={squad.activeSquad.name}
            memberCount={squad.activeSquad.member_count}
            totalStreak={squad.activeSquad.total_streak}
            inviteCode={squad.activeSquad.invite_code}
            onCopied={(msg) => showToast(msg)}
          />

          <Row style={{ justifyContent: 'space-between', marginBottom: 12 }}>
            <Txt s={17} w="800">Today's meal board</Txt>
            <Txt s={11} color={c.mute}>{todayLabel()}</Txt>
          </Row>

          {squad.board.map((m) => (
            <BoardRow key={m.user_id} member={m} onNudge={async (slot) => notify(await squad.nudge(m, slot))} />
          ))}

          {squad.board.length === 1 ? (
            <Txt s={12} color={c.mute} style={{ textAlign: 'center', marginBottom: 12 }}>
              It's just you so far. Share the invite code with your roommates!
            </Txt>
          ) : null}

          <Txt s={11} color={c.mute} style={{ textAlign: 'center', marginTop: 8 }}>
            Meal slots show main campus meals. Totals include daily snacks.
          </Txt>

          <JoinOrCreate compact onCreate={async (n) => notify(await squad.create(n))} onJoin={async (code) => notify(await squad.join(code))} />

          <Pressable onPress={async () => notify(await squad.leave())} style={{ alignItems: 'center', padding: 12, marginTop: 4 }}>
            <Txt s={12} color={c.mute}>Leave {squad.activeSquad.name}</Txt>
          </Pressable>
        </>
      ) : (
        <>
          <Card bg={c.yellow} style={{ marginBottom: 16 }}>
            <Txt s={18} w="800">No squad yet</Txt>
            <Txt s={12} color={c.mute} style={{ marginTop: 4 }}>
              Start one with your roommates, or join with an invite code.
            </Txt>
          </Card>
          <JoinOrCreate onCreate={async (n) => notify(await squad.create(n))} onJoin={async (code) => notify(await squad.join(code))} />
        </>
      )}
    </>
  );
}

function SquadCard({
  name,
  memberCount,
  totalStreak,
  inviteCode,
  onCopied,
}: {
  name: string;
  memberCount: number;
  totalStreak: number;
  inviteCode: string;
  onCopied: (message: string) => void;
}) {
  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      onCopied(`📋 Invite code copied: ${inviteCode}`);
    } catch {
      onCopied(`Invite code: ${inviteCode}`);
    }
  };

  return (
    <Card style={{ marginBottom: 16 }}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Txt s={18} w="800">{name}</Txt>
          <Txt s={11} color={c.mute}>
            {memberCount} {memberCount === 1 ? 'Member' : 'Members'} · Private campus circle
          </Txt>
        </View>
        <Pill bg={c.yellow}>Active</Pill>
      </Row>

      <Card bg={c.yellow} style={{ marginVertical: 12 }}>
        <Txt s={22} w="800">🔥 {totalStreak} total streak-days</Txt>
        <Txt s={11} color={c.mute} style={{ marginTop: 2 }}>
          Every day someone logs a meal keeps their streak alive.
        </Txt>
      </Card>

      <Pressable
        onPress={copyCode}
        style={{ alignItems: 'center', borderWidth: 1, borderColor: c.line, borderRadius: 20, padding: 12, cursor: 'pointer' as any }}
      >
        <Txt w="700">+ Invite Friend · {inviteCode}</Txt>
      </Pressable>
    </Card>
  );
}

function BoardRow({ member, onNudge }: { member: BoardMember; onNudge: (slot: MealSlot) => void }) {
  const pct = member.calorie_target > 0 ? Math.round((member.calories_today / member.calorie_target) * 100) : 0;

  return (
    <Card style={{ flexDirection: 'row', marginBottom: 12, padding: 12 }}>
      <View style={{ alignItems: 'center', width: 75, borderRightWidth: 1, borderColor: c.line, paddingRight: 8 }}>
        <Avatar size={40} label={displayName(member).charAt(0)} />
        <Txt w="800" style={{ marginTop: 4, textAlign: 'center' }} numberOfLines={1}>{displayName(member).split(' ')[0]}</Txt>
        <Txt s={10} color={c.mute} style={{ textAlign: 'center', marginBottom: 4 }}>🔥 {member.streak_days} {member.streak_days === 1 ? 'day' : 'days'}</Txt>
        <Ring size={40} label={`${pct}%`} />
      </View>

      <Row style={{ flex: 1, paddingLeft: 8 }}>
        {SLOTS.map((slot) => {
          const logged = hasSlot(member, slot);
          const nudged = member.nudged_slots.includes(slot);
          return (
            <View key={slot} style={{ flex: 1, alignItems: 'center', marginHorizontal: 3 }}>
              <Txt s={9} color={c.mute}>{slot}</Txt>
              {logged ? (
                <View style={{ height: 75, alignSelf: 'stretch', backgroundColor: c.mint, borderRadius: 12, marginTop: 4, alignItems: 'center', justifyContent: 'center' }}>
                  <Txt s={18}>✓</Txt>
                </View>
              ) : member.is_me ? (
                <View style={{ height: 75, alignSelf: 'stretch', borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', borderColor: c.line, marginTop: 4, alignItems: 'center', justifyContent: 'center' }}>
                  <Txt s={11} color={c.mute}>Not yet</Txt>
                </View>
              ) : (
                <Pressable
                  disabled={nudged}
                  onPress={() => onNudge(slot)}
                  style={{
                    height: 75,
                    alignSelf: 'stretch',
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderStyle: 'dashed',
                    borderColor: nudged ? c.dark : c.mute,
                    backgroundColor: nudged ? '#e2f0d9' : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 4,
                    cursor: (nudged ? 'default' : 'pointer') as any,
                  }}
                >
                  <Txt s={11} w="700" color={nudged ? c.dark : c.ink}>{nudged ? 'Nudged' : 'Nudge'}</Txt>
                </Pressable>
              )}
            </View>
          );
        })}
      </Row>
    </Card>
  );
}

function JoinOrCreate({
  compact,
  onCreate,
  onJoin,
}: {
  compact?: boolean;
  onCreate: (name: string) => Promise<void>;
  onJoin: (code: string) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [open, setOpen] = useState(!compact);

  if (!open) {
    return (
      <Pressable onPress={() => setOpen(true)} style={{ alignItems: 'center', padding: 12, marginTop: 12 }}>
        <Txt s={12} w="700">+ Join or start another squad</Txt>
      </Pressable>
    );
  }

  return (
    <Card style={{ marginTop: 12, marginBottom: 12 }}>
      <Txt w="800" style={{ marginBottom: 8 }}>Join with an invite code</Txt>
      <Row style={{ gap: 8, marginBottom: 16 }}>
        <TextInput value={code} onChangeText={setCode} placeholder="SQUAD-XXXXXX" autoCapitalize="characters" style={inputStyle as any} />
        <Btn
          onPress={async () => {
            if (!code.trim()) return;
            await onJoin(code);
            setCode('');
          }}
        >
          Join
        </Btn>
      </Row>

      <Txt w="800" style={{ marginBottom: 8 }}>Or start a new squad</Txt>
      <Row style={{ gap: 8 }}>
        <TextInput value={name} onChangeText={setName} placeholder="Roomie Diet Squad" maxLength={40} style={inputStyle as any} />
        <Btn
          bg={c.green}
          onPress={async () => {
            if (!name.trim()) return;
            await onCreate(name);
            setName('');
          }}
        >
          Create
        </Btn>
      </Row>
    </Card>
  );
}

// The original prototype board, shown when nobody is signed in.
function DemoSquad({ loading }: { loading: boolean }) {
  const { groupMembers, nudgeMember, showToast } = useApp();

  return (
    <>
      <Title
        title="Your little circle."
        sub="Show up for yourself. Cheer for each other."
        right={<IconBox label="•••" onPress={() => showToast('Group settings: Roomie Diet Squad')} />}
      />
      {!loading ? (
        <Txt s={12} color={c.mute} style={{ marginBottom: 12 }}>
          Showing demo data. Sign in to see your own squad.
        </Txt>
      ) : null}

      <Card style={{ marginBottom: 16 }}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Txt s={18} w="800">Roomie Diet Squad</Txt>
            <Txt s={11} color={c.mute}>4 Members · Private campus circle</Txt>
          </View>
          <Pill bg={c.yellow}>Active</Pill>
        </Row>
        <Card bg={c.yellow} style={{ marginVertical: 12 }}>
          <Txt s={22} w="800">🔥 42 total streak-days</Txt>
          <Txt s={11} color={c.mute} style={{ marginTop: 2 }}>
            Every meal check-in adds to the squad leaderboard!
          </Txt>
        </Card>
        <Pressable
          onPress={() => showToast('📋 Group invite code copied: CALORIE-SQUAD-2026')}
          style={{ alignItems: 'center', borderWidth: 1, borderColor: c.line, borderRadius: 20, padding: 12, cursor: 'pointer' as any }}
        >
          <Txt w="700">+ Invite Friend</Txt>
        </Pressable>
      </Card>

      <Row style={{ justifyContent: 'space-between', marginBottom: 12 }}>
        <Txt s={17} w="800">Today's meal board</Txt>
        <Txt s={11} color={c.mute}>{todayLabel()}</Txt>
      </Row>

      {groupMembers.map((member) => (
        <Card key={member.name} style={{ flexDirection: 'row', marginBottom: 12, padding: 12 }}>
          <View style={{ alignItems: 'center', width: 75, borderRightWidth: 1, borderColor: c.line, paddingRight: 8 }}>
            <Avatar size={40} label={member.name.charAt(0)} />
            <Txt w="800" style={{ marginTop: 4 }}>{member.name}</Txt>
            <Txt s={10} color={c.mute}>{member.streak} streak</Txt>
            <Ring size={40} label={member.pct} />
          </View>
          <Row style={{ flex: 1, paddingLeft: 8 }}>
            {SLOTS.map((slot, i) => (
              <View key={slot} style={{ flex: 1, alignItems: 'center', marginHorizontal: 3 }}>
                <Txt s={9} color={c.mute}>{slot}</Txt>
                {i < member.slots ? (
                  <View style={{ height: 75, alignSelf: 'stretch', backgroundColor: c.mint, borderRadius: 12, marginTop: 4, alignItems: 'center', justifyContent: 'center' }}>
                    <Txt s={18}>✓</Txt>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => nudgeMember(member.name)}
                    style={{
                      height: 75,
                      alignSelf: 'stretch',
                      borderRadius: 12,
                      borderWidth: 1.5,
                      borderStyle: 'dashed',
                      borderColor: member.nudged ? c.dark : c.mute,
                      backgroundColor: member.nudged ? '#e2f0d9' : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: 4,
                      cursor: 'pointer' as any,
                    }}
                  >
                    <Txt s={11} w="700" color={member.nudged ? c.dark : c.ink}>
                      {member.nudged ? 'Nudged' : 'Nudge'}
                    </Txt>
                  </Pressable>
                )}
              </View>
            ))}
          </Row>
        </Card>
      ))}

      <Txt s={11} color={c.mute} style={{ textAlign: 'center', marginTop: 8 }}>
        Meal slots show main campus meals. Totals include daily snacks.
      </Txt>
    </>
  );
}

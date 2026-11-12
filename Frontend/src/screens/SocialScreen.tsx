import React, { useState } from 'react';
import { View, TextInput, Pressable } from 'react-native-web';
import { useApp } from '../context/AppContext';
import {
  Screen,
  Title,
  Segmented,
  Row,
  Txt,
  Avatar,
  Ring,
  Post,
  IconBox,
  Pill,
  Card,
  c,
} from '../ui';

interface SocialScreenProps {
  onNavigate: (screen: string) => void;
  initialTab?: number;
}

export default function SocialScreen({ onNavigate, initialTab = 0 }: SocialScreenProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const {
    followingPosts,
    discoverPosts,
    groupMembers,
    toggleLikePost,
    addPostComment,
    nudgeMember,
    showToast,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  // Filter Discover posts
  const filteredDiscover = discoverPosts.filter((p) => {
    const matchesSearch =
      p.caption.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.place.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <Screen tab="Social" onSelectTab={onNavigate}>
      {/* Social Sub-Tabs: Following, Discover, Groups */}
      <Segmented
        items={['Following', 'Discover', 'Groups']}
        active={activeTab}
        onSelect={setActiveTab}
      />

      {/* TAB 0: FOLLOWING */}
      {activeTab === 0 && (
        <>
          <Title
            title="Better together."
            sub="A little inspiration from your people."
            right={<IconBox label="bell" onPress={() => showToast('🔔 Mia cheered your 12-day streak!')} />}
          />

          {/* Peer Rings Bar */}
          <Row style={{ justifyContent: 'space-between', marginBottom: 20, paddingHorizontal: 4 }}>
            {[
              ['You', '27%'],
              ['Mia', '72%'],
              ['Aiden', '78%'],
              ['Sara', '80%'],
            ].map(([n, p]) => (
              <View key={n} style={{ alignItems: 'center' }}>
                <Ring size={60} label={p} />
                <Txt s={12} w="700" style={{ marginTop: 6 }}>{n}</Txt>
                <Txt s={10} color={c.mute}>{p} today</Txt>
              </View>
            ))}
          </Row>

          {/* Social Posts Feed */}
          {followingPosts.map((post) => (
            <Post
              key={post.id}
              user={post.user}
              place={post.place}
              kcal={post.kcal}
              pct={post.pct}
              caption={post.caption}
              streak={post.streak}
              avatarUrl={post.avatarUrl}
              image={post.image_url || post.image}
              likes={post.likes}
              liked={post.liked}
              comments={post.comments}
              onLike={() => toggleLikePost(post.id, false)}
              onAddComment={(text) => addPostComment(post.id, text, false)}
            />
          ))}

          <View style={{ alignSelf: 'center', marginVertical: 16 }}>
            <Pill bg={c.green}>✓ You're all caught up with your circle</Pill>
          </View>
        </>
      )}

      {/* TAB 1: DISCOVER */}
      {activeTab === 1 && (
        <>
          <Title
            title="Find your next favourite."
            sub="Fresh ideas, from campus and beyond."
            right={<IconBox label="filter" onPress={() => showToast('Filter applied: Under 500 kcal')} />}
          />

          {/* Search Box */}
          <TextInput
            placeholder="Search meals, people or campus spots..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{
              backgroundColor: '#fff',
              borderRadius: 999,
              height: 48,
              paddingHorizontal: 18,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: c.line,
              fontSize: 13,
              outlineStyle: 'none' as any,
            }}
          />

          {/* Discovery Filter Tags */}
          <Row style={{ marginBottom: 14, gap: 6 }}>
            {['All', 'Under 500 kcal', 'High Protein', 'Campus Eats'].map((tag) => (
              <Pill
                key={tag}
                active={activeFilter === tag}
                onPress={() => {
                  setActiveFilter(tag);
                  showToast(`Filter: ${tag}`);
                }}
              >
                {tag}
              </Pill>
            ))}
          </Row>

          <Card bg={c.green} style={{ marginBottom: 16 }}>
            <Txt w="800">Good ideas worth saving.</Txt>
            <Txt s={12} color={c.mute} style={{ marginTop: 2 }}>
              Discover easy, nutritious meals for busy university days.
            </Txt>
          </Card>

          {/* Public Posts Feed */}
          {filteredDiscover.map((post) => (
            <Post
              key={post.id}
              user={post.user}
              place={post.place}
              kcal={post.kcal}
              pct={post.pct}
              caption={post.caption}
              streak={post.streak}
              avatarUrl={post.avatarUrl}
              image={post.image_url || post.image}
              likes={post.likes}
              liked={post.liked}
              comments={post.comments}
              onLike={() => toggleLikePost(post.id, true)}
              onAddComment={(text) => addPostComment(post.id, text, true)}
            />
          ))}
        </>
      )}

      {/* TAB 2: GROUPS CIRCLE */}
      {activeTab === 2 && (
        <>
          <Title
            title="Your little circle."
            sub="Show up for yourself. Cheer for each other."
            right={<IconBox label="•••" onPress={() => showToast('Group settings: Roomie Diet Squad')} />}
          />

          {/* Private Circle Card */}
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

          {/* Today's Meal Board */}
          <Row style={{ justifyContent: 'space-between', marginBottom: 12 }}>
            <Txt s={17} w="800">Today's meal board</Txt>
            <Txt s={11} color={c.mute}>15 Oct 2026</Txt>
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
                {['Breakfast', 'Lunch', 'Dinner'].map((slot, i) => (
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
      )}
    </Screen>
  );
}

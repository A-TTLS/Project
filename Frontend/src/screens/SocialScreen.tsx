import React, { useState } from 'react';
import { View, TextInput } from 'react-native-web';
import { useApp } from '../context/AppContext';
import SquadTab from '../components/SquadTab';
import {
  Screen,
  Title,
  Segmented,
  Row,
  Txt,
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
    toggleLikePost,
    addPostComment,
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

      {/* TAB 2: GROUPS CIRCLE (Member 5 · Roomie Diet Squad) */}
      {activeTab === 2 && <SquadTab />}
    </Screen>
  );
}

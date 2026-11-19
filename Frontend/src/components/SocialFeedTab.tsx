import React, { useState } from 'react';
import { View, TextInput } from 'react-native-web';
import { useApp } from '../context/AppContext';
import { useSocial } from '../hooks/useSocial';
import type { FeedFilter, FeedTab, Visibility } from '../services/socialService';
import FeedPostCard from './FeedPostCard';
import { Title, Row, Txt, Ring, Post, IconBox, Pill, Card, Btn, c } from '../ui';

// Member 5 · Social → Following and Discover tabs (SCRUM-61).
// Signed in: real posts from Supabase. Signed out: the original demo feed.

const FILTERS: { key: FeedFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'under_500', label: 'Under 500 kcal' },
  { key: 'high_protein', label: 'High Protein' },
  { key: 'campus', label: 'Campus Eats' },
];

const searchStyle = {
  backgroundColor: '#fff',
  borderRadius: 999,
  height: 48,
  paddingHorizontal: 18,
  marginBottom: 12,
  borderWidth: 1,
  borderColor: c.line,
  fontSize: 13,
  outlineStyle: 'none',
} as any;

export default function SocialFeedTab({ tab }: { tab: FeedTab }) {
  const { showToast } = useApp();
  const feed = useSocial(tab);

  const notify = (res: { success: boolean; message: string }) => {
    showToast(res.success ? `✅ ${res.message}` : `⚠️ ${res.message}`);
    return res.success;
  };

  if (!feed.isLive && !feed.loading) return <DemoFeed tab={tab} />;

  const isFollowing = tab === 'following';

  return (
    <>
      {isFollowing ? (
        <Title
          title="Better together."
          sub="A little inspiration from your people."
          right={<IconBox label="↻" onPress={() => void feed.reload()} />}
        />
      ) : (
        <Title
          title="Find your next favourite."
          sub="Fresh ideas, from campus and beyond."
          right={<IconBox label="↻" onPress={() => void feed.reload()} />}
        />
      )}

      {/* Following: progress rings for me and my squad */}
      {isFollowing && feed.people.length > 0 ? (
        <Row style={{ justifyContent: 'space-around', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
          {feed.people.map((p) => (
            <View key={p.user_id} style={{ alignItems: 'center', width: 70 }}>
              <Ring size={56} label={`${p.pct_today}%`} progress={Math.min(p.pct_today, 100) / 100} />
              <Txt s={12} w="700" style={{ marginTop: 6 }} numberOfLines={1}>{p.is_me ? 'You' : p.name}</Txt>
              <Txt s={10} color={c.mute}>today</Txt>
            </View>
          ))}
        </Row>
      ) : null}

      {isFollowing ? <ShareCard onShare={async (caption, v) => notify(await feed.share(caption, v))} /> : null}

      {/* Discover: search and filters */}
      {!isFollowing ? (
        <>
          <TextInput
            placeholder="Search meals, people or campus spots..."
            value={feed.search}
            onChangeText={feed.setSearch}
            style={searchStyle}
          />
          <Row style={{ marginBottom: 14, gap: 6, flexWrap: 'wrap' }}>
            {FILTERS.map((f) => (
              <Pill key={f.key} active={feed.filter === f.key} onPress={() => feed.setFilter(f.key)}>
                {f.label}
              </Pill>
            ))}
          </Row>
        </>
      ) : null}

      {feed.error ? (
        <Card bg={c.red} style={{ marginBottom: 16 }}>
          <Txt w="700">Couldn't load the feed</Txt>
          <Txt s={12} color={c.mute} style={{ marginVertical: 6 }}>{feed.error}</Txt>
          <Pill onPress={() => void feed.reload()}>Try again</Pill>
        </Card>
      ) : null}

      {feed.loading && feed.posts.length === 0 ? <Txt color={c.mute}>Loading posts…</Txt> : null}

      {feed.posts.map((post) => (
        <FeedPostCard
          key={post.post_id}
          post={post}
          onLike={() => void feed.toggleLike(post)}
          onComment={async (text) => notify(await feed.comment(post, text))}
          onFollow={async () => notify(await feed.toggleFollow(post))}
          onVisibility={async (v) => notify(await feed.changeVisibility(post, v))}
        />
      ))}

      {!feed.loading && feed.posts.length === 0 && !feed.error ? (
        <Card bg={c.green} style={{ marginBottom: 16 }}>
          {isFollowing ? (
            <>
              <Txt w="800">Your feed is quiet.</Txt>
              <Txt s={12} color={c.mute} style={{ marginTop: 2 }}>
                Follow people from Discover, or join a squad in Groups, to see their meals here.
              </Txt>
            </>
          ) : (
            <>
              <Txt w="800">No posts match.</Txt>
              <Txt s={12} color={c.mute} style={{ marginTop: 2 }}>Try another search or filter.</Txt>
            </>
          )}
        </Card>
      ) : null}

      {isFollowing && feed.posts.length > 0 ? (
        <View style={{ alignSelf: 'center', marginVertical: 16 }}>
          <Pill bg={c.green}>✓ You're all caught up with your circle</Pill>
        </View>
      ) : null}
    </>
  );
}

// SCRUM-25: share today's progress card, choosing who sees it.
function ShareCard({ onShare }: { onShare: (caption: string, visibility: Visibility) => Promise<boolean> }) {
  const [open, setOpen] = useState(false);
  const [caption, setCaption] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('circle');
  const [busy, setBusy] = useState(false);

  if (!open) {
    return (
      <Card bg={c.yellow} style={{ marginBottom: 16 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Txt w="800">Share today's progress</Txt>
            <Txt s={11} color={c.mute}>Let your squad cheer you on.</Txt>
          </View>
          <Pill bg={c.card} onPress={() => setOpen(true)}>Share card</Pill>
        </Row>
      </Card>
    );
  }

  return (
    <Card bg={c.yellow} style={{ marginBottom: 16 }}>
      <Txt w="800" style={{ marginBottom: 8 }}>Share today's progress</Txt>
      <TextInput
        value={caption}
        onChangeText={setCaption}
        placeholder="Say something (optional)"
        maxLength={200}
        style={{ ...searchStyle, height: 42, marginBottom: 10 }}
      />
      <Txt s={11} color={c.mute} style={{ marginBottom: 6 }}>Who can see it?</Txt>
      <Row style={{ gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        <Pill active={visibility === 'circle'} onPress={() => setVisibility('circle')}>👥 My squad</Pill>
        <Pill active={visibility === 'public'} onPress={() => setVisibility('public')}>🌍 Everyone</Pill>
      </Row>
      <Row style={{ gap: 8 }}>
        <Btn
          bg={c.card}
          style={{ flex: 1 }}
          onPress={() => {
            setOpen(false);
            setCaption('');
          }}
        >
          Cancel
        </Btn>
        <Btn
          bg={c.green}
          style={{ flex: 1 }}
          onPress={async () => {
            if (busy) return;
            setBusy(true);
            const ok = await onShare(caption, visibility);
            setBusy(false);
            if (ok) {
              setOpen(false);
              setCaption('');
            }
          }}
        >
          {busy ? 'Sharing…' : 'Share'}
        </Btn>
      </Row>
    </Card>
  );
}

// The original prototype feed, shown when nobody is signed in.
function DemoFeed({ tab }: { tab: FeedTab }) {
  const { followingPosts, discoverPosts, toggleLikePost, addPostComment, showToast } = useApp();
  const isDiscover = tab === 'discover';
  const posts = isDiscover ? discoverPosts : followingPosts;

  return (
    <>
      <Title
        title={isDiscover ? 'Find your next favourite.' : 'Better together.'}
        sub={isDiscover ? 'Fresh ideas, from campus and beyond.' : 'A little inspiration from your people.'}
        right={<IconBox label="bell" onPress={() => showToast('Sign in to see your own feed')} />}
      />
      <Txt s={12} color={c.mute} style={{ marginBottom: 12 }}>
        Showing demo data. Sign in to see your own feed.
      </Txt>
      {posts.map((post) => (
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
          onLike={() => toggleLikePost(post.id, isDiscover)}
          onAddComment={(text) => addPostComment(post.id, text, isDiscover)}
        />
      ))}
    </>
  );
}

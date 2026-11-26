import React, { useState } from 'react';
import { View, TextInput, Pressable } from 'react-native-web';
import type { FeedPost, Visibility } from '../services/socialService';
import { Row, Txt, Avatar, Pill, Card, Ph, c } from '../ui';

// Member 5 · One post in the Following or Discover feed (SCRUM-64).
// Authors also get the "who can see this" switch (SCRUM-27).

const VISIBILITY_LABEL: Record<Visibility, string> = {
  public: '🌍 Public',
  circle: '👥 Squad',
  private: '🔒 Only me',
};

function timeAgo(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

interface Props {
  post: FeedPost;
  onLike: () => void;
  onComment: (text: string) => Promise<boolean>;
  onFollow: () => void;
  onVisibility: (visibility: Visibility) => void;
}

export default function FeedPostCard({ post, onLike, onComment, onFollow, onVisibility }: Props) {
  const [draft, setDraft] = useState('');
  const [showAllComments, setShowAllComments] = useState(false);
  const [editingVisibility, setEditingVisibility] = useState(false);

  const comments = showAllComments ? post.comments : post.comments.slice(-2);
  const place = [post.location_name || 'Campus spot', timeAgo(post.created_at)].join(' · ');

  const send = async () => {
    if (!draft.trim()) return;
    if (await onComment(draft)) setDraft('');
  };

  return (
    <Card style={{ marginBottom: 16 }}>
      {/* Author */}
      <Row style={{ justifyContent: 'space-between' }}>
        <Row style={{ flex: 1, marginRight: 8 }}>
          {post.author_avatar ? (
            <img
              src={post.author_avatar}
              alt=""
              style={{ width: 36, height: 36, borderRadius: 18, objectFit: 'cover' }}
            />
          ) : (
            <Avatar size={36} label={post.author_name.charAt(0)} />
          )}
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Txt w="700" numberOfLines={1}>
              {post.is_me ? 'You' : post.author_name}
              {post.is_squadmate ? <Txt s={11} color={c.dark}>  · squad</Txt> : null}
            </Txt>
            <Txt s={11} color={c.mute} numberOfLines={1}>{place}</Txt>
          </View>
        </Row>

        {post.is_me ? (
          <Pill onPress={() => setEditingVisibility((v) => !v)}>{VISIBILITY_LABEL[post.visibility]} ▾</Pill>
        ) : (
          <Pill active={!post.is_following} onPress={onFollow}>
            {post.is_following ? 'Following' : '+ Follow'}
          </Pill>
        )}
      </Row>

      {/* Who can see this (author only) */}
      {post.is_me && editingVisibility ? (
        <View style={{ backgroundColor: c.bg, borderRadius: 12, padding: 10, marginTop: 10 }}>
          <Txt s={11} color={c.mute} style={{ marginBottom: 6 }}>Who can see this post?</Txt>
          <Row style={{ gap: 6, flexWrap: 'wrap' }}>
            {(['public', 'circle', 'private'] as Visibility[]).map((v) => (
              <Pill
                key={v}
                active={post.visibility === v}
                onPress={() => {
                  onVisibility(v);
                  setEditingVisibility(false);
                }}
              >
                {VISIBILITY_LABEL[v]}
              </Pill>
            ))}
          </Row>
        </View>
      ) : null}

      {/* Numbers */}
      <Row style={{ justifyContent: 'space-between', marginVertical: 10 }}>
        <Txt s={12} w="700">
          {post.calories ?? 0} kcal
          {post.protein_g ? <Txt s={12} color={c.mute}>  · {Math.round(Number(post.protein_g))}g protein</Txt> : null}
        </Txt>
        <Txt s={11} color={c.mute}>{post.pct_daily_goal ?? 0}% of daily target</Txt>
      </Row>

      {/* Photo */}
      {post.image_url ? (
        <View style={{ width: '100%', height: 200, borderRadius: 16, overflow: 'hidden', backgroundColor: c.block }}>
          <img
            src={post.image_url}
            alt={post.caption || 'Meal photo'}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </View>
      ) : (
        <Ph h={120} r={16} label={post.location_name === 'Daily progress' ? 'DAILY PROGRESS' : 'MEAL PHOTO'} />
      )}

      {/* Likes, streak, caption */}
      <Row style={{ marginTop: 10, justifyContent: 'space-between' }}>
        <Pressable onPress={onLike} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 } as any}>
          <Txt s={14}>{post.liked_by_me ? '❤️' : '🤍'}</Txt>
          <Txt s={12} w="600">{post.like_count} {post.like_count === 1 ? 'like' : 'likes'}</Txt>
        </Pressable>
        <Txt s={12} color={c.mute}>🔥 {post.author_streak}-day streak</Txt>
      </Row>
      {post.caption ? <Txt s={13} style={{ marginVertical: 8 }}>{post.caption}</Txt> : null}

      {/* Comments */}
      {post.comments.length > 2 && !showAllComments ? (
        <Pressable onPress={() => setShowAllComments(true)}>
          <Txt s={11} color={c.mute} style={{ marginBottom: 4 }}>View all {post.comments.length} comments</Txt>
        </Pressable>
      ) : null}
      {comments.map((cm, i) => (
        <Row key={i} style={{ backgroundColor: c.bg, borderRadius: 10, padding: 8, marginBottom: 4 }}>
          <Txt s={11}>
            <Txt s={11} w="700">{cm.author.startsWith('@') ? cm.author : `@${cm.author}`}</Txt>  {cm.content}
          </Txt>
        </Row>
      ))}

      <Row style={{ marginTop: 8, gap: 8 }}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={send}
          placeholder="Add a comment…"
          placeholderTextColor="#94A3B8"
          maxLength={500}
          style={{
            flex: 1,
            backgroundColor: c.bg,
            borderRadius: 999,
            paddingHorizontal: 14,
            paddingVertical: 8,
            fontSize: 12,
            color: c.ink,
            outlineStyle: 'none',
          } as any}
        />
        <Pressable onPress={send} style={{ justifyContent: 'center', paddingHorizontal: 6 }}>
          <Txt s={12} w="700" color={draft.trim() ? c.dark : c.mute}>Post</Txt>
        </Pressable>
      </Row>
    </Card>
  );
}

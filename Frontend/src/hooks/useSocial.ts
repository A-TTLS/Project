import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import {
  addComment,
  getFeed,
  getPeopleToday,
  setFollow,
  setLike,
  setPostVisibility,
  shareDayCard,
  type FeedFilter,
  type FeedPost,
  type FeedTab,
  type PersonToday,
  type Visibility,
} from '../services/socialService';

// Loads one feed tab (Following or Discover) from Supabase.
// isLive is false when nobody is signed in; the screen then shows its demo data.

type Result = { success: boolean; message: string };

export interface SocialState {
  isLive: boolean;
  loading: boolean;
  error: string | null;
  posts: FeedPost[];
  people: PersonToday[];
  search: string;
  filter: FeedFilter;
  setSearch: (text: string) => void;
  setFilter: (filter: FeedFilter) => void;
  reload: () => Promise<void>;
  toggleLike: (post: FeedPost) => Promise<void>;
  comment: (post: FeedPost, text: string) => Promise<Result>;
  toggleFollow: (post: FeedPost) => Promise<Result>;
  changeVisibility: (post: FeedPost, visibility: Visibility) => Promise<Result>;
  share: (caption: string, visibility: Visibility) => Promise<Result>;
}

function readableError(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) return String((err as { message: string }).message);
  return 'Something went wrong. Please try again.';
}

export function useSocial(tab: FeedTab): SocialState {
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [people, setPeople] = useState<PersonToday[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FeedFilter>('all');

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const feed = await getFeed(tab, search, filter);
      if (feed === null) {
        setIsLive(false);
        setPosts([]);
        setPeople([]);
        return;
      }
      setIsLive(true);
      setPosts(feed);
      if (tab === 'following') setPeople(await getPeopleToday());
    } catch (err) {
      setError(readableError(err));
    } finally {
      setLoading(false);
    }
  }, [tab, search, filter]);

  // Reload when the tab, search or filter changes (search waits for typing to pause).
  useEffect(() => {
    const timer = setTimeout(() => void reload(), search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [reload, search]);

  // Reload when the user signs in or out.
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') void reload();
    });
    return () => data.subscription.unsubscribe();
  }, [reload]);

  // Update one post on screen straight away; the server call follows.
  const patch = (postId: string, change: Partial<FeedPost>) =>
    setPosts((prev) => prev.map((p) => (p.post_id === postId ? { ...p, ...change } : p)));

  const toggleLike = useCallback(async (post: FeedPost) => {
    const like = !post.liked_by_me;
    patch(post.post_id, { liked_by_me: like, like_count: post.like_count + (like ? 1 : -1) });
    try {
      await setLike(post.post_id, like);
    } catch {
      patch(post.post_id, { liked_by_me: post.liked_by_me, like_count: post.like_count });
    }
  }, []);

  const comment = useCallback(
    async (post: FeedPost, text: string): Promise<Result> => {
      try {
        await addComment(post.post_id, text);
        await reload();
        return { success: true, message: 'Comment posted!' };
      } catch (err) {
        return { success: false, message: readableError(err) };
      }
    },
    [reload],
  );

  const toggleFollow = useCallback(
    async (post: FeedPost): Promise<Result> => {
      const follow = !post.is_following;
      try {
        await setFollow(post.author_id, follow);
        // The same author may have several posts on screen.
        setPosts((prev) => prev.map((p) => (p.author_id === post.author_id ? { ...p, is_following: follow } : p)));
        if (tab === 'following' && !follow) await reload();
        return { success: true, message: follow ? `Following ${post.author_name}` : `Unfollowed ${post.author_name}` };
      } catch (err) {
        return { success: false, message: readableError(err) };
      }
    },
    [tab, reload],
  );

  const changeVisibility = useCallback(
    async (post: FeedPost, visibility: Visibility): Promise<Result> => {
      try {
        await setPostVisibility(post.post_id, visibility);
        patch(post.post_id, { visibility });
        const who = visibility === 'public' ? 'everyone' : visibility === 'circle' ? 'your squad' : 'only you';
        return { success: true, message: `Now visible to ${who}` };
      } catch (err) {
        return { success: false, message: readableError(err) };
      }
    },
    [],
  );

  const share = useCallback(
    async (caption: string, visibility: Visibility): Promise<Result> => {
      try {
        await shareDayCard(caption, visibility);
        await reload();
        return { success: true, message: 'Shared your progress card!' };
      } catch (err) {
        return { success: false, message: readableError(err) };
      }
    },
    [reload],
  );

  return {
    isLive,
    loading,
    error,
    posts,
    people,
    search,
    filter,
    setSearch,
    setFilter,
    reload,
    toggleLike,
    comment,
    toggleFollow,
    changeVisibility,
    share,
  };
}

'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const AuthContext = createContext(null);

function getFavKey(mediaType, itemId) {
  return `${mediaType}:${itemId}`;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) return;
      if (error) console.error(error);
      setUser(data?.session?.user ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setFavorites([]);
      return;
    }

    let isMounted = true;
    setFavoritesLoading(true);

    supabase
      .from('favorites')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (error) {
          console.error(error);
          setFavorites([]);
          return;
        }
        setFavorites(data ?? []);
      })
      .finally(() => {
        if (!isMounted) return;
        setFavoritesLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  const favoritesKeySet = useMemo(() => {
    const set = new Set();
    for (const f of favorites) {
      set.add(getFavKey(f.media_type, f.item_id));
    }
    return set;
  }, [favorites]);

  const isFavorited = (mediaType, itemId) => favoritesKeySet.has(getFavKey(mediaType, itemId));

  const toggleFavorite = async ({ mediaType, item }) => {
    const itemId = item?.id;
    if (!itemId) return;

    const title = item?.title || item?.name;
    const poster_path = item?.poster_path ?? null;
    const vote_average = typeof item?.vote_average === 'number' ? item.vote_average : null;
    const release_date = item?.release_date || item?.first_air_date || null;

    if (!user) {
      throw new Error('NOT_AUTHENTICATED');
    }

    const key = getFavKey(mediaType, itemId);
    const currentlyFavorited = favoritesKeySet.has(key);

    if (currentlyFavorited) {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .match({ user_id: user.id, item_id: itemId, media_type: mediaType });

      if (error) throw error;

      setFavorites((prev) => prev.filter((f) => !(f.item_id === itemId && f.media_type === mediaType)));
      return;
    }

    const insertRow = {
      user_id: user.id,
      item_id: itemId,
      media_type: mediaType,
      title,
      poster_path,
      vote_average,
      release_date,
    };

    const { data, error } = await supabase
      .from('favorites')
      .upsert(insertRow, { onConflict: 'user_id,item_id' })
      .select('*')
      .single();

    if (error) throw error;

    setFavorites((prev) => {
      const next = [data, ...prev.filter((f) => !(f.item_id === itemId && f.media_type === mediaType))];
      return next;
    });
  };

  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signUp = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      favorites,
      favoritesLoading,
      isFavorited,
      toggleFavorite,
      signIn,
      signUp,
      signOut,
    }),
    [user, loading, favorites, favoritesLoading, favoritesKeySet]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

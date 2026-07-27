import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile row from public.profiles, creating it if it doesn't exist
  const fetchProfile = async (userId, currentUserObject) => {
    if (!userId) {
      setProfile(null);
      setRole(null);
      setAvatarUrl(null);
      return null;
    }
    try {
      // 1. Try to fetch existing profile
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      // 2. If profile doesn't exist, create it (PART 3)
      if (!data) {
        console.log('Profile row does not exist, creating one for user:', userId);
        const userMeta = currentUserObject?.user_metadata || {};
        const newProfile = {
          id: userId,
          email: currentUserObject?.email || '',
          full_name: userMeta.full_name || '',
          phone: '',
          avatar_url: null,
          role: 'user',
          status: 'active'
        };

        const { data: insertedData, error: insertError } = await supabase
          .from('profiles')
          .insert([newProfile])
          .select()
          .single();

        if (insertError) {
          console.error('Error inserting new user profile:', insertError);
          // Retry fetching in case of concurrency
          const { data: retryData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
          if (retryData) {
            data = retryData;
          } else {
            throw insertError;
          }
        } else {
          data = insertedData;
        }
      }

      setProfile(data);
      setRole(data?.role || 'user');
      setAvatarUrl(data?.avatar_url || null);
      return data;
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
      setProfile(null);
      setRole(null);
      setAvatarUrl(null);
      return null;
    }
  };

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.id, currentUser);
      }
      setLoading(false);
    });

    // 2. Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.id, currentUser);
      } else {
        setProfile(null);
        setRole(null);
        setAvatarUrl(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async ({ email, password, fullName, phone }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone
        }
      }
    });
    if (error) throw error;
    return data;
  };

  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    if (data.user) {
      await fetchProfile(data.user.id, data.user);
    }
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setProfile(null);
    setRole(null);
    setAvatarUrl(null);
  };

  const refreshProfile = async () => {
    if (user?.id) {
      return await fetchProfile(user.id, user);
    }
  };

  const refreshAvatar = (url) => {
    setAvatarUrl(url);
    setProfile(prev => prev ? { ...prev, avatar_url: url } : null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        avatarUrl,
        loading,
        signUp,
        signIn,
        signOut,
        refreshProfile,
        refreshAvatar
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

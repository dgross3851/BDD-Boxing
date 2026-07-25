import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  // Download avatar from storage as a blob
  const downloadAvatar = async (path) => {
    if (!path) {
      setAvatarUrl(prevUrl => {
        if (prevUrl) URL.revokeObjectURL(prevUrl);
        return null;
      });
      return;
    }
    try {
      const { data, error } = await supabase.storage
        .from('avatars')
        .download(path);
      
      if (error) throw error;
      
      const newUrl = URL.createObjectURL(data);
      setAvatarUrl(prevUrl => {
        if (prevUrl) URL.revokeObjectURL(prevUrl);
        return newUrl;
      });
    } catch (err) {
      console.error('Error downloading avatar:', err);
      setAvatarUrl(prevUrl => {
        if (prevUrl) URL.revokeObjectURL(prevUrl);
        return null;
      });
    }
  };

  // Fetch profile row from public.profiles
  const fetchProfile = async (userId) => {
    if (!userId) {
      setProfile(null);
      setRole(null);
      setAvatarUrl(prevUrl => {
        if (prevUrl) URL.revokeObjectURL(prevUrl);
        return null;
      });
      return null;
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        setProfile(null);
        setRole(null);
        setAvatarUrl(prevUrl => {
          if (prevUrl) URL.revokeObjectURL(prevUrl);
          return null;
        });
        return null;
      }
      setProfile(data);
      setRole(data?.role || 'user');

      if (data?.avatar_url) {
        await downloadAvatar(data.avatar_url);
      } else {
        setAvatarUrl(prevUrl => {
          if (prevUrl) URL.revokeObjectURL(prevUrl);
          return null;
        });
      }
      return data;
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
      return null;
    }
  };

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.id);
      }
      setLoading(false);
    });

    // 2. Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.id);
      } else {
        setProfile(null);
        setRole(null);
        setAvatarUrl(prevUrl => {
          if (prevUrl) URL.revokeObjectURL(prevUrl);
          return null;
        });
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
      await fetchProfile(data.user.id);
    }
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setProfile(null);
    setRole(null);
    setAvatarUrl(prevUrl => {
      if (prevUrl) URL.revokeObjectURL(prevUrl);
      return null;
    });
  };

  const refreshProfile = async () => {
    if (user?.id) {
      return await fetchProfile(user.id);
    }
  };

  const refreshAvatar = async (path) => {
    await downloadAvatar(path);
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

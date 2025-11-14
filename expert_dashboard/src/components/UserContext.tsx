"use client";

import { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from 'react';
import { supabase } from './supabase';
import { UserProfile, User, UserContextType } from '../types';

const SUPPRESS_AUTH_TOAST_KEY = 'bs:suppress-auth-toast';

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const initialResolved = useRef(false);
  const isMountedRef = useRef(true);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileData) {
        setProfile(profileData);
        return;
      }

      if (profileError?.code === 'PGRST116') {
        // Profile intentionally missing (not created yet)
        setProfile(null);
        return;
      }

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        setProfile(null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [fetchProfile, user]);

  const resolveSession = useCallback(
    async (sessionUser: User | null) => {
      if (!isMountedRef.current) return;
      setUser(sessionUser);

      if (sessionUser) {
        await fetchProfile(sessionUser.id);
      } else {
        setProfile(null);
      }
    },
    [fetchProfile]
  );

  const logout = useCallback(async () => {
    // Immediately clear local state for instant UI response
    setUser(null);
    setProfile(null);

    if (typeof window !== 'undefined') {
      sessionStorage.setItem(SUPPRESS_AUTH_TOAST_KEY, 'true');
    }

    try {
      await supabase.auth.signOut();
    } catch {
      // No-op: auth state listener will keep things consistent
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    const getInitialSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        await resolveSession(session?.user ?? null);
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
          initialResolved.current = true;
        }
      }
    };

    getInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMountedRef.current) return;

      const shouldShowSpinner = !initialResolved.current;
      if (shouldShowSpinner) {
        setLoading(true);
      }

      try {
        await resolveSession(session?.user ?? null);
      } catch (error) {
        console.error('Error in auth state change:', error);
      } finally {
        if (isMountedRef.current) {
          if (shouldShowSpinner) {
            setLoading(false);
          }
          initialResolved.current = true;
        }
      }
    });

    return () => {
      isMountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [resolveSession]);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        await resolveSession(session?.user ?? null);
      } catch (error) {
        console.error('Error refreshing session on visibility change:', error);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [resolveSession]);

  return (
    <UserContext.Provider value={{ user, profile, loading, refreshProfile, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

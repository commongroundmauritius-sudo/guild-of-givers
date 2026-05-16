import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, type AppRole } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  country: string | null;
  address: string | null;
  bio: string | null;
  age: number | null;
  status: string | null;
  ngo_id: string | null;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  profile: Profile | null;
  isSubscribed: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    metadata?: Record<string, unknown>,
  ) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchAuthData = useCallback(async (userId: string) => {
    try {
      const [roleRes, profileRes, subRes] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase
          .from("subscriptions")
          .select("status")
          .eq("user_id", userId)
          .eq("status", "active")
          .maybeSingle(),
      ]);

      if (roleRes.data) setRole(roleRes.data.role as AppRole);
      else setRole("member");

      if (profileRes.data) setProfile(profileRes.data as Profile);
      else setProfile(null);

      setIsSubscribed(!!subRes.data);
    } catch (error) {
      console.error("Error fetching auth data:", error);
    }
  }, []);

  const refreshAuth = useCallback(async () => {
    try {
      setLoading(true);
      const {
        data: { session: s },
      } = await supabase.auth.getSession();

      setSession(s);
      setUser(s?.user ?? null);

      if (s?.user) {
        await fetchAuthData(s.user.id);
      } else {
        setRole(null);
        setProfile(null);
        setIsSubscribed(false);
      }
    } catch (error) {
      console.error("refreshAuth error:", error);
    } finally {
      setLoading(false);
    }
  }, [fetchAuthData]);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        setLoading(true);
        try {
          await fetchAuthData(newSession.user.id);
        } finally {
          setLoading(false);
        }
      } else {
        setRole(null);
        setProfile(null);
        setIsSubscribed(false);
        setLoading(false);
      }
    });

    refreshAuth();

    return () => sub.subscription.unsubscribe();
  }, [fetchAuthData, refreshAuth]);

  const value: AuthContextValue = {
    user,
    session,
    role,
    profile,
    isSubscribed,
    loading,
    signIn: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    },
    signUp: async (email, password, metadata) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            typeof window !== "undefined" ? `${window.location.origin}/dashboard` : undefined,
          data: metadata,
        },
      });
      return { error };
    },
    signInWithGoogle: async () => {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo:
            typeof window !== "undefined" ? `${window.location.origin}/dashboard` : undefined,
        },
      });
    },
    signOut: async () => {
      try {
        await supabase.auth.signOut();
      } catch (error) {
        console.error("Supabase signOut error:", error);
      } finally {
        // Purge all cached data
        queryClient.clear();
        // Explicitly clear state for immediate UI update
        setUser(null);
        setSession(null);
        setRole(null);
        setProfile(null);
        setIsSubscribed(false);
        setLoading(false);
      }
    },
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

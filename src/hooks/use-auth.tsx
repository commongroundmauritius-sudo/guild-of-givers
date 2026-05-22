import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, type AppRole } from "@/integrations/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";

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
  organization_id: string | null;
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
  ) => Promise<{ error: any | null; data?: any }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Use React Query for auth data to get better caching and stale-while-revalidate behavior
  const { data: authData } = useQuery({
    queryKey: ["auth-data", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const [roleRes, profileRes, subRes] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle(),
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase
          .from("subscriptions")
          .select("status")
          .eq("user_id", user.id)
          .eq("status", "active")
          .maybeSingle(),
      ]);

      return {
        role: (roleRes.data?.role as AppRole) ?? "member",
        profile: profileRes.data as Profile | null,
        isSubscribed: !!subRes.data,
      };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false, // Prevent focus-triggered full reloads
  });

  const refreshAuth = useCallback(async () => {
    try {
      const {
        data: { session: s },
      } = await supabase.auth.getSession();

      setSession(s);
      setUser(s?.user ?? null);

      if (s?.user?.id) {
        await queryClient.invalidateQueries({ queryKey: ["auth-data", s.user.id] });
      }
    } catch (error) {
      console.error("refreshAuth error:", error);
    } finally {
      setLoading(false);
    }
  }, [queryClient]);

  useEffect(() => {
    // Initial session fetch
    refreshAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);

      if (_event === "SIGNED_OUT") {
        queryClient.clear();
      }
    });

    return () => subscription.unsubscribe();
  }, [refreshAuth, queryClient]);

  const value: AuthContextValue = {
    user,
    session,
    role: authData?.role ?? null,
    profile: authData?.profile ?? null,
    isSubscribed: authData?.isSubscribed ?? false,
    loading,
    signIn: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error, data };
    },
    signUp: async (email, password, metadata) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            typeof window !== "undefined" ? `${window.location.origin}/dashboard` : undefined,
          data: metadata,
        },
      });
      return { error, data };
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
        // queryClient.clear() is handled in onAuthStateChange SIGNED_OUT
        setUser(null);
        setSession(null);
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

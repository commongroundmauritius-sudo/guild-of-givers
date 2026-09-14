import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, type AppRole } from "@/integrations/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { isMockPaymentsEnabled } from "@/lib/payments/mock-provider";

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
  sessionReady: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<{ error: Error | null; data?: any }>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  const resolvePrimaryRole = (roles: Array<{ role: AppRole }> | null | undefined): AppRole | null => {
    const roleValues = new Set((roles ?? []).map((item) => item.role));
    if (roleValues.has("super_admin")) return "super_admin";
    if (roleValues.has("admin")) return "admin";
    if (roleValues.has("organization")) return "organization";
    if (roleValues.has("ngo")) return "ngo";
    if (roleValues.has("member")) return "member";
    return null;
  };

  const { data: authData, isLoading: authDataLoading } = useQuery({
    queryKey: ["auth-data", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const [roleRes, profileRes, subRes] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", user.id),
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("subscriptions").select("status").eq("user_id", user.id).eq("status", "active").maybeSingle(),
      ]);
      return {
        role: resolvePrimaryRole(roleRes.data as Array<{ role: AppRole }> | null),
        profile: profileRes.data as Profile | null,
        isSubscribed: !!subRes.data,
      };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const refreshAuth = useCallback(async () => {
    try {
      const sessionResult = await Promise.race([
        supabase.auth.getSession(),
        new Promise<never>((_, reject) => window.setTimeout(() => reject(new Error("AUTH_SESSION_TIMEOUT")), 5000)),
      ]);
      const { data: { session: s } } = sessionResult;
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user?.id) await queryClient.invalidateQueries({ queryKey: ["auth-data", s.user.id] });
    } catch (error) {
      console.error("refreshAuth error:", error);
      setSession(null);
      setUser(null);
    } finally {
      setSessionLoading(false);
    }
  }, [queryClient]);

  useEffect(() => {
    refreshAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setSessionLoading(false);
      if (_event === "SIGNED_OUT") queryClient.clear();
    });
    return () => subscription.unsubscribe();
  }, [refreshAuth, queryClient]);

  const loading = sessionLoading || (!!user && authDataLoading);

  const value: AuthContextValue = {
    user,
    session,
    role: authData?.role ?? null,
    profile: authData?.profile ?? null,
    isSubscribed: authData?.isSubscribed ?? false,
    loading,
    sessionReady: !sessionLoading,
    signIn: async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      return { error, data } as { error: Error | null };
    },
    signUp: async (email, password, metadata) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/dashboard` : undefined, data: metadata },
      });

      if (!error && isMockPaymentsEnabled() && metadata?.role === "member" && Number(metadata?.subscription_amount) >= 167) {
        if (!data?.session) {
          return { error: new Error("Your account was created, but the mock membership could not be finalized because no active session was returned."), data };
        }

        const transactionId = typeof metadata.mock_transaction_id === "string" && metadata.mock_transaction_id.startsWith("mock_txn_")
          ? metadata.mock_transaction_id
          : `mock_txn_${Math.random().toString(36).slice(2, 11)}`;
        const { error: finalizeError } = await supabase.rpc("dev_complete_mock_membership", {
          p_amount_mur: Number(metadata.subscription_amount),
          p_billing_date: 7,
          p_covers_fees: Boolean(metadata.covers_fees),
          p_transaction_id: transactionId,
          p_priority_initiatives: metadata.source_initiative_id ? [metadata.source_initiative_id] : [],
        } as any);
        if (finalizeError) return { error: new Error(finalizeError.message), data };
      }
      return { error, data };
    },
    resetPassword: async (email) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined });
      return { error } as { error: Error | null };
    },
    updatePassword: async (password) => {
      const { error } = await supabase.auth.updateUser({ password });
      return { error } as { error: Error | null };
    },
    signInWithGoogle: async () => {
      await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: typeof window !== "undefined" ? `${window.location.origin}/dashboard` : undefined } });
    },
    signOut: async () => {
      try { await supabase.auth.signOut(); } catch (error) { console.error("Supabase signOut error:", error); }
      finally { setUser(null); setSession(null); setSessionLoading(false); }
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
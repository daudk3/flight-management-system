import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const fetchRole = useCallback(async (userId) => {
    if (!userId) {
      setRole(null);
      return null;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Failed to load profile role", error);
      setRole(null);
      return null;
    }

    const nextRole = data?.role ?? null;
    setRole(nextRole);
    return nextRole;
  }, []);

  const syncSession = useCallback(
    async (session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);

      if (nextUser?.id) {
        await fetchRole(nextUser.id);
      } else {
        setRole(null);
      }

      setInitializing(false);
    },
    [fetchRole],
  );

  useEffect(() => {
    let isMounted = true;

    async function init() {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Failed to get auth session", error);
      }

      if (isMounted) {
        await syncSession(data?.session ?? null);
      }
    }

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      syncSession(session);
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [syncSession]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setRole(null);
    }
    return { error };
  }, []);

  const signIn = useCallback(
    async ({ email, password }) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      const signedInUser = data?.user ?? data?.session?.user ?? null;

      if (!signedInUser?.id) {
        return {
          error: new Error("Unable to resolve your profile. Please try again."),
        };
      }

      const fetchedRole = await fetchRole(signedInUser.id);

      if (!fetchedRole) {
        await supabase.auth.signOut();
        return {
          error: new Error(
            "No role assigned to this account yet. Contact your administrator.",
          ),
        };
      }

      return { error: null };
    },
    [fetchRole],
  );

  const value = useMemo(
    () => ({
      user,
      role,
      loading: initializing,
      signIn,
      signOut,
    }),
    [initializing, role, signIn, signOut, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

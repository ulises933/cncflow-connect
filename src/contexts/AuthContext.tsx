import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: { id: string; nombre: string; email: string; rol: string; activo: boolean } | null;
  userRoles: string[];
  allowedModules: string[];
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null, session: null, profile: null, userRoles: [], allowedModules: [],
  loading: true, isAdmin: false, signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthContextType["profile"]>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [allowedModules, setAllowedModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (userId: string) => {
    try {
      const [profileRes, rolesRes, modulesRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
        supabase.rpc("get_user_modules", { _user_id: userId }),
      ]);

      if (profileRes.data) setProfile(profileRes.data as any);
      if (rolesRes.data) setUserRoles(rolesRes.data.map((r: any) => r.role));
      if (modulesRes.data) setAllowedModules((modulesRes.data as any[]).map((m: any) => m.module_key));
    } catch (err) {
      console.error("Error fetching user data:", err);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => fetchUserData(session.user.id), 0);
      } else {
        setProfile(null);
        setUserRoles([]);
        setAllowedModules([]);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchUserData(session.user.id);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setUserRoles([]);
    setAllowedModules([]);
  };

  const isAdmin = userRoles.includes("admin");

  return (
    <AuthContext.Provider value={{ user, session, profile, userRoles, allowedModules, loading, isAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

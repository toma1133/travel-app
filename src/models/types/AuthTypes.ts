import { Session } from "@supabase/supabase-js";

export interface AuthContextType {
    session: Session | null;
    loading: boolean;
    signInWithPassword: (email: string, password: string) => Promise<void>,
    signOut: () => Promise<void>;
}

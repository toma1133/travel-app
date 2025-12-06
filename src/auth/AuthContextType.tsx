import { Session } from "@supabase/supabase-js";

export default interface AuthContextType {
    session: Session | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

import { ReactNode, useEffect, useState } from "react";
import { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { supabaseClient } from "../services/SupabaseClient";
import AuthContext from "../contexts/AuthContext";

const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabaseClient.auth.getSession().then(({ data }) => {
            setSession(data.session);
            setLoading(false);
        });
        const {
            data: { subscription },
        } = supabaseClient.auth.onAuthStateChange(
            (_event: AuthChangeEvent, session: Session | null) => {
                setSession(session);
                setLoading(false);
            }
        );
        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        setLoading(true);
        await supabaseClient.auth.signOut();
        setSession(null);
        setLoading(false);
    };

    return (
        <AuthContext.Provider value={{ session, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;

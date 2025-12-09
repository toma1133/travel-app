import { ReactNode, useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabaseClient } from "../../services/SupabaseClient";
import AuthContext from "../../contexts/AuthContext";

const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        supabaseClient.auth.getSession().then(({ data }) => {
            if (!mounted) return;
            setSession(data.session);
            setLoading(false);
        });

        const { data: authListener } = supabaseClient.auth.onAuthStateChange(
            (_event, newSession) => {
                setSession(newSession);
            }
        );

        const onStorage = (e: StorageEvent) => {
            if (e.key === "supabase.auth.token") {
                supabaseClient.auth
                    .getSession()
                    .then(({ data }) => setSession(data.session));
            }
        };
        window.addEventListener("storage", onStorage);

        const onVisible = () => {
            if (document.visibilityState === "visible") {
                supabaseClient.auth
                    .getSession()
                    .then(({ data }) => setSession(data.session));
            }
        };
        document.addEventListener("visibilitychange", onVisible);

        return () => {
            mounted = false;
            authListener?.subscription.unsubscribe();
            window.removeEventListener("storage", onStorage);
            document.removeEventListener("visibilitychange", onVisible);
        };
    }, []);

    const signInWithPassword = async (email: string, password: string) => {
        setLoading(true);

        const { error } = await supabaseClient.auth.signInWithPassword({
            email,
            password,
        });

        setLoading(false);

        if (error) throw error;
    };

    const signOut = async () => {
        setLoading(true);

        await supabaseClient.auth.signOut();

        setSession(null);
        setLoading(false);
    };

    return (
        <AuthContext.Provider
            value={{ session, loading, signInWithPassword, signOut }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;

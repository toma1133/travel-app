import {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from "react";
import AuthContext from "./AuthContext";
import { supabase } from "../db/supabase";

const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data }: any) => {
            setSession(data.session);
            setLoading(false);
        });
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
            setSession(session);
            setLoading(false);
        });
        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        setLoading(true);
        await supabase.auth.signOut();
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

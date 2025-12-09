import { createContext } from "react";
import { AuthContextType } from "../models/types/AuthTypes";

const AuthContext = createContext<AuthContextType>({
    session: null,
    loading: true,
    signInWithPassword: async () => { },
    signOut: async () => { },
});

export default AuthContext;

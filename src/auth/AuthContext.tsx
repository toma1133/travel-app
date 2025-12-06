import { createContext } from "react";
import AuthContextType from "./AuthContextType";

const AuthContext = createContext<AuthContextType>({
    session: null,
    loading: true,
    signOut: async () => {},
});

export default AuthContext;

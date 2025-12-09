import { useEffect, useState } from "react";
import AuthProvider from "./providers/AuthProvider";
import AppContent from "./AppContent";

const App = () => {
    const [isOffline, setIsOffline] = useState(() => {
        if (typeof navigator === "undefined") return false;
        return !navigator.onLine;
    });

    useEffect(() => {
        const handleStatusChange = () => setIsOffline(!navigator.onLine);

        window.addEventListener("online", handleStatusChange);
        window.addEventListener("offline", handleStatusChange);

        return () => {
            window.removeEventListener("online", handleStatusChange);
            window.removeEventListener("offline", handleStatusChange);
        };
    }, []);

    return (
        <AuthProvider>
            <AppContent isOffline={isOffline} />
        </AuthProvider>
    );
};

export default App;

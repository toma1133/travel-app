import AuthProvider from "./auth/AuthProvider";
import AppContent from "./AppContent";

const App = () => {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
};

export default App;

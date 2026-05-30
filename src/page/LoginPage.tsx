import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabaseClient } from "../services/SupabaseClient";
import LoadingMask from "../components/common/LoadingMask";

const LoginPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const returnTo =
        (location.state as { returnTo?: string })?.returnTo ?? "/trip";

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        setLoading(true);
        setError("");

        const { error } = await supabaseClient.auth.signInWithPassword({
            email,
            password,
        });

        setLoading(false);

        if (error) {
            setError(error.message);
        } else {
            navigate(returnTo, { replace: true });
        }
    };

    if (loading) return <LoadingMask />;

    return (
        <div className="flex min-h-screen items-center justify-center bg-background transition-colors duration-300">
            <div className="w-full max-w-sm rounded-2xl bg-card p-8 shadow-xl border border-border">
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-bold text-foreground tracking-tight mb-2">Welcome Back</h1>
                    <p className="text-sm text-muted-foreground">
                        請登入以存取您的行程
                    </p>
                </div>

                {error && (
                    <div className="mb-6 rounded-lg bg-destructive/10 p-3 text-destructive text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-foreground/80">
                            Email
                        </label>
                        <input
                            type="email"
                            required
                            className="block w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground shadow-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@example.com"
                            autoComplete="email"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-foreground/80">
                            密碼
                        </label>
                        <input
                            type="password"
                            required
                            className="block w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground shadow-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-primary px-4 py-2.5 text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors mt-2 shadow-sm"
                    >
                        {loading ? "登入中..." : "登入"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;

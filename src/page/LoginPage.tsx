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
        <div className="flex min-h-screen items-center justify-center bg-[#F2F2F0]">
            <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg border border-[#E5E7EB]">
                <p className="mb-6 text-center text-[#4B5563]">
                    請登入以存取您的行程
                </p>

                {error && (
                    <div className="mb-4 rounded bg-red-100 p-3 text-red-600 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[#4B5563]">
                            Email
                        </label>
                        <input
                            type="email"
                            required
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#9F1239] focus:outline-none focus:ring-1 focus:ring-[#9F1239]"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="xxx@test.com"
                            autoComplete="on"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#4B5563]">
                            密碼
                        </label>
                        <input
                            type="password"
                            required
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#9F1239] focus:outline-none focus:ring-1 focus:ring-[#9F1239]"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="****"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-md bg-[#9F1239] px-4 py-2 text-white hover:bg-[#881337] disabled:opacity-50 transition-colors"
                    >
                        {loading ? "登入中..." : "登入"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;

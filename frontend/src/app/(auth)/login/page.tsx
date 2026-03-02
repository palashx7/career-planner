"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogIn, Loader2, ArrowLeft } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/store";

export default function LoginPage() {
    const router = useRouter();
    const setAuth = useAuthStore((state) => state.setAuth);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit } = useForm();

    const onSubmit = async (data: any) => {
        setIsLoading(true);
        setError("");

        try {
            // FastAPI OAuth2PasswordRequestForm expects form-data format
            const formData = new URLSearchParams();
            formData.append("username", data.email);
            formData.append("password", data.password);

            const response = await api.post("/auth/login", formData, {
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
            });

            const token = response.data.access_token;

            // We don't have a /me route yet, but we have the token holding the role.
            // For now, we trust the token and store it.
            setAuth(token, { id: 0, email: data.email, role: "student" });

            // Send them to the dashboard
            router.push("/dashboard");

        } catch (err: any) {
            setError(
                err.response?.data?.detail || "Invalid email or password. Please try again."
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 relative">
            <div className="absolute top-0 left-0 w-full h-full bg-blue-900/10 blur-[150px] pointer-events-none" />

            <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors duration-200">
                <ArrowLeft className="h-4 w-4" /> Back Home
            </Link>

            <div className="glass-panel w-full max-w-md p-8 relative z-10">
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="h-12 w-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4 border border-blue-500/30">
                        <LogIn className="h-6 w-6 text-blue-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
                    <p className="text-slate-400 text-sm mt-2">Log in to view your career roadmap</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-500 rounded-lg p-3 text-sm mb-6 text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                        <input
                            type="email"
                            {...register("email", { required: true })}
                            className="input-field"
                            placeholder="you@university.edu"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                        <input
                            type="password"
                            {...register("password", { required: true })}
                            className="input-field"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-primary mt-4 flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In"}
                    </button>
                </form>

                <p className="text-center text-slate-400 text-sm mt-6">
                    Don't have an account?{" "}
                    <Link href="/register" className="text-blue-400 hover:text-blue-300 font-medium">
                        Create one
                    </Link>
                </p>
            </div>
        </div>
    );
}

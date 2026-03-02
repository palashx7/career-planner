"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, Loader2, ArrowLeft } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/store";

export default function AdminLoginPage() {
    const router = useRouter();
    const setAuth = useAuthStore((state) => state.setAuth);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit } = useForm();

    const onSubmit = async (data: any) => {
        setIsLoading(true);
        setError("");

        try {
            const formData = new URLSearchParams();
            formData.append("username", data.email);
            formData.append("password", data.password);

            // Hit the dedicated admin entry point
            const response = await api.post("/auth/admin-login", formData, {
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
            });

            const token = response.data.access_token;

            // Store token and strict admin role
            setAuth(token, { id: 0, email: data.email, role: "admin" });

            // Send them to the admin portal
            router.push("/admin/dashboard");

        } catch (err: any) {
            setError(
                err.response?.data?.detail || "Invalid admin credentials or lack of permissions."
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 relative">
            <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-emerald-900/10 blur-[150px] pointer-events-none" />

            <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors duration-200">
                <ArrowLeft className="h-4 w-4" /> Back Home
            </Link>

            <div className="glass-panel w-full max-w-md p-8 relative z-10 border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.05)]">
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="h-12 w-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4 border border-emerald-500/50">
                        <ShieldAlert className="h-6 w-6 text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">University Portal</h2>
                    <p className="text-emerald-400/80 text-sm mt-2">Authorized Staff Only</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-500 rounded-lg p-3 text-sm mb-6 text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Staff Email</label>
                        <input
                            type="email"
                            {...register("email", { required: true })}
                            className="input-field border-emerald-900/50 focus:ring-emerald-500/50 focus:border-emerald-500"
                            placeholder="admin@university.edu"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                        <input
                            type="password"
                            {...register("password", { required: true })}
                            className="input-field border-emerald-900/50 focus:ring-emerald-500/50 focus:border-emerald-500"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-primary mt-4 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]"
                    >
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Secure Login"}
                    </button>
                </form>
            </div>
        </div>
    );
}

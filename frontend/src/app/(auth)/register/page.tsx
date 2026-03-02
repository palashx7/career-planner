"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus, Loader2, ArrowLeft, MailCheck } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/store";

export default function RegisterPage() {
    const router = useRouter();
    const setAuth = useAuthStore((state) => state.setAuth);

    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // OTP State
    const [awaitingOTP, setAwaitingOTP] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState("");
    const [otp, setOtp] = useState("");

    const { register, handleSubmit, watch } = useForm({
        defaultValues: {
            is_college_student: false,
            email: "",
            password: "",
            full_name: "",
            base_country: "",
            college_name: ""
        }
    });

    const isCollege = watch("is_college_student");

    const onSubmit = async (data: any) => {
        setIsLoading(true);
        setError("");

        try {
            // 1. Register User
            await api.post("/auth/register", {
                email: data.email,
                password: data.password,
                full_name: data.full_name,
                base_country: data.base_country,
                is_college_student: data.is_college_student,
                college_name: data.college_name || null
            });

            // 2. Handle Routing based on College Tie-up
            if (data.is_college_student) {
                setRegisteredEmail(data.email);
                setAwaitingOTP(true);
            } else {
                // Normal users are verified immediately. Let's redirect to login.
                router.push("/login?registered=true");
            }

        } catch (err: any) {
            setError(
                err.response?.data?.detail || "Registration failed. Please try again."
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const response = await api.post("/auth/verify-otp", {
                email: registeredEmail,
                code: otp
            });

            const token = response.data.access_token;
            setAuth(token, { id: 0, email: registeredEmail, role: "student" });
            router.push("/dashboard");

        } catch (err: any) {
            setError(err.response?.data?.detail || "Invalid OTP code.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 relative overflow-y-auto">
            <div className="absolute top-0 right-0 w-full h-full bg-emerald-900/10 blur-[150px] pointer-events-none" />

            <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors duration-200">
                <ArrowLeft className="h-4 w-4" /> Back Home
            </Link>

            <div className="glass-panel w-full max-w-md p-8 relative z-10 my-12">

                {/* Registration Form */}
                {!awaitingOTP ? (
                    <>
                        <div className="flex flex-col items-center text-center mb-8">
                            <div className="h-12 w-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4 border border-emerald-500/30">
                                <UserPlus className="h-6 w-6 text-emerald-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Create Account</h2>
                            <p className="text-slate-400 text-sm mt-2">Start your AI-powered career journey</p>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 text-red-500 rounded-lg p-3 text-sm mb-6 text-center">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    {...register("full_name", { required: true })}
                                    className="input-field"
                                    placeholder="John Doe"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                                <input
                                    type="email"
                                    {...register("email", { required: true })}
                                    className="input-field"
                                    placeholder="name@university.edu"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                                <input
                                    type="password"
                                    {...register("password", { required: true, minLength: 6 })}
                                    className="input-field"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Country</label>
                                <input
                                    type="text"
                                    {...register("base_country", { required: true })}
                                    className="input-field"
                                    placeholder="United States"
                                    required
                                />
                            </div>

                            {/* College Tie-Up Checkbox */}
                            <div className="flex items-center gap-3 p-4 border border-slate-700/50 bg-slate-800/20 rounded-xl mt-2">
                                <input
                                    type="checkbox"
                                    id="college_student"
                                    {...register("is_college_student")}
                                    className="h-5 w-5 rounded border-slate-600 bg-slate-900 text-blue-500 focus:ring-blue-500/50"
                                />
                                <label htmlFor="college_student" className="text-sm font-medium text-slate-300 cursor-pointer">
                                    I am registering via a partner University
                                </label>
                            </div>

                            {/* Conditional College Name */}
                            {isCollege && (
                                <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                                    <label className="block text-sm font-medium text-slate-300 mb-1">University Name</label>
                                    <input
                                        type="text"
                                        {...register("college_name", { required: true })}
                                        className="input-field border-blue-500/30 bg-blue-900/10"
                                        placeholder="Harvard University"
                                        required
                                    />
                                    <p className="text-xs text-slate-400 mt-2">
                                        Note: A verification code will be sent to your email to confirm your university status.
                                    </p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="btn-primary mt-4 flex items-center justify-center gap-2"
                            >
                                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify & Create Account"}
                            </button>
                        </form>

                        <p className="text-center text-slate-400 text-sm mt-6">
                            Already have an account?{" "}
                            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">
                                Log in
                            </Link>
                        </p>
                    </>
                ) : (
                    /* OTP Verification Flow */
                    <div className="flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
                        <div className="h-16 w-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-6 border border-blue-500/30">
                            <MailCheck className="h-8 w-8 text-blue-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Check your email</h2>
                        <p className="text-slate-400 text-sm mt-2 mb-8">
                            We sent a 6-digit verification code to <span className="text-white font-medium">{registeredEmail}</span>
                        </p>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 text-red-500 rounded-lg p-3 text-sm w-full mb-6">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleVerifyOTP} className="w-full flex flex-col gap-4">
                            <input
                                type="text"
                                maxLength={6}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                className="input-field text-center text-2xl tracking-[0.5em] font-mono"
                                placeholder="••••••"
                                required
                            />
                            <button
                                type="submit"
                                disabled={isLoading || otp.length !== 6}
                                className="btn-primary mt-4 flex items-center justify-center gap-2"
                            >
                                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify Code"}
                            </button>
                        </form>
                    </div>
                )}

            </div>
        </div>
    );
}

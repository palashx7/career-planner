"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Target, Loader2, ArrowRight, Settings2 } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/store";

export default function ProfilePage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const { register, handleSubmit } = useForm({
        defaultValues: {
            role: "",
            country: user?.base_country || ""
        }
    });

    const onSubmit = async (data: any) => {
        setIsLoading(true);
        setError("");
        setSuccess("");

        try {
            const response = await api.post("/workflow/role", {
                role: data.role,
                country: data.country
            });

            setSuccess(`Job Profile created: ${response.data.role} in ${response.data.country}`);

            // Auto-redirect to the analyzer to fetch the market requirements
            setTimeout(() => {
                router.push("/dashboard/analyzer");
            }, 1500);

        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to save job profile.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl">
            <header className="mb-10">
                <h1 className="text-3xl font-bold text-white mb-2">Target Role Setup</h1>
                <p className="text-slate-400">
                    Configure the exact job title and location you are aiming for. Our AI will use this to scrape live job boards and analyze current market requirements.
                </p>
            </header>

            <div className="glass-panel p-8 relative overflow-hidden text-center md:text-left">

                {/* Decorative background element */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-center gap-4 mb-6 justify-center md:justify-start">
                    <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                        <Settings2 className="h-6 w-6 text-blue-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Career Configuration</h2>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-500 rounded-lg p-3 text-sm mb-6 text-center">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 rounded-lg p-3 text-sm mb-6 text-center flex items-center justify-center gap-2">
                        Target Saved Successfully! Redirecting to Analyzer...
                        <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 relative z-10">

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Target Job Title</label>
                        <input
                            type="text"
                            {...register("role", { required: true })}
                            className="input-field text-lg"
                            placeholder="e.g. Senior Frontend Engineer"
                            required
                        />
                        <p className="text-xs text-slate-500 mt-2">Be as specific as possible (e.g., "MERN Stack Developer" instead of "Developer")</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Target Country</label>
                        <input
                            type="text"
                            {...register("country", { required: true })}
                            className="input-field text-lg"
                            placeholder="e.g. United States"
                            required
                        />
                        <p className="text-xs text-slate-500 mt-2">We will scrape job boards specific to this region's market.</p>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !!success}
                        className="btn-primary py-4 mt-4 flex items-center justify-center gap-2 text-lg shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]"
                    >
                        {isLoading ? (
                            <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                            <>Save Configuration & Analyze Market <ArrowRight className="h-5 w-5" /></>
                        )}
                    </button>
                </form>

            </div>
        </div>
    );
}

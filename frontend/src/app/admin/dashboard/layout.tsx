"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, LogOut, Verified } from "lucide-react";
import { useAuthStore } from "@/lib/store";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { token, user, clearAuth } = useAuthStore();

    useEffect(() => {
        if (!token || user?.role !== "admin") {
            router.push("/admin/login");
        }
    }, [token, user, router]);

    const handleLogout = () => {
        clearAuth();
        router.push("/admin/login");
    };

    if (!token || user?.role !== "admin") return null;

    return (
        <div className="min-h-screen flex bg-[#020617] text-slate-50">

            <aside className="w-72 hidden md:flex flex-col bg-slate-900/50 backdrop-blur-xl border-r border-emerald-900/50 p-6 fixed h-full z-20">
                <div className="flex items-center gap-3 mb-12">
                    <div className="h-10 w-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                        <Verified className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">University<span className="text-emerald-400">Portal</span></span>
                </div>

                <nav className="flex-1 space-y-2">
                    <Link href="/admin/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium bg-emerald-600/10 text-emerald-400 border border-emerald-500/20">
                        <Users className="h-5 w-5 text-emerald-400" />
                        Student Monitoring
                    </Link>
                </nav>

                <div className="mt-auto pt-6 border-t border-slate-800">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors w-full text-left font-medium text-sm"
                    >
                        <LogOut className="h-5 w-5" />
                        Logout Staff
                    </button>
                </div>
            </aside>

            <main className="flex-1 md:ml-72 flex flex-col min-h-screen relative">
                <div className="absolute top-0 right-0 w-[800px] h-[500px] bg-emerald-900/5 blur-[150px] pointer-events-none z-0" />
                <div className="relative z-10 p-8 w-full max-w-6xl mx-auto h-full flex flex-col">
                    {children}
                </div>
            </main>
        </div>
    );
}

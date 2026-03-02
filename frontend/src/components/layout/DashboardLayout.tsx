"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
    LayoutDashboard,
    UserCircle,
    FileText,
    CheckSquare,
    Briefcase,
    Target,
    BookOpen,
    Settings,
    LogOut
} from "lucide-react";
import { useAuthStore } from "@/lib/store";

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Profile & Role Phase", href: "/dashboard/profile", icon: UserCircle },
    { name: "AI Resume Analyzer", href: "/dashboard/analyzer", icon: FileText },
    { name: "Task Manager", href: "/dashboard/tasks", icon: CheckSquare },
    { name: "Experience Journal", href: "/dashboard/journal", icon: BookOpen },
    { name: "Custom Resume Builder", href: "/dashboard/builder", icon: Briefcase },
    { name: "AI Mock Interview", href: "/dashboard/interview", icon: Target },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);
    const { token, user, clearAuth } = useAuthStore();

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isMounted && !token) {
            router.push("/login");
        }
    }, [isMounted, token, router]);

    const handleLogout = () => {
        clearAuth();
        router.push("/login");
    };

    if (!isMounted || !token) return null;

    return (
        <div className="min-h-screen flex bg-[#020617] text-slate-50">

            {/* Sidebar Overlay for Mobile could go here. Assuming Desktop-first for now */}
            <aside className="w-72 hidden md:flex flex-col bg-slate-900/50 backdrop-blur-xl border-r border-slate-800 p-6 fixed h-full z-20">
                <div className="flex items-center gap-3 mb-12">
                    <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                        <span className="font-bold text-xl text-white">C</span>
                    </div>
                    <span className="text-xl font-bold tracking-tight">Career<span className="text-blue-400">Planner</span></span>
                </div>

                <nav className="flex-1 space-y-2">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${isActive
                                    ? "bg-blue-600/10 text-blue-400 border border-blue-500/20"
                                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 text-sm"
                                    }`}
                            >
                                <item.icon className={`h-5 w-5 ${isActive ? "text-blue-400" : ""}`} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="mt-auto pt-6 border-t border-slate-800">
                    <Link
                        href="/dashboard/settings"
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-2 ${pathname === "/dashboard/settings"
                            ? "bg-slate-800 text-white font-medium shadow-md border border-slate-700/50"
                            : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                            }`}
                    >
                        <Settings className="h-5 w-5" />
                        Settings
                    </Link>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-xl transition-all font-medium text-sm"
                    >
                        <LogOut className="h-5 w-5" />
                        Logout ({user?.email?.split('@')[0]})
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 md:ml-72 flex flex-col min-h-screen relative">
                {/* Subtle background glow specific to dashboard */}
                <div className="absolute top-0 right-0 w-[800px] h-[500px] bg-blue-900/5 blur-[150px] pointer-events-none z-0" />

                <div className="relative z-10 p-8 w-full max-w-6xl mx-auto h-full flex flex-col">
                    {children}
                </div>
            </main>
        </div>
    );
}

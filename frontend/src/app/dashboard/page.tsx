"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/store";
import api from "@/lib/api";
import {
    Target,
    TrendingUp,
    AlertCircle,
    CheckCircle2,
    ArrowRight,
    Loader2,
    FileText
} from "lucide-react";

export default function DashboardPage() {
    const { user } = useAuthStore();
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const response = await api.get("/dashboard/summary");
                setData(response.data);
            } catch (err: any) {
                setError("Failed to load dashboard data. Please make sure you are logged in.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchSummary();
    }, []);

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="glass-card p-6 border-red-500/20 text-center">
                    <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white">Connection Error</h2>
                    <p className="text-slate-400 mt-2">{error}</p>
                </div>
            </div>
        );
    }

    const { active_profile, progress_percentage, total_requirements_analyzed, strengths_identified, gaps_identified, upcoming_tasks } = data;

    if (!active_profile) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto text-center h-[70vh]">
                <div className="h-20 w-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 border border-blue-500/20">
                    <Target className="h-10 w-10 text-blue-400" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-4">Welcome to CareerPlanner</h1>
                <p className="text-slate-400 mb-8 border-b border-slate-800 pb-8">
                    You haven't selected a target job role yet. To generate your AI-powered 6-month roadmap, we first need to know where you want to go.
                </p>
                <Link href="/dashboard/profile" className="btn-primary w-full flex items-center justify-center gap-2">
                    Start Your Journey <ArrowRight className="h-5 w-5" />
                </Link>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

            <header className="mb-10">
                <h1 className="text-3xl font-bold text-white mb-2">Hello, {user?.full_name || user?.email?.split('@')[0]}</h1>
                <p className="text-slate-400">
                    Here is the current intelligence for your <span className="text-blue-400 font-medium">{active_profile.role}</span> goal in {active_profile.country}.
                </p>
            </header>

            {/* Top Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">

                <div className="glass-card p-6 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-slate-400 font-medium">Plan Progress</h3>
                        <div className="p-2 bg-blue-500/10 rounded-lg"><TrendingUp className="h-5 w-5 text-blue-400" /></div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-white">{Math.round(progress_percentage)}</span>
                        <span className="text-slate-400">%</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-800 h-2 rounded-full mt-4 overflow-hidden">
                        <div className="bg-blue-500 h-full rounded-full transition-all duration-1000 w-[0%]" style={{ width: `${progress_percentage}%` }} />
                    </div>
                </div>

                <div className="glass-card p-6 flex flex-col justify-between border-slate-700/50">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-slate-400 font-medium">Market Data</h3>
                        <div className="p-2 bg-slate-800 rounded-lg"><Target className="h-5 w-5 text-slate-300" /></div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-white">{total_requirements_analyzed}</span>
                        <span className="text-slate-400">skills</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-4">Extracted from 10 live company postings</p>
                </div>

                <div className="glass-card p-6 flex flex-col justify-between border-emerald-900/50">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-slate-400 font-medium">Your Strengths</h3>
                        <div className="p-2 bg-emerald-500/10 rounded-lg"><CheckCircle2 className="h-5 w-5 text-emerald-400" /></div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-white">{strengths_identified}</span>
                        <span className="text-slate-400">verified</span>
                    </div>
                    <p className="text-xs text-emerald-500/70 mt-4">Ready for the resume builder</p>
                </div>

                <div className="glass-card p-6 flex flex-col justify-between border-orange-900/50">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-slate-400 font-medium">Critical Gaps</h3>
                        <div className="p-2 bg-orange-500/10 rounded-lg"><AlertCircle className="h-5 w-5 text-orange-400" /></div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-white">{gaps_identified}</span>
                        <span className="text-slate-400">weaknesses</span>
                    </div>
                    <p className="text-xs text-orange-500/70 mt-4">Focus areas for the next 6 months</p>
                </div>

            </div>

            {/* Main Content Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Active Roadmap Preview */}
                <div className="lg:col-span-2 glass-panel p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-white">Active Roadmap Tasks</h2>
                        <Link href="/dashboard/tasks" className="text-sm text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1">
                            View All <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>

                    {upcoming_tasks.length === 0 ? (
                        <div className="text-center py-12 border border-slate-800 border-dashed rounded-xl">
                            <p className="text-slate-400 mb-4">No AI tasks have been generated yet.</p>
                            <Link href="/dashboard/analyzer" className="btn-secondary text-sm">Run AI Gap Analysis</Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {upcoming_tasks.slice(0, 4).map((task: any) => (
                                <div key={task.id} className="flex gap-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:border-slate-600 transition-colors">
                                    <div className="flex-shrink-0 flex flex-col items-center justify-center h-12 w-12 rounded-lg bg-blue-900/20 border border-blue-500/20 text-blue-400 font-bold">
                                        M{task.month_target}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${task.task_type === 'learning' ? 'bg-purple-500/20 text-purple-400' :
                                                task.task_type === 'project' ? 'bg-emerald-500/20 text-emerald-400' :
                                                    'bg-orange-500/20 text-orange-400'
                                                }`}>
                                                {task.task_type}
                                            </span>
                                            <h4 className="text-white font-medium">{task.title}</h4>
                                        </div>
                                        <p className="text-slate-400 text-sm line-clamp-2">{task.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick Actions / Status */}
                <div className="space-y-6">
                    <div className="glass-card p-6">
                        <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
                        <div className="space-y-3">
                            <Link href="/dashboard/profile" className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-800/50 transition-colors group">
                                <div className="flex items-center gap-3 text-slate-300 group-hover:text-white">
                                    <Target className="h-5 w-5 text-blue-400" />
                                    <span>Change Job Role</span>
                                </div>
                                <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-white transition-colors" />
                            </Link>
                            <Link href="/dashboard/analyzer" className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-800/50 transition-colors group border-t border-slate-800">
                                <div className="flex items-center gap-3 text-slate-300 group-hover:text-white">
                                    <FileText className="h-5 w-5 text-emerald-400" />
                                    <span>Upload Resume for AI</span>
                                </div>
                                <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-white transition-colors" />
                            </Link>
                        </div>
                    </div>

                    {/* If College Student */}
                    {user?.role === "student" && user?.is_college_student && (
                        <div className="glass-card p-6 border-blue-900/50 bg-blue-900/5">
                            <h2 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-2">University Connection</h2>
                            <p className="text-sm text-slate-300">
                                Your progress is being synced with <strong>{user.college_name}</strong> administrators for tracking.
                            </p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

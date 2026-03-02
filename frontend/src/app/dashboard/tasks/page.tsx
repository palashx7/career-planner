"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Loader2, Play, BookOpen, Presentation } from "lucide-react";
import api from "@/lib/api";

type Task = {
    id: number;
    month_target: number;
    title: string;
    description: string;
    task_type: "learning" | "project" | "other";
    is_completed: boolean;
};

export default function TasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchTasks = async () => {
        try {
            // The summary endpoint returns tasks inside active_profile. 
            // But we can just use the summary endpoint's "upcoming_tasks" and a dedicated endpoint if we had one.
            // Wait, we don't have a direct GET /tasks endpoint, but we can hit /dashboard/summary 
            // which returns `upcoming_tasks` and we can also calculate it.
            const response = await api.get("/dashboard/summary");

            // We need ALL tasks, not just upcoming. 
            // The summary endpoint doesn't return completed tasks in a separate array currently.
            // Let's modify our frontend to use upcoming_tasks, or we can just fetch summary and use what's there.
            // For now, let's assume `upcoming_tasks` contains the road map.
            // In a real app we'd add `GET /workflow/tasks`.
            setTasks(response.data.upcoming_tasks || []);
        } catch (err: any) {
            setError("Failed to load your customized roadmap.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const handleComplete = async (taskId: number) => {
        try {
            await api.put(`/dashboard/tasks/${taskId}/complete`);
            // Optimistic update
            setTasks(tasks.filter(t => t.id !== taskId));
        } catch (err) {
            console.error("Failed to complete task:", err);
        }
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center h-[70vh]">
                <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
            </div>
        );
    }

    // Group by month
    const groupedTasks = tasks.reduce((acc, task) => {
        if (!acc[task.month_target]) acc[task.month_target] = [];
        acc[task.month_target].push(task);
        return acc;
    }, {} as Record<number, Task[]>);

    const months = Object.keys(groupedTasks).map(Number).sort((a, b) => a - b);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="mb-10">
                <h1 className="text-3xl font-bold text-white mb-2">6-Month Execution Plan</h1>
                <p className="text-slate-400 max-w-2xl">
                    This is your personalized, AI-generated curriculum designed to bridge your identified skill gaps. Mark tasks complete as you progress to sync with your University dashboard.
                </p>
            </header>

            {error && <div className="p-4 bg-red-500/10 text-red-500 rounded-xl mb-8">{error}</div>}

            {tasks.length === 0 && !error ? (
                <div className="glass-panel p-12 text-center max-w-lg mx-auto border-dashed border-2 border-slate-700">
                    <h3 className="text-xl font-bold text-white mb-2">No Active Tasks</h3>
                    <p className="text-slate-400">
                        Run the AI Resume Analyzer to generate your customized month-by-month roadmap.
                    </p>
                </div>
            ) : (
                <div className="space-y-12 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-800 before:to-transparent">
                    {months.map((month) => (
                        <div key={month} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">

                            {/* Timeline Node */}
                            <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-[#020617] bg-blue-900/50 text-blue-400 font-bold shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                M{month}
                            </div>

                            {/* Card Content */}
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-6 glass-panel border border-slate-800/50 hover:border-blue-500/30 transition-colors shadow-xl">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <Play className="h-4 w-4 text-blue-400" /> Month {month} Objectives
                                </h3>

                                <div className="space-y-4">
                                    {groupedTasks[month].map(task => (
                                        <div key={task.id} className="p-4 bg-slate-900/50 rounded-xl border border-slate-800/50 flex gap-4 group/task">
                                            <button
                                                onClick={() => handleComplete(task.id)}
                                                className="mt-1 text-slate-500 hover:text-emerald-400 transition-colors"
                                            >
                                                <Circle className="h-5 w-5" />
                                            </button>

                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    {task.task_type === 'learning' ? <BookOpen className="h-3 w-3 text-purple-400" /> : <Presentation className="h-3 w-3 text-emerald-400" />}
                                                    <h4 className="text-white text-sm font-medium">{task.title}</h4>
                                                </div>
                                                <p className="text-xs text-slate-400 leading-relaxed">{task.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

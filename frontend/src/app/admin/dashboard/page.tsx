"use client";

import { useEffect, useState } from "react";
import { Users, GraduationCap, TrendingUp, Search, Loader2 } from "lucide-react";
import api from "@/lib/api";

type StudentData = {
    id: number;
    full_name: string;
    email: string;
    target_role: string;
    progress_percentage: number;
};

export default function AdminDashboardPage() {
    const [students, setStudents] = useState<StudentData[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<StudentData[]>([]);
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchStudents = async () => {
            setIsLoading(true);
            try {
                const response = await api.get("/admin/students");
                setStudents(response.data);
                setFilteredStudents(response.data);
            } catch (err: any) {
                setError(err.response?.data?.detail || "Failed to load student data.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchStudents();
    }, []);

    useEffect(() => {
        if (!search.trim()) {
            setFilteredStudents(students);
        } else {
            const q = search.toLowerCase();
            setFilteredStudents(
                students.filter((s) =>
                    s.full_name.toLowerCase().includes(q) ||
                    s.email.toLowerCase().includes(q) ||
                    s.target_role.toLowerCase().includes(q)
                )
            );
        }
    }, [search, students]);

    // Aggregates
    const totalStudents = students.length;
    const activeStudents = students.filter(s => s.target_role !== "No role selected").length;
    const avgProgress = totalStudents > 0
        ? Math.round(students.reduce((acc, curr) => acc + curr.progress_percentage, 0) / totalStudents)
        : 0;

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-10 w-10 text-emerald-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="mb-10">
                <h1 className="text-3xl font-bold text-white mb-2">Student Monitoring Dashboard</h1>
                <p className="text-slate-400">
                    Track course completion and AI roadmap progress for all students tied to your University.
                </p>
            </header>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="glass-card p-6 border-slate-700/50">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-slate-400 font-medium">Total Registered</h3>
                        <div className="p-2 bg-slate-800 rounded-lg"><Users className="h-5 w-5 text-slate-300" /></div>
                    </div>
                    <span className="text-4xl font-bold text-white">{totalStudents}</span>
                </div>

                <div className="glass-card p-6 border-blue-900/30">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-slate-400 font-medium">Active Roadmaps</h3>
                        <div className="p-2 bg-blue-500/10 rounded-lg"><GraduationCap className="h-5 w-5 text-blue-400" /></div>
                    </div>
                    <span className="text-4xl font-bold text-white">{activeStudents}</span>
                </div>

                <div className="glass-card p-6 border-emerald-900/50">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-slate-400 font-medium">Avg. Completion</h3>
                        <div className="p-2 bg-emerald-500/10 rounded-lg"><TrendingUp className="h-5 w-5 text-emerald-400" /></div>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-white">{avgProgress}</span>
                        <span className="text-emerald-500 font-medium">%</span>
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className="glass-panel overflow-hidden flex flex-col">

                <div className="p-6 border-b border-slate-800 flex justify-between items-center gap-4 flex-wrap">
                    <h2 className="text-xl font-bold text-white">Student Roster</h2>

                    <div className="relative w-full max-w-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-slate-500" />
                        </div>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="input-field pl-10 py-2 border-slate-800 bg-slate-900/50 focus:border-emerald-500 focus:ring-emerald-500/20"
                            placeholder="Search name, email, or role..."
                        />
                    </div>
                </div>

                {error ? (
                    <div className="p-8 text-center text-red-400">{error}</div>
                ) : filteredStudents.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">No students match your criteria.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-300">
                            <thead className="text-xs uppercase bg-slate-800/50 text-slate-400 border-b border-slate-700/50">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Name</th>
                                    <th className="px-6 py-4 font-semibold">Email</th>
                                    <th className="px-6 py-4 font-semibold">Target Career</th>
                                    <th className="px-6 py-4 font-semibold text-right">Roadmap Progress</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {filteredStudents.map((s) => (
                                    <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4 font-medium text-white">{s.full_name}</td>
                                        <td className="px-6 py-4 text-slate-400">{s.email}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${s.target_role === "No role selected"
                                                    ? "bg-slate-800 text-slate-500"
                                                    : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                                }`}>
                                                {s.target_role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-3">
                                                <span className="font-medium text-emerald-400">{s.progress_percentage}%</span>
                                                <div className="w-24 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${s.progress_percentage}%` }} />
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

        </div>
    );
}

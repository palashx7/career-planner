"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { BookOpen, Plus, Tag, Calendar, Loader2 } from "lucide-react";

type MarketRequirement = {
    id: number;
    name: string;
    category: string;
    description: string;
};

type JournalEntry = {
    id: number;
    title: string;
    notes: string;
    requirement_id: number | null;
    created_at: string;
};

export default function JournalPage() {
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [requirements, setRequirements] = useState<MarketRequirement[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Form State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newNotes, setNewNotes] = useState("");
    const [selectedReqId, setSelectedReqId] = useState<string>("");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [journalRes, marketRes] = await Promise.all([
                api.get("/workflow/journal"),
                api.get("/workflow/market")
            ]);
            setEntries(journalRes.data);
            setRequirements(marketRes.data);
        } catch (err) {
            console.error("Failed to fetch journal data:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateEntry = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim() || !newNotes.trim()) return;

        setIsSubmitting(true);
        try {
            const payload = {
                title: newTitle,
                notes: newNotes,
                requirement_id: selectedReqId ? parseInt(selectedReqId) : null
            };
            const res = await api.post("/workflow/journal", payload);

            setEntries([res.data, ...entries]);

            // Reset form
            setNewTitle("");
            setNewNotes("");
            setSelectedReqId("");
            setIsFormOpen(false);
        } catch (err) {
            console.error("Failed to save entry:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getRequirementName = (reqId: number | null) => {
        if (!reqId) return null;
        const req = requirements.find(r => r.id === reqId);
        return req ? req.name : "Unknown Skill";
    };

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto space-y-8">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <BookOpen className="h-8 w-8 text-blue-500" />
                        Experience Journal
                    </h1>
                    <p className="text-slate-400 mt-2 max-w-2xl">
                        Log your daily internship or project tasks here. Tag your notes to specific market requirements to slowly build proof of your expertise for your resume.
                    </p>
                </div>
                <button
                    onClick={() => setIsFormOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-900/20"
                >
                    <Plus className="h-5 w-5" />
                    New Entry
                </button>
            </header>

            {/* Create Entry Modal */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="glass-panel border-slate-700 w-full max-w-2xl overflow-hidden shadow-2xl">
                        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                            <h2 className="text-xl font-semibold text-white">Log Experience</h2>
                            <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleCreateEntry} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
                                <input
                                    type="text"
                                    required
                                    value={newTitle}
                                    onChange={e => setNewTitle(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                    placeholder="E.g., Automated deployment pipeline"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Market Skill Proven (Optional)</label>
                                <select
                                    value={selectedReqId}
                                    onChange={e => setSelectedReqId(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none"
                                >
                                    <option value="">No specific skill / General note</option>
                                    {requirements.map(req => (
                                        <option key={req.id} value={req.id}>
                                            {req.name} ({req.category.replace('_', ' ')})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Detailed Notes</label>
                                <textarea
                                    required
                                    value={newNotes}
                                    onChange={e => setNewNotes(e.target.value)}
                                    rows={5}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-y"
                                    placeholder="What exactly did you do? What tools did you use? What was the impact or metric of success?"
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsFormOpen(false)}
                                    className="px-5 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Entry"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Entries Grid */}
            {entries.length === 0 ? (
                <div className="glass-panel border-slate-800/50 p-12 text-center rounded-2xl flex flex-col items-center justify-center">
                    <div className="h-16 w-16 bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
                        <BookOpen className="h-8 w-8 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-medium text-white mb-2">No entries yet</h3>
                    <p className="text-slate-400 max-w-md mx-auto mb-6">
                        Start logging your daily tasks, projects, or learnings. This builds the raw material you'll need to write killer resume bullets later.
                    </p>
                    <button
                        onClick={() => setIsFormOpen(true)}
                        className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
                    >
                        Create First Entry
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {entries.map(entry => {
                        const skillName = getRequirementName(entry.requirement_id);
                        const dateString = new Date(entry.created_at).toLocaleDateString('en-US', {
                            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                        });

                        return (
                            <div key={entry.id} className="glass-panel border-slate-800 hover:border-slate-700 transition-all p-6 relative group overflow-hidden">

                                {skillName && (
                                    <div className="absolute top-0 right-0 p-4">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-900/30 text-blue-400 border border-blue-500/20">
                                            <Tag className="h-3 w-3" />
                                            {skillName}
                                        </span>
                                    </div>
                                )}

                                <div className="pr-24">
                                    <h3 className="text-lg font-semibold text-white mb-2 leading-tight">
                                        {entry.title}
                                    </h3>
                                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-4">
                                        <Calendar className="h-3.5 w-3.5" />
                                        {dateString}
                                    </div>
                                </div>

                                <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed line-clamp-4 group-hover:line-clamp-none transition-all duration-300">
                                    {entry.notes}
                                </p>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
}

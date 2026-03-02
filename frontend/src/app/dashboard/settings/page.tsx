"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { UserCircle, Save, Loader2, School } from "lucide-react";
import { useAuthStore } from "@/lib/store";

export default function SettingsPage() {
    const { user, setAuth, token } = useAuthStore();

    // Form State
    const [fullName, setFullName] = useState("");
    const [isCollegeStudent, setIsCollegeStudent] = useState(false);
    const [collegeName, setCollegeName] = useState("");

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        if (user) {
            setFullName(user.full_name || "");
            setIsCollegeStudent(user.is_college_student || false);
            setCollegeName(user.college_name || "");
            setIsLoading(false);
        }
    }, [user]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setSuccessMessage("");
        setErrorMessage("");

        try {
            const payload = {
                full_name: fullName,
                is_college_student: isCollegeStudent,
                college_name: isCollegeStudent ? collegeName : null
            };

            const res = await api.put("/auth/me", payload);

            // Update Zustand Store so Navbar/Layout reflects new name immediately
            if (token) {
                setAuth(token, res.data);
            }

            setSuccessMessage("Profile updated successfully.");

            setTimeout(() => setSuccessMessage(""), 3000);

        } catch (err: any) {
            console.error("Failed to update profile", err);
            setErrorMessage(err.response?.data?.detail || "An error occurred while saving.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto space-y-8 mt-4">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <UserCircle className="h-8 w-8 text-blue-500" />
                    Account Settings
                </h1>
                <p className="text-slate-400 mt-2">
                    Update your basic profile information and student status here.
                </p>
            </header>

            <div className="glass-panel border-slate-800 p-8 relative overflow-hidden">
                {/* Subtle BG Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-900/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

                <form onSubmit={handleSave} className="space-y-6 relative z-10">

                    {successMessage && (
                        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            {successMessage}
                        </div>
                    )}

                    {errorMessage && (
                        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                            {errorMessage}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Email Address (Read Only)</label>
                        <input
                            type="text"
                            disabled
                            value={user?.email || ""}
                            className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-500 cursor-not-allowed"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="e.g., Jane Doe"
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        />
                    </div>

                    <div className="pt-4 border-t border-slate-800">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative flex items-center justify-center">
                                <input
                                    type="checkbox"
                                    checked={isCollegeStudent}
                                    onChange={(e) => {
                                        setIsCollegeStudent(e.target.checked);
                                        if (!e.target.checked) setCollegeName("");
                                    }}
                                    className="sr-only"
                                />
                                <div className={`w-6 h-6 rounded border ${isCollegeStudent ? 'bg-blue-600 border-blue-600' : 'bg-slate-900 border-slate-700 group-hover:border-slate-500'} flex items-center justify-center transition-all`}>
                                    {isCollegeStudent && <div className="w-2 h-2 bg-white rounded-sm"></div>}
                                </div>
                            </div>
                            <span className="text-sm font-medium text-slate-300 select-none">I am currently a college student</span>
                        </label>
                    </div>

                    {isCollegeStudent && (
                        <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                            <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                                <School className="h-4 w-4 text-slate-400" />
                                College / University Name
                            </label>
                            <input
                                type="text"
                                required={isCollegeStudent}
                                value={collegeName}
                                onChange={(e) => setCollegeName(e.target.value)}
                                placeholder="e.g., Stanford University"
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            />
                        </div>
                    )}

                    <div className="pt-6 flex justify-end">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-900/20 disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none"
                        >
                            {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    FileText, UploadCloud, BrainCircuit, CheckCircle2, AlertTriangle,
    Loader2, Globe, Send, RefreshCw, Sparkles
} from "lucide-react";
import api from "@/lib/api";

type Requirement = {
    id: number;
    name: string;
    description: string;
};

type Grade = {
    requirement_id: number;
    rating: number;
    reason: string;
};

export default function AnalyzerPage() {
    const router = useRouter();
    const [requirements, setRequirements] = useState<Requirement[]>([]);
    const [isFetchingMarket, setIsFetchingMarket] = useState(true);
    const [marketError, setMarketError] = useState("");

    // Resume upload state
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisError, setAnalysisError] = useState("");

    // Results
    const [grades, setGrades] = useState<Grade[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchMarketData = async () => {
            try {
                // This hits SerpApi + Gemini, so it might take 10-15s
                const response = await api.get("/workflow/market");
                setRequirements(response.data);
            } catch (err: any) {
                setMarketError(
                    err.response?.data?.detail || "You need to set up a Job Profile first."
                );
            } finally {
                setIsFetchingMarket(false);
            }
        };
        fetchMarketData();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
            setAnalysisError("");
        }
    };

    const runAIAssessment = async () => {
        if (!selectedFile) return;

        setIsAnalyzing(true);
        setAnalysisError("");
        setGrades([]);

        const formData = new FormData();
        formData.append("file", selectedFile);

        try {
            const response = await api.post("/workflow/resume-extract", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            setGrades(response.data.evaluations || []);
        } catch (err: any) {
            setAnalysisError(err.response?.data?.detail || "AI Parsing Failed.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const saveAssessmentsAndGeneratePlan = async () => {
        setIsSaving(true);
        try {
            // Format data for /workflow/assessment
            const payload = {
                assessments: grades.map(g => ({
                    requirement_id: g.requirement_id,
                    rating: g.rating,
                    reason: g.reason
                }))
            };

            // Save assessments
            await api.post("/workflow/assessment", payload);

            // Generate plan tasks
            await api.post("/workflow/plan");

            // Redirect to roadmap!
            router.push("/dashboard/tasks");

        } catch (err) {
            setAnalysisError("Failed to save and generate plan.");
            setIsSaving(false);
        }
    };

    // Helper to find a specific grade
    const getGrade = (reqId: number) => grades.find(g => g.requirement_id === reqId);

    if (isFetchingMarket) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] text-center max-w-lg mx-auto">
                <div className="relative mb-8">
                    <div className="absolute inset-0 bg-blue-500/30 blur-2xl rounded-full animate-pulse" />
                    <div className="h-20 w-20 bg-slate-900 border border-blue-500/50 rounded-2xl flex items-center justify-center relative z-10">
                        <Globe className="h-10 w-10 text-blue-400 animate-spin-slow" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">Scanning Live Market Data...</h2>
                <p className="text-slate-400">
                    Our AI agents are currently crawling job boards and extracting the most requested skills for your target role in your selected country. This takes about 10-15 seconds.
                </p>
            </div>
        );
    }

    if (marketError) {
        return (
            <div className="glass-panel p-8 text-center max-w-lg mx-auto mt-20">
                <AlertTriangle className="h-12 w-12 text-orange-400 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Profile Missing</h2>
                <p className="text-slate-400 mb-6">{marketError}</p>
                <button onClick={() => router.push("/dashboard/profile")} className="btn-primary">
                    Go to Profile Setup
                </button>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">AI Resume Analyzer</h1>
                    <p className="text-slate-400 max-w-2xl">
                        We identified <strong>{requirements.length} core competencies</strong> currently demanded by employers. Upload your resume and let Gemini objectively score your proficiency against these market requirements.
                    </p>
                </div>

                {/* Upload Zone */}
                <div className="glass-panel p-4 flex items-center gap-4 border-dashed border-2 border-slate-700 hover:border-blue-500/50 transition-colors cursor-pointer w-full md:w-auto shrink-0 relative overflow-hidden"
                    onClick={() => fileInputRef.current?.click()}>
                    <input
                        type="file"
                        className="hidden"
                        ref={fileInputRef}
                        accept=".pdf,.docx"
                        onChange={handleFileChange}
                    />
                    <div className="h-12 w-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/30">
                        <UploadCloud className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                        <p className="text-white font-medium">{selectedFile ? selectedFile.name : "Upload PDF / Docx"}</p>
                        <p className="text-xs text-slate-400 text-left">{selectedFile ? "Ready for Analysis" : "Click to browse files"}</p>
                    </div>
                </div>
            </header>

            {/* Controls */}
            <div className="flex flex-col md:flex-row items-center justify-between p-4 glass-card border-blue-900/40 mb-8 bg-blue-900/10">
                <div className="flex items-center gap-3 text-slate-300 mb-4 md:mb-0">
                    <BrainCircuit className="h-5 w-5 text-purple-400" />
                    <span className="text-sm font-medium">Gemini 2.5 Auto-Scoring Engine</span>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    {analysisError && <span className="text-sm text-red-400 flex items-center">{analysisError}</span>}

                    <button
                        onClick={runAIAssessment}
                        disabled={!selectedFile || isAnalyzing || isSaving}
                        className="btn-primary flex-1 md:flex-none flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 shadow-[0_0_15px_rgba(147,51,234,0.3)] disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none"
                    >
                        {isAnalyzing ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing Document...</>
                        ) : (
                            <><Sparkles className="h-4 w-4" /> Run AI Assessment</>
                        )}
                    </button>

                    {grades.length > 0 && (
                        <button
                            onClick={saveAssessmentsAndGeneratePlan}
                            disabled={isSaving}
                            className="btn-primary flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                        >
                            {isSaving ? (
                                <><Loader2 className="h-4 w-4 animate-spin" /> Generating Plan...</>
                            ) : (
                                <><Send className="h-4 w-4" /> Save & Generate Roadmap</>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Grid of parsed requirements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {requirements.map((req) => {
                    const parsedGrade = getGrade(req.id);

                    return (
                        <div key={req.id} className={`glass-panel p-6 border-l-4 transition-all duration-500 ${parsedGrade
                            ? (parsedGrade.rating >= 4 ? 'border-l-emerald-500' : parsedGrade.rating >= 2 ? 'border-l-orange-500' : 'border-l-red-500')
                            : 'border-l-slate-700'
                            }`}>
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="text-lg font-bold text-white">{req.name}</h3>
                                {parsedGrade && (
                                    <div className={`px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-1 ${parsedGrade.rating >= 4 ? 'bg-emerald-500/20 text-emerald-400' :
                                        parsedGrade.rating >= 2 ? 'bg-orange-500/20 text-orange-400' :
                                            'bg-red-500/20 text-red-400'
                                        }`}>
                                        {parsedGrade.rating} / 5
                                    </div>
                                )}
                            </div>

                            <p className="text-slate-400 text-sm mb-4 line-clamp-3 leading-relaxed">
                                {req.description}
                            </p>

                            {parsedGrade ? (
                                <div className="mt-auto px-4 py-3 bg-slate-900/50 rounded-xl border border-slate-800/50">
                                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                        <span className="text-purple-400">AI Assessment: </span>
                                        {parsedGrade.reason}
                                    </p>
                                </div>
                            ) : (
                                <div className="mt-auto animate-pulse px-4 py-3 bg-slate-800/20 rounded-xl border border-dashed border-slate-700">
                                    <p className="text-xs text-slate-500 text-center">Awaiting document analysis...</p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

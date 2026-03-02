"use client";

import { useEffect, useState } from "react";
import { Wrench, Sparkles, Download, CheckCircle2, Loader2, Upload } from "lucide-react";
import api from "@/lib/api";
// @ts-ignore
import domtoimage from "dom-to-image-more";
import jsPDF from "jspdf";

type Strength = {
    id: number;
    name: string;
    category: string;
};

export default function ResumeBuilderPage() {
    const [strengths, setStrengths] = useState<Strength[]>([]);
    const [selectedStrengths, setSelectedStrengths] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Rewriter State
    const [basicBullet, setBasicBullet] = useState("");
    const [isRewriting, setIsRewriting] = useState(false);
    const [optimizedBullets, setOptimizedBullets] = useState<string[]>([]);

    // Full Generate State
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [isGeneratingFull, setIsGeneratingFull] = useState(false);
    const [fullResumeData, setFullResumeData] = useState<any>(null);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        const fetchStrengths = async () => {
            try {
                const res = await api.get("/workflow/resume/strengths");
                setStrengths(res.data);
            } catch (err) {
                console.error("Failed to fetch strengths:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStrengths();
    }, []);

    const toggleStrength = (name: string) => {
        if (selectedStrengths.includes(name)) {
            setSelectedStrengths(selectedStrengths.filter(s => s !== name));
        } else {
            setSelectedStrengths([...selectedStrengths, name]);
        }
    };

    const handleRewrite = async () => {
        if (!basicBullet.trim()) return;
        setIsRewriting(true);
        try {
            const res = await api.post("/workflow/resume/rewrite", {
                bullet_point: basicBullet,
                strengths: selectedStrengths
            });
            setOptimizedBullets([res.data.optimized_bullet, ...optimizedBullets]);
            setBasicBullet("");
            setSelectedStrengths([]); // Reset selection
        } catch (err) {
            console.error("Failed to rewrite bullet:", err);
        } finally {
            setIsRewriting(false);
        }
    };

    const handleGenerateFull = async () => {
        setIsGeneratingFull(true);
        try {
            const formData = new FormData();
            if (resumeFile) {
                formData.append("file", resumeFile);
            }

            const res = await api.post("/workflow/resume/generate-full", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            setFullResumeData(res.data);
            setResumeFile(null);
            // Auto Select some strengths
        } catch (err) {
            console.error("Failed to generate full resume:", err);
        } finally {
            setIsGeneratingFull(false);
        }
    };

    const handlePrint = async () => {
        const printContent = document.getElementById('resume-document');
        if (!printContent) return;

        setIsExporting(true);
        try {
            const originalBg = printContent.style.backgroundColor;
            printContent.style.backgroundColor = 'white';

            // IMPORTANT: We DO NOT remove `p-8 md:p-12`. These paddings represent the physical margins of the paper.
            // If removed, the text touches the edge of the snapshot, causing the final PDF to look awkwardly zoomed in.
            const originalClasses = printContent.className;
            printContent.classList.remove('rounded-xl', 'shadow-2xl');

            // SVG rendering engine bug in dom-to-image with Tailwind's CSS reset:
            // Tailwind adds `border-width: 0; border-style: solid;` to everything globally.
            // dom-to-image renders un-width'd solid borders as thick black lines.
            // We use a style tag to force border-style none, then restore the specific bottom borders used in the resume.
            const styleElement = document.createElement('style');
            styleElement.innerHTML = `
                #resume-document * {
                    border-style: none !important;
                }
                #resume-document .border-b-2,
                #resume-document .border-b {
                    border-bottom-style: solid !important;
                }
                /* Prevent contentEditable outlines grabbing focus borders in the snapshot */
                #resume-document [contenteditable] {
                    outline: none !important;
                }
            `;
            printContent.appendChild(styleElement);

            // We use dom-to-image-more because html2canvas crashes on Tailwind v4 CSS variables
            const dataUrl = await domtoimage.toPng(printContent, {
                bgcolor: '#ffffff',
                quality: 1.0,
                scale: 2
            });

            // Cleanup DOM modifications
            printContent.removeChild(styleElement);
            printContent.style.backgroundColor = originalBg;
            printContent.className = originalClasses;

            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();

            // Calculate height proportionately
            const imgProps = pdf.getImageProperties(dataUrl);
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${fullResumeData?.name?.replace(/\s+/g, '_') || "Candidate"}_Resume.pdf`);

        } catch (error) {
            console.error("Failed to generate PDF", error);
        } finally {
            setIsExporting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[70vh]">
                <Loader2 className="h-10 w-10 text-emerald-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">

            {/* LEFT PANE: Controls & Rewriter */}
            <div className="w-full lg:w-1/2 flex flex-col gap-6 hide-on-print">

                <header className="mb-4">
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Wrench className="h-8 w-8 text-emerald-400" /> Resume Architect
                    </h1>
                    <p className="text-slate-400 mt-2">
                        Use AI to algorithmically generate your entire document, or rewrite individual bullets using your verified market strengths.
                    </p>
                </header>

                {/* Full Auto-Generator */}
                <div className="glass-card p-6 border-blue-900/30 bg-blue-900/10">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-blue-400" /> Auto-Generate Entire Resume
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Optional: Upload Old Resume Context</label>

                            <div className="border-2 border-dashed border-blue-500/30 rounded-xl p-6 flex flex-col items-center justify-center bg-blue-900/10 transition-colors hover:bg-blue-900/20 cursor-pointer relative group">
                                <input
                                    type="file"
                                    accept=".pdf,.docx"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                                />
                                <Upload className="h-8 w-8 text-blue-400 mb-2 transition-transform group-hover:scale-110" />
                                {resumeFile ? (
                                    <p className="text-sm text-blue-300 font-medium bg-blue-900/40 px-3 py-1 rounded-full">{resumeFile.name}</p>
                                ) : (
                                    <>
                                        <p className="text-sm font-medium text-slate-300 text-center">Drag & Drop or Click to Upload Old Resume</p>
                                        <p className="text-xs text-slate-500 mt-1 text-center">Otherwise, AI will invent a plausible template.</p>
                                        <p className="text-xs text-slate-500 text-center mt-1">PDF or DOCX max 5MB</p>
                                    </>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={handleGenerateFull}
                            disabled={isGeneratingFull || isRewriting}
                            className="btn-primary w-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center gap-2 disabled:bg-slate-800 disabled:text-slate-500"
                        >
                            {isGeneratingFull ? <Loader2 className="h-5 w-5 animate-spin" /> : "Generate Full ATS Document"}
                        </button>
                    </div>
                </div>

                {/* Strengths Bank */}
                <div className="glass-panel p-6 border-emerald-900/40">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" /> Verified Market Strengths
                    </h2>
                    <p className="text-sm text-slate-400 mb-4">Select keywords to weave into your next single bullet rewrite.</p>

                    <div className="flex flex-wrap gap-2">
                        {strengths.length === 0 ? (
                            <p className="text-sm text-slate-500">No strengths rated 4/5 or 5/5 yet. Go to the Analyzer.</p>
                        ) : (
                            strengths.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => toggleStrength(s.name)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedStrengths.includes(s.name)
                                        ? "bg-emerald-500 text-slate-900 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                        : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700"
                                        }`}
                                >
                                    {s.name}
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* AI Rewriter */}
                <div className="glass-card p-6 border-purple-900/30 bg-purple-900/10">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Wrench className="h-5 w-5 text-purple-400" /> Single Bullet Optimizer
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Basic Draft Bullet</label>
                            <textarea
                                value={basicBullet}
                                onChange={(e) => setBasicBullet(e.target.value)}
                                className="input-field min-h-[80px] resize-none focus:border-purple-500 focus:ring-purple-500/20"
                                placeholder="e.g. Worked on the backend database to make it faster."
                            />
                        </div>
                        <button
                            onClick={handleRewrite}
                            disabled={isRewriting || !basicBullet.trim()}
                            className="btn-primary w-full bg-purple-600 hover:bg-purple-500 flex items-center justify-center gap-2 disabled:bg-slate-800 disabled:text-slate-500"
                        >
                            {isRewriting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Optimize & Inject Keywords"}
                        </button>
                    </div>
                </div>

                {/* Generated Library */}
                {optimizedBullets.length > 0 && (
                    <div className="glass-panel p-6 border-slate-800">
                        <h2 className="text-lg font-bold text-white mb-4">Your Optimized Bullets</h2>
                        <div className="space-y-3">
                            {optimizedBullets.map((bullet, idx) => (
                                <div key={idx} className="p-4 bg-slate-900/50 border border-slate-800/50 rounded-xl relative group">
                                    <p className="text-sm text-slate-300 leading-relaxed pr-8">{bullet}</p>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-slate-500 mt-4 italic">Copy these and paste them directly into the document preview on the right.</p>
                    </div>
                )}

            </div>

            {/* RIGHT PANE: Live Document Preview */}
            <div className="w-full lg:w-1/2 flex flex-col gap-4">
                <div className="flex justify-between items-center hide-on-print">
                    <h2 className="text-lg font-bold text-white">ATS Document Preview</h2>
                    <button
                        onClick={handlePrint}
                        disabled={isExporting}
                        className="btn-secondary py-2 flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        {isExporting ? "Exporting..." : "Export PDF"}
                    </button>
                </div>

                {/* The Printable Canvas */}
                <div className="bg-white text-black p-8 md:p-12 rounded-xl shadow-2xl min-h-[842px] print:shadow-none print:p-0 print:m-0 w-full overflow-hidden text-sm" id="resume-document">

                    <div className="mb-6 border-b-2 border-slate-300 pb-4">
                        <h1 className="text-3xl font-bold uppercase tracking-widest text-slate-900 mb-1" contentEditable suppressContentEditableWarning>
                            {fullResumeData?.name || "JOHN DOE"}
                        </h1>
                        <p className="text-slate-600 font-medium tracking-wide flex items-center gap-2" contentEditable suppressContentEditableWarning>
                            <span>{fullResumeData?.contact || "City, Country | email@example.com | linkedin.com/in/johndoe"}</span>
                        </p>
                    </div>

                    <div className="mb-6">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-800 border-b border-slate-200 pb-1 mb-3">Professional Experience</h2>

                        {(fullResumeData?.experience || [
                            {
                                title: "Senior Software Engineer",
                                date: "Jan 2022 – Present",
                                company: "Tech Company Corp. - City, Country",
                                bullets: [
                                    "Engineered a high-performance REST API architecture processing 10m+ daily requests, improving SLA uptime.",
                                    "Spearheaded the migration to AWS Cloud infrastructure resulting in a 40% reduction in operating costs.",
                                    "Mentored a team of 5 junior developers through agile sprints and rigorous code reviews."
                                ]
                            }
                        ]).map((exp: any, i: number) => (
                            <div key={i} className="mb-4">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h3 className="font-bold text-slate-900" contentEditable suppressContentEditableWarning>{exp.title}</h3>
                                    <span className="text-slate-500 font-medium text-xs" contentEditable suppressContentEditableWarning>{exp.date}</span>
                                </div>
                                <p className="font-medium text-slate-700 mb-2 italic" contentEditable suppressContentEditableWarning>{exp.company}</p>
                                <ul className="list-disc pl-5 space-y-1.5 text-slate-700" contentEditable suppressContentEditableWarning>
                                    {exp.bullets.map((b: string, j: number) => (
                                        <li key={j}>{b}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    <div className="mb-6">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-800 border-b border-slate-200 pb-1 mb-3">Projects</h2>

                        {(fullResumeData?.projects || [
                            {
                                title: "Market Analysis AI Platform",
                                date: "Personal Project",
                                bullets: [
                                    "Architected an AI career coach using FastAPI, Next.js, and Google Gemini LLMs.",
                                    "Implemented secure JWT authentication and state management utilizing React hooks."
                                ]
                            }
                        ]).map((proj: any, i: number) => (
                            <div key={i} className="mb-4">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h3 className="font-bold text-slate-900" contentEditable suppressContentEditableWarning>{proj.title}</h3>
                                    <span className="text-slate-500 font-medium text-xs" contentEditable suppressContentEditableWarning>{proj.date}</span>
                                </div>
                                <ul className="list-disc pl-5 space-y-1.5 text-slate-700" contentEditable suppressContentEditableWarning>
                                    {proj.bullets.map((b: string, j: number) => (
                                        <li key={j}>{b}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    <div>
                        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-800 border-b border-slate-200 pb-1 mb-3">Education</h2>

                        {(fullResumeData?.education || [
                            {
                                degree: "B.S. in Computer Science",
                                date: "May 2024",
                                school: "State University - City, Country"
                            }
                        ]).map((edu: any, i: number) => (
                            <div key={i} className="mb-3">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h3 className="font-bold text-slate-900" contentEditable suppressContentEditableWarning>{edu.degree}</h3>
                                    <span className="text-slate-500 font-medium text-xs" contentEditable suppressContentEditableWarning>{edu.date}</span>
                                </div>
                                <p className="font-medium text-slate-700" contentEditable suppressContentEditableWarning>{edu.school}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

        </div>
    );
}

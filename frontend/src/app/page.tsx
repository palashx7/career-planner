import Link from 'next/link';
import { ArrowRight, GraduationCap, Briefcase } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/20 blur-[120px] rounded-full pointer-events-none" />

      <main className="z-10 w-full max-w-5xl flex flex-col items-center text-center gap-8">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
          Accelerate your <span className="text-gradient">Career Path</span>
        </h1>

        <p className="text-lg md:text-xl text-slate-300 max-w-2xl">
          An AI-powered intelligence platform that analyzes live market data to identify your skill gaps and generate a custom 6-month roadmap just for you.
        </p>

        <div className="grid md:grid-cols-2 gap-6 w-full max-w-3xl mt-10">

          {/* Student Login Path */}
          <div className="glass-panel p-8 flex flex-col items-center text-center gap-4 hover:-translate-y-2 transition-transform duration-300 cursor-default">
            <div className="h-16 w-16 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
              <GraduationCap className="h-8 w-8 text-blue-400" />
            </div>
            <h2 className="text-2xl font-semibold text-white">Students</h2>
            <p className="text-slate-400 text-sm mb-4">
              Join individually or via your configured University tying to unlock your AI roadmap.
            </p>
            <div className="flex w-full gap-3 mt-auto">
              <Link href="/login" className="btn-secondary w-full text-center">Login</Link>
              <Link href="/register" className="btn-primary w-full text-center flex items-center justify-center gap-2">
                Join <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Admin Path */}
          <div className="glass-panel p-8 flex flex-col items-center text-center gap-4 hover:-translate-y-2 transition-transform duration-300 cursor-default">
            <div className="h-16 w-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
              <Briefcase className="h-8 w-8 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-semibold text-white">University Admins</h2>
            <p className="text-slate-400 text-sm mb-4">
              Monitor your students' 6-month roadmaps and verify their progress in real-time.
            </p>
            <div className="flex w-full gap-3 mt-auto">
              <Link href="/admin/login" className="btn-secondary w-full text-center">Dashboard Access</Link>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

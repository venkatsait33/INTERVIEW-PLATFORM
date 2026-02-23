/**
 * AboutPage.jsx
 * Mission, values, tech stack, and contact section.
 */

import React from 'react';
import { Link } from 'react-router-dom';

const VALUES = [
  {
    icon: '🎯',
    title: 'Candidate first',
    desc: 'Candidates don\'t need accounts. They get a link, they join, they code. Technical skill — not setup friction — decides the outcome.',
  },
  {
    icon: '🔍',
    title: 'Radical transparency',
    desc: 'Both participants see every keystroke, every output, every run. There are no hidden test cases or secret scoring — just shared screens and honest evaluation.',
  },
  {
    icon: '⚙️',
    title: 'Pragmatic engineering',
    desc: 'We removed Clerk, Inngest, and Stream. JWT, Socket.io, and setTimeout do the same job at a fraction of the operational complexity. Fewer moving parts = fewer failures.',
  },
  {
    icon: '🚀',
    title: 'Speed over ceremony',
    desc: 'Schedule → notify → code → feedback in one flow. We believe the fastest path from "meet the candidate" to "make a decision" produces the best hires.',
  },
];

const TEAM = [
  { name: 'Engineering',    size: 3, avatar: 'ENG', color: 'bg-teal-800'   },
  { name: 'Product',        size: 1, avatar: 'PRD', color: 'bg-violet-800' },
  { name: 'Infrastructure', size: 1, avatar: 'OPS', color: 'bg-slate-700'  },
];

const STACK = [
  { name: 'React 18',      tag: 'Frontend',  dot: 'bg-teal-400' },
  { name: 'Vite',          tag: 'Build',     dot: 'bg-teal-400' },
  { name: 'Tailwind CSS',  tag: 'Styling',   dot: 'bg-teal-400' },
  { name: 'Monaco Editor', tag: 'Code',      dot: 'bg-teal-400' },
  { name: 'Node.js',       tag: 'Backend',   dot: 'bg-emerald-400' },
  { name: 'Express',       tag: 'Backend',   dot: 'bg-emerald-400' },
  { name: 'Socket.io',     tag: 'Real-time', dot: 'bg-emerald-400' },
  { name: 'MongoDB',       tag: 'Database',  dot: 'bg-emerald-400' },
  { name: 'JWT + bcrypt',  tag: 'Auth',      dot: 'bg-amber-400'   },
  { name: 'Nodemailer',    tag: 'Email',     dot: 'bg-amber-400'   },
  { name: 'Piston API',    tag: 'Execution', dot: 'bg-red-400'     },
  { name: 'PeerJS',        tag: 'Video',     dot: 'bg-red-400'     },
  { name: 'Docker Compose',tag: 'Deploy',    dot: 'bg-slate-400'   },
  { name: 'Nginx',         tag: 'Proxy',     dot: 'bg-slate-400'   },
];

const TIMELINE = [
  { year: '2023', event: 'InterviewPro v1 launched — basic scheduling and code editor.' },
  { year: '2024 Q1', event: 'Added WebRTC video, no-show reporting, and role-based dashboards.' },
  { year: '2024 Q3', event: 'Removed Clerk and Inngest. Replaced with JWT + Socket.io timers. Simplified.' },
  { year: '2025', event: 'Shared code execution — both participants see run output simultaneously.' },
];

export default function AboutPage() {
  return (
    <div className="pt-16">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(20,184,166,0.08), transparent 70%)' }} />

        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-teal-400 text-sm font-bold uppercase tracking-widest mb-4">About</p>
              <h1 className="text-5xl sm:text-6xl font-black text-white leading-tight mb-6"
                style={{ fontFamily: "'Syne', sans-serif" }}>
                We believe great<br />
                hiring starts with<br />
                <span className="text-teal-400">great tooling.</span>
              </h1>
            </div>
            <div>
              <p className="text-lg text-slate-400 leading-relaxed mb-6">
                InterviewPro was born out of frustration with technical interview platforms that
                require candidates to sign up, spin up separate tabs for video, paste code into
                chat messages, and guess what output looks like.
              </p>
              <p className="text-slate-400 leading-relaxed">
                We built a single-room experience where everything happens in one screen —
                and where the shared code execution output means both participants are
                always looking at the exact same thing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Values ───────────────────────────────────────────── */}
      <section className="py-20 bg-[#060b17] border-y border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-black text-white mb-12 text-center"
            style={{ fontFamily: "'Syne', sans-serif" }}>
            What we believe
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {VALUES.map((v, i) => (
              <div key={i} className="bg-[#080d1f] border border-slate-800/60 rounded-2xl p-6">
                <div className="text-3xl mb-4">{v.icon}</div>
                <h3 className="text-base font-bold text-white mb-2">{v.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Timeline ─────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-black text-white mb-12 text-center"
            style={{ fontFamily: "'Syne', sans-serif" }}>
            How we got here
          </h2>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 top-2 bottom-2 w-px bg-teal-900" />

            <div className="space-y-8">
              {TIMELINE.map((t, i) => (
                <div key={i} className="flex gap-6">
                  <div className="w-12 h-12 shrink-0 rounded-full bg-[#0d1322] border border-teal-900
                    flex items-center justify-center z-10">
                    <div className="w-3 h-3 rounded-full bg-teal-500" />
                  </div>
                  <div className="pt-2">
                    <p className="text-xs font-bold text-teal-400 uppercase tracking-widest mb-1">{t.year}</p>
                    <p className="text-sm text-slate-300 leading-relaxed">{t.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Tech Stack ───────────────────────────────────────── */}
      <section className="py-20 bg-[#060b17] border-y border-slate-800/50">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-black text-white mb-3 text-center"
            style={{ fontFamily: "'Syne', sans-serif" }}>
            Technology stack
          </h2>
          <p className="text-slate-500 text-center text-sm mb-12">
            Self-hosted, open infrastructure. No vendor lock-in.
          </p>

          <div className="flex flex-wrap gap-3 justify-center">
            {STACK.map((s, i) => (
              <div key={i}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#080d1f] border border-slate-800/60
                  rounded-xl text-sm">
                <div className={`w-2 h-2 rounded-full ${s.dot}`} />
                <span className="font-semibold text-white">{s.name}</span>
                <span className="text-slate-600 text-xs">{s.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact ──────────────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-white mb-4"
              style={{ fontFamily: "'Syne', sans-serif" }}>
              Get in touch
            </h2>
            <p className="text-slate-400">Have questions? Want a demo? We'd love to hear from you.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            {[
              { icon: '📧', label: 'Email',        value: 'hello@interviewpro.io' },
              { icon: '🐙', label: 'GitHub',        value: 'github.com/interviewpro' },
              { icon: '💼', label: 'LinkedIn',      value: 'linkedin.com/company/interviewpro' },
            ].map((c, i) => (
              <div key={i}
                className="bg-[#080d1f] border border-slate-800/60 rounded-2xl p-5 text-center">
                <div className="text-2xl mb-2">{c.icon}</div>
                <p className="text-xs text-slate-600 font-bold uppercase tracking-widest mb-1">{c.label}</p>
                <p className="text-xs text-teal-400 font-mono">{c.value}</p>
              </div>
            ))}
          </div>

          {/* Contact form */}
          <div className="bg-[#080d1f] border border-slate-800/60 rounded-3xl p-8">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Name
                  </label>
                  <input type="text" placeholder="Your name"
                    className="w-full bg-[#060b17] border border-slate-700 rounded-xl px-4 py-3
                      text-sm text-white focus:outline-none focus:border-teal-500 placeholder-slate-700" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Email
                  </label>
                  <input type="email" placeholder="you@company.com"
                    className="w-full bg-[#060b17] border border-slate-700 rounded-xl px-4 py-3
                      text-sm text-white focus:outline-none focus:border-teal-500 placeholder-slate-700" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Message
                </label>
                <textarea rows={5} placeholder="Tell us what you need…"
                  className="w-full bg-[#060b17] border border-slate-700 rounded-xl px-4 py-3
                    text-sm text-white focus:outline-none focus:border-teal-500 placeholder-slate-700 resize-none" />
              </div>
              <button
                className="w-full py-3.5 bg-teal-600 hover:bg-teal-500 text-white font-bold
                  rounded-xl text-sm transition-all active:scale-95">
                Send Message →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="py-16 bg-[#060b17] border-t border-slate-800/50 text-center">
        <div className="max-w-xl mx-auto px-6">
          <h2 className="text-3xl font-black text-white mb-4"
            style={{ fontFamily: "'Syne', sans-serif" }}>
            Ready to start?
          </h2>
          <p className="text-slate-400 mb-8 text-sm">
            Free to use. No credit card. No vendor lock-in.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register"
              className="px-8 py-4 bg-teal-600 hover:bg-teal-500 text-white font-bold
                rounded-2xl text-sm transition-all active:scale-95">
              Get Started →
            </Link>
            <Link to="/pricing"
              className="px-8 py-4 border border-slate-700 hover:border-slate-600 text-slate-400
                hover:text-white font-bold rounded-2xl text-sm transition-all">
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

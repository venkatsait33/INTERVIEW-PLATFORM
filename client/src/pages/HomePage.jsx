/**
 * HomePage.jsx
 *
 * Landing page for InterviewPro.
 * Aesthetic: dark editorial — deep navy, electric teal, Syne bold headers,
 * geometric grid, animated terminal demo, large typographic sections.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

/* ── Animated typing lines for the code preview ─────────── */
const CODE_LINES = [
  { text: 'function twoSum(nums, target) {', color: 'text-teal-300' },
  { text: '  const map = new Map();', color: 'text-slate-300' },
  { text: '  for (let i = 0; i < nums.length; i++) {', color: 'text-slate-300' },
  { text: '    const complement = target - nums[i];', color: 'text-slate-400' },
  { text: '    if (map.has(complement)) {', color: 'text-slate-300' },
  { text: '      return [map.get(complement), i];', color: 'text-emerald-400' },
  { text: '    }', color: 'text-slate-300' },
  { text: '    map.set(nums[i], i);', color: 'text-slate-400' },
  { text: '  }', color: 'text-slate-300' },
  { text: '}', color: 'text-teal-300' },
  { text: '', color: '' },
  { text: '// ✓ Output: [0, 1]  (2ms)', color: 'text-emerald-500' },
];

const STATS = [
  { value: '10k+',  label: 'Interviews conducted' },
  { value: '98%',   label: 'Platform uptime' },
  { value: '7',     label: 'Languages supported' },
  { value: '<50ms', label: 'Code sync latency' },
];

const FEATURES_PREVIEW = [
  {
    icon: '⚡',
    title: 'Real-time Code Editor',
    desc: 'Monaco-powered editor with live collaboration. Both users type — both see every keystroke instantly.',
  },
  {
    icon: '▶',
    title: 'Shared Code Execution',
    desc: 'Click Run once — output appears simultaneously for both interviewer and candidate via WebSocket.',
  },
  {
    icon: '🎥',
    title: 'Built-in Video Call',
    desc: 'WebRTC peer-to-peer video. No external service. No extra tabs. Everything in one screen.',
  },
  {
    icon: '💬',
    title: 'Live Chat Panel',
    desc: 'In-room chat for hints, clarifications, and quick notes — persisted so late-joiners see history.',
  },
  {
    icon: '🛡',
    title: 'Role-based Access',
    desc: 'Admin, HR, Interviewer, and Candidate — each sees exactly what they need, nothing more.',
  },
  {
    icon: '📧',
    title: 'Smart Notifications',
    desc: 'Auto-cancel with email alerts, no-show reporting, lobby admit flow — all automated.',
  },
];

const TESTIMONIALS = [
  {
    quote: 'We cut our interview setup time by 80%. Candidates join a link, code runs, feedback is logged — done.',
    name:  'Priya Mehta',
    title: 'Engineering Director, Fintech Startup',
    avatar: 'PM',
  },
  {
    quote: 'The shared code output is a game changer. I can see what the candidate is thinking as they run each test.',
    name:  'Samuel Okafor',
    title: 'Senior Software Engineer & Interviewer',
    avatar: 'SO',
  },
  {
    quote: "Finally a platform that respects candidate experience. No sign-ups required — they just join the room.",
    name:  'Anika Larsen',
    title: 'Head of Talent Acquisition',
    avatar: 'AL',
  },
];

/* ── Animated typing hook ────────────────────────────────── */
function useTypingAnimation(lines, speed = 30) {
  const [visibleLines, setVisibleLines] = useState([]);
  const [currentLine,  setCurrentLine]  = useState(0);
  const [currentChar,  setCurrentChar]  = useState(0);

  useEffect(() => {
    if (currentLine >= lines.length) return;
    const line = lines[currentLine];

    if (currentChar <= line.text.length) {
      const t = setTimeout(() => {
        setVisibleLines(prev => {
          const next = [...prev];
          next[currentLine] = { ...line, text: line.text.slice(0, currentChar) };
          return next;
        });
        setCurrentChar(c => c + 1);
      }, speed);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => {
        setCurrentLine(l => l + 1);
        setCurrentChar(0);
      }, 50);
      return () => clearTimeout(t);
    }
  }, [currentLine, currentChar, lines, speed]);

  return visibleLines;
}

export default function HomePage() {
  const typedLines = useTypingAnimation(CODE_LINES, 25);
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="overflow-x-hidden">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">

        {/* Background grid */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(20, 184, 166, 0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(20, 184, 166, 0.04) 1px, transparent 1px)
            `,
            backgroundSize: '64px 64px',
          }}
        />

        {/* Radial glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]
          rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse, rgba(20,184,166,0.12) 0%, transparent 70%)',
          }}
        />

        {/* Corner accent shapes */}
        <div className="absolute top-24 right-12 w-32 h-32 border border-teal-500/20 rounded-2xl
          rotate-12 pointer-events-none" />
        <div className="absolute top-36 right-20 w-16 h-16 border border-teal-500/15 rounded-xl
          rotate-45 pointer-events-none" />
        <div className="absolute bottom-24 left-8 w-24 h-24 border border-teal-500/10 rounded-2xl
          -rotate-6 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left: copy */}
            <div className={`transition-all duration-700 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                bg-teal-950/60 border border-teal-800/60 text-teal-400 text-xs font-semibold
                tracking-wide mb-6">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                Real-time Technical Interviews
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[0.95] tracking-tight text-white mb-6"
                style={{ fontFamily: "'Syne', sans-serif" }}>
                Interview<br />
                <span className="text-teal-400">smarter.</span><br />
                Hire<br />
                <span className="text-slate-400">faster.</span>
              </h1>

              <p className="text-lg text-slate-400 leading-relaxed max-w-xl mb-10">
                The complete technical interview platform — collaborative code editor,
                shared execution output, live video, and automated workflows. Built for
                engineering teams that move fast.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/register"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4
                    bg-teal-600 hover:bg-teal-500 text-white text-base font-bold rounded-2xl
                    transition-all active:scale-95 shadow-xl shadow-teal-900/40">
                  Start for Free
                  <span className="text-teal-300">→</span>
                </Link>
                <Link to="/features"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4
                    border border-slate-700 hover:border-teal-600 text-slate-300 hover:text-white
                    text-base font-bold rounded-2xl transition-all">
                  See How It Works
                </Link>
              </div>

              {/* Social proof */}
              <div className="mt-10 flex items-center gap-4">
                <div className="flex -space-x-2">
                  {['PM', 'SO', 'AL', 'RK', 'JW'].map((av, i) => (
                    <div key={av} className="w-9 h-9 rounded-full bg-teal-800 border-2 border-[#04091a]
                      flex items-center justify-center text-[10px] font-bold text-teal-200">
                      {av}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Trusted by 200+ teams</div>
                  <div className="text-xs text-slate-500">across 40+ countries</div>
                </div>
              </div>
            </div>

            {/* Right: animated code editor */}
            <div className={`transition-all duration-700 delay-200 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute -inset-4 rounded-3xl opacity-30 blur-2xl"
                  style={{ background: 'radial-gradient(ellipse, #14b8a6 0%, transparent 70%)' }} />

                {/* Editor window */}
                <div className="relative bg-[#0a0f1e] border border-slate-700/60 rounded-2xl overflow-hidden
                  shadow-2xl shadow-black/60">

                  {/* Window chrome */}
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800 bg-[#0d1322]">
                    <div className="w-3 h-3 rounded-full bg-red-500/70" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
                    <span className="ml-3 text-xs text-slate-500 font-mono">two-sum.js</span>
                    <div className="ml-auto flex items-center gap-2">
                      <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-950/60
                        px-2 py-0.5 rounded-full border border-emerald-900">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        2 participants
                      </div>
                    </div>
                  </div>

                  {/* Code area */}
                  <div className="p-5 font-mono text-sm leading-relaxed min-h-[280px]"
                    style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>
                    {CODE_LINES.map((line, i) => {
                      const visible = typedLines[i];
                      if (visible === undefined && i > typedLines.length) return null;
                      return (
                        <div key={i} className="flex">
                          <span className="text-slate-700 select-none w-8 shrink-0 text-right pr-3">
                            {i + 1}
                          </span>
                          <span className={visible?.color || line.color}>
                            {visible !== undefined ? visible.text : ''}
                            {i === typedLines.length - 1 && (
                              <span className="inline-block w-2 h-4 bg-teal-400 animate-pulse ml-0.5
                                rounded-sm align-middle" />
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Output bar */}
                  <div className="border-t border-slate-800 px-5 py-3 bg-[#060b17] flex items-center gap-3">
                    <span className="text-xs text-emerald-400 font-mono font-bold">✓ Output</span>
                    <span className="text-xs text-emerald-300 font-mono">[0, 1]</span>
                    <span className="text-xs text-slate-600 ml-auto font-mono">2ms · JavaScript 18</span>
                    <span className="text-[10px] text-teal-500 bg-teal-950/50 px-2 py-0.5 rounded-full
                      border border-teal-900">Both users see this</span>
                  </div>
                </div>

                {/* Floating chat bubble */}
                <div className="absolute -right-4 top-1/3 bg-[#0d1a2d] border border-teal-800/60
                  rounded-2xl p-3 shadow-xl max-w-[160px]">
                  <p className="text-[10px] text-teal-400 font-semibold mb-1">Interviewer</p>
                  <p className="text-xs text-slate-300">Good approach! Try edge case with empty array 👍</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────── */}
      <section className="py-16 border-y border-slate-800/50 bg-[#060b17]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl font-black text-teal-400 tracking-tight mb-1"
                  style={{ fontFamily: "'Syne', sans-serif" }}>
                  {s.value}
                </div>
                <div className="text-sm text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ────────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mb-16">
            <p className="text-teal-400 text-sm font-bold uppercase tracking-widest mb-3">Platform</p>
            <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight"
              style={{ fontFamily: "'Syne', sans-serif" }}>
              Everything you need.<br />
              <span className="text-slate-500">Nothing you don't.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES_PREVIEW.map((f, i) => (
              <div key={i}
                className="group relative bg-[#080d1f] border border-slate-800/60 rounded-2xl p-6
                  hover:border-teal-800/60 transition-all duration-300 hover:-translate-y-1">
                {/* Hover glow */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'radial-gradient(ellipse at top left, rgba(20,184,166,0.05), transparent 60%)' }} />

                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link to="/features"
              className="inline-flex items-center gap-2 text-teal-400 hover:text-teal-300
                text-sm font-bold transition-colors">
              View all features →
            </Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="py-24 bg-[#060b17]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-teal-400 text-sm font-bold uppercase tracking-widest mb-3">Workflow</p>
            <h2 className="text-4xl sm:text-5xl font-black text-white"
              style={{ fontFamily: "'Syne', sans-serif" }}>
              How it works
            </h2>
          </div>

          <div className="relative">
            {/* Connector line */}
            <div className="hidden lg:block absolute top-10 left-1/6 right-1/6 h-px bg-gradient-to-r
              from-transparent via-teal-800/60 to-transparent" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { step: '01', title: 'HR schedules',    desc: 'HR creates the interview and assigns interviewer and candidate.' },
                { step: '02', title: 'Candidate joins', desc: 'Candidate enters the lobby — interviewer admits with one click.' },
                { step: '03', title: 'Code together',   desc: 'Both write code in a shared editor. Either can run it — both see the output.' },
                { step: '04', title: 'Instant feedback', desc: 'Interviewer submits structured feedback. HR sees results in real time.' },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-[#0d1322] border border-teal-900/60
                    flex items-center justify-center mx-auto mb-4">
                    <span className="text-teal-400 font-black text-lg"
                      style={{ fontFamily: "'Syne', sans-serif" }}>{s.step}</span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{s.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-white"
              style={{ fontFamily: "'Syne', sans-serif" }}>
              Teams love it
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-[#080d1f] border border-slate-800/60 rounded-2xl p-6">
                <div className="text-3xl text-teal-800 font-serif mb-4">"</div>
                <p className="text-sm text-slate-300 leading-relaxed mb-6 italic">
                  {t.quote}
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-800 flex items-center justify-center
                    text-xs font-bold text-teal-200">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────── */}
      <section className="py-24 bg-[#060b17]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-5xl sm:text-6xl font-black text-white leading-tight mb-6"
            style={{ fontFamily: "'Syne', sans-serif" }}>
            Ready to run<br />
            <span className="text-teal-400">better interviews?</span>
          </h2>
          <p className="text-lg text-slate-400 mb-10">
            Set up in minutes. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register"
              className="px-10 py-4 bg-teal-600 hover:bg-teal-500 text-white text-base font-bold
                rounded-2xl transition-all active:scale-95 shadow-xl shadow-teal-900/40">
              Get Started Free →
            </Link>
            <Link to="/pricing"
              className="px-10 py-4 border border-slate-700 hover:border-teal-600 text-slate-300
                hover:text-white text-base font-bold rounded-2xl transition-all">
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

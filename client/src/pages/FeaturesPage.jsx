/**
 * FeaturesPage.jsx
 * Deep-dive into every InterviewPro feature.
 * Design: same dark editorial system as HomePage.
 */

import React from 'react';
import { Link } from 'react-router-dom';

const FEATURE_SECTIONS = [
  {
    tag:   'Code Editor',
    icon:  '⚡',
    title: 'Collaborative Monaco Editor',
    desc:  'The same editor that powers VS Code — embedded directly in the interview room. Both participants see every keystroke in real time with sub-50ms sync latency powered by Socket.io.',
    bullets: [
      'Live bi-directional code sync (no CRDT conflicts at 2-participant scale)',
      'Remote cursor ghost line — see exactly where the other person is typing',
      'Syntax highlighting for 7 languages: JS, TS, Python, Java, C++, Go, Rust',
      'Language selector synced — changing language updates both sides instantly',
      'Font ligatures, smooth scrolling, gutter line numbers',
    ],
    visual: {
      lines: [
        { num: 1,  text: 'function binarySearch(arr, target) {', c: 'text-teal-300' },
        { num: 2,  text: '  let l = 0, r = arr.length - 1;',    c: 'text-slate-300' },
        { num: 3,  text: '  while (l <= r) {',                   c: 'text-slate-300' },
        { num: 4,  text: '    const mid = Math.floor((l+r)/2);', c: 'text-slate-400' },
        { num: 5,  text: '    if (arr[mid] === target) return mid;', c: 'text-emerald-400' },
        { num: 6,  text: '    arr[mid] < target ? l=mid+1 : r=mid-1;', c: 'text-slate-300' },
        { num: 7,  text: '  }', c: 'text-slate-300' },
        { num: 8,  text: '  return -1;', c: 'text-slate-400' },
        { num: 9,  text: '}', c: 'text-teal-300' },
      ],
      badge: '⟵ Interviewer cursor',
      lang:  'JavaScript',
    },
  },
  {
    tag:   'Execution',
    icon:  '▶',
    title: 'Shared Code Execution',
    desc:  'The most important feature: when EITHER person clicks Run, the output appears on BOTH screens instantly. The runner emits two socket events — run-start (spinner on both) and run-result (output on both).',
    bullets: [
      'Piston API backend — isolated execution sandboxes, no code escapes',
      'Execution time reported in ms — lets you discuss algorithmic complexity',
      'stdout + stderr separated — clean error display with exit code badge',
      'Last run result synced on join — late arrivals see previous output',
      'Animated loading state shows WHO triggered the run',
    ],
    visual: null,
    outputDemo: {
      input:  'twoSum([2, 7, 11, 15], 9)',
      output: '[0, 1]',
      time:   '3ms',
      exit:   0,
      runBy:  'Interviewer',
    },
  },
  {
    tag:   'Video',
    icon:  '🎥',
    title: 'WebRTC Peer Video',
    desc:  'Browser-native video calling via PeerJS — no Twilio, no Daily, no external billing. Signaling goes through your own Socket.io server, media is direct peer-to-peer.',
    bullets: [
      'Camera + microphone with in-room toggle buttons',
      'Candidate video + local preview side-by-side in the right panel',
      'Graceful fallback if media permissions are denied',
      'Works alongside code editor and chat without separate windows',
    ],
    visual: null,
  },
  {
    tag:   'Chat',
    icon:  '💬',
    title: 'In-room Live Chat',
    desc:  'A persistent chat panel embedded directly in the interview room — no third-party SDK. Messages are stored in room memory and synced to new joiners so nothing is lost.',
    bullets: [
      'Real-time delivery via Socket.io room broadcast',
      'Sender name, role badge, and timestamp on every message',
      'History preserved for the session (last 200 messages)',
      'Chat available as a tab in the bottom output panel',
      'Toast notifications when a message arrives while on Output tab',
    ],
    visual: null,
  },
  {
    tag:   'Roles',
    icon:  '🛡',
    title: 'Role-based Access Control',
    desc:  'Four distinct roles with separate dashboards, permissions, and views. JWT-based auth with bcrypt passwords — no third-party auth service required.',
    bullets: [
      'Admin — full platform overview, user management, all interviews',
      'HR — schedule interviews, assign interviewer/candidate pairs, view results',
      'Interviewer — dashboard, lobby admit, code room, feedback submission',
      'Candidate — upcoming interviews, lobby join, room entry',
    ],
    visual: null,
    roles: [
      { label: 'Admin',       color: 'bg-red-900/40 text-red-400 border-red-800'       },
      { label: 'HR',          color: 'bg-blue-900/40 text-blue-400 border-blue-800'     },
      { label: 'Interviewer', color: 'bg-emerald-900/40 text-emerald-400 border-emerald-800' },
      { label: 'Candidate',   color: 'bg-purple-900/40 text-purple-400 border-purple-800'    },
    ],
  },
  {
    tag:   'Automation',
    icon:  '🤖',
    title: 'Smart Scheduling & Automation',
    desc:  'Automated workflows keep interviews on track without manual intervention. All powered by Node.js setTimeout and Socket.io — no third-party job queue.',
    bullets: [
      '6-hour auto-cancel timer — prevents zombie interviews staying open forever',
      'Email notifications to all parties on schedule, cancel, and completion',
      'No-show reporting — either party can report after 60-minute wait',
      'No-show emails sent to both reporter (confirmed) and absent party (warned)',
      'Activity and notification logs stored in MongoDB for audit trails',
    ],
    visual: null,
  },
];

export default function FeaturesPage() {
  return (
    <div className="pt-16">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(rgba(20,184,166,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(20,184,166,0.03) 1px, transparent 1px)`,
            backgroundSize: '64px 64px',
          }} />

        <div className="max-w-4xl mx-auto px-6 text-center relative">
          <p className="text-teal-400 text-sm font-bold uppercase tracking-widest mb-4">Platform Features</p>
          <h1 className="text-5xl sm:text-6xl font-black text-white leading-tight mb-6"
            style={{ fontFamily: "'Syne', sans-serif" }}>
            Built for how<br />
            <span className="text-teal-400">engineers actually work.</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Every feature was designed around real interview workflows —
            not generic video-call bolt-ons.
          </p>
        </div>
      </section>

      {/* ── Feature sections ─────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 space-y-8 pb-24">
        {FEATURE_SECTIONS.map((section, si) => (
          <div key={si}
            className="bg-[#080d1f] border border-slate-800/60 rounded-3xl p-8 lg:p-12
              relative overflow-hidden">

            {/* Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full
              bg-teal-950/50 border border-teal-900 text-teal-400 text-xs font-bold
              uppercase tracking-widest mb-6">
              <span>{section.icon}</span>
              <span>{section.tag}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              {/* Text */}
              <div>
                <h2 className="text-3xl font-black text-white mb-4 leading-tight"
                  style={{ fontFamily: "'Syne', sans-serif" }}>
                  {section.title}
                </h2>
                <p className="text-slate-400 leading-relaxed mb-6">{section.desc}</p>

                <ul className="space-y-3">
                  {section.bullets.map((b, bi) => (
                    <li key={bi} className="flex items-start gap-3 text-sm text-slate-300">
                      <span className="w-5 h-5 rounded-full bg-teal-900/60 border border-teal-800 flex items-center
                        justify-center text-teal-400 shrink-0 mt-0.5 text-[10px] font-bold">✓</span>
                      {b}
                    </li>
                  ))}
                </ul>

                {section.roles && (
                  <div className="flex flex-wrap gap-2 mt-6">
                    {section.roles.map(r => (
                      <span key={r.label}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${r.color}`}>
                        {r.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Visual */}
              <div>
                {section.visual && (
                  <div className="bg-[#0a0f1e] border border-slate-700/40 rounded-2xl overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800 bg-[#0d1322]">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                      </div>
                      <span className="ml-2 text-xs text-slate-500 font-mono">binary-search.js</span>
                      <span className="ml-auto text-[10px] text-slate-600 font-mono">{section.visual.lang}</span>
                    </div>
                    <div className="p-4 font-mono text-xs leading-relaxed"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {section.visual.lines.map(l => (
                        <div key={l.num} className="flex">
                          <span className="text-slate-700 w-6 shrink-0 text-right mr-4">{l.num}</span>
                          <span className={l.c}>{l.text}</span>
                        </div>
                      ))}
                      <div className="mt-2 flex items-center gap-2 text-teal-500 text-[10px]">
                        <span>▶</span>
                        <span className="h-px flex-1 bg-teal-900/60" />
                        <span>{section.visual.badge}</span>
                      </div>
                    </div>
                  </div>
                )}

                {section.outputDemo && (
                  <div className="bg-[#0a0f1e] border border-slate-700/40 rounded-2xl overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-slate-800 bg-[#0d1322] flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-500">Output Panel</span>
                      <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-teal-950 text-teal-400
                        border border-teal-900">Run by {section.outputDemo.runBy}</span>
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-slate-500 font-mono mb-2">
                        &gt; {section.outputDemo.input}
                      </p>
                      <p className="text-lg font-mono text-emerald-400 font-bold mb-3">
                        {section.outputDemo.output}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] text-slate-600 font-mono">
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-500 border border-emerald-900">
                          exit 0
                        </span>
                        <span>{section.outputDemo.time}</span>
                        <span className="text-teal-500">↗ Both participants see this</span>
                      </div>
                    </div>
                  </div>
                )}

                {!section.visual && !section.outputDemo && !section.roles && (
                  <div className="h-32 bg-[#060b17] rounded-2xl border border-slate-800/40 flex items-center
                    justify-center">
                    <span className="text-6xl opacity-20">{section.icon}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="py-20 bg-[#060b17] border-t border-slate-800/50">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-black text-white mb-4"
            style={{ fontFamily: "'Syne', sans-serif" }}>
            See it in action
          </h2>
          <p className="text-slate-400 mb-8">Set up your first interview in under 5 minutes.</p>
          <Link to="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-teal-600 hover:bg-teal-500
              text-white font-bold rounded-2xl transition-all active:scale-95">
            Start Free →
          </Link>
        </div>
      </section>
    </div>
  );
}

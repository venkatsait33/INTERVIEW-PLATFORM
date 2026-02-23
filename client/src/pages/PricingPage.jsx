/**
 * PricingPage.jsx
 * Three pricing tiers + FAQ.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const PLANS = [
  {
    name:     'Starter',
    price:    'Free',
    period:   '',
    desc:     'Perfect for small teams and early-stage startups.',
    highlight: false,
    cta:      { label: 'Get Started Free', to: '/register' },
    features: [
      '5 interviews / month',
      'Up to 2 interviewers',
      'Collaborative code editor',
      'Shared code execution (Python, JS)',
      'Socket.io chat',
      'Email notifications',
      '7-day interview history',
    ],
    missing: [
      'Video recording',
      'Custom branding',
      'Priority support',
      'API access',
    ],
  },
  {
    name:     'Team',
    price:    '$49',
    period:   '/month',
    desc:     'For growing engineering teams running regular technical interviews.',
    highlight: true,
    cta:      { label: 'Start Free Trial', to: '/register' },
    features: [
      'Unlimited interviews',
      'Up to 20 interviewers',
      'All 7 languages',
      'Shared code execution',
      'WebRTC video (no extra cost)',
      'Role-based dashboards',
      'No-show reporting + emails',
      '6-hour auto-cancel',
      '90-day history',
      'Priority email support',
    ],
    missing: [
      'Video recording',
      'SSO / SAML',
      'Dedicated CSM',
    ],
  },
  {
    name:     'Enterprise',
    price:    'Custom',
    period:   '',
    desc:     'For large organisations with custom compliance and integration needs.',
    highlight: false,
    cta:      { label: 'Contact Sales', to: '/about' },
    features: [
      'Everything in Team',
      'Unlimited everything',
      'Video recording + storage',
      'SSO / SAML integration',
      'Custom domain & branding',
      'API access + webhooks',
      'SLA guarantees',
      'Dedicated customer success manager',
      'On-prem deployment option',
      'Custom data retention',
    ],
    missing: [],
  },
];

const FAQ = [
  {
    q: 'Do candidates need to sign up?',
    a: 'No. Candidates join via a secure link with a room token — they don\'t need an account. Only HR, interviewers, and admins need an InterviewPro account.',
  },
  {
    q: 'Which programming languages are supported?',
    a: 'JavaScript, TypeScript, Python, Java, C++, Go, and Rust. Code runs in isolated Piston sandboxes. Both participants see the output when either clicks Run.',
  },
  {
    q: 'Is this self-hosted?',
    a: 'Yes — InterviewPro ships as a Docker Compose stack. You run it on your own infrastructure. No third-party auth (no Clerk) and no background job service (no Inngest) required.',
  },
  {
    q: 'How does the shared code output work?',
    a: 'When either participant clicks "Run", a code:run-start event is emitted via Socket.io — both users see a loading state. The runner calls the Piston API, then emits code:run-result which the server broadcasts to the entire room. Both see identical output simultaneously.',
  },
  {
    q: 'What happens if someone doesn\'t show up?',
    a: 'After 60 minutes of waiting, the present participant can report a no-show. The interview is cancelled, and both parties receive an email notification. There is also a 6-hour auto-cancel timer that fires if an interview stays open too long.',
  },
  {
    q: 'Can I change plans later?',
    a: 'Yes. Upgrade or downgrade at any time from your admin dashboard. Changes take effect immediately.',
  },
];

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="pt-16">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="py-24 text-center relative">
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(ellipse at 50% 0%, rgba(20,184,166,0.1) 0%, transparent 60%)`,
          }} />
        <div className="max-w-3xl mx-auto px-6 relative">
          <p className="text-teal-400 text-sm font-bold uppercase tracking-widest mb-4">Pricing</p>
          <h1 className="text-5xl sm:text-6xl font-black text-white leading-tight mb-6"
            style={{ fontFamily: "'Syne', sans-serif" }}>
            Simple, honest pricing.
          </h1>
          <p className="text-lg text-slate-400">
            Start free. Scale as you hire. No per-seat surprises.
          </p>
        </div>
      </section>

      {/* ── Plans ────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {PLANS.map((plan, i) => (
            <div key={i}
              className={`relative rounded-3xl p-8 flex flex-col transition-all duration-300 ${
                plan.highlight
                  ? 'bg-teal-950/30 border-2 border-teal-600/70 shadow-2xl shadow-teal-900/30'
                  : 'bg-[#080d1f] border border-slate-800/60'
              }`}>

              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1
                  bg-teal-500 rounded-full text-xs font-black text-slate-900 tracking-wide uppercase">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-black text-white mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-black text-white"
                    style={{ fontFamily: "'Syne', sans-serif" }}>{plan.price}</span>
                  {plan.period && <span className="text-slate-500 text-sm">{plan.period}</span>}
                </div>
                <p className="text-sm text-slate-500">{plan.desc}</p>
              </div>

              <Link to={plan.cta.to}
                className={`w-full py-3 rounded-2xl text-sm font-bold text-center mb-8
                  transition-all active:scale-95 ${
                  plan.highlight
                    ? 'bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-900/40'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}>
                {plan.cta.label}
              </Link>

              <ul className="space-y-3 mb-6">
                {plan.features.map((f, fi) => (
                  <li key={fi} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <span className="text-teal-400 shrink-0 mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
                {plan.missing.map((f, fi) => (
                  <li key={fi} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <span className="shrink-0 mt-0.5">✕</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Guarantee banner */}
        <div className="mt-12 bg-[#080d1f] border border-slate-800/60 rounded-2xl p-6
          flex items-center gap-4 text-center sm:text-left">
          <div className="text-3xl shrink-0 hidden sm:block">🛡</div>
          <div>
            <p className="text-sm font-bold text-white mb-1">30-day money-back guarantee</p>
            <p className="text-sm text-slate-500">
              Not happy? We'll refund your first payment, no questions asked.
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section className="py-20 bg-[#060b17] border-t border-slate-800/50">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-black text-white text-center mb-12"
            style={{ fontFamily: "'Syne', sans-serif" }}>
            Frequently asked questions
          </h2>

          <div className="space-y-3">
            {FAQ.map((item, i) => (
              <div key={i}
                className="bg-[#080d1f] border border-slate-800/60 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left">
                  <span className="text-sm font-semibold text-white">{item.q}</span>
                  <span className={`text-teal-400 text-lg shrink-0 ml-4 transition-transform ${
                    openFaq === i ? 'rotate-45' : ''
                  }`}>+</span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 border-t border-slate-800/60">
                    <p className="text-sm text-slate-400 leading-relaxed pt-4">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────── */}
      <section className="py-20 text-center">
        <div className="max-w-xl mx-auto px-6">
          <h2 className="text-3xl font-black text-white mb-4"
            style={{ fontFamily: "'Syne', sans-serif" }}>
            Still have questions?
          </h2>
          <p className="text-slate-400 mb-8">
            Talk to our team — we typically respond within a few hours.
          </p>
          <Link to="/about"
            className="inline-flex items-center gap-2 px-8 py-4 border border-slate-700
              hover:border-teal-600 text-slate-300 hover:text-white font-bold rounded-2xl
              transition-all">
            Contact Us →
          </Link>
        </div>
      </section>
    </div>
  );
}

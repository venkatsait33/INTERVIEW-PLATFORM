/**
 * PublicLayout.jsx
 * Shared nav + footer wrapper for all public-facing pages
 * (Home, About, Features, Pricing, Login, Register).
 *
 * Design: Deep navy, electric teal accents, Syne font, geometric details.
 */

import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV_LINKS = [
  { label: 'Features', to: '/features' },
  { label: 'Pricing',  to: '/pricing'  },
  { label: 'About',    to: '/about'    },
];

export default function PublicLayout() {
  const [scrolled,      setScrolled]      = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user }    = useAuth();
  const location    = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => setMobileMenuOpen(false), [location.pathname]);

  const dashboardPath = user
    ? { admin: '/admin', hr: '/hr', interviewer: '/interviewer', candidate: '/candidate' }[user.role] || '/'
    : null;

  return (
    <div className="min-h-screen bg-[#04091a] text-slate-200"
      style={{ fontFamily: "'Syne', 'DM Sans', sans-serif" }}>

      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#04091a]/95 backdrop-blur-xl border-b border-slate-800/60 shadow-2xl shadow-black/40'
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center
              text-slate-900 text-sm font-black tracking-tighter group-hover:bg-teal-400 transition-colors">
              IP
            </div>
            <span className="text-lg font-black tracking-tight text-white">
              Interview<span className="text-teal-400">Pro</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(link => (
              <Link key={link.to} to={link.to}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  location.pathname === link.to
                    ? 'text-teal-400 bg-teal-950/50'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}>
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Link to={dashboardPath}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl
                  text-sm font-bold transition-all active:scale-95">
                Go to Dashboard →
              </Link>
            ) : (
              <>
                <Link to="/login"
                  className="px-4 py-2 text-slate-300 hover:text-white text-sm font-semibold
                    transition-colors">
                  Sign In
                </Link>
                <Link to="/register"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl
                    text-sm font-bold transition-all active:scale-95 shadow-lg shadow-teal-900/50">
                  Get Started →
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5"
            onClick={() => setMobileMenuOpen(o => !o)}>
            <span className={`w-5 h-0.5 bg-slate-300 transition-all ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`w-5 h-0.5 bg-slate-300 transition-all ${mobileMenuOpen ? 'opacity-0' : ''}`} />
            <span className={`w-5 h-0.5 bg-slate-300 transition-all ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#080d1f] border-t border-slate-800 px-6 py-4 space-y-2">
            {NAV_LINKS.map(link => (
              <Link key={link.to} to={link.to}
                className="block px-4 py-3 rounded-xl text-sm font-semibold text-slate-300
                  hover:text-white hover:bg-slate-800 transition-colors">
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              {user ? (
                <Link to={dashboardPath}
                  className="block text-center px-4 py-3 bg-teal-600 text-white rounded-xl
                    text-sm font-bold">
                  Go to Dashboard →
                </Link>
              ) : (
                <>
                  <Link to="/login"
                    className="block text-center px-4 py-3 text-slate-300 text-sm font-semibold">
                    Sign In
                  </Link>
                  <Link to="/register"
                    className="block text-center px-4 py-3 bg-teal-600 text-white rounded-xl
                      text-sm font-bold">
                    Get Started →
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* ── Page Content ─────────────────────────────────────── */}
      <main>
        <Outlet />
      </main>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-slate-800/50 bg-[#040912]">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <Link to="/" className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-teal-500 rounded-lg flex items-center justify-center
                  text-slate-900 text-xs font-black">IP</div>
                <span className="font-black text-white">Interview<span className="text-teal-400">Pro</span></span>
              </Link>
              <p className="text-sm text-slate-500 leading-relaxed">
                The complete technical interview platform for modern engineering teams.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Product</h4>
              <ul className="space-y-2.5">
                {[['Features', '/features'], ['Pricing', '/pricing'], ['About', '/about']].map(([l, h]) => (
                  <li key={h}>
                    <Link to={h} className="text-sm text-slate-500 hover:text-teal-400 transition-colors">{l}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Platform */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Platform</h4>
              <ul className="space-y-2.5">
                {[['Sign In', '/login'], ['Register', '/register'], ['Dashboard', '/dashboard']].map(([l, h]) => (
                  <li key={h}>
                    <Link to={h} className="text-sm text-slate-500 hover:text-teal-400 transition-colors">{l}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Legal</h4>
              <ul className="space-y-2.5">
                {[['Privacy Policy', '#'], ['Terms of Service', '#'], ['Cookie Policy', '#']].map(([l, h]) => (
                  <li key={l}>
                    <a href={h} className="text-sm text-slate-500 hover:text-teal-400 transition-colors">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between pt-8 border-t border-slate-800/50">
            <p className="text-xs text-slate-600">© {new Date().getFullYear()} InterviewPro. All rights reserved.</p>
            <p className="text-xs text-slate-600 mt-2 sm:mt-0">
              Built with Socket.io · JWT · MongoDB · React
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

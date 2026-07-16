import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, CheckCircle, Dumbbell, ListTodo, Shield, MapPin, Phone, Mail,
  FolderKanban, Folder, BellRing, CalendarClock, Wallet, Receipt, Sparkles,
  Bell, Activity, Users, Lock, LayoutDashboard, Smartphone, ShieldCheck, KeyRound, Zap,
} from 'lucide-react';

// Flagship modules — big showcase cards
const CORE = [
  { icon: FolderKanban, title: 'Task Board', desc: 'Kanban boards with priorities, due dates, approvals and projects — powerful task management for your whole team.' },
  { icon: Dumbbell, title: 'Gym Tracker', desc: 'Log meals, workouts and water. Protein ring, weight trends, charts and a beautiful day-by-day fitness journal.' },
  { icon: Wallet, title: 'SpendFlow', desc: 'Track expenses and receipts by category and payment mode, with clean analytics that show where money goes.' },
  { icon: Sparkles, title: 'AI Assistant', desc: 'A built-in AI chat that helps you plan tasks, summarize your day and get more done — right inside the app.' },
];

// Every module in the suite
const MODULES = [
  { icon: FolderKanban, title: 'Task Board', desc: 'Kanban, priorities & due dates.' },
  { icon: ListTodo, title: 'Task Management', desc: 'Assign, approve & oversee team work.' },
  { icon: Folder, title: 'Projects', desc: 'Group tasks into organized projects.' },
  { icon: Dumbbell, title: 'Gym & Nutrition', desc: 'Meals, workouts, water & protein.' },
  { icon: BellRing, title: 'Smart Reminders', desc: '15-min & 1-hr alerts, repeat & snooze.' },
  { icon: CalendarClock, title: 'Calendar & Events', desc: 'Schedule events with email reminders.' },
  { icon: Wallet, title: 'SpendFlow', desc: 'Personal expense tracking & analytics.' },
  { icon: Receipt, title: 'Office Expenses', desc: 'Reimbursement & claims tracker.' },
  { icon: Sparkles, title: 'AI Assistant', desc: 'Chat-based AI to plan & summarize.' },
  { icon: Bell, title: 'Notifications', desc: 'Real-time in-app & email alerts.' },
  { icon: Activity, title: 'Activity Log', desc: 'Full audit trail of every action.' },
  { icon: Users, title: 'Team & Permissions', desc: 'Roles & granular access control.' },
  { icon: Lock, title: 'Private Vault', desc: 'PIN-protected hidden modules.' },
  { icon: LayoutDashboard, title: 'Dashboard', desc: 'Insights & analytics at a glance.' },
  { icon: Smartphone, title: 'Install as App', desc: 'PWA — works offline, push alerts.' },
];

const SECURITY = [
  { icon: ShieldCheck, title: 'JWT Authentication', desc: 'Signed, expiring tokens on every request.' },
  { icon: KeyRound, title: 'Two-Factor (2FA)', desc: 'Optional TOTP with authenticator apps.' },
  { icon: Zap, title: 'Rate-Limited Login', desc: 'Brute-force protection & login alerts.' },
  { icon: Lock, title: 'Private by Default', desc: 'Encrypted secrets — your data stays yours.' },
];

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      {/* Ambient background */}
      <div className="landing-bg-orb landing-bg-orb-1" />
      <div className="landing-bg-orb landing-bg-orb-2" />
      <div className="landing-bg-orb landing-bg-orb-3" />

      {/* Nav */}
      <nav className="landing-nav">
        <div className="landing-nav-brand">
          <img src="/logo.png" alt="Logo" style={{ height: 32 }} />
          <span className="landing-nav-name">Helios</span>
        </div>
        <div className="landing-nav-links">
          <a href="#modules">Features</a>
          <a href="#security">Security</a>
          <a href="#contact">Contact</a>
        </div>
        <div className="landing-nav-actions">
          <Link to="/login" className="landing-nav-login">Login</Link>
          <Link to="/login" className="landing-nav-cta">Get Started <ArrowRight size={16} /></Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-badge">✨ One workspace for work, fitness &amp; money</div>
        <h1 className="landing-h1">
          <span className="landing-h1-dark">Work Smarter.</span><br />
          <span className="landing-h1-accent">Stay Fit. Save More.</span>
        </h1>
        <p className="landing-sub">
          Helios unifies task management, gym &amp; nutrition tracking, expenses and an AI assistant —
          all in one beautifully designed, secure workspace.
        </p>
        <div className="landing-hero-actions">
          <button onClick={() => navigate('/login')} className="landing-cta-primary">
            Start for free <ArrowRight size={18} />
          </button>
          <a href="#modules" className="landing-cta-ghost">Explore features</a>
        </div>

        {/* Stats strip */}
        <div className="landing-stats">
          <div className="landing-stat"><span className="landing-stat-num">15+</span><span className="landing-stat-label">Modules</span></div>
          <div className="landing-stat"><span className="landing-stat-num">Real-time</span><span className="landing-stat-label">Live sync</span></div>
          <div className="landing-stat"><span className="landing-stat-num">2FA</span><span className="landing-stat-label">Secured</span></div>
          <div className="landing-stat"><span className="landing-stat-num">PWA</span><span className="landing-stat-label">Installable</span></div>
        </div>
      </section>

      {/* Core modules — big cards */}
      <section className="landing-section">
        <div className="landing-section-head">
          <span className="landing-eyebrow">Core suite</span>
          <h2 className="landing-section-title">Four powerful apps, one login</h2>
          <p className="landing-section-sub">Everything you use every day, unified so nothing falls through the cracks.</p>
        </div>
        <div className="landing-core">
          {CORE.map((f, i) => (
            <div key={i} className="landing-core-card">
              <div className="landing-core-icon"><f.icon size={26} /></div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* All modules grid */}
      <section className="landing-section" id="modules">
        <div className="landing-section-head">
          <span className="landing-eyebrow">Everything included</span>
          <h2 className="landing-section-title">All your tools in one place</h2>
          <p className="landing-section-sub">From tasks and projects to fitness, finance, reminders and AI — no more app juggling.</p>
        </div>
        <div className="landing-modules">
          {MODULES.map((m, i) => (
            <div key={i} className="landing-module-card">
              <div className="landing-module-icon"><m.icon size={20} /></div>
              <div>
                <h4>{m.title}</h4>
                <p>{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Security band */}
      <section className="landing-security" id="security">
        <div className="landing-section-head">
          <span className="landing-eyebrow">Built-in security</span>
          <h2 className="landing-section-title">Private &amp; secure by design</h2>
          <p className="landing-section-sub">Your workspace is protected at every layer — from login to storage.</p>
        </div>
        <div className="landing-security-grid">
          {SECURITY.map((s, i) => (
            <div key={i} className="landing-security-item">
              <div className="landing-security-icon"><s.icon size={22} /></div>
              <h4>{s.title}</h4>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Social proof */}
      <section className="landing-proof">
        <div className="landing-proof-item"><CheckCircle size={18} color="#10B981" /> Real-time sync</div>
        <div className="landing-proof-item"><CheckCircle size={18} color="#10B981" /> Mobile responsive</div>
        <div className="landing-proof-item"><CheckCircle size={18} color="#10B981" /> Email notifications</div>
        <div className="landing-proof-item"><CheckCircle size={18} color="#10B981" /> PWA installable</div>
      </section>

      {/* Footer CTA */}
      <section className="landing-footer-cta">
        <h2>Ready to bring it all together?</h2>
        <p className="landing-footer-cta-sub">Join Helios and run your work, health and finances from one place.</p>
        <button onClick={() => navigate('/login')} className="landing-cta-primary">Get Started — It's Free <ArrowRight size={18} /></button>
      </section>

      {/* Footer */}
      <footer className="landing-footer" id="contact">
        <div className="landing-footer-grid">
          <div className="landing-footer-brand">
            <div className="landing-footer-logo">
              <img src="/logo.png" alt="Helios" style={{ height: 28 }} />
              <span>Helios</span>
            </div>
            <p>Your all-in-one workspace for tasks, fitness &amp; expenses — beautifully unified in one premium suite.</p>
          </div>

          <div className="landing-footer-col">
            <h4>Product</h4>
            <a href="#modules">Task Board</a>
            <a href="#modules">Gym Tracker</a>
            <a href="#modules">SpendFlow</a>
            <a href="#modules">AI Assistant</a>
            <Link to="/login">Login</Link>
          </div>

          <div className="landing-footer-col landing-footer-contact">
            <h4>Get in touch</h4>
            <div className="landing-footer-contact-item">
              <MapPin size={17} />
              <span>Office 1204, Boulevard Plaza Tower 1,<br />Downtown Dubai, United Arab Emirates</span>
            </div>
            <div className="landing-footer-contact-item">
              <Phone size={17} />
              <a href="tel:+97141234567">+971 4 123 4567</a>
            </div>
            <div className="landing-footer-contact-item">
              <Mail size={17} />
              <a href="mailto:hello@kunjtech.in">hello@kunjtech.in</a>
            </div>
          </div>
        </div>

        <div className="landing-footer-bottom">
          <span>© {new Date().getFullYear()} Helios. All rights reserved.</span>
          <span>Made with ❤️ in Dubai</span>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

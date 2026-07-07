import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle, Dumbbell, IndianRupee, ListTodo, Shield } from 'lucide-react';

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
        <div className="landing-nav-actions">
          <Link to="/login" className="landing-nav-login">Login</Link>
          <Link to="/login" className="landing-nav-cta">Get Started <ArrowRight size={16} /></Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-badge">✨ Your all-in-one productivity suite</div>
        <h1 className="landing-h1">
          <span className="landing-h1-dark">Work Smarter.</span><br />
          <span className="landing-h1-accent">Stay Fit. Save More.</span>
        </h1>
        <p className="landing-sub">
          Task management, gym & nutrition tracking, expense control — beautifully unified in one premium workspace.
        </p>
        <div className="landing-hero-actions">
          <button onClick={() => navigate('/login')} className="landing-cta-primary">
            Start for free <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* Features grid */}
      <section className="landing-features">
        {[
          { icon: ListTodo, title: 'Task Board', desc: 'Kanban, priorities, projects — powerful task management for your team.' },
          { icon: Dumbbell, title: 'Gym Tracker', desc: 'Log meals, workouts, water. Protein ring, charts, daily journal.' },
          { icon: IndianRupee, title: 'SpendFlow', desc: 'Track expenses, receipts, categories. Beautiful analytics.' },
          { icon: Shield, title: 'Secure & Private', desc: 'Rate-limited login, JWT auth, encrypted. Your data stays yours.' },
        ].map((f, i) => (
          <div key={i} className="landing-feature-card">
            <div className="landing-feature-icon"><f.icon size={24} /></div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
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
        <h2>Ready to level up?</h2>
        <button onClick={() => navigate('/login')} className="landing-cta-primary">Get Started — It's Free <ArrowRight size={18} /></button>
      </section>

      <footer className="landing-footer">
        <span>© {new Date().getFullYear()} Helios. Built with ❤️</span>
      </footer>
    </div>
  );
};

export default Landing;

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    // In a real app, we might capture the email. Here we just go to login/signup.
    navigate('/login');
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#FAF9F6', // Elegant Warm Cream / Off-White
      position: 'relative', 
      overflow: 'hidden', 
      fontFamily: '"Inter", sans-serif',
      color: '#123246'
    }}>
      
      {/* Background Dot Pattern */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)'
      }} />

      {/* Beautiful Ambient Mesh Gradients */}
      <div style={{
        position: 'absolute', top: '-10%', right: '-5%', width: '800px', height: '800px',
        background: 'radial-gradient(circle, rgba(255, 183, 130, 0.25) 0%, rgba(255,255,255,0) 70%)', // Soft peach
        filter: 'blur(70px)', zIndex: 0, pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '-20%', left: '-10%', width: '900px', height: '900px',
        background: 'radial-gradient(circle, rgba(130, 224, 255, 0.25) 0%, rgba(255,255,255,0) 70%)', // Soft cyan
        filter: 'blur(90px)', zIndex: 0, pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', top: '20%', left: '15%', width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(255, 236, 179, 0.3) 0%, rgba(255,255,255,0) 70%)', // Soft yellow
        filter: 'blur(70px)', zIndex: 0, pointerEvents: 'none'
      }} />
      {/* Navigation */}
      <nav style={{ 
        position: 'relative', 
        zIndex: 10, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '2rem 4rem',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <img src="/logo.png" alt="Purple Logo" style={{ height: '36px' }} />
          <div style={{ fontSize: '1.75rem', fontWeight: '900', color: '#1B263B', letterSpacing: '-0.5px' }}>
            Pur<span style={{ color: '#F4A261' }}>p</span>le
          </div>
        </div>

        {/* Center Links */}
        <div style={{ display: 'flex', gap: '2.5rem', fontWeight: '600', fontSize: '0.9rem', color: '#123246' }}>
          <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Products <span style={{ fontSize: '0.7rem' }}>▼</span>
          </div>
          <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Developers <span style={{ fontSize: '0.7rem' }}>▼</span>
          </div>
          <div style={{ cursor: 'pointer' }}>Pricing</div>
          <div style={{ cursor: 'pointer' }}>Blog</div>
          <div style={{ cursor: 'pointer' }}>Company</div>
        </div>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Link to="/login" style={{ color: '#123246', fontWeight: '600', fontSize: '0.95rem', textDecoration: 'none' }}>
            Login
          </Link>
          <Link to="/login" style={{ 
            padding: '0.6rem 1.25rem', 
            borderRadius: '8px', 
            backgroundColor: 'rgba(255, 255, 255, 0.7)', 
            backdropFilter: 'blur(5px)',
            color: '#123246', 
            fontWeight: '600', 
            fontSize: '0.95rem', 
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            border: '1px solid rgba(0,0,0,0.05)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
          }}>
            Get started <ChevronRight size={16} />
          </Link>
        </div>
      </nav>

      {/* Hero Content */}
      <main style={{ 
        position: 'relative', 
        zIndex: 10, 
        maxWidth: '1400px', 
        margin: '0 auto', 
        padding: '8rem 4rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        
        <h1 style={{ 
          fontSize: 'clamp(4rem, 8.5vw, 8rem)', 
          fontWeight: '900', 
          lineHeight: '0.9', 
          letterSpacing: '-4px', 
          margin: '0 0 2rem 0' 
        }}>
          <div style={{ color: '#092A3A' }}>FedNow</div>
          <div style={{ color: '#889BA5' }}>EarlyAccess</div>
        </h1>

        <p style={{ 
          fontSize: '1.25rem', 
          color: '#3B4D57', 
          maxWidth: '500px', 
          lineHeight: '1.6', 
          fontWeight: '500',
          margin: '0 0 3rem 0'
        }}>
          The Federal Reserve's new real-time payment rail. Instant,
          transparent, and available 24/7/365.
        </p>

        <div style={{ marginBottom: '1rem', fontWeight: '800', color: '#092A3A', fontSize: '1.1rem' }}>
          Sign up for early access
        </div>

        <form onSubmit={handleEmailSubmit} style={{ 
          display: 'flex', 
          alignItems: 'center', 
          background: 'white', 
          borderRadius: '12px', 
          padding: '0.5rem', 
          maxWidth: '450px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          border: '1px solid rgba(0,0,0,0.05)'
        }}>
          <input 
            type="email" 
            placeholder="Email address" 
            required
            style={{ 
              flex: 1, 
              border: 'none', 
              outline: 'none', 
              padding: '0.75rem 1rem', 
              fontSize: '1rem',
              color: '#123246',
              background: 'transparent'
            }} 
          />
          <button type="submit" style={{ 
            backgroundColor: '#092A3A', 
            color: 'white', 
            border: 'none', 
            padding: '0.85rem 2rem', 
            borderRadius: '8px', 
            fontWeight: '600',
            fontSize: '1rem',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#164359'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#092A3A'}
          >
            Submit
          </button>
        </form>

      </main>

    </div>
  );
};

export default Landing;

import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { gameAudio } from '../utils/AudioEngine'

const Navbar = () => {
  const { user, logout } = useAuth()
  const { connected }    = useSocket()
  const navigate         = useNavigate()
  const location         = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [isMuted, setIsMuted]   = useState(gameAudio.isMuted)

  const handleToggleAudio = () => {
    gameAudio.init()
    setIsMuted(gameAudio.toggleMute())
  }

  const navLinks = [
    { path: '/',            label: 'Home',    icon: '🏠' },
    { path: '/play',        label: 'Play',    icon: '✈️' },
    { path: '/history',     label: 'History', icon: '📊' },
    { path: '/wallet',      label: 'Wallet',  icon: '💳' },
    ...(user?.role === 'admin' ? [{ path: '/admin', label: 'Admin', icon: '⚙️' }] : []),
  ]

  if (!user) return null

  return (
    <>
      <nav style={{
        height: '52px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 14px',
        background: '#0f1420',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>

        {/* ── Left: Aviator logo ── */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', flexShrink: 0, marginRight: '10px' }}>
          {/* Aviator text logo like screenshot */}
          <span style={{
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
            fontWeight: 700,
            fontSize: '22px',
            color: '#e53935',
            letterSpacing: '-0.5px',
            textShadow: '0 0 12px rgba(229,57,53,0.5)',
          }}>
            Aviator
          </span>
          {/* Small plane icon */}
          <span style={{ fontSize: '16px', marginTop: '-2px' }}>✈</span>
        </Link>

        {/* ── Help button like screenshot ── */}
        <button style={{
          width: '24px', height: '24px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
          color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: 700,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>?</button>

        {/* ── Spacer ── */}
        <div style={{ flex: 1 }} />

        {/* ── Balance (screenshot style: "0 INR") ── */}
        <div
          onClick={() => navigate('/wallet')}
          style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '8px', padding: '4px 10px',
            cursor: 'pointer', marginRight: '8px',
          }}
        >
          <span style={{ color: '#4caf50', fontWeight: 800, fontSize: '14px' }}>
            {(user?.balance || 0).toFixed(0)}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 600 }}>INR</span>
        </div>

        {/* ── Hamburger menu ── */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            width: '36px', height: '36px', borderRadius: '8px',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            cursor: 'pointer', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '4px',
          }}
        >
          {[0,1,2].map(i => (
            <div key={i} style={{ width: '16px', height: '2px', background: 'rgba(255,255,255,0.7)', borderRadius: '2px' }} />
          ))}
        </button>
      </nav>

      {/* ── Slide-down menu ── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{
              position: 'fixed', top: '52px', left: 0, right: 0, zIndex: 40,
              background: '#0f1420',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              padding: '8px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            }}
          >
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 16px', borderRadius: '10px', textDecoration: 'none',
                  color: location.pathname === link.path ? '#ffffff' : 'rgba(255,255,255,0.6)',
                  background: location.pathname === link.path ? 'rgba(255,255,255,0.07)' : 'transparent',
                  marginBottom: '2px', fontSize: '14px', fontWeight: 600,
                }}
              >
                <span style={{ fontSize: '18px' }}>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}

            {/* Connection status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}>
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: connected ? '#4caf50' : '#f44336',
              }} />
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
                {connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {/* Audio + Logout */}
            <div style={{ display: 'flex', gap: '8px', padding: '8px 16px 4px' }}>
              <button onClick={handleToggleAudio} style={{
                flex: 1, padding: '8px', borderRadius: '8px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.6)', fontSize: '12px', cursor: 'pointer',
              }}>
                {isMuted ? '🔇 Muted' : '🔊 Sound'}
              </button>
              <button onClick={() => { logout(); navigate('/login') }} style={{
                flex: 1, padding: '8px', borderRadius: '8px',
                background: 'rgba(229,57,53,0.1)', border: '1px solid rgba(229,57,53,0.3)',
                color: '#ef5350', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
              }}>
                🚪 Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Navbar

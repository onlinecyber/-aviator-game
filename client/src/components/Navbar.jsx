import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Volume2, VolumeX, Wallet, LogOut, Menu, X, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { gameAudio } from '../utils/AudioEngine'
import skyRushLogo from '../assets/skyrush-logo.png'

const Navbar = () => {
  const { user, logout } = useAuth()
  const { connected } = useSocket()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [isMuted, setIsMuted] = useState(gameAudio.isMuted)

  const handleToggleAudio = () => {
    gameAudio.init()
    const muted = gameAudio.toggleMute()
    setIsMuted(muted)
  }

  const navLinks = [
    { path: '/',            label: 'Play',        icon: '🎮' },
    { path: '/history',     label: 'History',     icon: '📊' },
    { path: '/leaderboard', label: 'Leaders',     icon: '🏆' },
    { path: '/wallet',      label: 'Wallet',      icon: '💳' },
    ...(user?.role === 'admin' ? [{ path: '/admin', label: 'Admin', icon: '⚙️' }] : []),
  ]

  const handleLogout = () => { logout(); navigate('/login') }

  if (!user) return null

  return (
    <>
      <nav
        className="h-14 flex items-center px-4 sticky top-0 z-50 border-b border-white/5"
        style={{
          background: 'linear-gradient(to right, rgba(8,12,24,0.98), rgba(11,15,26,0.98))',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 1px 0 rgba(0,230,118,0.08), 0 4px 30px rgba(0,0,0,0.5)',
        }}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 mr-6 flex-shrink-0 group">
          <img
            src={skyRushLogo}
            alt="SkyRush"
            className="h-9 w-auto object-contain transition-all duration-300 group-hover:scale-105"
            style={{ filter: 'drop-shadow(0 0 8px rgba(255,23,68,0.5))' }}
          />
        </Link>

        {/* Nav links — desktop */}
        <div className="hidden md:flex items-center gap-0.5 flex-1">
          {navLinks.map((link) => {
            const active = location.pathname === link.path
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 flex items-center gap-1.5 ${
                  active
                    ? 'text-neon-green'
                    : 'text-white/40 hover:text-white/80 hover:bg-white/5'
                }`}
                style={active ? {
                  background: 'rgba(0,230,118,0.08)',
                  borderBottom: '2px solid rgba(0,230,118,0.6)',
                  textShadow: '0 0 10px rgba(0,230,118,0.5)',
                } : {}}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            )
          })}
        </div>

        {/* Right */}
        <div className="ml-auto flex items-center gap-2">
          {/* Live status */}
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-full border border-white/5 bg-black/20">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${connected ? 'bg-neon-green animate-pulse-fast' : 'bg-brand-primary'}`} />
            <span className="text-[10px] font-mono" style={{ color: connected ? '#00e676' : '#ff5252' }}>
              {connected ? 'LIVE' : 'OFF'}
            </span>
          </div>

          {/* Balance */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl cursor-pointer hover:scale-105 transition-transform"
            style={{
              background: 'rgba(255,215,0,0.08)',
              border: '1px solid rgba(255,215,0,0.25)',
            }}
            onClick={() => navigate('/wallet')}
          >
            <Wallet size={12} className="text-neon-gold" />
            <span className="font-mono font-black text-sm" style={{ color: '#ffd700' }}>
              ₹{(user?.balance || 0).toFixed(2)}
            </span>
          </div>

          {/* User chip */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black"
              style={{ background: 'linear-gradient(135deg, #cc44ff, #00e5ff)', color: '#000' }}
            >
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <span className="text-white/70 text-xs font-semibold">{user?.username}</span>
          </div>

          {/* Audio toggle */}
          <button
            onClick={handleToggleAudio}
            className="p-2 rounded-lg transition-all hover:bg-white/5"
            style={{ color: isMuted ? 'rgba(255,255,255,0.3)' : '#00e676' }}
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-all"
          >
            <LogOut size={15} />
          </button>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-all"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden fixed top-14 left-0 right-0 z-40 p-4 space-y-1"
            style={{
              background: 'rgba(8,12,24,0.97)',
              backdropFilter: 'blur(20px)',
              borderBottom: '1px solid rgba(0,230,118,0.1)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            }}
          >
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between px-4 py-3 rounded-xl transition-all"
                style={location.pathname === link.path ? {
                  background: 'rgba(0,230,118,0.08)',
                  border: '1px solid rgba(0,230,118,0.2)',
                  color: '#00e676',
                } : {
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  color: 'rgba(255,255,255,0.7)',
                }}
              >
                <span className="flex items-center gap-3 text-sm font-semibold">
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </span>
                <ChevronRight size={14} className="opacity-40" />
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Navbar

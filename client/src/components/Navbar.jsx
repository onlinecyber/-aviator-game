import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'

const Navbar = () => {
  const { user, logout } = useAuth()
  const { connected } = useSocket()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const navLinks = [
    { path: '/', label: 'Game' },
    { path: '/history', label: 'History' },
    { path: '/leaderboard', label: 'Leaderboard' },
    { path: '/wallet', label: 'Wallet' },
    ...(user?.role === 'admin' ? [{ path: '/admin', label: 'Admin' }] : []),
  ]

  const handleLogout = () => { logout(); navigate('/login') }

  if (!user) return null

  return (
    <nav
      className="h-14 flex items-center px-4 border-b border-white/5 sticky top-0 z-50"
      style={{ background: '#0a0e1a' }}
    >
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 mr-6">
        <div className="flex items-center gap-1.5">
          <span className="text-xl">✈️</span>
          <span
            className="font-black text-lg tracking-widest"
            style={{
              background: 'linear-gradient(90deg, #e63946, #ff6b81)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Aviator
          </span>
        </div>
        <span className="hidden sm:flex items-center gap-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full px-2 py-0.5 text-yellow-400 text-[10px] font-bold">
          How to play?
        </span>
      </Link>

      {/* Nav links — desktop */}
      <div className="hidden md:flex items-center gap-1 flex-1">
        {navLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
              location.pathname === link.path
                ? 'bg-white/10 text-white'
                : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* Right */}
      <div className="ml-auto flex items-center gap-3">
        {/* Live dot */}
        <div className="hidden sm:flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-[10px] text-white/30">{connected ? 'Live' : 'Offline'}</span>
        </div>

        {/* Balance */}
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm"
          style={{ background: '#1a2540', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <span className="text-yellow-400 text-xs">₹</span>
          <span className="font-mono font-bold text-yellow-400 text-sm">
            {(user?.balance || 0).toFixed(2)}
          </span>
        </div>

        {/* Username */}
        <span className="hidden sm:block text-white/50 text-xs">{user?.username}</span>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="text-white/30 hover:text-white text-xs px-2 py-1.5 rounded-lg hover:bg-white/5 transition-all"
        >
          Exit
        </button>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden text-white/50 hover:text-white p-1"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="absolute top-14 left-0 right-0 bg-[#0d1220] border-b border-white/5 px-4 py-3 space-y-1 md:hidden"
          >
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm ${
                  location.pathname === link.path ? 'bg-white/10 text-white' : 'text-white/50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

export default Navbar

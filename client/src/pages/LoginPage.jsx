import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Rocket, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import ParticlesBackground from '../components/ParticlesBackground'

const LoginPage = () => {
  const { login }    = useAuth()
  const navigate     = useNavigate()
  const [form, setForm]       = useState({ identifier: '', password: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.identifier, form.password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: '#0b0f1a' }}
    >
      <ParticlesBackground />

      {/* Neon orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/5 w-96 h-96 rounded-full blur-[120px]"
             style={{ background: 'radial-gradient(circle, rgba(0,230,118,0.08) 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/4 right-1/5 w-80 h-80 rounded-full blur-[100px]"
             style={{ background: 'radial-gradient(circle, rgba(204,68,255,0.07) 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 rounded-full blur-[80px]"
             style={{ background: 'radial-gradient(circle, rgba(0,229,255,0.05) 0%, transparent 70%)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4"
            style={{
              background: 'linear-gradient(135deg, rgba(255,23,68,0.2), rgba(255,109,0,0.15))',
              border: '1px solid rgba(255,23,68,0.3)',
              boxShadow: '0 0 40px rgba(255,23,68,0.2)',
              fontSize: '2.5rem',
            }}
          >
            ✈
          </motion.div>
          <h1
            className="font-orbitron font-black text-4xl uppercase tracking-widest mb-2"
            style={{
              background: 'linear-gradient(135deg, #ff1744, #ff6d00, #ffd700)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: 'none',
            }}
          >
            AVIATOR
          </h1>
          <p className="text-white/35 text-sm font-orbitron tracking-widest uppercase">
            Premium Crash Game
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-7"
          style={{
            background: 'linear-gradient(145deg, rgba(13,18,32,0.97), rgba(9,13,24,0.99))',
            border: '1px solid rgba(0,230,118,0.15)',
            boxShadow: '0 0 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,230,118,0.04), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          {/* Top accent line */}
          <div className="h-0.5 w-full rounded-full mb-7" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,230,118,0.5), transparent)' }} />

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                style={{ background: 'rgba(255,23,68,0.1)', border: '1px solid rgba(255,23,68,0.3)', color: '#ff5252' }}
              >
                <span>⚠</span>
                <span className="font-semibold">{error}</span>
              </motion.div>
            )}

            {/* Mobile / username */}
            <div>
              <label className="block text-xs font-orbitron font-bold uppercase tracking-widest mb-2"
                     style={{ color: 'rgba(0,230,118,0.6)' }}>
                Mobile Number
              </label>
              <input
                id="login-identifier"
                type="text"
                required
                value={form.identifier}
                onChange={e => setForm({ ...form, identifier: e.target.value })}
                className="input-neon w-full px-4 py-3 text-sm"
                placeholder="10-digit mobile number"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-orbitron font-bold uppercase tracking-widest mb-2"
                     style={{ color: 'rgba(0,230,118,0.6)' }}>
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPwd ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="input-neon w-full px-4 py-3 pr-11 text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="btn-bet w-full py-4 mt-2 text-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  SIGNING IN…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Rocket size={16} />
                  LAUNCH →
                </span>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-5 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="text-white/35 text-sm">
              No account?{' '}
              <Link
                to="/register"
                className="font-bold transition-colors hover:text-neon-green"
                style={{ color: '#00e676', textShadow: '0 0 10px rgba(0,230,118,0.4)' }}
              >
                Register Free →
              </Link>
            </p>
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-4 mt-6">
          {['🔒 Secure', '⚡ Instant', '🎯 Provably Fair'].map(tag => (
            <span key={tag} className="text-white/20 text-[10px] font-orbitron tracking-widest">{tag}</span>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

export default LoginPage

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, UserPlus, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import ParticlesBackground from '../components/ParticlesBackground'
import skyRushLogo from '../assets/skyrush-logo.png'

const RegisterPage = () => {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm]       = useState({ mobile: '', password: '', confirm: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) { setError('Passwords do not match'); return }
    if (form.password.length < 6)       { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      await register(form.mobile, form.password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const pwdStrength = form.password.length >= 8 ? 3 : form.password.length >= 6 ? 2 : form.password.length > 0 ? 1 : 0
  const strengths   = [
    { color: '#ff1744', label: 'Weak' },
    { color: '#ff6d00', label: 'Fair' },
    { color: '#ffd700', label: 'Good' },
    { color: '#00e676', label: 'Strong' },
  ]

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: '#0b0f1a' }}
    >
      <ParticlesBackground />

      {/* Neon orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/3 right-1/5 w-80 h-80 rounded-full blur-[120px]"
             style={{ background: 'radial-gradient(circle, rgba(0,230,118,0.08) 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/4 left-1/4 w-72 h-72 rounded-full blur-[100px]"
             style={{ background: 'radial-gradient(circle, rgba(0,229,255,0.06) 0%, transparent 70%)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-block mb-2"
          >
            <img
              src={skyRushLogo}
              alt="SkyRush"
              className="h-24 w-auto mx-auto object-contain"
              style={{ filter: 'drop-shadow(0 0 20px rgba(255,23,68,0.55))' }}
            />
          </motion.div>
          <p className="text-white/35 text-xs font-orbitron tracking-[0.25em] uppercase mt-2">
            Create your SkyRush account
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-7"
          style={{
            background: 'linear-gradient(145deg, rgba(13,18,32,0.97), rgba(9,13,24,0.99))',
            border: '1px solid rgba(0,229,255,0.12)',
            boxShadow: '0 0 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
          }}
        >
          <div className="h-0.5 w-full rounded-full mb-7"
               style={{ background: 'linear-gradient(90deg, transparent, rgba(0,229,255,0.5), transparent)' }} />

          <form onSubmit={handleSubmit} className="space-y-4">
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

            {/* Mobile */}
            <div>
              <label className="block text-xs font-orbitron font-bold uppercase tracking-widest mb-2"
                     style={{ color: 'rgba(0,229,255,0.6)' }}>
                Mobile Number
              </label>
              <input
                id="reg-mobile"
                type="text"
                required
                value={form.mobile}
                onChange={e => setForm({ ...form, mobile: e.target.value })}
                className="input-neon w-full px-4 py-3 text-sm"
                placeholder="10-digit mobile number"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-orbitron font-bold uppercase tracking-widest mb-2"
                     style={{ color: 'rgba(0,229,255,0.6)' }}>
                Password
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPwd ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="input-neon w-full px-4 py-3 pr-11 text-sm"
                  placeholder="Min 6 characters"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* Strength bar */}
              {form.password && (
                <div className="flex gap-1 mt-2">
                  {[1,2,3].map(n => (
                    <div key={n} className="flex-1 h-1 rounded-full transition-all duration-300"
                         style={{ background: n <= pwdStrength ? strengths[pwdStrength].color : 'rgba(255,255,255,0.08)' }} />
                  ))}
                  <span className="text-[10px] font-semibold ml-1" style={{ color: strengths[pwdStrength].color }}>
                    {strengths[pwdStrength].label}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm */}
            <div>
              <label className="block text-xs font-orbitron font-bold uppercase tracking-widest mb-2"
                     style={{ color: 'rgba(0,229,255,0.6)' }}>
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="reg-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={form.confirm}
                  onChange={e => setForm({ ...form, confirm: e.target.value })}
                  className="input-neon w-full px-4 py-3 pr-11 text-sm"
                  placeholder="Repeat password"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                {form.confirm && form.confirm === form.password && (
                  <CheckCircle size={15} className="absolute right-9 top-1/2 -translate-y-1/2 text-neon-green" />
                )}
              </div>
            </div>

            {/* Submit */}
            <button
              id="register-submit"
              type="submit"
              disabled={loading}
              className="btn-bet w-full py-4 mt-2 text-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  CREATING ACCOUNT…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <UserPlus size={16} />
                  CREATE ACCOUNT
                </span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="text-white/35 text-sm">
              Already registered?{' '}
              <Link
                to="/login"
                className="font-bold transition-colors hover:text-neon-cyan"
                style={{ color: '#00e5ff', textShadow: '0 0 10px rgba(0,229,255,0.4)' }}
              >
                Sign In →
              </Link>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 mt-6">
          {['🔒 Secure', '⚡ Instant', '🎯 Provably Fair'].map(tag => (
            <span key={tag} className="text-white/20 text-[10px] font-orbitron tracking-widest">{tag}</span>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

export default RegisterPage

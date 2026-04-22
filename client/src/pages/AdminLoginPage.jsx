import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

const AdminLoginPage = () => {
  const { login, logout } = useAuth()
  const navigate = useNavigate()
  const [form, setForm]     = useState({ identifier: '', password: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(form.identifier, form.password)
      if (data?.user?.role !== 'admin') {
        // Not an admin — log them out immediately
        logout()
        setError('Access denied. Admin credentials required.')
        return
      }
      navigate('/admin')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a0f1a 0%, #0d1520 50%, #080c14 100%)',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Animated background grid */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage: `
          linear-gradient(rgba(229,57,53,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(229,57,53,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }} />

      {/* Corner accent glows */}
      <div style={{
        position: 'absolute', top: '-100px', right: '-100px',
        width: '400px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(229,57,53,0.08) 0%, transparent 70%)',
        zIndex: 0,
      }} />
      <div style={{
        position: 'absolute', bottom: '-100px', left: '-100px',
        width: '350px', height: '350px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,165,0,0.05) 0%, transparent 70%)',
        zIndex: 0,
      }} />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          width: '100%', maxWidth: '420px',
          position: 'relative', zIndex: 1,
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          {/* Shield icon */}
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{ marginBottom: '16px' }}
          >
            <div style={{
              width: '72px', height: '72px', borderRadius: '20px',
              background: 'linear-gradient(135deg, #e53935, #c62828)',
              margin: '0 auto',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '32px',
              boxShadow: '0 8px 30px rgba(229,57,53,0.4)',
            }}>
              🛡️
            </div>
          </motion.div>
          <h1 style={{
            color: '#ffffff',
            fontWeight: 900,
            fontSize: '22px',
            margin: '0 0 6px',
            letterSpacing: '1px',
            fontFamily: 'Inter, sans-serif',
          }}>
            ADMIN PORTAL
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.3)',
            fontSize: '12px',
            letterSpacing: '2px',
            margin: 0,
          }}>
            AVIATOR GAME — RESTRICTED ACCESS
          </p>
        </div>

        {/* Login card */}
        <div style={{
          background: 'linear-gradient(145deg, rgba(18,24,38,0.98), rgba(12,16,28,0.99))',
          borderRadius: '20px',
          padding: '28px 24px',
          border: '1px solid rgba(229,57,53,0.2)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(229,57,53,0.06)',
        }}>
          {/* Top red accent line */}
          <div style={{
            height: '3px', borderRadius: '2px',
            background: 'linear-gradient(90deg, transparent, #e53935, transparent)',
            marginBottom: '24px',
          }} />

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: 'rgba(229,57,53,0.1)',
                border: '1px solid rgba(229,57,53,0.35)',
                borderRadius: '10px',
                padding: '10px 14px',
                color: '#ff5252',
                fontSize: '13px',
                fontWeight: 600,
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>⚠️</span> {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Username */}
            <div>
              <label style={labelS}>Admin Username</label>
              <input
                type="text"
                value={form.identifier}
                onChange={e => setForm({ ...form, identifier: e.target.value })}
                placeholder="Enter admin username"
                required
                autoComplete="username"
                style={inputS}
              />
            </div>

            {/* Password */}
            <div>
              <label style={labelS}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="Enter admin password"
                  required
                  autoComplete="current-password"
                  style={{ ...inputS, paddingRight: '44px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'transparent', border: 'none',
                    color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: '16px',
                  }}
                >
                  {showPwd ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Submit */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                border: 'none',
                background: loading
                  ? 'rgba(229,57,53,0.4)'
                  : 'linear-gradient(135deg, #e53935, #c62828)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '15px',
                cursor: loading ? 'not-allowed' : 'pointer',
                letterSpacing: '1px',
                boxShadow: '0 4px 20px rgba(229,57,53,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '4px',
              }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: '16px', height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTop: '2px solid #fff',
                    borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  Authenticating...
                </>
              ) : (
                <> 🔐 Access Admin Panel </>
              )}
            </motion.button>
          </form>

          {/* Bottom divider */}
          <div style={{
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            textAlign: 'center',
          }}>
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', margin: 0 }}>
              🔒 This area is restricted to authorized personnel only
            </p>
          </div>
        </div>

        {/* Bottom note */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <a
            href="/login"
            style={{
              color: 'rgba(255,255,255,0.25)',
              fontSize: '12px',
              textDecoration: 'none',
            }}
          >
            ← Back to Player Login
          </a>
        </div>
      </motion.div>

      {/* Spin animation style */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

const labelS = {
  display: 'block',
  color: 'rgba(255,255,255,0.4)',
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '1px',
  textTransform: 'uppercase',
  marginBottom: '7px',
}

const inputS = {
  width: '100%',
  background: 'rgba(0,0,0,0.4)',
  border: '1px solid rgba(229,57,53,0.2)',
  borderRadius: '11px',
  color: '#ffffff',
  fontSize: '14px',
  padding: '12px 14px',
  outline: 'none',
  fontFamily: 'Inter, sans-serif',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
}

export default AdminLoginPage

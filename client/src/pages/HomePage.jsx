import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

/* ── Random Indian names for live payouts ── */
const NAMES = [
  'Salim M.', 'Suresh K.', 'Pooja C.', 'Iram S.', 'Sabir A.',
  'Rahul M.', 'Priya R.', 'Arjun V.', 'Neha G.', 'Vikram T.',
  'Anjali P.', 'Rohit S.', 'Deepa N.', 'Mohan L.', 'Kavya J.',
  'Amit D.', 'Sunita B.', 'Ravi K.', 'Meena H.', 'Farhan Q.',
]

const randAmount = () => Math.floor(Math.random() * 55000 + 8000)
const randName   = () => NAMES[Math.floor(Math.random() * NAMES.length)]

const generatePayouts = (count = 8) =>
  Array.from({ length: count }, () => ({
    id:     Math.random().toString(36).slice(2),
    name:   randName(),
    amount: randAmount(),
  }))

/* ── Bottom nav tabs ── */
const NAV_TABS = [
  { id: 'home',    label: 'Home',    icon: '🏠' },
  { id: 'games',   label: 'Games',   icon: '🎮' },
  { id: 'support', label: 'Support', icon: '👤' },
  { id: 'profile', label: 'Profile', icon: '⊞'  },
]

const HomePage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [payouts, setPayouts] = useState(() => generatePayouts(8))
  const [activeTab, setActiveTab] = useState('home')
  const intervalRef = useRef(null)

  /* Randomly update one payout row every 1.5s for "live" feel */
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setPayouts(prev => {
        const next = [...prev]
        const idx  = Math.floor(Math.random() * next.length)
        next[idx] = { id: Math.random().toString(36).slice(2), name: randName(), amount: randAmount() }
        return next
      })
    }, 1500)
    return () => clearInterval(intervalRef.current)
  }, [])

  return (
    <div style={{
      minHeight: 'calc(100vh - 52px)',
      background: '#0d1117',
      display: 'flex',
      flexDirection: 'column',
      paddingBottom: '64px',
    }}>

      {/* ── HERO BANNER ── */}
      <div style={{ padding: '16px 14px 8px' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            background: 'linear-gradient(145deg, #1a1f2e, #141824)',
            borderRadius: '18px',
            padding: '20px 18px 0',
            border: '1px solid rgba(255,255,255,0.07)',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Heading */}
          <div style={{ textAlign: 'center', marginBottom: '6px' }}>
            <h1 style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 900,
              fontSize: '26px',
              color: '#ffffff',
              letterSpacing: '1px',
              margin: 0,
              textShadow: '0 2px 15px rgba(255,255,255,0.15)',
            }}>
              AVIATOR GAME
            </h1>
            <p style={{
              color: 'rgba(255,255,255,0.45)',
              fontSize: '13px',
              margin: '4px 0 14px',
              fontWeight: 500,
            }}>
              Fly smart, cash out faster!
            </p>
          </div>

          {/* Plane + logo + CTA card */}
          <div style={{
            background: 'linear-gradient(135deg, #1a0505, #2a0808, #1a1010)',
            borderRadius: '14px 14px 0 0',
            padding: '16px 16px 0',
            position: 'relative',
            minHeight: '140px',
            overflow: 'hidden',
          }}>
            {/* Red chevrons background */}
            <div style={{
              position: 'absolute', right: 0, top: 0, bottom: 0,
              display: 'flex', alignItems: 'center', gap: '-6px',
              opacity: 0.7,
            }}>
              {[0,1,2].map(i => (
                <div key={i} style={{
                  width: '45px', height: '100%',
                  borderRight: `3px solid rgba(180,10,10,${0.4 - i * 0.1})`,
                  transform: `skewX(-15deg) translateX(${i * 14}px)`,
                }} />
              ))}
            </div>

            {/* Aviator text logo */}
            <div style={{
              position: 'absolute', left: '16px', top: '14px',
              fontFamily: 'Georgia, serif', fontStyle: 'italic',
              fontWeight: 700, fontSize: '28px', color: '#e53935',
              textShadow: '0 0 20px rgba(229,57,53,0.6)',
              zIndex: 2,
            }}>
              Aviator
            </div>

            {/* Plane illustration */}
            <motion.div
              animate={{ x: [0, 6, 0], y: [0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'absolute', left: '10px', bottom: '15px',
                fontSize: '62px', zIndex: 2, lineHeight: 1,
                filter: 'drop-shadow(0 0 10px rgba(229,57,53,0.5))',
              }}
            >
              ✈
            </motion.div>

            {/* PLAY GAME button */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/play')}
              style={{
                position: 'absolute',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'linear-gradient(135deg, #2ecc40, #27ae36)',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '16px',
                letterSpacing: '1px',
                border: 'none',
                borderRadius: '50px',
                padding: '13px 32px',
                cursor: 'pointer',
                boxShadow: '0 0 25px rgba(46,204,64,0.55), 0 4px 20px rgba(0,0,0,0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                zIndex: 3,
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ fontSize: '18px' }}>🎮</span>
              PLAY GAME
            </motion.button>

            {/* Bottom spacer for button */}
            <div style={{ height: '72px' }} />
          </div>
        </motion.div>
      </div>

      {/* ── LIVE PAYOUTS ── */}
      <div style={{ padding: '10px 14px' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          style={{
            background: 'linear-gradient(145deg, #1a1f2e, #141824)',
            borderRadius: '18px',
            border: '1px solid rgba(255,255,255,0.07)',
            overflow: 'hidden',
          }}
        >
          {/* Section header */}
          <div style={{
            padding: '14px 18px 10px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span style={{ fontSize: '16px' }}>⚡</span>
            <span style={{
              color: '#2ecc40',
              fontWeight: 800,
              fontSize: '15px',
              letterSpacing: '2px',
              fontFamily: 'Inter, sans-serif',
            }}>
              LIVE PAYOUTS
            </span>
          </div>

          {/* Payout rows */}
          <div style={{ padding: '4px 0' }}>
            <AnimatePresence initial={false}>
              {payouts.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -20, backgroundColor: 'rgba(46,204,64,0.1)' }}
                  animate={{ opacity: 1, x: 0, backgroundColor: 'rgba(0,0,0,0)' }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.35 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '11px 18px',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                  }}
                >
                  <span style={{
                    color: 'rgba(255,255,255,0.85)',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}>
                    {p.name}
                  </span>
                  <motion.span
                    key={p.id + '-amount'}
                    initial={{ scale: 1.2, color: '#2ecc40' }}
                    animate={{ scale: 1, color: '#2ecc40' }}
                    style={{
                      color: '#2ecc40',
                      fontWeight: 800,
                      fontSize: '15px',
                      fontFamily: 'monospace',
                    }}
                  >
                    ₹ {p.amount.toLocaleString('en-IN')}
                  </motion.span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Green right border accent */}
          <div style={{
            position: 'absolute',
            right: 0, top: 0, bottom: 0,
            width: '3px',
            background: 'linear-gradient(to bottom, transparent, #2ecc40, transparent)',
            borderRadius: '0 18px 18px 0',
          }} />
        </motion.div>
      </div>

      {/* ── BOTTOM NAV BAR ── */}
      <div style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        height: '64px',
        background: '#141824',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 50,
        padding: '0 8px',
      }}>
        {NAV_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id)
              if (tab.id === 'games') navigate('/play')
              if (tab.id === 'profile') navigate('/wallet')
            }}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '6px 0',
            }}
          >
            <span style={{
              fontSize: '22px',
              filter: activeTab === tab.id ? 'none' : 'grayscale(0.6) opacity(0.5)',
            }}>
              {tab.icon}
            </span>
            <span style={{
              fontSize: '10px',
              fontWeight: 600,
              color: activeTab === tab.id ? '#e53935' : 'rgba(255,255,255,0.4)',
              transition: 'color 0.15s',
            }}>
              {tab.label}
            </span>
            {activeTab === tab.id && (
              <div style={{
                width: '20px', height: '2px',
                background: '#e53935',
                borderRadius: '2px',
              }} />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

export default HomePage

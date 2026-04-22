import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../context/GameContext'
import { useAuth } from '../context/AuthContext'

/* quick bet options matching screenshot */
const QUICK_BETS = [10, 100, 500, 1000]

const useLiveCashout = (startTime, isActive, amount) => {
  const ref = useRef(null)
  useEffect(() => {
    if (!isActive || !startTime) { if (ref.current) ref.current.innerText = ''; return }
    let raf
    const loop = () => {
      const m = Math.E ** (0.00006 * (Date.now() - startTime))
      if (ref.current) ref.current.innerText = `${(amount * m).toFixed(2)} INR`
      raf = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(raf)
  }, [startTime, isActive, amount])
  return ref
}

const SingleBetPanel = ({ panelId }) => {
  const { status, startTime, myBet, cashedOut, placeBet, cashout, error } = useGame()
  const { user } = useAuth()
  const [tab, setTab]       = useState('Bet')
  const [amount, setAmount] = useState('10.00')
  const [autoCashout, setAutoCashout] = useState('2.00')

  const isWaiting  = status === 'WAITING'
  const isRunning  = status === 'RUNNING'
  const isCrashed  = status === 'CRASHED'
  const hasBet     = !!myBet && !cashedOut
  const canBet     = isWaiting && !myBet
  const canCashout = isRunning && hasBet

  const cashoutRef = useLiveCashout(startTime, canCashout, myBet?.amount || 0)

  const handleBet = () => {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) return
    placeBet(amt, tab === 'Auto' ? parseFloat(autoCashout) : null)
  }

  const handleCashout = () => cashout()

  const adjust = (delta) =>
    setAmount(prev => Math.max(1, parseFloat(prev || 0) + delta).toFixed(2))

  const amtNum = parseFloat(amount || 0)

  return (
    <div style={{
      background: '#1e2235',
      borderRadius: '16px',
      padding: '12px 14px',
      marginBottom: '8px',
    }}>
      {/* Bet / Auto tabs */}
      <div style={{
        display: 'inline-flex',
        background: '#151827',
        borderRadius: '24px',
        padding: '3px',
        marginBottom: '12px',
        gap: '2px',
      }}>
        {['Bet', 'Auto'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '6px 22px',
            borderRadius: '20px',
            border: 'none',
            background: tab === t ? '#2a2f45' : 'transparent',
            color: tab === t ? '#ffffff' : (t === 'Auto' && tab !== 'Auto' ? '#e53935' : 'rgba(255,255,255,0.4)'),
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}>
            {t}
          </button>
        ))}
      </div>

      {/* Amount row + BET button */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>

        {/* ⊖ amount ⊕ pill */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0',
          background: '#111520', borderRadius: '30px',
          padding: '0', overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.08)',
          flex: '0 0 auto',
        }}>
          <button onClick={() => adjust(-1)} style={{
            width: '36px', height: '44px',
            background: 'transparent', border: 'none',
            color: '#ffffff', fontSize: '22px', fontWeight: 300,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>⊖</button>
          <input
            type="number" value={amount}
            onChange={e => setAmount(e.target.value)}
            min="1" step="1"
            style={{
              width: '70px', background: 'transparent', border: 'none',
              color: '#ffffff', fontSize: '16px', fontWeight: 700,
              textAlign: 'center', outline: 'none', fontFamily: 'inherit',
              padding: '0',
            }}
          />
          <button onClick={() => adjust(1)} style={{
            width: '36px', height: '44px',
            background: 'transparent', border: 'none',
            color: '#ffffff', fontSize: '22px', fontWeight: 300,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>⊕</button>
        </div>

        {/* BET / CASHOUT button */}
        <AnimatePresence mode="wait">
          {canCashout ? (
            <motion.button key="co" onClick={handleCashout}
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              style={{
                flex: 1, padding: '10px 8px', borderRadius: '14px', border: 'none',
                background: 'linear-gradient(135deg, #ff5722, #e91e63)',
                color: '#fff', fontWeight: 800, fontSize: '14px',
                cursor: 'pointer', lineHeight: 1.3,
                boxShadow: '0 4px 20px rgba(255,87,34,0.5)',
              }}>
              CASH OUT
              <div ref={cashoutRef} style={{ fontSize: '12px', fontWeight: 500, opacity: 0.9 }} />
            </motion.button>
          ) : canBet ? (
            <motion.button key="bet" onClick={handleBet}
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              style={{
                flex: 1, padding: '10px 8px', borderRadius: '14px', border: 'none',
                background: 'linear-gradient(135deg, #43a047, #2e7d32)',
                color: '#fff', fontWeight: 800, fontSize: '15px',
                cursor: 'pointer', lineHeight: 1.3,
                boxShadow: '0 4px 20px rgba(67,160,71,0.5)',
              }}>
              BET
              <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '2px' }}>
                {amtNum.toFixed(2)} INR
              </div>
            </motion.button>
          ) : (
            <div key="dis" style={{
              flex: 1, padding: '12px 8px', borderRadius: '14px',
              background: hasBet
                ? 'linear-gradient(135deg, #1b5e20, #2e7d32)'
                : 'rgba(255,255,255,0.05)',
              textAlign: 'center',
              color: hasBet ? '#81c784' : 'rgba(255,255,255,0.3)',
              fontSize: '12px', fontWeight: 600,
            }}>
              {isCrashed ? 'Next round...' : hasBet ? `Bet: ${myBet?.amount} INR ✓` : 'CLOSED'}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick amounts — 2x2 grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
        {QUICK_BETS.map(v => (
          <button key={v} onClick={() => setAmount(v.toFixed(2))} style={{
            padding: '5px 0',
            background: 'transparent',
            border: 'none',
            color: parseFloat(amount) === v ? '#ffffff' : 'rgba(255,255,255,0.4)',
            fontSize: '13px',
            fontWeight: parseFloat(amount) === v ? 700 : 500,
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'color 0.15s',
          }}>
            {v >= 1000 ? `${v/1000},000` : v}
          </button>
        ))}
      </div>

      {/* Auto cashout input */}
      <AnimatePresence>
        {tab === 'Auto' && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden', marginTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px',
              background: '#111520', borderRadius: '10px', padding: '8px 12px',
              border: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>Auto cash out at</span>
              <input type="number" value={autoCashout} onChange={e => setAutoCashout(e.target.value)}
                min="1.01" step="0.1"
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  color: '#fff', fontWeight: 700, fontSize: '14px', textAlign: 'right', fontFamily: 'inherit' }} />
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>x</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p style={{ color: '#ff5252', fontSize: '11px', textAlign: 'center', margin: '6px 0 0' }}>⚠ {error}</p>}
    </div>
  )
}

const BetPanelDouble = () => (
  <div style={{ padding: '0 10px' }}>
    <SingleBetPanel panelId={1} />
    <SingleBetPanel panelId={2} />
  </div>
)

export default BetPanelDouble

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, TrendingUp, RotateCcw } from 'lucide-react'
import { useGame } from '../context/GameContext'
import { useAuth } from '../context/AuthContext'

const QUICK_BETS = [10, 50, 100, 500]

/* Live cashout value — DOM-injected at 60fps */
const useLiveCashout = (startTime, isActive, amount) => {
  const ref = useRef(null)
  useEffect(() => {
    if (!isActive || !startTime) {
      if (ref.current) ref.current.innerText = '—'
      return
    }
    let raf
    const loop = () => {
      const elapsed = Date.now() - startTime
      const m = Math.E ** (0.00006 * elapsed)
      if (ref.current) ref.current.innerText = `₹${(amount * m).toFixed(2)}`
      raf = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(raf)
  }, [startTime, isActive, amount])
  return ref
}

const BetPanel = ({ panelId }) => {
  const { status, startTime, myBet, cashedOut, placeBet, cashout, error } = useGame()
  const { user } = useAuth()
  const [tab, setTab] = useState('BET')
  const [amount, setAmount] = useState('100.00')
  const [autoCashout, setAutoCashout] = useState('2.00')

  const isWaiting = status === 'WAITING'
  const isRunning = status === 'RUNNING'
  const isCrashed = status === 'CRASHED'

  const hasBet    = !!myBet && !cashedOut
  const canBet    = isWaiting && !myBet
  const canCashout = isRunning && hasBet

  const cashoutRef = useLiveCashout(startTime, canCashout, myBet?.amount || 0)

  const handleBet = () => {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) return
    if (window.navigator?.vibrate) window.navigator.vibrate(40)
    placeBet(amt, tab === 'AUTO' ? parseFloat(autoCashout) : null)
  }

  const handleCashout = () => {
    if (window.navigator?.vibrate) window.navigator.vibrate([80, 40, 80])
    cashout()
  }

  const adjust = (delta) => {
    setAmount(prev => Math.max(1, parseFloat(prev || 0) + delta).toFixed(2))
  }

  return (
    <div
      className="flex-1 rounded-2xl p-3 flex flex-col gap-2.5 min-w-0"
      style={{
        background: 'linear-gradient(145deg, rgba(13,18,32,0.95), rgba(9,13,24,0.98))',
        border: '1px solid rgba(0,230,118,0.12)',
        boxShadow: '0 4px 30px rgba(0,0,0,0.4), inset 0 1px 0 rgba(0,230,118,0.05)',
      }}
    >
      {/* Tabs */}
      <div
        className="flex gap-1 p-1 rounded-xl"
        style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.04)' }}
      >
        {['BET', 'AUTO'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`tab-btn flex-1 py-1.5 flex items-center justify-center gap-1.5 ${tab === t ? 'active' : ''}`}
          >
            {t === 'AUTO' && <Zap size={9} />}
            {t === 'BET'  && <TrendingUp size={9} />}
            {t}
          </button>
        ))}
      </div>

      {/* Amount row */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => adjust(-10)}
          className="w-9 h-9 rounded-xl font-black text-base flex items-center justify-center flex-shrink-0 transition-all hover:scale-110 active:scale-95"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
        >
          −
        </button>

        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neon-gold font-bold text-sm pointer-events-none">₹</span>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            min="1"
            className="input-neon w-full pl-7 pr-3 py-2 text-center text-base font-black"
          />
        </div>

        <button
          onClick={() => adjust(10)}
          className="w-9 h-9 rounded-xl font-black text-base flex items-center justify-center flex-shrink-0 transition-all hover:scale-110 active:scale-95"
          style={{ background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.2)', color: '#00e676' }}
        >
          +
        </button>
      </div>

      {/* Quick chips */}
      <div className="flex gap-1.5">
        {QUICK_BETS.map(v => (
          <button
            key={v}
            onClick={() => setAmount(v.toFixed(2))}
            className="quick-chip flex-1 py-1.5 text-center"
          >
            {v}
          </button>
        ))}
      </div>

      {/* Auto cashout field */}
      <AnimatePresence>
        {tab === 'AUTO' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,230,118,0.15)' }}
            >
              <Zap size={12} className="text-neon-green flex-shrink-0" />
              <span className="text-[10px] uppercase font-orbitron font-bold text-white/40 tracking-widest flex-shrink-0">
                Auto @
              </span>
              <input
                type="number"
                value={autoCashout}
                onChange={e => setAutoCashout(e.target.value)}
                min="1.01"
                step="0.1"
                className="bg-transparent flex-1 text-right text-neon-green font-mono font-black text-sm focus:outline-none"
              />
              <span className="text-neon-green/60 text-xs font-bold">x</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Button */}
      <AnimatePresence mode="wait">
        {canCashout ? (
          <motion.button
            key="cashout"
            onClick={handleCashout}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="btn-cashout w-full py-4 relative"
          >
            <div className="relative z-10 flex flex-col items-center gap-0.5">
              <span className="text-sm tracking-widest">CASH OUT</span>
              <span ref={cashoutRef} className="font-mono text-lg font-black text-white/90">—</span>
            </div>
          </motion.button>
        ) : canBet ? (
          <motion.button
            key="bet"
            onClick={handleBet}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="btn-bet w-full py-4 relative"
          >
            <div className="relative z-10 flex flex-col items-center gap-0.5">
              <span className="text-sm tracking-widest">BET NOW</span>
              <span className="font-mono text-base font-black opacity-80">₹{parseFloat(amount || 0).toFixed(2)}</span>
            </div>
          </motion.button>
        ) : (
          <motion.div
            key="waiting-btn"
            className="w-full py-4 rounded-2xl flex flex-col items-center justify-center gap-0.5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {isCrashed ? (
              <>
                <RotateCcw size={14} className="text-white/30 animate-spin-slow" />
                <span className="text-white/25 text-xs font-orbitron tracking-widest">NEXT ROUND</span>
              </>
            ) : hasBet ? (
              <>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-2 h-2 rounded-full"
                  style={{ background: '#00e676', boxShadow: '0 0 10px #00e676' }}
                />
                <span className="text-white/40 text-xs font-orbitron tracking-widest">IN BET ₹{myBet?.amount}</span>
              </>
            ) : (
              <>
                <span className="text-white/20 text-xs font-orbitron tracking-widest">CLOSED</span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && (
        <p className="text-center text-xs font-semibold" style={{ color: '#ff5252' }}>
          ⚠ {error}
        </p>
      )}
    </div>
  )
}

const BetPanelDouble = () => (
  <div className="flex gap-3 w-full h-full">
    <BetPanel panelId={1} />
    <BetPanel panelId={2} />
  </div>
)

export default BetPanelDouble

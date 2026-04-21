import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../context/GameContext'
import { useAuth } from '../context/AuthContext'

const QUICK = [10, 50, 100, 500] // More realistic quick bets based on INR/Crypto

// Local native multiplier string generator logic
const useLiveCashoutValue = (startTime, isRunning, amount) => {
  const textRef = useRef(null)

  useEffect(() => {
    if (!isRunning || !startTime) {
      if (textRef.current) textRef.current.innerText = `₹(Waiting)`
      return
    }

    let rafId
    const loop = () => {
        const elapsed = Date.now() - startTime
        const m = Math.E ** (0.00006 * elapsed)
        const payout = (amount * m).toFixed(2)
        if (textRef.current) {
           textRef.current.innerText = `₹${payout}`
        }
        rafId = requestAnimationFrame(loop)
    }
    loop()

    return () => cancelAnimationFrame(rafId)
  }, [startTime, isRunning, amount])

  return textRef
}

const BetPanel = ({ panelId, disabled }) => {
  const { status, startTime, myBet, cashedOut, placeBet, cashout, error } = useGame()
  const { user } = useAuth()
  const [tab, setTab] = useState('bet')
  const [amount, setAmount] = useState('10.00')
  const [autoCashout, setAutoCashout] = useState('2.00')

  const isWaiting = status === 'WAITING'
  const isRunning = status === 'RUNNING'
  const isCrashed = status === 'CRASHED'

  const hasBet = !!myBet && !cashedOut
  const canBet = isWaiting && !myBet && !disabled
  const canCashout = isRunning && hasBet && !disabled

  const cashoutValRef = useLiveCashoutValue(startTime, canCashout, myBet?.amount || 0)

  const handleBet = () => {
    // Basic Haptic Feedback
    if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(50)
      
    const amt = parseFloat(amount)
    if (!amt) return
    const ac = tab === 'auto' ? parseFloat(autoCashout) : null
    placeBet(amt, ac)
  }

  const handleCashout = () => {
    // Force vibration for satisfying tactile feel
    if (window.navigator && window.navigator.vibrate) window.navigator.vibrate([100, 50, 100])
    cashout()
  }

  const adjust = (delta) => {
    setAmount((prev) => Math.max(1, parseFloat(prev || 0) + delta).toFixed(2))
  }

  return (
    <div className="flex-1 bg-[#161c2e] border border-white/5 rounded-2xl p-2.5 sm:p-3 min-w-0 shadow-lg relative">
      {disabled && (
           <div className="absolute inset-0 bg-black/60 z-10 rounded-2xl flex items-center justify-center backdrop-blur-[2px]">
              <span className="text-white/50 text-sm font-bold bg-black/50 px-3 py-1 rounded-full border border-white/10 uppercase tracking-widest">+ Add Panel</span>
           </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-3 bg-[#0d1220] p-1 rounded-lg">
        {['bet', 'auto'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-1 rounded-md text-xs font-bold uppercase tracking-widest transition-all ${
              tab === t
                ? 'bg-[#1e2d4a] text-white shadow'
                : 'text-white/40 hover:text-white/70 hover:bg-white/5'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Amount row */}
      <div className="flex items-center gap-1.5 mb-2">
        <button
          onClick={() => adjust(-10)}
          className="w-10 h-10 rounded-xl bg-[#1e2d4a] text-white/50 hover:text-white hover:bg-[#2a3d5f] active:scale-95 transition-all text-xl font-medium flex items-center justify-center flex-shrink-0"
        >−</button>

        <div className="flex-1 relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 font-bold">₹</div>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="1"
            className="w-full bg-[#0a0e1a] border border-white/10 rounded-xl pl-7 pr-3 py-2 text-center text-white font-mono text-base sm:text-lg font-bold focus:outline-none focus:border-brand-primary/50 transition-colors"
          />
        </div>

        <button
          onClick={() => adjust(10)}
          className="w-10 h-10 rounded-xl bg-[#1e2d4a] text-white/50 hover:text-white hover:bg-[#2a3d5f] active:scale-95 transition-all text-xl font-medium flex items-center justify-center flex-shrink-0"
        >+</button>
      </div>

      {/* Quick amounts */}
      <div className="flex gap-1.5 mb-3">
        {QUICK.map((v) => (
          <button
            key={v}
            onClick={() => setAmount(v.toFixed(2))}
            className="flex-1 py-1.5 text-xs text-white/60 font-semibold bg-[#1a2540] hover:bg-[#1e2d4a] active:bg-[#2a3d5f] rounded-lg transition-all"
          >
            {v}
          </button>
        ))}
      </div>

      {/* Auto cashout input */}
      <AnimatePresence>
        {tab === 'auto' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-3 overflow-hidden"
          >
            <div className="flex items-center gap-2 bg-[#0a0e1a] border border-white/5 p-1.5 rounded-xl">
              <span className="text-white/40 text-[11px] uppercase font-bold pl-2 flex-shrink-0">Auto Cashout</span>
              <input
                type="number"
                value={autoCashout}
                onChange={(e) => setAutoCashout(e.target.value)}
                min="1.01"
                step="0.1"
                className="flex-1 bg-transparent px-2 py-1 text-right text-brand-gold font-mono text-sm focus:outline-none focus:bg-white/5 rounded"
              />
              <span className="text-brand-gold/60 text-xs font-bold pr-2">x</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Big Action Button */}
      <AnimatePresence mode="wait">
        {canCashout ? (
          <motion.button
            key="cashout"
            onClick={handleCashout}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileTap={{ scale: 0.96 }}
            className="w-full py-4 sm:py-5 rounded-xl font-black text-lg transition-transform relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #FF6B00, #FFA800)',
              boxShadow: '0 8px 30px rgba(255, 107, 0, 0.4)',
              color: '#fff',
            }}
          >
            <div className="relative z-10 flex flex-col items-center leading-none">
                <span className="uppercase tracking-wide text-[15px] mb-1">Cash Out</span>
                <span ref={cashoutValRef} className="font-mono text-xl text-white/90 drop-shadow-md">
                   ₹(Calc)
                </span>
            </div>
             {/* Gloss overlay */}
             <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none rounded-t-xl" />
          </motion.button>
        ) : canBet ? (
          <motion.button
            key="bet"
            onClick={handleBet}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileTap={{ scale: 0.96 }}
            className="w-full py-4 sm:py-5 rounded-xl font-black transition-all relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #10B981, #059669)',
              boxShadow: '0 8px 30px rgba(16, 185, 129, 0.4)',
              color: '#fff',
            }}
          >
            <div className="relative z-10 flex flex-col items-center leading-none">
              <span className="uppercase tracking-widest text-lg mb-1 drop-shadow-md">BET</span>
              <span className="font-mono text-sm text-white/80">₹{parseFloat(amount || 0).toFixed(2)}</span>
            </div>
            {/* Pulsing light effect inside button */}
            <motion.div 
               animate={{ opacity: [0.3, 0.6, 0.3] }}
               transition={{ duration: 2, repeat: Infinity }}
               className="absolute inset-0 bg-white/10 pointer-events-none"
            />
            {/* Gloss overlay */}
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none rounded-t-xl" />
          </motion.button>
        ) : (
          <motion.button
            key="disabled"
            disabled
            className="w-full py-4 sm:py-5 rounded-xl font-bold text-sm uppercase tracking-wider text-white/30 cursor-not-allowed border border-white/5"
            style={{ background: '#111724' }}
          >
            {isCrashed ? 'Waiting for next...' : hasBet ? `In Game — ₹${myBet?.amount}` : 'Betting Closed'}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Error Toast / Text */}
      {error && (
        <p className="absolute -bottom-6 left-0 right-0 text-red-500 font-bold text-xs text-center drop-shadow-md">
           {error}
        </p>
      )}
    </div>
  )
}

// Two panels side by side
const BetPanelDouble = () => {
  return (
    <div className="flex flex-col sm:flex-row w-full gap-3">
      <BetPanel panelId={1} disabled={false} />
      {/* Example: making second panel unlocked standard */}
      <BetPanel panelId={2} disabled={false} />
    </div>
  )
}

export default BetPanelDouble

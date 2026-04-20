import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../context/GameContext'
import { useAuth } from '../context/AuthContext'

const QUICK = [1, 2, 5, 10]

// Individual Panel — Bet or Auto
const BetPanel = ({ panelId, disabled }) => {
  const { status, myBet, cashedOut, multiplier, placeBet, cashout, error } = useGame()
  const { user } = useAuth()
  const [tab, setTab] = useState('bet')
  const [amount, setAmount] = useState('1.00')
  const [autoCashout, setAutoCashout] = useState('2.00')

  const isWaiting = status === 'WAITING'
  const isRunning = status === 'RUNNING'
  const isCrashed = status === 'CRASHED'

  const hasBet = !!myBet && !cashedOut
  const canBet = isWaiting && !myBet && !disabled
  const canCashout = isRunning && hasBet && !disabled

  const handleBet = () => {
    const amt = parseFloat(amount)
    if (!amt) return
    const ac = tab === 'auto' ? parseFloat(autoCashout) : null
    placeBet(amt, ac)
  }

  const adjust = (delta) => {
    setAmount((prev) => Math.max(1, parseFloat(prev || 0) + delta).toFixed(2))
  }

  const cashoutValue = hasBet && isRunning
    ? (myBet.amount * multiplier).toFixed(2)
    : null

  return (
    <div className="flex-1 bg-[#131929] rounded-xl p-3 min-w-0">
      {/* Tabs */}
      <div className="flex gap-1 mb-3">
        {['bet', 'auto'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1 rounded-md text-xs font-semibold capitalize transition-all ${
              tab === t
                ? 'bg-[#1e2d4a] text-white'
                : 'text-white/30 hover:text-white/60'
            }`}
          >
            {t === 'bet' ? 'Bet' : 'Auto'}
          </button>
        ))}
      </div>

      {/* Amount row */}
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={() => adjust(-1)}
          className="w-8 h-8 rounded-lg bg-[#1e2d4a] text-white/70 hover:text-white hover:bg-[#2a3d5f] transition-all font-bold text-lg flex items-center justify-center flex-shrink-0"
        >−</button>

        <div className="flex-1 relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="1"
            className="w-full bg-[#1a2540] border border-white/10 rounded-lg px-3 py-1.5 text-center text-white font-mono text-sm font-bold focus:outline-none focus:border-white/20"
          />
        </div>

        <button
          onClick={() => adjust(1)}
          className="w-8 h-8 rounded-lg bg-[#1e2d4a] text-white/70 hover:text-white hover:bg-[#2a3d5f] transition-all font-bold text-lg flex items-center justify-center flex-shrink-0"
        >+</button>
      </div>

      {/* Quick amounts */}
      <div className="flex gap-1.5 mb-3">
        {QUICK.map((v) => (
          <button
            key={v}
            onClick={() => setAmount(v.toFixed(2))}
            className="flex-1 py-1 text-xs text-white/40 hover:text-white/70 bg-[#1a2540] hover:bg-[#1e2d4a] rounded-md transition-all font-mono"
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
            <div className="flex items-center gap-2">
              <span className="text-white/40 text-xs flex-shrink-0">Auto @</span>
              <input
                type="number"
                value={autoCashout}
                onChange={(e) => setAutoCashout(e.target.value)}
                min="1.01"
                step="0.1"
                className="flex-1 bg-[#1a2540] border border-white/10 rounded-lg px-3 py-1.5 text-center text-white font-mono text-sm focus:outline-none focus:border-white/20"
              />
              <span className="text-white/40 text-xs">x</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Button */}
      <AnimatePresence mode="wait">
        {canCashout ? (
          <motion.button
            key="cashout"
            onClick={cashout}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full py-3 rounded-xl font-black text-sm text-white transition-all"
            style={{
              background: 'linear-gradient(135deg, #e67e00, #ff9900)',
              boxShadow: '0 4px 20px rgba(230, 100, 0, 0.4)',
            }}
          >
            <div>CASH OUT</div>
            <div className="text-xs opacity-80 font-normal">₹{cashoutValue}</div>
          </motion.button>
        ) : canBet ? (
          <motion.button
            key="bet"
            onClick={handleBet}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full py-3 rounded-xl font-black text-sm transition-all"
            style={{
              background: 'linear-gradient(135deg, #1a8a38, #22b84a)',
              boxShadow: '0 4px 20px rgba(30, 160, 70, 0.4)',
              color: '#fff',
            }}
          >
            <div>BET</div>
            <div className="text-xs opacity-80 font-normal">₹{parseFloat(amount || 0).toFixed(2)}</div>
          </motion.button>
        ) : (
          <motion.button
            key="disabled"
            disabled
            className="w-full py-3 rounded-xl font-bold text-sm text-white/20 cursor-not-allowed"
            style={{ background: '#1a2540' }}
          >
            {isCrashed ? 'Next Round…' : hasBet ? `In Game — ₹${myBet?.amount}` : 'Waiting…'}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && (
        <p className="text-red-400 text-xs mt-2 text-center">{error}</p>
      )}
    </div>
  )
}

// Two panels side by side
const BetPanelDouble = () => {
  return (
    <>
      <BetPanel panelId={1} disabled={false} />
      <BetPanel panelId={2} disabled={true} />
    </>
  )
}

export default BetPanelDouble

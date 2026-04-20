import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../context/GameContext'
import { useAuth } from '../context/AuthContext'

const QUICK_AMOUNTS = [10, 50, 100, 500, 1000]

const BetPanel = () => {
  const { status, myBet, cashedOut, multiplier, placeBet, cashout, error } = useGame()
  const { user } = useAuth()

  const [amount, setAmount] = useState('100')
  const [autoCashout, setAutoCashout] = useState('')
  const [useAutoCashout, setUseAutoCashout] = useState(false)

  const isWaiting = status === 'WAITING'
  const isRunning = status === 'RUNNING'
  const isCrashed = status === 'CRASHED'

  const hasBet = !!myBet && !cashedOut
  const canBet = isWaiting && !myBet
  const canCashout = isRunning && hasBet

  const handlePlaceBet = () => {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) return
    const ac = useAutoCashout ? parseFloat(autoCashout) : null
    placeBet(amt, ac)
  }

  const handleCashout = () => {
    cashout()
  }

  const setQuickAmount = (val) => {
    setAmount(String(val))
  }

  const doubleBet = () => setAmount(String(Math.min(parseFloat(amount || 0) * 2, user?.balance || 0)))
  const halfBet = () => setAmount(String(Math.floor(parseFloat(amount || 0) / 2)))

  const currentProfit = hasBet && isRunning
    ? ((myBet.amount * multiplier) - myBet.amount).toFixed(2)
    : null

  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      <h3 className="font-bold text-white text-base mb-1">Place Bet</h3>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-brand-primary/10 border border-brand-primary/30 rounded-lg px-3 py-2 text-brand-primary text-sm"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active bet indicator */}
      <AnimatePresence>
        {hasBet && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="glass-dark rounded-xl p-3 border border-brand-accent/20"
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-white/50 text-xs">Active Bet</span>
              <span className="text-brand-accent font-mono font-bold">₹{myBet.amount}</span>
            </div>
            {isRunning && currentProfit && (
              <div className="flex justify-between items-center">
                <span className="text-white/50 text-xs">Potential Win</span>
                <span className="text-brand-gold font-mono font-bold text-sm">
                  +₹{currentProfit}
                </span>
              </div>
            )}
            {myBet.autoCashout && (
              <div className="flex justify-between items-center mt-1">
                <span className="text-white/40 text-xs">Auto Cashout</span>
                <span className="text-brand-blue text-xs font-mono">{myBet.autoCashout}x</span>
              </div>
            )}
          </motion.div>
        )}
        {cashedOut && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-brand-accent/10 border border-brand-accent/30 rounded-xl p-3 text-center"
          >
            <span className="text-brand-accent font-bold text-sm">✓ Cashed out successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bet amount input */}
      <div className={`${hasBet ? 'opacity-50 pointer-events-none' : ''}`}>
        <label className="text-white/50 text-xs mb-1.5 block">Bet Amount (₹)</label>
        <div className="flex gap-2">
          <input
            id="bet-amount"
            type="number"
            min="1"
            max={user?.balance}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input-field flex-1 font-mono text-lg font-bold"
            placeholder="100"
          />
          <button onClick={halfBet} className="btn-outline px-3 py-2 text-sm">½</button>
          <button onClick={doubleBet} className="btn-outline px-3 py-2 text-sm">2x</button>
        </div>

        {/* Quick amounts */}
        <div className="flex gap-2 mt-2 flex-wrap">
          {QUICK_AMOUNTS.map((v) => (
            <button
              key={v}
              onClick={() => setQuickAmount(v)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all duration-150 min-w-[44px] ${
                amount === String(v)
                  ? 'bg-brand-primary/20 border-brand-primary/50 text-brand-primary'
                  : 'border-white/10 text-white/50 hover:border-white/30 hover:text-white'
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Auto cashout */}
        <div className="mt-3">
          <label className="flex items-center gap-2 cursor-pointer mb-2">
            <div
              onClick={() => setUseAutoCashout((v) => !v)}
              className={`w-10 h-5 rounded-full transition-all duration-200 relative cursor-pointer ${
                useAutoCashout ? 'bg-brand-primary' : 'bg-white/10'
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${
                  useAutoCashout ? 'left-5' : 'left-0.5'
                }`}
              />
            </div>
            <span className="text-white/60 text-xs select-none">Auto Cashout</span>
          </label>

          <AnimatePresence>
            {useAutoCashout && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
              >
                <input
                  id="auto-cashout"
                  type="number"
                  min="1.01"
                  step="0.1"
                  value={autoCashout}
                  onChange={(e) => setAutoCashout(e.target.value)}
                  className="input-field font-mono text-sm"
                  placeholder="e.g. 2.00"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Action button */}
      <AnimatePresence mode="wait">
        {canCashout ? (
          <motion.button
            key="cashout"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={handleCashout}
            id="cashout-btn"
            className="w-full py-4 bg-brand-accent hover:bg-emerald-400 text-dark-400 font-black text-xl rounded-xl transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-brand-accent/30 animate-pulse-fast"
          >
            CASH OUT @ {multiplier.toFixed(2)}x
            <div className="text-sm font-normal opacity-70 mt-0.5">
              ₹{(myBet?.amount * multiplier).toFixed(2)}
            </div>
          </motion.button>
        ) : canBet ? (
          <motion.button
            key="bet"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={handlePlaceBet}
            id="place-bet-btn"
            className="w-full btn-primary py-4 text-lg font-black"
          >
            PLACE BET — ₹{parseFloat(amount || 0).toFixed(2)}
          </motion.button>
        ) : (
          <motion.button
            key="waiting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            disabled
            className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-white/30 font-bold text-sm cursor-not-allowed"
          >
            {isCrashed ? 'Waiting for next round…' : hasBet ? 'Waiting for takeoff…' : 'Round in progress'}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

export default BetPanel

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWallet } from '../context/WalletContext'

const QUICK_AMOUNTS = [100, 500, 1000, 5000, 10000]

const DepositModal = ({ onClose }) => {
  const { deposit, loading } = useWallet()
  const [amount, setAmount] = useState('')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleDeposit = async () => {
    setError('')
    const result = await deposit(parseFloat(amount))
    if (result.success) {
      setSuccess(true)
      setTimeout(onClose, 1500)
    } else {
      setError(result.message)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="glass relative rounded-2xl p-6 w-full max-w-sm z-10"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white text-xl"
        >✕</button>

        <h2 className="text-xl font-black mb-1 gradient-text">Add Funds</h2>
        <p className="text-white/40 text-sm mb-5">Top up your Aviator wallet</p>

        {success ? (
          <motion.div
            initial={{ scale: 0.8 }} animate={{ scale: 1 }}
            className="text-center py-8"
          >
            <div className="text-5xl mb-3">✅</div>
            <p className="text-brand-accent font-bold">Deposit Successful!</p>
          </motion.div>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <label className="text-white/50 text-xs block mb-1.5">Amount (₹)</label>
                <input
                  id="deposit-amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="input-field font-mono text-lg"
                  min="10"
                />
              </div>

              <div className="grid grid-cols-5 gap-1.5">
                {QUICK_AMOUNTS.map((v) => (
                  <button
                    key={v}
                    onClick={() => setAmount(String(v))}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      amount === String(v)
                        ? 'bg-brand-primary/20 border-brand-primary/50 text-brand-primary'
                        : 'border-white/10 text-white/50 hover:border-white/30'
                    }`}
                  >
                    {v >= 1000 ? `${v / 1000}K` : v}
                  </button>
                ))}
              </div>

              {error && (
                <p className="text-brand-primary text-sm">{error}</p>
              )}

              <button
                id="confirm-deposit-btn"
                onClick={handleDeposit}
                disabled={loading || !amount}
                className="w-full btn-success py-3 text-base font-black"
              >
                {loading ? 'Processing…' : `Deposit ₹${amount || '—'}`}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}

export default DepositModal

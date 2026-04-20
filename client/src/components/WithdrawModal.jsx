import { useState } from 'react'
import { motion } from 'framer-motion'
import { useWallet } from '../context/WalletContext'
import { useAuth } from '../context/AuthContext'

const WithdrawModal = ({ onClose }) => {
  const { withdraw, loading } = useWallet()
  const { user } = useAuth()
  const [amount, setAmount] = useState('')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleWithdraw = async () => {
    setError('')
    if (parseFloat(amount) > user?.balance) {
      setError('Insufficient balance')
      return
    }
    const result = await withdraw(parseFloat(amount))
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
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="glass relative rounded-2xl p-6 w-full max-w-sm z-10"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white text-xl">✕</button>
        <h2 className="text-xl font-black mb-1 text-brand-gold">Withdraw</h2>
        <p className="text-white/40 text-sm mb-1">Available: <span className="text-white font-mono">₹{user?.balance?.toFixed(2)}</span></p>

        {success ? (
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-center py-8">
            <div className="text-5xl mb-3">💸</div>
            <p className="text-brand-gold font-bold">Withdrawal Successful!</p>
          </motion.div>
        ) : (
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-white/50 text-xs block mb-1.5">Amount (₹)</label>
              <input
                id="withdraw-amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Min ₹50"
                className="input-field font-mono text-lg"
              />
            </div>
            <button
              onClick={() => setAmount(String(Math.floor(user?.balance || 0)))}
              className="text-xs text-brand-primary underline"
            >
              Withdraw all (₹{Math.floor(user?.balance || 0)})
            </button>

            {error && <p className="text-brand-primary text-sm">{error}</p>}

            <button
              id="confirm-withdraw-btn"
              onClick={handleWithdraw}
              disabled={loading || !amount}
              className="w-full btn-primary py-3 text-base font-black"
            >
              {loading ? 'Processing…' : `Withdraw ₹${amount || '—'}`}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default WithdrawModal

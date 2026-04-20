import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useWallet } from '../context/WalletContext'
import DepositModal from '../components/DepositModal'
import WithdrawModal from '../components/WithdrawModal'
import TransactionTable from '../components/TransactionTable'

const WalletPage = () => {
  const { user } = useAuth()
  const { getTransactions } = useWallet()
  const [showDeposit, setShowDeposit] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [transactions, setTransactions] = useState([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loadingTx, setLoadingTx] = useState(false)

  const loadTransactions = async (p = 1) => {
    setLoadingTx(true)
    try {
      const data = await getTransactions(p)
      setTransactions(data.transactions)
      setPages(data.pages)
      setPage(p)
    } finally {
      setLoadingTx(false)
    }
  }

  useEffect(() => {
    loadTransactions(1)
  }, [])

  // Reload after modal close
  const handleModalClose = (type) => {
    if (type === 'deposit') setShowDeposit(false)
    if (type === 'withdraw') setShowWithdraw(false)
    setTimeout(() => loadTransactions(1), 500)
  }

  const stats = [
    { label: 'Balance', value: `₹${(user?.balance || 0).toFixed(2)}`, color: 'text-brand-gold' },
    { label: 'Total Won', value: `₹${(user?.totalWon || 0).toFixed(2)}`, color: 'text-brand-accent' },
    { label: 'Total Bets', value: user?.totalBets || 0, color: 'text-brand-blue' },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-3xl font-black gradient-text">💰 Wallet</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="glass rounded-2xl p-5 text-center">
            <p className="text-white/40 text-xs mb-1">{s.label}</p>
            <p className={`font-mono font-black text-xl ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button
          id="open-deposit-btn"
          onClick={() => setShowDeposit(true)}
          className="btn-success py-5 text-lg font-black"
        >
          ⬆️ Deposit
        </button>
        <button
          id="open-withdraw-btn"
          onClick={() => setShowWithdraw(true)}
          className="btn-primary py-5 text-lg font-black"
        >
          ⬇️ Withdraw
        </button>
      </div>

      {/* Transactions */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-white text-lg">Transaction History</h2>
          <button
            onClick={() => loadTransactions(1)}
            className="btn-ghost text-sm"
          >
            ↺ Refresh
          </button>
        </div>

        {loadingTx ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
          </div>
        ) : (
          <TransactionTable transactions={transactions} />
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-5">
            <button
              onClick={() => loadTransactions(page - 1)}
              disabled={page === 1}
              className="btn-ghost text-sm disabled:opacity-30"
            >
              ← Prev
            </button>
            <span className="text-white/40 text-sm">{page} / {pages}</span>
            <button
              onClick={() => loadTransactions(page + 1)}
              disabled={page === pages}
              className="btn-ghost text-sm disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showDeposit && <DepositModal onClose={() => handleModalClose('deposit')} />}
        {showWithdraw && <WithdrawModal onClose={() => handleModalClose('withdraw')} />}
      </AnimatePresence>
    </div>
  )
}

export default WalletPage

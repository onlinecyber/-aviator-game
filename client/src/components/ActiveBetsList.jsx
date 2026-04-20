import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../context/GameContext'
import { useAuth } from '../context/AuthContext'

const maskName = (name = '') => {
  if (name.length <= 2) return name + '***'
  return name[0] + '***' + name[name.length - 1]
}

const getAvatarColor = (name = '') => {
  const colors = [
    '#e63946', '#457b9d', '#2a9d8f', '#e9c46a',
    '#f4a261', '#264653', '#6a4c93', '#1982c4',
  ]
  let hash = 0
  for (let c of name) hash = c.charCodeAt(0) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

const tabs = ['All Bets', 'My Bets', 'Top']

const ActiveBetsList = () => {
  const { activeBets, multiplier, status } = useGame()
  const { user } = useAuth()
  const [tab, setTab] = useState('All Bets')

  const isRunning = status === 'RUNNING'

  // For demo — enrich active bets list
  const bets = tab === 'All Bets' ? activeBets
    : tab === 'My Bets' ? activeBets.filter((b) => b.username === user?.username)
    : [...activeBets].sort((a, b) => b.amount - a.amount)

  return (
    <div className="flex flex-col h-full text-[11px]">
      {/* Header */}
      <div className="px-3 pt-2 pb-1 border-b border-white/5 flex-shrink-0">
        <div className="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-2">
          ALL BETS <span className="text-white/30 ml-1">{activeBets.length}</span>
        </div>
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-1 rounded-md text-[10px] font-semibold transition-all ${
                tab === t
                  ? 'bg-[#1e2d4a] text-white'
                  : 'text-white/30 hover:text-white/60'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Column headers */}
      <div className="flex items-center px-2 py-1.5 border-b border-white/5 flex-shrink-0">
        <div className="flex-1 text-white/30 text-[10px]">User</div>
        <div className="w-14 text-white/30 text-[10px] text-right">Bet ₹</div>
        <div className="w-8 text-white/30 text-[10px] text-center">X</div>
        <div className="w-16 text-white/30 text-[10px] text-right">Cash out ₹</div>
      </div>

      {/* Bet rows */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence initial={false}>
          {bets.length === 0 ? (
            <div className="text-center py-8 text-white/20 text-xs">No bets yet</div>
          ) : (
            bets.map((bet, i) => {
              const isCashedOut = bet.cashedOut || false
              const potentialWin = isRunning && !isCashedOut
                ? (bet.amount * multiplier).toFixed(2)
                : null
              const avatarColor = getAvatarColor(bet.username)

              return (
                <motion.div
                  key={`${bet.username}-${bet.amount}`}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 20, opacity: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  className={`flex items-center px-2 py-1.5 border-b border-white/3 transition-colors ${
                    isCashedOut
                      ? 'bg-green-900/20 border-l-2 border-l-green-500/50'
                      : 'hover:bg-white/2'
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold text-[9px] mr-1.5 flex-shrink-0"
                    style={{ background: avatarColor }}
                  >
                    {bet.username?.[0]?.toUpperCase()}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <span className="text-white/70 truncate block">{maskName(bet.username)}</span>
                  </div>

                  {/* Bet amount */}
                  <div className="w-14 text-right font-mono text-white/70">
                    {bet.amount?.toFixed(2)}
                  </div>

                  {/* Multiplier at cashout */}
                  <div className="w-8 text-center font-mono">
                    {isCashedOut
                      ? <span className="text-green-400 font-bold">{bet.cashedOutAt?.toFixed(2)}x</span>
                      : <span className="text-white/20">—</span>
                    }
                  </div>

                  {/* Cash out amount */}
                  <div className="w-16 text-right font-mono">
                    {isCashedOut
                      ? <span className="text-green-400 font-bold">{(bet.amount * (bet.cashedOutAt || 1)).toFixed(2)}</span>
                      : potentialWin
                      ? <span className="text-white/40">{potentialWin}</span>
                      : <span className="text-white/20">—</span>
                    }
                  </div>
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default ActiveBetsList

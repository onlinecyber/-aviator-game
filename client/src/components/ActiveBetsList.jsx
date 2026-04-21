import { useState, useEffect, useRef } from 'react'
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

// Special hook for list to update at 10fps instead of 60fps to save DOM performance on 100+ bets
const useListMultiplier = (startTime, isRunning) => {
  const [m, setM] = useState(1.0)
  useEffect(() => {
    if (!isRunning || !startTime) { setM(1.0); return }
    const int = setInterval(() => {
      const elapsed = Date.now() - startTime
      setM(Math.E ** (0.00006 * elapsed))
    }, 100)
    return () => clearInterval(int)
  }, [startTime, isRunning])
  return m
}

const ActiveBetsList = () => {
  const { activeBets, status, startTime } = useGame()
  const { user } = useAuth()
  const [tab, setTab] = useState('All Bets')

  const isRunning = status === 'RUNNING'
  const listMultiplier = useListMultiplier(startTime, isRunning)

  // Map backend array if we receive player:cashedout to update local `activeBets` if needed.
  // Wait, backend sends activeBets via `players:active` and when someone cashes out, it emits `player:cashedout`
  // Actually, our context activeBets currently is `[{username, amount, autoCashout}]`, we need to track if they cashed out.
  // The context needs to handle `player:cashedout` to mark them as cashedOut.
  // Assuming our context marks `cashedOutAt`.

  let bets = tab === 'All Bets' 
    ? activeBets 
    : tab === 'My Bets' 
      ? activeBets.filter((b) => b.username === user?.username)
      : [...activeBets].sort((a, b) => b.amount - a.amount)

  return (
    <div className="flex flex-col h-full text-[11px]">
      {/* Header */}
      <div className="px-3 pt-2 pb-1 border-b border-white/5 flex-shrink-0">
        <div className="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-2">
          ALL BETS <span className="text-white/30 ml-1">{activeBets.length}</span>
        </div>
        <div className="flex gap-1" style={{ maxWidth: '200px' }}>
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-1 rounded-md text-[10px] font-semibold transition-all ${
                tab === t
                  ? 'bg-[#1e2d4a] text-white shadow'
                  : 'text-white/30 hover:text-white/60 hover:bg-white/5'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Column headers */}
      <div className="flex items-center px-2 py-1.5 border-b border-white/5 flex-shrink-0 font-semibold tracking-wider">
        <div className="flex-1 text-white/30 text-[10px]">User</div>
        <div className="w-14 text-white/30 text-[10px] text-right">Bet ₹</div>
        <div className="w-9 text-white/30 text-[10px] text-center">X</div>
        <div className="w-16 text-white/30 text-[10px] text-right">Cash out ₹</div>
      </div>

      {/* Bet rows */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide py-1">
        <AnimatePresence initial={false}>
          {bets.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center py-8 text-white/20 text-xs font-semibold"
            >
              No bets this round
            </motion.div>
          ) : (
            bets.map((bet, i) => {
              const isCashedOut = !!bet.cashedOutAt
              const potentialWin = isRunning && !isCashedOut
                ? (bet.amount * listMultiplier).toFixed(2)
                : null
              const avatarColor = getAvatarColor(bet.username)

              // Determine if Top Cashout (arbitrary highlight for high multipliers or amounts)
              const isTopCashout = isCashedOut && (bet.cashedOutAt >= 10 || bet.amount >= 500)

              return (
                <motion.div
                  key={`${bet.username}-${bet.amount}`}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ 
                     x: 0, 
                     opacity: 1,
                     backgroundColor: isCashedOut ? (isTopCashout ? 'rgba(16, 185, 129, 0.25)' : 'rgba(20, 83, 45, 0.2)') : 'rgba(255, 255, 255, 0.02)'
                  }}
                  exit={{ x: 20, opacity: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.2) }}
                  className={`flex items-center px-2 py-1.5 mx-1 mb-px rounded-md border-l-2 transition-colors ${
                    isCashedOut
                      ? isTopCashout 
                         ? 'border-l-emerald-400 shadow-md shadow-emerald-500/10'
                         : 'border-l-emerald-600/50'
                      : 'border-l-transparent hover:bg-white/5'
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold text-[9px] mr-2 flex-shrink-0"
                    style={{ background: avatarColor }}
                  >
                    {bet.username?.[0]?.toUpperCase()}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0 pr-2">
                    <span className="text-white/70 truncate block font-medium">{maskName(bet.username)}</span>
                  </div>

                  {/* Bet amount */}
                  <div className="w-14 text-right font-mono text-white/70">
                    {bet.amount?.toFixed(2)}
                  </div>

                  {/* Multiplier at cashout */}
                  <div className="w-9 text-center font-mono">
                    {isCashedOut
                      ? <motion.span 
                          initial={{ scale: 1.5, color: '#fff' }}
                          animate={{ scale: 1, color: isTopCashout ? '#34d399' : '#4ade80' }}
                          className={`font-black ${isTopCashout ? 'drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]' : ''}`}
                        >
                          {bet.cashedOutAt?.toFixed(2)}x
                        </motion.span>
                      : <span className="text-white/20">—</span>
                    }
                  </div>

                  {/* Cash out amount */}
                  <div className="w-16 text-right font-mono pl-2">
                    {isCashedOut
                      ? <span className={`font-black ${isTopCashout ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'text-emerald-500'}`}>
                           +{(bet.amount * bet.cashedOutAt).toFixed(2)}
                        </span>
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

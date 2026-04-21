import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../context/GameContext'
import { useAuth } from '../context/AuthContext'

const maskName = (name = '') => {
  if (name.length <= 2) return name + '***'
  return name[0] + '***' + name[name.length - 1]
}

const getAvatarColor = (name = '') => {
  const colors = ['#00e676', '#00e5ff', '#cc44ff', '#ffd700', '#ff5252', '#2979ff', '#ff6d00', '#00bcd4']
  let hash = 0
  for (const c of name) hash = c.charCodeAt(0) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

const useListMultiplier = (startTime, isRunning) => {
  const [m, setM] = useState(1.0)
  useEffect(() => {
    if (!isRunning || !startTime) { setM(1.0); return }
    const id = setInterval(() => {
      setM(Math.E ** (0.00006 * (Date.now() - startTime)))
    }, 100)
    return () => clearInterval(id)
  }, [startTime, isRunning])
  return m
}

const tabs = ['ALL BETS', 'MY BETS', 'TOP']

const ActiveBetsList = () => {
  const { activeBets, status, startTime } = useGame()
  const { user } = useAuth()
  const [tab, setTab] = useState('ALL BETS')

  const isRunning = status === 'RUNNING'
  const listM     = useListMultiplier(startTime, isRunning)

  const bets = tab === 'ALL BETS'
    ? activeBets
    : tab === 'MY BETS'
    ? activeBets.filter(b => b.username === user?.username)
    : [...activeBets].sort((a, b) => b.amount - a.amount)

  return (
    <div className="flex flex-col h-full text-[11px]">
      {/* Header */}
      <div className="px-3 pt-2.5 pb-2 border-b flex-shrink-0" style={{ borderColor: 'rgba(0,230,118,0.08)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="font-orbitron text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(0,230,118,0.6)' }}>
            Live Bets
          </span>
          <span
            className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(0,230,118,0.1)', color: '#00e676', border: '1px solid rgba(0,230,118,0.2)' }}
          >
            {activeBets.length}
          </span>
        </div>
        <div className="flex gap-1">
          {tabs.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`tab-btn flex-1 py-1 ${tab === t ? 'active' : ''}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Column headers */}
      <div className="flex items-center px-3 py-1.5 border-b flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
        <div className="flex-1 text-white/25 text-[9px] font-orbitron uppercase tracking-widest">Player</div>
        <div className="w-14 text-white/25 text-[9px] font-orbitron uppercase tracking-widest text-right">Bet</div>
        <div className="w-10 text-white/25 text-[9px] font-orbitron uppercase tracking-widest text-center">×</div>
        <div className="w-16 text-white/25 text-[9px] font-orbitron uppercase tracking-widest text-right">Payout</div>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto scrollbar-hide py-1">
        <AnimatePresence initial={false}>
          {bets.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center py-10"
            >
              <div className="text-2xl mb-2">🎲</div>
              <div className="text-white/20 text-xs font-orbitron tracking-widest">NO BETS YET</div>
            </motion.div>
          ) : (
            bets.map((bet, i) => {
              const cashed     = !!bet.cashedOutAt
              const isMega     = cashed && (bet.cashedOutAt >= 10 || bet.amount >= 1000)
              const potencial  = isRunning && !cashed ? (bet.amount * listM).toFixed(2) : null
              const avatarClr  = getAvatarColor(bet.username)
              const isMe       = bet.username === user?.username

              return (
                <motion.div
                  key={`${bet.username}-${bet.amount}-${i}`}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 20, opacity: 0 }}
                  transition={{ delay: Math.min(i * 0.015, 0.2) }}
                  className="flex items-center px-3 py-1.5 mx-1 mb-0.5 rounded-xl transition-all"
                  style={{
                    background: cashed
                      ? isMega
                        ? 'rgba(0,230,118,0.12)'
                        : 'rgba(0,230,118,0.06)'
                      : isMe
                      ? 'rgba(0,229,255,0.04)'
                      : 'transparent',
                    borderLeft: cashed
                      ? `2px solid ${isMega ? '#00e676' : 'rgba(0,230,118,0.3)'}`
                      : isMe
                      ? '2px solid rgba(0,229,255,0.4)'
                      : '2px solid transparent',
                    boxShadow: isMega ? '0 0 15px rgba(0,230,118,0.15)' : 'none',
                  }}
                >
                  {/* Avatar */}
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black mr-2 flex-shrink-0"
                    style={{ background: avatarClr, color: '#000' }}
                  >
                    {bet.username?.[0]?.toUpperCase()}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0 pr-1">
                    <span
                      className="truncate block font-semibold"
                      style={{ color: isMe ? '#00e5ff' : 'rgba(255,255,255,0.65)' }}
                    >
                      {maskName(bet.username)}{isMe && ' 👤'}
                    </span>
                  </div>

                  {/* Bet */}
                  <div className="w-14 text-right font-mono" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    ₹{bet.amount?.toFixed(2)}
                  </div>

                  {/* Multiplier */}
                  <div className="w-10 text-center font-mono">
                    {cashed ? (
                      <motion.span
                        initial={{ scale: 1.4 }}
                        animate={{ scale: 1 }}
                        className="font-black"
                        style={{
                          color: isMega ? '#00e676' : '#4ade80',
                          textShadow: isMega ? '0 0 10px rgba(0,230,118,0.7)' : 'none',
                        }}
                      >
                        {bet.cashedOutAt?.toFixed(2)}×
                      </motion.span>
                    ) : (
                      <span style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>
                    )}
                  </div>

                  {/* Payout */}
                  <div className="w-16 text-right font-mono">
                    {cashed ? (
                      <span
                        className="font-black"
                        style={{
                          color: isMega ? '#00e676' : '#4ade80',
                          textShadow: isMega ? '0 0 8px rgba(0,230,118,0.5)' : 'none',
                        }}
                      >
                        +₹{(bet.amount * bet.cashedOutAt).toFixed(0)}
                      </span>
                    ) : potencial ? (
                      <span style={{ color: 'rgba(255,255,255,0.35)' }}>₹{potencial}</span>
                    ) : (
                      <span style={{ color: 'rgba(255,255,255,0.15)' }}>—</span>
                    )}
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

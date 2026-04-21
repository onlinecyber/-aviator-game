import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'
import { useGame } from '../context/GameContext'
import ProvablyFairModal from './ProvablyFairModal'

const getPillStyle = (cp) => {
  if (!cp) return { cls: 'pill-low', label: '?' }
  if (cp >= 10) return { cls: 'pill-moon',  label: `${cp.toFixed(2)}x` }
  if (cp >= 3)  return { cls: 'pill-high',  label: `${cp.toFixed(2)}x` }
  if (cp >= 2)  return { cls: 'pill-mid',   label: `${cp.toFixed(2)}x` }
  return              { cls: 'pill-low',   label: `${cp.toFixed(2)}x` }
}

const GameHistoryBar = () => {
  const { history } = useGame()
  const [selectedGame, setSelectedGame] = useState(null)

  return (
    <>
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-hide select-none">
        <div className="flex-shrink-0 flex items-center gap-1 mr-1">
          <ShieldCheck size={10} className="text-neon-green opacity-60" />
          <span className="text-[9px] text-white/25 uppercase tracking-widest font-semibold font-orbitron">History</span>
        </div>

        {history.length === 0 ? (
          <div className="flex gap-1.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-14 h-6 rounded-lg animate-pulse"
                style={{ background: 'rgba(255,255,255,0.04)', animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        ) : (
          history.map((item, i) => {
            const cp = item.crashPoint || 1
            const { cls, label } = getPillStyle(cp)
            return (
              <motion.button
                key={item.gameId || i}
                onClick={() => setSelectedGame(item)}
                initial={{ x: -15, opacity: 0, scale: 0.8 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03, type: 'spring', stiffness: 300 }}
                className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-orbitron font-bold cursor-pointer transition-all hover:scale-110 hover:brightness-125 whitespace-nowrap ${cls}`}
                title={`Game ${item.gameId?.slice(-6)} — click to verify`}
              >
                {label}
              </motion.button>
            )
          })
        )}
      </div>

      <ProvablyFairModal
        isOpen={!!selectedGame}
        onClose={() => setSelectedGame(null)}
        gameData={selectedGame}
      />
    </>
  )
}

export default GameHistoryBar

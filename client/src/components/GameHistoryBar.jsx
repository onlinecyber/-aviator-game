import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../context/GameContext'

const getCrashColor = (cp) => {
  if (!cp) return { text: 'text-white/50', bg: 'bg-white/5', border: 'border-white/10' }
  if (cp < 2)  return { text: 'text-red-400',    bg: 'bg-red-500/10',  border: 'border-red-500/30' }
  if (cp < 5)  return { text: 'text-blue-400',   bg: 'bg-blue-500/10', border: 'border-blue-500/30' }
  if (cp < 10) return { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' }
  return              { text: 'text-green-400',  bg: 'bg-green-500/10', border: 'border-green-500/30' }
}

const GameHistoryBar = () => {
  const { history } = useGame()

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 select-none scrollbar-hide">
      {history.length === 0 ? (
        <span className="text-white/20 text-xs px-2">No history</span>
      ) : (
        history.map((item, i) => {
          const cp = item.crashPoint || 1
          const { text, bg, border } = getCrashColor(cp)
          return (
            <motion.div
              key={item.gameId || i}
              initial={{ x: -15, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.02 }}
              className={`flex-shrink-0 px-2.5 py-1 rounded-md border text-xs font-mono font-bold cursor-default whitespace-nowrap ${bg} ${text} ${border}`}
            >
              {cp.toFixed(2)}x
            </motion.div>
          )
        })
      )}
    </div>
  )
}

export default GameHistoryBar

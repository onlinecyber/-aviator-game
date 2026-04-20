import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../context/GameContext'

const MultiplierDisplay = () => {
  const { status, multiplier, lastCrashPoint, bettingEndsIn } = useGame()

  const isCrashed = status === 'CRASHED'
  const isRunning = status === 'RUNNING'
  const isWaiting = status === 'WAITING'

  const getColor = () => {
    if (isCrashed) return '#e63946'
    if (isWaiting) return '#ffd60a'
    if (multiplier < 1.5) return '#06d6a0'
    if (multiplier < 3) return '#4cc9f0'
    if (multiplier < 10) return '#f4a261'
    return '#e63946'
  }

  const displayValue = isCrashed
    ? (lastCrashPoint || 1).toFixed(2)
    : (multiplier || 1).toFixed(2)

  return (
    <div className="flex flex-col items-center justify-center select-none">
      {/* Main multiplier */}
      <motion.div
        key={`${status}-${Math.floor(multiplier * 10)}`}
        className="font-mono font-black leading-none text-center"
        style={{
          fontSize: 'clamp(3rem, 10vw, 7rem)',
          color: getColor(),
          textShadow: `0 0 30px ${getColor()}60, 0 0 60px ${getColor()}30`,
          transition: 'color 0.3s ease',
        }}
        animate={isRunning ? { scale: [1, 1.02, 1] } : {}}
        transition={{ duration: 0.2 }}
      >
        {displayValue}x
      </motion.div>

      {/* Status label */}
      <AnimatePresence mode="wait">
        {isWaiting && (
          <motion.div
            key="waiting"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="mt-2 text-brand-gold/80 font-semibold text-sm tracking-widest uppercase"
          >
            Starting soon…
          </motion.div>
        )}
        {isRunning && multiplier >= 5 && (
          <motion.div
            key="running-high"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="mt-2 text-white/50 font-bold text-xs tracking-widest uppercase animate-pulse-fast"
          >
            🔥 GOING HIGH — CASH OUT!
          </motion.div>
        )}
        {isCrashed && (
          <motion.div
            key="crashed"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-2 text-brand-primary/70 font-semibold text-sm tracking-widest uppercase"
          >
            Next round starting…
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MultiplierDisplay

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import api from '../services/api'

const MEDALS = ['🥇', '🥈', '🥉']

const LeaderboardPage = () => {
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/games/leaderboard')
      .then((r) => setLeaderboard(r.data.leaderboard || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-black gradient-text mb-1">🏆 Leaderboard</h1>
        <p className="text-white/40 text-sm">Top players by total winnings</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center text-white/30">
              <div className="text-5xl mb-3">🏆</div>
              <p>No players yet. Be the first to win!</p>
            </div>
          ) : (
            leaderboard.map((player, i) => (
              <motion.div
                key={player.username}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`glass rounded-2xl p-4 flex items-center gap-4 ${
                  i === 0 ? 'border border-brand-gold/20 border-glow' : ''
                }`}
              >
                {/* Rank */}
                <div className="text-2xl w-10 text-center flex-shrink-0">
                  {MEDALS[i] || <span className="text-white/30 font-bold text-base">#{player.rank}</span>}
                </div>

                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-black text-lg flex-shrink-0"
                  style={{
                    background: `hsl(${(i * 47) % 360}, 70%, 45%)`,
                  }}
                >
                  {player.username?.[0]?.toUpperCase()}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className={`font-bold truncate ${i === 0 ? 'text-brand-gold' : 'text-white'}`}>
                    {player.username}
                  </p>
                  <p className="text-white/40 text-xs">{player.totalBets} bets played</p>
                </div>

                {/* Stats */}
                <div className="text-right flex-shrink-0">
                  <p className="font-mono font-black text-brand-accent">
                    ₹{(player.totalWon || 0).toFixed(0)}
                  </p>
                  <p className={`text-xs font-mono ${player.netProfit >= 0 ? 'text-brand-accent' : 'text-brand-primary'}`}>
                    {player.netProfit >= 0 ? '+' : ''}₹{(player.netProfit || 0).toFixed(0)} net
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default LeaderboardPage

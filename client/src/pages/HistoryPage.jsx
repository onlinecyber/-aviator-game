import { useState, useEffect } from 'react'
import api from '../services/api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const HistoryPage = () => {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [myBets, setMyBets] = useState([])
  const [tab, setTab] = useState('games') // 'games' | 'mybets'

  useEffect(() => {
    const fetchAll = async () => {
      const [gamesRes, betsRes] = await Promise.all([
        api.get('/api/games/history?limit=50'),
        api.get('/api/games/my-bets'),
      ])
      setGames(gamesRes.data.games || [])
      setMyBets(betsRes.data.bets || [])
      setLoading(false)
    }
    fetchAll().catch(() => setLoading(false))
  }, [])

  const getCrashColor = (cp) => {
    if (cp < 1.5) return '#e63946'
    if (cp < 3) return '#ffd60a'
    if (cp < 10) return '#4cc9f0'
    return '#06d6a0'
  }

  const chartData = [...games].reverse().slice(-30).map((g) => ({
    name: `${(g.revealedCrashPoint || 1).toFixed(2)}x`,
    value: g.revealedCrashPoint || 1,
    fill: getCrashColor(g.revealedCrashPoint || 1),
  }))

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-3xl font-black gradient-text">📜 History</h1>

      {/* Chart */}
      {!loading && games.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <h2 className="font-bold mb-4 text-white/70 text-sm uppercase tracking-wider">
            Last 30 Crash Points
          </h2>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 9 }} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 9 }} />
              <Tooltip
                contentStyle={{ background: '#1a1b2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {['games', 'mybets'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === t ? 'bg-brand-primary text-white' : 'glass text-white/50 hover:text-white'
            }`}
          >
            {t === 'games' ? '🎮 All Games' : '🎯 My Bets'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          {tab === 'games' ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/40 border-b border-white/5">
                  <th className="text-left p-4 font-medium">#</th>
                  <th className="text-left p-4 font-medium">Crash Point</th>
                  <th className="text-left p-4 font-medium hidden sm:table-cell">Players</th>
                  <th className="text-left p-4 font-medium hidden md:table-cell">Total Bet</th>
                  <th className="text-right p-4 font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {games.map((g, i) => {
                  const cp = g.revealedCrashPoint || 1
                  const color = getCrashColor(cp)
                  return (
                    <tr key={g.gameId} className="hover:bg-white/2 transition-colors">
                      <td className="p-4 text-white/30 text-xs">{i + 1}</td>
                      <td className="p-4">
                        <span
                          className="font-mono font-black text-base px-3 py-1 rounded-lg"
                          style={{ color, background: `${color}18`, border: `1px solid ${color}35` }}
                        >
                          {cp.toFixed(2)}x
                        </span>
                      </td>
                      <td className="p-4 text-white/50 hidden sm:table-cell">{g.playerCount || 0}</td>
                      <td className="p-4 font-mono text-white/50 hidden md:table-cell">
                        ₹{(g.totalBetAmount || 0).toFixed(2)}
                      </td>
                      <td className="p-4 text-right text-white/30 text-xs">
                        {g.crashedAt ? new Date(g.crashedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/40 border-b border-white/5">
                  <th className="text-left p-4 font-medium">Bet Amount</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium hidden sm:table-cell">Cashout</th>
                  <th className="text-right p-4 font-medium">Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {myBets.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-white/30">No bets placed yet</td>
                  </tr>
                ) : (
                  myBets.map((bet) => (
                    <tr key={bet._id} className="hover:bg-white/2 transition-colors">
                      <td className="p-4 font-mono font-bold text-white">₹{bet.amount}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold border ${
                          bet.status === 'cashedout'
                            ? 'bg-brand-accent/10 text-brand-accent border-brand-accent/30'
                            : bet.status === 'lost'
                            ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/30'
                            : 'bg-white/5 text-white/50 border-white/10'
                        }`}>
                          {bet.status}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-white/60 hidden sm:table-cell">
                        {bet.cashedOutAt ? `${bet.cashedOutAt.toFixed(2)}x` : '—'}
                      </td>
                      <td className={`p-4 text-right font-mono font-bold ${bet.profit >= 0 ? 'text-brand-accent' : 'text-brand-primary'}`}>
                        {bet.profit >= 0 ? '+' : ''}₹{(bet.profit || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

export default HistoryPage

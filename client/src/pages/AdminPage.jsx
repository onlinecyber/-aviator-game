import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../services/api'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend
} from 'recharts'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
const fmtDate = (d) =>
  new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

const StatusBadge = ({ active }) => (
  <span className={`px-2 py-0.5 rounded-lg text-xs font-bold border ${
    active
      ? 'bg-brand-accent/10 text-brand-accent border-brand-accent/30'
      : 'bg-brand-primary/10 text-brand-primary border-brand-primary/30'
  }`}>
    {active ? 'Active' : 'Banned'}
  </span>
)

const TxBadge = ({ status }) => {
  const map = {
    pending:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    completed: 'bg-brand-accent/10 text-brand-accent border-brand-accent/30',
    failed:    'bg-brand-primary/10 text-brand-primary border-brand-primary/30',
  }
  return (
    <span className={`px-2 py-0.5 rounded-lg text-xs font-bold border capitalize ${map[status] || ''}`}>
      {status}
    </span>
  )
}

const Spinner = () => (
  <div className="flex justify-center items-center py-16">
    <div className="w-8 h-8 border-2 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
  </div>
)

const Pagination = ({ page, pages, onChange }) =>
  pages > 1 ? (
    <div className="flex items-center justify-center gap-3 mt-5 pt-4 border-t border-white/5">
      <button onClick={() => onChange(page - 1)} disabled={page === 1} className="btn-ghost text-sm disabled:opacity-30">← Prev</button>
      <span className="text-white/40 text-sm font-mono">{page} / {pages}</span>
      <button onClick={() => onChange(page + 1)} disabled={page === pages} className="btn-ghost text-sm disabled:opacity-30">Next →</button>
    </div>
  ) : null

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, color = 'text-white', glow }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`glass rounded-2xl p-5 ${glow ? 'border border-brand-accent/20' : ''}`}
  >
    <div className="text-3xl mb-3">{icon}</div>
    <p className="text-white/40 text-xs uppercase tracking-wider mb-1">{label}</p>
    <p className={`font-mono font-black text-2xl ${color}`}>{value}</p>
    {sub && <p className="text-white/30 text-xs mt-1">{sub}</p>}
  </motion.div>
)

// ─── Overview Tab ─────────────────────────────────────────────────────────────
const OverviewTab = ({ stats }) => {
  if (!stats) return <Spinner />

  const profitColor = stats.houseProfit >= 0 ? 'text-brand-accent' : 'text-brand-primary'

  const chartData = [
    { name: 'Total Bet', value: stats.totalBet },
    { name: 'Total Payout', value: stats.totalPayout },
    { name: "Today's Bets", value: stats.todayBets },
    { name: 'House Profit', value: Math.max(0, stats.houseProfit) },
  ]

  return (
    <div className="space-y-6">
      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="👥" label="Total Users" value={stats.totalUsers} sub={`${stats.activeUsers} active, ${stats.bannedUsers} banned`} color="text-brand-blue" />
        <StatCard icon="🎮" label="Total Rounds" value={stats.totalGames.toLocaleString()} color="text-brand-gold" />
        <StatCard icon="⏳" label="Pending Withdrawals" value={stats.pendingWithdrawals} color="text-yellow-400" sub="Requires action" />
        <StatCard icon="📈" label="House Profit" value={fmt(stats.houseProfit)} color={profitColor} glow={stats.houseProfit > 0} />
      </div>

      {/* Financial breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-5">
          <p className="text-white/40 text-xs mb-1">Total Wagered</p>
          <p className="text-2xl font-black font-mono text-white">{fmt(stats.totalBet)}</p>
        </div>
        <div className="glass rounded-2xl p-5">
          <p className="text-white/40 text-xs mb-1">Total Paid Out</p>
          <p className="text-2xl font-black font-mono text-brand-primary">{fmt(stats.totalPayout)}</p>
        </div>
        <div className="glass rounded-2xl p-5">
          <p className="text-white/40 text-xs mb-1">Today's Volume</p>
          <p className="text-2xl font-black font-mono text-brand-gold">{fmt(stats.todayBets)}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="glass rounded-2xl p-6">
        <h3 className="font-bold text-white/70 text-sm uppercase tracking-wider mb-4">Financial Overview</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
            <Tooltip
              contentStyle={{ background: '#1a1b2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 12 }}
              formatter={(v) => [fmt(v), '']}
            />
            <Bar dataKey="value" fill="#e63946" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ─── Users Tab ────────────────────────────────────────────────────────────────
const UsersTab = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [balanceInputs, setBalanceInputs] = useState({})
  const [msg, setMsg] = useState('')

  const fetchUsers = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const r = await api.get(`/api/admin/users?search=${search}&filter=${filter}&page=${p}`)
      setUsers(r.data.users || [])
      setPages(r.data.pages)
      setPage(p)
    } finally {
      setLoading(false)
    }
  }, [search, filter])

  useEffect(() => { fetchUsers(1) }, [filter])

  const showMsg = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  const handleBan = async (id, isActive) => {
    await api.patch(`/api/admin/users/${id}/status`)
    showMsg(isActive ? 'User banned ✓' : 'User unbanned ✓')
    fetchUsers(page)
  }

  const handleBalance = async (id) => {
    const amt = parseFloat(balanceInputs[id])
    if (!amt) return
    await api.patch(`/api/admin/users/${id}/balance`, { amount: amt, reason: 'Admin adjustment' })
    showMsg(`Balance adjusted by ₹${amt} ✓`)
    setBalanceInputs((p) => ({ ...p, [id]: '' }))
    fetchUsers(page)
  }

  return (
    <div className="space-y-4">
      {msg && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-brand-accent/10 border border-brand-accent/30 rounded-xl px-4 py-3 text-brand-accent text-sm">
          ✓ {msg}
        </motion.div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchUsers(1)}
          placeholder="Search username or email…"
          className="input-field flex-1 min-w-[200px]"
        />
        <button onClick={() => fetchUsers(1)} className="btn-outline px-5">Search</button>
        {['all', 'active', 'banned'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${
              filter === f ? 'bg-brand-primary text-white' : 'glass text-white/50 hover:text-white'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/40 border-b border-white/5 text-left">
                  <th className="p-4">User</th>
                  <th className="p-4">Balance</th>
                  <th className="p-4 hidden md:table-cell">Bets / Won</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 hidden lg:table-cell">Adjust Balance</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-white/30">No users found</td></tr>
                ) : users.map((u) => (
                  <tr key={u._id} className="hover:bg-white/2 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm"
                          style={{ background: `hsl(${parseInt(u._id?.slice(-6), 16) % 360}, 60%, 40%)` }}>
                          {u.username?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{u.username}</p>
                          <p className="text-white/40 text-xs">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-mono font-bold text-brand-gold">{fmt(u.balance)}</td>
                    <td className="p-4 text-white/50 hidden md:table-cell">
                      <span className="text-white/70">{u.totalBets || 0}</span>
                      <span className="text-white/30 mx-1">/</span>
                      <span className="text-brand-accent">{fmt(u.totalWon)}</span>
                    </td>
                    <td className="p-4"><StatusBadge active={u.isActive} /></td>
                    <td className="p-4 hidden lg:table-cell">
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={balanceInputs[u._id] || ''}
                          onChange={(e) => setBalanceInputs((p) => ({ ...p, [u._id]: e.target.value }))}
                          placeholder="±amount"
                          className="input-field w-28 py-1.5 text-sm"
                        />
                        <button onClick={() => handleBalance(u._id)} className="btn-outline text-xs px-3 py-1.5">Apply</button>
                      </div>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleBan(u._id, u.isActive)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-bold border transition-all ${
                          u.isActive
                            ? 'border-brand-primary/40 text-brand-primary hover:bg-brand-primary/10'
                            : 'border-brand-accent/40 text-brand-accent hover:bg-brand-accent/10'
                        }`}
                      >
                        {u.isActive ? '🚫 Ban' : '✅ Unban'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pages={pages} onChange={fetchUsers} />
        </div>
      )}
    </div>
  )
}

// ─── Deposits Tab ─────────────────────────────────────────────────────────────
const DepositsTab = () => {
  const [deposits, setDeposits] = useState([])
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('pending')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [msg, setMsg] = useState({ text: '', type: 'success' })

  const fetchD = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const r = await api.get(`/api/admin/deposits?status=${status}&page=${p}`)
      setDeposits(r.data.deposits || [])
      setPages(r.data.pages)
      setPage(p)
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => { fetchD(1) }, [status])

  const showMsg = (text, type = 'success') => {
    setMsg({ text, type })
    setTimeout(() => setMsg({ text: '', type: 'success' }), 3000)
  }

  const handleApprove = async (id) => {
    try {
      await api.patch(`/api/admin/deposits/${id}/approve`)
      showMsg('Deposit approved & balance credited ✓', 'success')
      fetchD(page)
    } catch (err) {
      showMsg(err.response?.data?.message || 'Approval failed', 'warn')
    }
  }

  const handleReject = async (id) => {
    const reason = window.prompt('Enter rejection reason:', 'Invalid UTR or payment not received')
    if (reason === null) return
    try {
      await api.patch(`/api/admin/deposits/${id}/reject`, { reason })
      showMsg('Deposit rejected ✓', 'warn')
      fetchD(page)
    } catch (err) {
      showMsg('Rejection failed', 'warn')
    }
  }

  return (
    <div className="space-y-4">
      {msg.text && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className={`border rounded-xl px-4 py-3 text-sm ${
            msg.type === 'success' ? 'bg-brand-accent/10 border-brand-accent/30 text-brand-accent' : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
          }`}>
          {msg.text}
        </motion.div>
      )}

      <div className="flex gap-2">
        {['pending', 'completed', 'rejected'].map((s) => (
          <button key={s} onClick={() => setStatus(s)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${
              status === s ? 'bg-brand-primary text-white' : 'glass text-white/50 hover:text-white'
            }`}>
            {s === 'pending' ? '⏳' : s === 'completed' ? '✅' : '❌'} {s}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/40 border-b border-white/5 text-left">
                  <th className="p-4">User / UTR</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4 hidden sm:table-cell">Method</th>
                  <th className="p-4 hidden md:table-cell">Time</th>
                  {status === 'pending' && <th className="p-4">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {deposits.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-12 text-white/30">No {status} deposits</td></tr>
                ) : deposits.map((d) => (
                  <tr key={d._id} className="hover:bg-white/2 transition-colors">
                    <td className="p-4">
                      <p className="font-semibold text-white">{d.userId?.username || '—'}</p>
                      <p className="text-brand-accent text-[10px] font-mono uppercase tracking-tighter mt-1 bg-brand-accent/5 px-1.5 py-0.5 rounded border border-brand-accent/10 inline-block">
                        UTR: {d.utrNumber}
                      </p>
                    </td>
                    <td className="p-4 font-mono font-black text-brand-accent text-lg">{fmt(d.amount)}</td>
                    <td className="p-4 hidden sm:table-cell">
                      <span className="text-white/60 bg-white/5 px-2 py-1 rounded text-xs">{d.paymentMethod}</span>
                    </td>
                    <td className="p-4 text-white/40 text-xs hidden md:table-cell">{fmtDate(d.createdAt)}</td>
                    {status === 'pending' && (
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button onClick={() => handleApprove(d._id)} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-brand-accent/10 text-brand-accent border border-brand-accent/30 hover:bg-brand-accent/20 transition-all">
                            ✅ Approve
                          </button>
                          <button onClick={() => handleReject(d._id)} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-brand-primary/10 text-brand-primary border border-brand-primary/30 hover:bg-brand-primary/20 transition-all">
                            ❌ Reject
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pages={pages} onChange={fetchD} />
        </div>
      )}
    </div>
  )
}

// ─── Withdrawals Tab ──────────────────────────────────────────────────────────
const WithdrawalsTab = () => {
  const [withdrawals, setWithdrawals] = useState([])
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('pending')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [msg, setMsg] = useState({ text: '', type: 'success' })

  const fetchW = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const r = await api.get(`/api/admin/withdrawals?status=${status}&page=${p}`)
      setWithdrawals(r.data.withdrawals || [])
      setPages(r.data.pages)
      setPage(p)
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => { fetchW(1) }, [status])

  const showMsg = (text, type = 'success') => {
    setMsg({ text, type })
    setTimeout(() => setMsg({ text: '', type: 'success' }), 3000)
  }

  const handleApprove = async (id) => {
    await api.patch(`/api/admin/withdrawals/${id}/approve`)
    showMsg('Withdrawal approved ✓', 'success')
    fetchW(page)
  }

  const handleReject = async (id) => {
    await api.patch(`/api/admin/withdrawals/${id}/reject`)
    showMsg('Withdrawal rejected & refunded ✓', 'warn')
    fetchW(page)
  }

  return (
    <div className="space-y-4">
      {msg.text && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className={`border rounded-xl px-4 py-3 text-sm ${
            msg.type === 'success'
              ? 'bg-brand-accent/10 border-brand-accent/30 text-brand-accent'
              : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
          }`}
        >
          {msg.text}
        </motion.div>
      )}

      {/* Status filter */}
      <div className="flex gap-2">
        {['pending', 'completed', 'failed'].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${
              status === s ? 'bg-brand-primary text-white' : 'glass text-white/50 hover:text-white'
            }`}
          >
            {s === 'pending' ? '⏳' : s === 'completed' ? '✅' : '❌'} {s}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/40 border-b border-white/5 text-left">
                  <th className="p-4">User</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4 hidden sm:table-cell">Status</th>
                  <th className="p-4 hidden md:table-cell">Requested</th>
                  {status === 'pending' && <th className="p-4">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {withdrawals.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-12 text-white/30">No {status} withdrawals</td></tr>
                ) : withdrawals.map((w) => (
                  <tr key={w._id} className="hover:bg-white/2 transition-colors">
                    <td className="p-4">
                      <p className="font-semibold text-white">{w.userId?.username || '—'}</p>
                      <p className="text-white/40 text-xs">{w.userId?.email}</p>
                      <p className="text-brand-gold text-xs font-mono mt-0.5">Balance: {fmt(w.userId?.balance)}</p>
                    </td>
                    <td className="p-4 font-mono font-black text-brand-primary text-lg">
                      {fmt(Math.abs(w.amount))}
                    </td>
                    <td className="p-4 hidden sm:table-cell"><TxBadge status={w.status} /></td>
                    <td className="p-4 text-white/40 text-xs hidden md:table-cell">{fmtDate(w.createdAt)}</td>
                    {status === 'pending' && (
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(w._id)}
                            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-brand-accent/10 text-brand-accent border border-brand-accent/30 hover:bg-brand-accent/20 transition-all"
                          >
                            ✅ Approve
                          </button>
                          <button
                            onClick={() => handleReject(w._id)}
                            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-brand-primary/10 text-brand-primary border border-brand-primary/30 hover:bg-brand-primary/20 transition-all"
                          >
                            ❌ Reject
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pages={pages} onChange={fetchW} />
        </div>
      )}
    </div>
  )
}

// ─── Game Rounds Tab ──────────────────────────────────────────────────────────
const GameRoundsTab = () => {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)

  const fetchGames = async (p = 1) => {
    setLoading(true)
    try {
      const r = await api.get(`/api/admin/games?page=${p}`)
      setGames(r.data.games || [])
      setPages(r.data.pages)
      setPage(p)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchGames(1) }, [])

  const getCrashColor = (cp) => {
    if (cp < 1.5) return '#e63946'
    if (cp < 3) return '#ffd60a'
    if (cp < 10) return '#4cc9f0'
    return '#06d6a0'
  }

  return (
    <div className="space-y-4">
      {loading ? <Spinner /> : (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/40 border-b border-white/5 text-left">
                  <th className="p-4">#</th>
                  <th className="p-4">Crash Point</th>
                  <th className="p-4 hidden sm:table-cell">Players</th>
                  <th className="p-4 hidden md:table-cell">Total Bet</th>
                  <th className="p-4 hidden lg:table-cell">Client Seed</th>
                  <th className="p-4 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {games.map((g, i) => {
                  const cp = g.revealedCrashPoint || 1
                  const color = getCrashColor(cp)
                  const houseEdge = (g.totalBetAmount || 0) - (g.totalCashoutAmount || 0)
                  return (
                    <tr key={g.gameId} className="hover:bg-white/2 transition-colors">
                      <td className="p-4 text-white/30 font-mono text-xs">{(page - 1) * 20 + i + 1}</td>
                      <td className="p-4">
                        <span
                          className="font-mono font-black px-3 py-1 rounded-lg text-base"
                          style={{ color, background: `${color}18`, border: `1px solid ${color}35` }}
                        >
                          {cp.toFixed(2)}x
                        </span>
                      </td>
                      <td className="p-4 text-white/60 hidden sm:table-cell">{g.playerCount || 0} players</td>
                      <td className="p-4 font-mono text-white/60 hidden md:table-cell">{fmt(g.totalBetAmount)}</td>
                      <td className="p-4 font-mono text-white/30 text-xs hidden lg:table-cell truncate max-w-[120px]">
                        {g.clientSeed || '—'}
                      </td>
                      <td className="p-4 text-right text-white/40 text-xs">
                        {g.crashedAt ? fmtDate(g.crashedAt) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pages={pages} onChange={fetchGames} />
        </div>
      )}
    </div>
  )
}

// ─── Transactions Tab ─────────────────────────────────────────────────────────
const TransactionsTab = () => {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [type, setType] = useState('')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)

  const fetchTx = async (p = 1) => {
    setLoading(true)
    try {
      const r = await api.get(`/api/admin/transactions?type=${type}&page=${p}`)
      setTransactions(r.data.transactions || [])
      setPages(r.data.pages)
      setPage(p)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTx(1) }, [type])

  const typeColors = {
    deposit: 'text-brand-accent',
    win: 'text-brand-accent',
    bet: 'text-brand-primary',
    withdraw: 'text-yellow-400',
    refund: 'text-brand-blue',
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {['', 'bet', 'win', 'deposit', 'withdraw', 'refund'].map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${
              type === t ? 'bg-brand-primary text-white' : 'glass text-white/50 hover:text-white'
            }`}
          >
            {t || 'All'}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/40 border-b border-white/5 text-left">
                  <th className="p-4">User</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4 hidden sm:table-cell">Status</th>
                  <th className="p-4 hidden md:table-cell">Balance After</th>
                  <th className="p-4 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {transactions.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-white/30">No transactions</td></tr>
                ) : transactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-white/2 transition-colors">
                    <td className="p-4">
                      <p className="font-semibold text-white">{tx.userId?.username || '—'}</p>
                      <p className="text-white/30 text-xs">{tx.userId?.email}</p>
                    </td>
                    <td className={`p-4 font-bold capitalize ${typeColors[tx.type] || 'text-white'}`}>{tx.type}</td>
                    <td className={`p-4 font-mono font-bold ${tx.amount >= 0 ? 'text-brand-accent' : 'text-brand-primary'}`}>
                      {tx.amount >= 0 ? '+' : ''}{fmt(Math.abs(tx.amount))}
                    </td>
                    <td className="p-4 hidden sm:table-cell"><TxBadge status={tx.status} /></td>
                    <td className="p-4 font-mono text-white/50 hidden md:table-cell">{fmt(tx.balanceAfter)}</td>
                    <td className="p-4 text-right text-white/40 text-xs">{fmtDate(tx.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pages={pages} onChange={fetchTx} />
        </div>
      )}
    </div>
  )
}

// ─── Settings Tab ──────────────────────────────────────────────────────────────
const SettingsTab = () => {
  const [upiIds, setUpiIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState({ text: '', type: 'success' })

  // New UPI form
  const [newUpi, setNewUpi] = useState({ upiId: '', name: '', isActive: true })

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/admin/settings/payment')
      const fetched = res.data.settings?.upiIds || []
      setUpiIds(fetched)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSettings() }, [])

  const showMsg = (text, type = 'success') => {
    setMsg({ text, type })
    setTimeout(() => setMsg({ text: '', type: 'success' }), 3000)
  }

  const handleSave = async (updatedUpis) => {
    setSaving(true)
    try {
      const res = await api.put('/api/admin/settings/payment', { upiIds: updatedUpis })
      setUpiIds(res.data.settings.upiIds || [])
      showMsg('Payment settings saved ✓', 'success')
    } catch (err) {
      showMsg('Failed to save settings', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleAddUpi = (e) => {
    e.preventDefault()
    if (!newUpi.upiId) return
    const updated = [...upiIds, { id: Date.now().toString(), ...newUpi }]
    handleSave(updated)
    setNewUpi({ upiId: '', name: '', isActive: true })
  }

  const handleToggle = (id) => {
    const updated = upiIds.map(u => u.id === id ? { ...u, isActive: !u.isActive } : u)
    handleSave(updated)
  }

  const handleDelete = (id) => {
    if (!window.confirm('Delete this UPI ID?')) return
    const updated = upiIds.filter(u => u.id !== id)
    handleSave(updated)
  }

  return (
    <div className="space-y-6">
      {msg.text && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className={`border rounded-xl px-4 py-3 text-sm ${
            msg.type === 'success' ? 'bg-brand-accent/10 border-brand-accent/30 text-brand-accent' : 'bg-red-500/10 border-red-500/30 text-red-500'
          }`}
        >
          {msg.text}
        </motion.div>
      )}

      {loading ? <Spinner /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Active UPI List */}
          <div className="glass rounded-2xl p-6">
            <h3 className="font-bold text-white/70 text-sm uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>Managed UPI IDs</span>
              <span className="bg-brand-primary/20 text-brand-primary px-2 py-0.5 rounded text-xs">
                {upiIds.filter(u => u.isActive).length} Active
              </span>
            </h3>

            <div className="space-y-3">
              {upiIds.length === 0 ? (
                <p className="text-white/30 text-sm text-center py-4">No UPI IDs added yet.</p>
              ) : upiIds.map(u => (
                <div key={u.id} className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                  u.isActive ? 'bg-white/5 border-white/10' : 'bg-black/20 border-white/5 opacity-50'
                }`}>
                  <div>
                    <p className={`font-mono text-sm ${u.isActive ? 'text-white' : 'text-white/50'}`}>{u.upiId}</p>
                    <p className="text-white/40 text-xs mt-0.5">{u.name || 'No Name'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggle(u.id)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg ${
                        u.isActive ? 'bg-brand-primary/20 text-brand-primary' : 'bg-white/10 text-white/50'
                      }`}
                      disabled={saving}
                    >
                      {u.isActive ? 'ON' : 'OFF'}
                    </button>
                    <button onClick={() => handleDelete(u.id)} className="px-2 py-1 text-xs text-red-400 hover:bg-red-500/20 rounded-lg">
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add New UPI Form */}
          <div className="glass rounded-2xl p-6">
            <h3 className="font-bold text-white/70 text-sm uppercase tracking-wider mb-4">
              Add New UPI ID
            </h3>
            <form onSubmit={handleAddUpi} className="space-y-4">
              <div>
                <label className="block text-white/40 text-xs font-bold uppercase tracking-wider mb-2">UPI ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. yourname@ybl"
                  value={newUpi.upiId}
                  onChange={e => setNewUpi({ ...newUpi, upiId: e.target.value })}
                  className="w-full bg-black/50 border border-white/20 text-white placeholder-white/30 rounded-xl px-4 py-3 outline-none focus:border-brand-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-white/40 text-xs font-bold uppercase tracking-wider mb-2">Display Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Aviator Game"
                  value={newUpi.name}
                  onChange={e => setNewUpi({ ...newUpi, name: e.target.value })}
                  className="w-full bg-black/50 border border-white/20 text-white placeholder-white/30 rounded-xl px-4 py-3 outline-none focus:border-brand-primary transition-all"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer mt-2">
                <input
                  type="checkbox"
                  checked={newUpi.isActive}
                  onChange={e => setNewUpi({ ...newUpi, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-white/20 bg-black/40 text-brand-primary"
                />
                <span className="text-sm text-white/70">Set as Active immediately</span>
              </label>

              <button
                type="submit"
                disabled={saving || !newUpi.upiId}
                className="w-full btn-primary py-3 mt-2"
              >
                {saving ? 'Saving...' : 'Add UPI ID ➕'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────
const AdminPage = () => {
  const [tab, setTab] = useState('overview')
  const [stats, setStats] = useState(null)
  const [pendingCount, setPendingCount] = useState(0)
  const [pendingDepCount, setPendingDepCount] = useState(0)

  useEffect(() => {
    api.get('/api/admin/stats').then((r) => {
      setStats(r.data.stats)
      setPendingCount(r.data.stats.pendingWithdrawals)
      setPendingDepCount(r.data.stats.pendingDeposits || 0)
    }).catch(console.error)
  }, [])

  // Refresh stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      api.get('/api/admin/stats').then((r) => {
        setStats(r.data.stats)
        setPendingCount(r.data.stats.pendingWithdrawals)
        setPendingDepCount(r.data.stats.pendingDeposits || 0)
      }).catch(() => {})
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const tabs = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'users', label: '👥 Users' },
    {
      id: 'deposits',
      label: (
        <span className="flex items-center gap-2">
          💰 Deposits
          {pendingDepCount > 0 && (
            <span className="bg-brand-accent text-dark-400 text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center">
              {pendingDepCount}
            </span>
          )}
        </span>
      )
    },
    {
      id: 'withdrawals',
      label: (
        <span className="flex items-center gap-2">
          💸 Withdrawals
          {pendingCount > 0 && (
            <span className="bg-yellow-500 text-dark-400 text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center">
              {pendingCount}
            </span>
          )}
        </span>
      )
    },
    { id: 'rounds', label: '🎮 Game Rounds' },
    { id: 'transactions', label: '💳 Transactions' },
    { id: 'settings', label: '⚙️ Settings' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-black gradient-text">⚙️ Admin Dashboard</h1>
          <p className="text-white/40 text-sm mt-1">Monitor, manage and control the platform</p>
        </div>
        <div className="flex items-center gap-2 glass px-4 py-2 rounded-xl">
          <span className="status-dot bg-brand-accent animate-pulse" />
          <span className="text-brand-accent font-mono text-sm font-bold">ADMIN</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap border-b border-white/5 pb-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === t.id
                ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20'
                : 'glass text-white/50 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {tab === 'overview' && <OverviewTab stats={stats} />}
          {tab === 'users' && <UsersTab />}
          {tab === 'deposits' && <DepositsTab />}
          {tab === 'withdrawals' && <WithdrawalsTab />}
          {tab === 'rounds' && <GameRoundsTab />}
          {tab === 'transactions' && <TransactionsTab />}
          {tab === 'settings' && <SettingsTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default AdminPage

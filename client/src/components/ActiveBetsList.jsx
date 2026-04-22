import { useState, useEffect, useRef } from 'react'
import { useGame } from '../context/GameContext'
import { useAuth } from '../context/AuthContext'

/* ── Fake bot names ── */
const BOT_NAMES = [
  'Rahul***', 'Priya***', 'Amit***', 'Sunita***', 'Vikram***',
  'Anjali***', 'Rohit***', 'Deepa***', 'Mohan***', 'Kavya***',
  'Salim***', 'Suresh***', 'Pooja***', 'Iram***', 'Sabir***',
  'Farhan***', 'Meena***', 'Ravi***', 'Nisha***', 'Arjun***',
  'Divya***', 'Sanjay***', 'Rekha***', 'Ajay***', 'Sneha***',
  'Vikas***', 'Preeti***', 'Nikhil***', 'Shweta***', 'Karan***',
]

const avatarColors = [
  '#e53935','#8e24aa','#1e88e5','#00897b','#f4511e',
  '#6d4c41','#039be5','#43a047','#fb8c00','#d81b60',
]

const avatarColor = (name = '') => {
  let h = 0
  for (const c of name) h = c.charCodeAt(0) + ((h << 5) - h)
  return avatarColors[Math.abs(h) % avatarColors.length]
}

const maskName = (name = '') => {
  if (name.includes('***')) return name
  if (name.length <= 2) return name + '***'
  return name[0] + '***' + name[name.length - 1]
}

const randBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const randFloat   = (min, max) => parseFloat((Math.random() * (max - min) + min).toFixed(2))
const randName    = () => BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)]

/* Generate fake bots for a round */
const generateBots = (count = 18) =>
  Array.from({ length: count }, (_, i) => ({
    id:            `bot_${i}_${Math.random().toString(36).slice(2)}`,
    username:      randName(),
    amount:        randBetween(10, 2000),
    isBot:         true,
    cashedOutAt:   null,
    autoCashout:   randFloat(1.2, 8),
  }))

const TABS = ['All Bets', 'My Bets', 'Top']

/* Live multiplier for cashout display */
const useLiveM = (startTime, isRunning) => {
  const [m, setM] = useState(1)
  useEffect(() => {
    if (!isRunning || !startTime) { setM(1); return }
    const id = setInterval(() => {
      setM(Math.E ** (0.00006 * (Date.now() - startTime)))
    }, 150)
    return () => clearInterval(id)
  }, [startTime, isRunning])
  return m
}

const ActiveBetsList = () => {
  const { activeBets, status, startTime } = useGame()
  const { user } = useAuth()
  const [tab, setTab]   = useState('All Bets')
  const [bots, setBots] = useState([])
  const botsRef         = useRef([])
  const timerRef        = useRef(null)

  const isRunning = status === 'RUNNING'
  const isWaiting = status === 'WAITING'
  const isCrashed = status === 'CRASHED'

  const liveM = useLiveM(startTime, isRunning)

  /* ── On WAITING: generate new bots ── */
  useEffect(() => {
    if (isWaiting) {
      const fresh = generateBots(randBetween(12, 20))
      botsRef.current = fresh
      setBots([...fresh])
    }
  }, [isWaiting])

  /* ── On RUNNING: randomly cash out bots based on their autoCashout ── */
  useEffect(() => {
    if (!isRunning) return
    clearInterval(timerRef.current)

    timerRef.current = setInterval(() => {
      const curM = Math.E ** (0.00006 * (Date.now() - startTime))
      let changed = false

      botsRef.current = botsRef.current.map(bot => {
        if (bot.cashedOutAt) return bot
        // Cash out if multiplier passed autoCashout or random early cashout
        if (curM >= bot.autoCashout || (curM > 1.3 && Math.random() < 0.03)) {
          changed = true
          return { ...bot, cashedOutAt: parseFloat(curM.toFixed(2)) }
        }
        return bot
      })

      if (changed) setBots([...botsRef.current])
    }, 300)

    return () => clearInterval(timerRef.current)
  }, [isRunning, startTime])

  /* ── On CRASHED: cash out remaining bots at crash point ── */
  useEffect(() => {
    if (!isCrashed) return
    clearInterval(timerRef.current)
    // Remaining bots lose (no cashout)
    botsRef.current = botsRef.current.map(bot =>
      bot.cashedOutAt ? bot : { ...bot, cashedOutAt: null, lost: true }
    )
    setBots([...botsRef.current])
  }, [isCrashed])

  /* Merge real bets + bots */
  const realBets = activeBets.map(b => ({ ...b, isBot: false }))
  const allBets  = [...realBets, ...bots]

  /* Tab filter */
  const filtered =
    tab === 'All Bets' ? allBets
    : tab === 'My Bets' ? realBets.filter(b => b.username === user?.username)
    : [...allBets].sort((a, b) => b.amount - a.amount)

  const cashedCount = allBets.filter(b => b.cashedOutAt).length

  return (
    <div style={{
      background: '#1e2235',
      borderRadius: '16px',
      overflow: 'hidden',
    }}>
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '11px 0', border: 'none',
            background: 'transparent', cursor: 'pointer',
            color: tab === t ? '#ffffff' : 'rgba(255,255,255,0.4)',
            fontWeight: tab === t ? 700 : 500, fontSize: '13px',
            borderBottom: tab === t ? '2px solid #ffffff' : '2px solid transparent',
            transition: 'all 0.15s',
          }}>{t}</button>
        ))}
      </div>

      {/* Stats row */}
      <div style={{
        padding: '7px 14px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', fontWeight: 600, letterSpacing: '1px' }}>
          ALL BETS
        </span>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ color: '#2ecc40', fontSize: '11px', fontWeight: 700 }}>
            ✅ {cashedCount} cashed
          </span>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>
            {allBets.length} total
          </span>
        </div>
      </div>

      {/* Column headers */}
      <div style={{
        display: 'flex', padding: '4px 14px 6px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        <div style={thStyle}>User</div>
        <div style={{ ...thStyle, width: '65px', textAlign: 'right' }}>Bet ₹</div>
        <div style={{ ...thStyle, width: '42px', textAlign: 'center' }}>X</div>
        <div style={{ ...thStyle, width: '72px', textAlign: 'right' }}>Cash out</div>
      </div>

      {/* Rows */}
      <div style={{ maxHeight: '240px', overflowY: 'auto', scrollbarWidth: 'none' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '12px' }}>
            {tab === 'My Bets' ? 'Place a bet to see it here' : 'No bets yet'}
          </div>
        ) : filtered.map((bet, i) => {
          const cashed   = !!bet.cashedOutAt
          const lost     = bet.lost
          const isMe     = !bet.isBot && bet.username === user?.username
          const potential = isRunning && !cashed && !lost
            ? (bet.amount * liveM).toFixed(0)
            : null

          return (
            <div key={bet.id || bet._id || `${bet.username}-${i}`} style={{
              display: 'flex', alignItems: 'center',
              padding: '7px 14px',
              background: cashed
                ? 'rgba(46,204,64,0.05)'
                : isMe ? 'rgba(255,255,255,0.03)' : 'transparent',
              borderBottom: '1px solid rgba(255,255,255,0.02)',
              transition: 'background 0.3s',
            }}>
              {/* Avatar */}
              <div style={{
                width: '24px', height: '24px', borderRadius: '50%',
                background: avatarColor(bet.username),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '9px', fontWeight: 900, color: '#fff',
                marginRight: '8px', flexShrink: 0,
                border: isMe ? '1.5px solid #ffd700' : 'none',
              }}>
                {bet.username?.[0]?.toUpperCase()}
              </div>

              {/* Name */}
              <div style={{
                flex: 1,
                color: isMe ? '#ffd700' : cashed ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.55)',
                fontSize: '12px', fontWeight: isMe ? 700 : 500,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {maskName(bet.username)}
                {isMe && <span style={{ color: '#ffd700', fontSize: '9px', marginLeft: '4px' }}>YOU</span>}
              </div>

              {/* Bet amount */}
              <div style={{ width: '65px', textAlign: 'right', color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontFamily: 'monospace' }}>
                {bet.amount?.toFixed(0)}
              </div>

              {/* Multiplier */}
              <div style={{ width: '42px', textAlign: 'center', fontSize: '11px', fontWeight: 700, fontFamily: 'monospace' }}>
                {cashed
                  ? <span style={{ color: '#2ecc40' }}>{bet.cashedOutAt?.toFixed(2)}×</span>
                  : lost
                  ? <span style={{ color: '#e53935' }}>💥</span>
                  : <span style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>
                }
              </div>

              {/* Cashout amount */}
              <div style={{ width: '72px', textAlign: 'right', fontSize: '12px', fontFamily: 'monospace' }}>
                {cashed
                  ? <span style={{ color: '#2ecc40', fontWeight: 800 }}>
                      ₹{Math.floor(bet.amount * bet.cashedOutAt).toLocaleString('en-IN')}
                    </span>
                  : lost
                  ? <span style={{ color: '#e53935', fontWeight: 700 }}>₹0</span>
                  : potential
                  ? <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>
                      ₹{parseInt(potential).toLocaleString('en-IN')}
                    </span>
                  : <span style={{ color: 'rgba(255,255,255,0.15)' }}>—</span>
                }
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const thStyle = {
  flex: 1,
  color: 'rgba(255,255,255,0.28)',
  fontSize: '10px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}

export default ActiveBetsList

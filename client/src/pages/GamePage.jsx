import { useNavigate } from 'react-router-dom'
import { useRef } from 'react'
import PlaneCanvas from '../components/PlaneCanvas'
import ActiveBetsList from '../components/ActiveBetsList'
import GameHistoryBar from '../components/GameHistoryBar'
import BetPanelDouble from '../components/BetPanelDouble'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'

const GamePage = () => {
  const navigate  = useNavigate()
  const { user }  = useAuth()
  const { connected } = useSocket()
  const roundIdRef = useRef(Math.floor(Math.random() * 90000000 + 10000000))

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 0px)',
      background: '#111827',
      overflow: 'hidden',
    }}>

      {/* ── TOP BAR: Back + Round ID + Ping ── */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 10px',
        background: '#0f1420',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>

        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          style={{
            width: '30px', height: '30px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#ffffff',
            fontSize: '16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          ←
        </button>

        {/* Round ID */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flex: 1 }}>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px' }}>Round ID:</span>
          <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '10px', fontWeight: 600 }}>
            {roundIdRef.current}
          </span>
          <span style={{ fontSize: '11px' }}>💎</span>
        </div>

        {/* Connection status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: connected ? '#2ecc40' : '#e53935',
          }} />
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px' }}>
            {connected ? 'LIVE' : 'OFF'}
          </span>
        </div>

        {/* Ping */}
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px' }}>
          Ping: <span style={{ color: 'rgba(255,255,255,0.55)' }}>32ms</span>
        </span>
      </div>

      {/* ── History bar ── */}
      <div style={{
        flexShrink: 0,
        padding: '5px 10px',
        background: '#0f1420',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        <GameHistoryBar />
      </div>

      {/* ── Canvas ── */}
      <div style={{
        flex: '1 1 0', minHeight: '220px', maxHeight: '45vh',
        position: 'relative', overflow: 'hidden',
      }}>
        <PlaneCanvas />
      </div>

      {/* ── Scrollable bottom: bet panels + bets list ── */}
      <div style={{ flex: '1 1 0', overflowY: 'auto', background: '#111827', scrollbarWidth: 'none' }}>

        {/* Bet panels */}
        <div style={{ padding: '10px 0 4px' }}>
          <BetPanelDouble />
        </div>

        {/* Bets list */}
        <div style={{ padding: '0 10px 16px' }}>
          <ActiveBetsList />
        </div>
      </div>

    </div>
  )
}

export default GamePage

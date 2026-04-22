import { useState } from 'react'
import { useGame } from '../context/GameContext'
import ProvablyFairModal from './ProvablyFairModal'

/* Color by crash point — matching screenshot (purple for >2x, cyan for ~1.35x, etc.) */
const getPill = (cp) => {
  if (!cp) return { bg: 'rgba(100,80,200,0.25)', color: '#9c88ff', border: 'rgba(140,120,255,0.4)' }
  if (cp >= 10) return { bg: 'rgba(200,50,255,0.2)', color: '#e040fb', border: 'rgba(200,50,255,0.5)' }
  if (cp >= 5)  return { bg: 'rgba(120,60,200,0.25)', color: '#b39ddb', border: 'rgba(140,80,220,0.5)' }
  if (cp >= 2)  return { bg: 'rgba(80,60,180,0.25)', color: '#9c88ff', border: 'rgba(120,100,220,0.4)' }
  if (cp >= 1.5)return { bg: 'rgba(0,180,200,0.2)', color: '#4dd0e1', border: 'rgba(0,180,200,0.4)' }
  return           { bg: 'rgba(80,60,180,0.25)', color: '#9c88ff', border: 'rgba(120,100,220,0.4)' }
}

const GameHistoryBar = () => {
  const { history } = useGame()
  const [selected, setSelected] = useState(null)

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px',
        overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '2px' }}>

        {history.length === 0
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{
                flexShrink: 0, width: '52px', height: '26px', borderRadius: '20px',
                background: 'rgba(255,255,255,0.06)',
              }} />
            ))
          : history.map((item, i) => {
              const cp = item.crashPoint || 1
              const { bg, color, border } = getPill(cp)
              return (
                <button key={item.gameId || i} onClick={() => setSelected(item)} style={{
                  flexShrink: 0, padding: '4px 12px', borderRadius: '20px',
                  background: bg, color, border: `1px solid ${border}`,
                  fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                  whiteSpace: 'nowrap', fontFamily: 'Inter, sans-serif',
                  transition: 'transform 0.1s',
                }}>
                  {cp.toFixed(2)}x
                </button>
              )
            })
        }
      </div>

      <ProvablyFairModal isOpen={!!selected} onClose={() => setSelected(null)} gameData={selected} />
    </>
  )
}

export default GameHistoryBar

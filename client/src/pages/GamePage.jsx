import PlaneCanvas from '../components/PlaneCanvas'
import ActiveBetsList from '../components/ActiveBetsList'
import GameHistoryBar from '../components/GameHistoryBar'
import BetPanelDouble from '../components/BetPanelDouble'
import ParticlesBackground from '../components/ParticlesBackground'

const GamePage = () => {
  return (
    <div className="flex flex-col h-[calc(100vh-56px)] relative overflow-hidden" style={{ background: '#0b0f1a' }}>

      {/* Particle layer */}
      <ParticlesBackground />

      {/* Grid-line layer */}
      <div
        className="absolute inset-0 pointer-events-none z-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,230,118,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,230,118,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* ── TOP: History bar ── */}
      <div
        className="flex-shrink-0 px-3 py-2 z-20 relative"
        style={{
          background: 'rgba(8,12,24,0.9)',
          borderBottom: '1px solid rgba(0,230,118,0.08)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <GameHistoryBar />
      </div>

      {/* ── MIDDLE: Canvas ── */}
      <div className="flex-1 relative overflow-hidden min-h-[28vh] z-10">
        <PlaneCanvas />
      </div>

      {/* ── BOTTOM: Bets + Live feed ── */}
      <div
        className="flex-shrink-0 z-20 relative"
        style={{
          background: 'rgba(8,12,24,0.95)',
          borderTop: '1px solid rgba(0,230,118,0.1)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 -4px 40px rgba(0,0,0,0.5)',
        }}
      >
        {/* Mobile: stacked. Desktop: side-by-side */}
        <div className="flex flex-col lg:flex-row lg:h-[250px]">

          {/* Bet panels */}
          <div className="flex-shrink-0 p-3 w-full lg:w-[560px]">
            <BetPanelDouble />
          </div>

          {/* Divider */}
          <div
            className="hidden lg:block w-px"
            style={{ background: 'linear-gradient(to bottom, transparent, rgba(0,230,118,0.15), transparent)' }}
          />

          {/* Live bets */}
          <div className="flex-1 overflow-hidden min-h-[180px] lg:min-h-0 relative">
            {/* Fade mask top */}
            <div className="absolute top-0 left-0 right-0 h-6 pointer-events-none z-10"
                 style={{ background: 'linear-gradient(to bottom, rgba(8,12,24,0.95), transparent)' }} />
            <ActiveBetsList />
          </div>

        </div>
      </div>

      {/* Bottom safe‐area spacer for iOS */}
      <div className="h-safe-b lg:hidden flex-shrink-0" />
    </div>
  )
}

export default GamePage

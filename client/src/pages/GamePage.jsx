import PlaneCanvas from '../components/PlaneCanvas'
import ActiveBetsList from '../components/ActiveBetsList'
import GameHistoryBar from '../components/GameHistoryBar'
import BetPanelDouble from '../components/BetPanelDouble'

const GamePage = () => {
  return (
    <div className="flex flex-col h-[calc(100vh-56px)] bg-[#0a0e1a] overflow-hidden">
      {/* TOP — History bar */}
      <div className="flex-shrink-0 bg-[#0d1220] border-b border-white/5 px-3 py-1.5 z-20 shadow">
        <GameHistoryBar />
      </div>

      {/* MIDDLE — Full width canvas */}
      <div className="flex-1 relative overflow-hidden min-h-[30vh]">
        <PlaneCanvas />
      </div>

      {/* BOTTOM — Bet panels + Live bets */}
      {/* On mobile: Scrollable vertically if needed or tightly packed. On Desktop: fixed height row */}
      <div className="flex-shrink-0 bg-[#0d1220] border-t border-white/5 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden lg:h-[260px] relative z-20">
        
        {/* Bet panels */}
        <div className="flex-shrink-0 p-3 w-full lg:w-[640px] flex items-center mb-4 lg:mb-0 pb-6 lg:pb-3 border-b lg:border-b-0 border-white/5">
          <BetPanelDouble />
        </div>

        {/* Divider Desktop */}
        <div className="hidden lg:block w-px bg-white/5 flex-shrink-0" />

        {/* Live bets list */}
        <div className="flex-1 overflow-hidden min-h-[200px] lg:min-h-0 relative">
          <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-[#0d1220] to-transparent z-10 pointer-events-none lg:hidden" />
          <ActiveBetsList />
        </div>
      </div>
    </div>
  )
}

export default GamePage

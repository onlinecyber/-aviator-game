import PlaneCanvas from '../components/PlaneCanvas'
import ActiveBetsList from '../components/ActiveBetsList'
import GameHistoryBar from '../components/GameHistoryBar'
import BetPanelDouble from '../components/BetPanelDouble'

const GamePage = () => {
  return (
    <div className="flex flex-col h-[calc(100vh-56px)] bg-[#0a0e1a] overflow-hidden">

      {/* TOP — History bar */}
      <div className="flex-shrink-0 bg-[#0d1220] border-b border-white/5 px-3 py-1.5">
        <GameHistoryBar />
      </div>

      {/* MIDDLE — Full width canvas */}
      <div className="flex-1 relative overflow-hidden min-h-0">
        <PlaneCanvas />
      </div>

      {/* BOTTOM — Bet panels + Live bets */}
      <div className="flex-shrink-0 bg-[#0d1220] border-t border-white/5 flex overflow-hidden" style={{ height: '220px' }}>

        {/* Bet panels */}
        <div className="flex gap-3 p-3 flex-shrink-0" style={{ width: '560px' }}>
          <BetPanelDouble />
        </div>

        {/* Divider */}
        <div className="w-px bg-white/5 flex-shrink-0" />

        {/* Live bets list */}
        <div className="flex-1 overflow-hidden">
          <ActiveBetsList />
        </div>

      </div>
    </div>
  )
}

export default GamePage

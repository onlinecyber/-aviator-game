import { createContext, useContext, useEffect, useReducer, useRef } from 'react'
import toast from 'react-hot-toast'
import { useSocket } from './SocketContext'
import { useAuth } from './AuthContext'
import { gameAudio } from '../utils/AudioEngine'

const GameContext = createContext(null)

const initialState = {
  status: 'WAITING',         // 'WAITING' | 'RUNNING' | 'CRASHED'
  gameId: null,
  startTime: null,           // Used for true 60fps client-side calculation
  serverSeedHash: null,
  bettingEndsIn: null,
  history: [],               // [{ gameId, crashPoint, crashedAt, serverSeed, clientSeed }]
  activeBets: [],            // [{ username, amount, autoCashout }]
  myBet: null,               // { betId, amount, autoCashout }
  cashedOut: false,
  lastCrashPoint: null,
  error: null,
}

function gameReducer(state, action) {
  switch (action.type) {
    case 'GAME_STATE':
      return {
        ...state,
        status: action.payload.status,
        gameId: action.payload.gameId,
        serverSeedHash: action.payload.serverSeedHash ?? state.serverSeedHash,
        bettingEndsIn: action.payload.bettingEndsIn ?? null,
        history: action.payload.history ?? state.history,
        ...(action.payload.status === 'WAITING' ? {
          myBet: null,
          cashedOut: false,
          lastCrashPoint: null,
          error: null,
          startTime: null,
        } : {}),
      }

    case 'GAME_STARTED':
      return {
        ...state,
        status: 'RUNNING',
        gameId: action.payload.gameId,
        startTime: action.payload.startTime,
      }

    case 'GAME_CRASHED':
      return {
        ...state,
        status: 'CRASHED',
        lastCrashPoint: action.payload.crashPoint,
        history: action.payload.history ?? state.history,
        myBet: state.cashedOut ? state.myBet : null,
      }

    case 'BET_PLACED':
      return {
        ...state,
        myBet: {
          betId: action.payload.betId,
          amount: action.payload.amount,
          autoCashout: action.payload.autoCashout,
        },
        error: null,
      }

    case 'CASHED_OUT':
      return {
        ...state,
        cashedOut: true,
        myBet: null,
      }

    case 'PLAYERS_ACTIVE':
      return { ...state, activeBets: action.payload }

    case 'PLAYER_CASHEDOUT': {
      const updatedBets = state.activeBets.map((b) =>
        b.username === action.payload.username
          ? { ...b, cashedOutAt: action.payload.multiplier }
          : b
      )
      return { ...state, activeBets: updatedBets }
    }

    case 'SET_ERROR':
      return { ...state, error: action.payload }

    case 'CLEAR_ERROR':
      return { ...state, error: null }

    default:
      return state
  }
}

export const GameProvider = ({ children }) => {
  const { socket } = useSocket()
  const { updateBalance } = useAuth()
  const [state, dispatch] = useReducer(gameReducer, initialState)
  const socketRef = useRef(socket)

  useEffect(() => {
    socketRef.current = socket
  }, [socket])

  useEffect(() => {
    if (!socket) return

    const handlers = {
      'game:state': (data) => dispatch({ type: 'GAME_STATE', payload: data }),
      'game:started': (data) => dispatch({ type: 'GAME_STARTED', payload: data }),
      'game:crashed': (data) => dispatch({ type: 'GAME_CRASHED', payload: data }),
      'bet:placed': (data) => {
        dispatch({ type: 'BET_PLACED', payload: data })
        toast.success(`Bet placed: ₹${data.amount}`)
      },
      'bet:cashedout': (data) => {
        dispatch({ type: 'CASHED_OUT', payload: data })
        updateBalance(data.balance)
        gameAudio.playCashout(data.winAmount)
        toast.success(`Cashed out: +₹${data.profit} at ${data.multiplier}x`, {
          icon: '🚀',
          style: { background: '#10B981', color: '#fff', fontWeight: 'bold' }
        })
      },
      'players:active': (data) => dispatch({ type: 'PLAYERS_ACTIVE', payload: data }),
      'player:cashedout': (data) => dispatch({ type: 'PLAYER_CASHEDOUT', payload: data }),
      'wallet:updated': (data) => updateBalance(data.balance),
      'bet:error': (data) => {
        dispatch({ type: 'SET_ERROR', payload: data.message })
        toast.error(data.message)
      },
    }

    Object.entries(handlers).forEach(([event, handler]) => socket.on(event, handler))

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => socket.off(event, handler))
    }
  }, [socket, updateBalance])

  const placeBet = (amount, autoCashout) => {
    if (!socketRef.current) return
    dispatch({ type: 'CLEAR_ERROR' })
    socketRef.current.emit('bet:place', { amount, autoCashout })
  }

  const cashout = () => {
    if (!socketRef.current) return
    socketRef.current.emit('bet:cashout')
  }

  return (
    <GameContext.Provider value={{ ...state, placeBet, cashout }}>
      {children}
    </GameContext.Provider>
  )
}

export const useGame = () => {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used inside GameProvider')
  return ctx
}

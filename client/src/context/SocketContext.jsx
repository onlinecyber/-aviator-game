import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext(null)

export const SocketProvider = ({ children }) => {
  const { token } = useAuth()
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
        setConnected(false)
      }
      return
    }

    // Create socket with JWT auth
    const socket = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    })

    socket.on('connect', () => {
      console.log('🔌 Socket connected:', socket.id)
      setConnected(true)
    })

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason)
      setConnected(false)
    })

    socket.on('connect_error', (err) => {
      console.error('Socket error:', err.message)
    })

    socketRef.current = socket

    return () => {
      socket.disconnect()
      socketRef.current = null
      setConnected(false)
    }
  }, [token])

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => {
  const ctx = useContext(SocketContext)
  if (!ctx) throw new Error('useSocket must be used inside SocketProvider')
  return ctx
}

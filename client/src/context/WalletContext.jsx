import { createContext, useContext, useState, useCallback } from 'react'
import api from '../services/api'
import { useAuth } from './AuthContext'

const WalletContext = createContext(null)

export const WalletProvider = ({ children }) => {
  const { updateBalance } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const clearMessages = () => {
    setError(null)
    setSuccess(null)
  }

  const deposit = useCallback(async (amount) => {
    setLoading(true)
    clearMessages()
    try {
      const { data } = await api.post('/api/wallet/deposit', { amount })
      updateBalance(data.balance)
      setSuccess(`Successfully deposited ₹${amount}`)
      return { success: true }
    } catch (err) {
      const msg = err.response?.data?.message || 'Deposit failed'
      setError(msg)
      return { success: false, message: msg }
    } finally {
      setLoading(false)
    }
  }, [updateBalance])

  const withdraw = useCallback(async (amount) => {
    setLoading(true)
    clearMessages()
    try {
      const { data } = await api.post('/api/wallet/withdraw', { amount })
      updateBalance(data.balance)
      setSuccess(`Successfully withdrew ₹${amount}`)
      return { success: true }
    } catch (err) {
      const msg = err.response?.data?.message || 'Withdrawal failed'
      setError(msg)
      return { success: false, message: msg }
    } finally {
      setLoading(false)
    }
  }, [updateBalance])

  const getTransactions = useCallback(async (page = 1) => {
    const { data } = await api.get(`/api/wallet/transactions?page=${page}`)
    return data
  }, [])

  return (
    <WalletContext.Provider value={{ loading, error, success, deposit, withdraw, getTransactions, clearMessages }}>
      {children}
    </WalletContext.Provider>
  )
}

export const useWallet = () => {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used inside WalletProvider')
  return ctx
}

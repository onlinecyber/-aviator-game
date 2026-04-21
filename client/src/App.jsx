import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import { GameProvider } from './context/GameContext'
import { WalletProvider } from './context/WalletContext'
import Navbar from './components/Navbar'
import GamePage from './pages/GamePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import WalletPage from './pages/WalletPage'
import HistoryPage from './pages/HistoryPage'
import LeaderboardPage from './pages/LeaderboardPage'
import AdminPage from './pages/AdminPage'
import PrivateRoute from './components/PrivateRoute'
import AdminRoute from './components/AdminRoute'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <GameProvider>
            <WalletProvider>
              <div className="min-h-screen flex flex-col">
                <Toaster position="top-center" reverseOrder={false} />
                <Navbar />
                <main className="flex-1">
                  <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/" element={<PrivateRoute><GamePage /></PrivateRoute>} />
                    <Route path="/wallet" element={<PrivateRoute><WalletPage /></PrivateRoute>} />
                    <Route path="/history" element={<PrivateRoute><HistoryPage /></PrivateRoute>} />
                    <Route path="/leaderboard" element={<PrivateRoute><LeaderboardPage /></PrivateRoute>} />
                    <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>
              </div>
            </WalletProvider>
          </GameProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App

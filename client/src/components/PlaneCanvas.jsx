import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../context/GameContext'

const PlaneCanvas = () => {
  const { status, multiplier, lastCrashPoint } = useGame()
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const stateRef = useRef({ points: [], floatT: 0 })

  const isCrashed = status === 'CRASHED'
  const isRunning = status === 'RUNNING'
  const isWaiting = status === 'WAITING'

  // Reset path on new round
  useEffect(() => {
    if (isWaiting) {
      stateRef.current.points = []
      stateRef.current.floatT = 0
    }
  }, [isWaiting])

  // Canvas resize
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      const ctx = canvas.getContext('2d')
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    resize()
    const obs = new ResizeObserver(resize)
    obs.observe(canvas)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const W = () => canvas.offsetWidth
    const H = () => canvas.offsetHeight

    // Origin: bottom-left corner of the graph area
    const OX = () => W() * 0.07
    const OY = () => H() * 0.88

    // Map multiplier to canvas position (logarithmic)
    const mToPos = (m, w, h) => {
      const ox = w * 0.07
      const oy = h * 0.88
      const t = Math.min(Math.log(Math.max(m, 1)) / Math.log(200), 1)
      const x = ox + t * (w * 0.88)
      // Use linear + exponential mix so it immediately climbs rather than staying flat
      const y = oy - (t * 0.5 + Math.pow(t, 1.8) * 0.5) * (h * 0.82)
      return { x, y }
    }

    const drawFrame = () => {
      const w = W(), h = H()
      ctx.save()
      ctx.clearRect(0, 0, w, h)

      // ── Background ────────────────────────────────────
      const bgGrad = ctx.createRadialGradient(w * 0.5, h * 0.4, 0, w * 0.5, h * 0.4, w * 0.8)
      bgGrad.addColorStop(0, '#0e2040')
      bgGrad.addColorStop(0.5, '#0a1628')
      bgGrad.addColorStop(1, '#070d18')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, w, h)

      // ── Radial Rays ────────────────────────────────────
      const ox = OX(), oy = OY()
      const numRays = 28
      for (let i = 0; i < numRays; i++) {
        const a1 = (i / numRays) * (Math.PI * 0.62) - 0.05
        const a2 = ((i + 0.5) / numRays) * (Math.PI * 0.62) - 0.05
        const r = Math.max(w, h) * 2.5
        ctx.beginPath()
        ctx.moveTo(ox, oy)
        ctx.arc(ox, oy, r, -a1, -a2, true)
        ctx.closePath()
        ctx.fillStyle = i % 2 === 0
          ? 'rgba(5, 15, 35, 0.6)'
          : 'rgba(10, 20, 45, 0.3)'
        ctx.fill()
      }

      // ── Grid dots ─────────────────────────────────────
      ctx.fillStyle = 'rgba(255,255,255,0.08)'
      for (let x = ox; x < w - 20; x += 60) {
        ctx.beginPath(); ctx.arc(x, oy + 6, 2, 0, Math.PI * 2); ctx.fill()
      }
      for (let y = oy; y > 20; y -= 60) {
        ctx.beginPath(); ctx.arc(ox - 6, y, 2, 0, Math.PI * 2); ctx.fill()
      }

      // ── Axis lines ────────────────────────────────────
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'
      ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(ox - 2, 0); ctx.lineTo(ox - 2, oy); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(ox - 2, oy); ctx.lineTo(w, oy); ctx.stroke()

      if (isWaiting) {
        // ── Waiting: idle float ───────────────────────────
        stateRef.current.floatT += 0.04
        const t = stateRef.current.floatT
        const px = ox + 30 + Math.sin(t * 0.5) * 6
        const py = oy - 30 + Math.sin(t) * 8

        // Draw idle plane
        drawPlane(ctx, px, py, -0.08, false, 0.7)

        // Dashed runway
        ctx.setLineDash([8, 12])
        ctx.strokeStyle = 'rgba(200,50,50,0.3)'
        ctx.lineWidth = 2
        ctx.beginPath(); ctx.moveTo(ox, oy - 2); ctx.lineTo(px - 10, oy - 2); ctx.stroke()
        ctx.setLineDash([])

      } else if (isRunning || isCrashed) {
        const m = multiplier || 1
        const cur = mToPos(m, w, h)

        // Track the path
        if (isRunning) {
          const pts = stateRef.current.points
          const last = pts[pts.length - 1]
          if (!last || Math.abs(last.x - cur.x) > 1.5) {
            pts.push({ ...cur })
          }
        }

        const pts = stateRef.current.points
        if (pts.length > 1) {
          const isC = isCrashed
          const lineColor = isC ? '#cc1a1a' : '#e02020'
          const fillColor = isC ? 'rgba(180,20,20,0.12)' : 'rgba(220,30,30,0.12)'
          const glowColor = isC ? 'rgba(200,20,20,' : 'rgba(255,40,40,'

          // Glow line (thick blurred)
          ctx.shadowColor = lineColor
          ctx.shadowBlur = 16
          ctx.beginPath()
          ctx.moveTo(pts[0].x, pts[0].y)
          for (let i = 1; i < pts.length; i++) {
            const cp = pts[i - 1]
            const np = pts[i]
            const mx = (cp.x + np.x) / 2
            ctx.quadraticCurveTo(cp.x, cp.y, mx, (cp.y + np.y) / 2)
          }
          ctx.lineTo(cur.x, cur.y)
          ctx.strokeStyle = lineColor
          ctx.lineWidth = 3.5
          ctx.lineJoin = 'round'
          ctx.lineCap = 'round'
          ctx.stroke()
          ctx.shadowBlur = 0

          // Filled area under curve
          ctx.beginPath()
          ctx.moveTo(pts[0].x, oy)
          for (let i = 0; i < pts.length; i++) {
            ctx.lineTo(pts[i].x, pts[i].y)
          }
          ctx.lineTo(cur.x, cur.y)
          ctx.lineTo(cur.x, oy)
          ctx.closePath()
          const fillG = ctx.createLinearGradient(0, 0, 0, oy)
          fillG.addColorStop(0, glowColor + '0.8)')
          fillG.addColorStop(0.6, glowColor + '0.4)')
          fillG.addColorStop(1, glowColor + '0.05)')
          ctx.fillStyle = fillG
          ctx.fill()
        }

        // Plane at tip
        const angle = isCrashed ? 0.6 : computeAngle(stateRef.current.points, cur)
        drawPlane(ctx, cur.x, cur.y, isCrashed ? 0.35 : angle, isCrashed, 1)
      }

      ctx.restore()
      animRef.current = requestAnimationFrame(drawFrame)
    }

    drawFrame()
    return () => cancelAnimationFrame(animRef.current)
  }, [status, multiplier, isRunning, isCrashed, isWaiting])

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />

      {/* Multiplier Display — center */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center" style={{ marginTop: '-8%' }}>
          <AnimatePresence mode="wait">
            {isWaiting ? (
              <motion.div
                key="waiting"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <div className="text-brand-gold font-black text-xl tracking-widest uppercase animate-pulse mb-2">
                  PLACE YOUR BETS
                </div>
                <div
                  className="font-black font-mono"
                  style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', color: '#ffd60a', textShadow: '0 0 40px rgba(255,214,10,0.5)' }}
                >
                  1.00x
                </div>
              </motion.div>
            ) : isCrashed ? (
              <motion.div
                key="crashed"
                initial={{ scale: 1.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 10 }}
                className="text-center"
              >
                <div className="text-red-400 font-bold text-sm uppercase tracking-widest mb-1">FLEW AWAY!</div>
                <div
                  className="font-black font-mono"
                  style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', color: '#e63946', textShadow: '0 0 60px rgba(230,57,70,0.8)' }}
                >
                  {(lastCrashPoint || 1).toFixed(2)}x
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="running"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div
                  className="font-black font-mono select-none"
                  style={{
                    fontSize: 'clamp(3.5rem, 9vw, 7rem)',
                    color: '#ffffff',
                    textShadow: '0 2px 40px rgba(255,255,255,0.3)',
                    letterSpacing: '0.02em',
                  }}
                >
                  {(multiplier || 1).toFixed(2)}x
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function computeAngle(pts, cur) {
  if (pts.length < 2) return -0.15
  const prev = pts[pts.length - 2] || pts[pts.length - 1]
  const dx = cur.x - prev.x
  const dy = cur.y - prev.y
  return Math.atan2(dy, dx)
}

function drawPlane(ctx, cx, cy, angle, crashed, alpha = 1) {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.translate(cx, cy)
  ctx.rotate(angle)

  const color = crashed ? '#882222' : '#dd2222'
  const dark  = crashed ? '#551111' : '#991111'

  // Fuselage
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.ellipse(0, 0, 26, 7, 0, 0, Math.PI * 2)
  ctx.fill()

  // Nose cone
  ctx.beginPath()
  ctx.moveTo(26, 0)
  ctx.lineTo(40, -2)
  ctx.lineTo(40, 2)
  ctx.closePath()
  ctx.fillStyle = dark
  ctx.fill()

  // Main wing
  ctx.beginPath()
  ctx.moveTo(5, 0)
  ctx.lineTo(-2, -22)
  ctx.lineTo(-10, -22)
  ctx.lineTo(-4, 0)
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()

  // Wing detail
  ctx.beginPath()
  ctx.moveTo(5, 0)
  ctx.lineTo(0, 16)
  ctx.lineTo(-6, 16)
  ctx.lineTo(-4, 0)
  ctx.closePath()
  ctx.fillStyle = dark
  ctx.fill()

  // Tail fin
  ctx.beginPath()
  ctx.moveTo(-18, 0)
  ctx.lineTo(-24, -13)
  ctx.lineTo(-20, -13)
  ctx.lineTo(-14, 0)
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()

  // Small tail stabilizer
  ctx.beginPath()
  ctx.moveTo(-20, 4)
  ctx.lineTo(-26, 10)
  ctx.lineTo(-22, 8)
  ctx.lineTo(-18, 4)
  ctx.closePath()
  ctx.fillStyle = dark
  ctx.fill()

  // Engine glow when flying
  if (!crashed) {
    ctx.shadowColor = '#ff6600'
    ctx.shadowBlur = 12
    ctx.fillStyle = '#ff8800'
    ctx.beginPath()
    ctx.arc(-26, 0, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
  }

  ctx.restore()
}

export default PlaneCanvas

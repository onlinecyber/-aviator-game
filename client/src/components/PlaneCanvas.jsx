import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../context/GameContext'
import { gameAudio } from '../utils/AudioEngine'

const PlaneCanvas = () => {
  const { status, startTime, lastCrashPoint } = useGame()
  const canvasRef     = useRef(null)
  const animRef       = useRef(null)
  const multiplierRef = useRef(null)

  // Main state
  const stateRef = useRef({
    points: [],
    floatT: 0,
    // Crash fly-up animation
    crashPlane: null,   // { x, y, vx, vy, angle } — plane flies off screen after crash
    crashDone: false,
  })

  const isCrashed = status === 'CRASHED'
  const isRunning = status === 'RUNNING'
  const isWaiting = status === 'WAITING'

  useEffect(() => {
    if (isWaiting) {
      stateRef.current.points    = []
      stateRef.current.floatT    = 0
      stateRef.current.crashPlane = null
      stateRef.current.crashDone  = false
    }
    if (isRunning) gameAudio.startEngine()
    if (isCrashed) gameAudio.playCrash()
  }, [isWaiting, isRunning, isCrashed])

  // HiDPI resize
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width  = canvas.offsetWidth  * dpr
      canvas.height = canvas.offsetHeight * dpr
      canvas.getContext('2d').scale(dpr, dpr)
    }
    resize()
    const obs = new ResizeObserver(resize)
    obs.observe(canvas)
    return () => obs.disconnect()
  }, [])

  // Main animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const W  = () => canvas.offsetWidth
    const H  = () => canvas.offsetHeight
    const OX = () => W() * 0.08
    const OY = () => H() * 0.88

    /**
     * mToPos — converts multiplier to canvas coordinates.
     * Using Math.log(30) (smaller base) so the curve moves FASTER visually.
     * Extra boost: curve starts steeper from origin.
     */
    const mToPos = (m, w, h) => {
      const ox = w * 0.08, oy = h * 0.88
      // Faster: divide by log(30) instead of log(150)
      const t = Math.min(Math.log(Math.max(m, 1)) / Math.log(30), 1)
      // Curve shape: starts steep, flattens at top-right
      const x = ox + t * (w * 0.87)
      const y = oy - (t * 0.35 + Math.pow(t, 1.6) * 0.65) * (h * 0.82)
      return { x, y }
    }

    const draw = () => {
      const w = W(), h = H()
      ctx.save()
      ctx.clearRect(0, 0, w, h)

      // ── Dark background ──
      ctx.fillStyle = '#111827'
      ctx.fillRect(0, 0, w, h)

      const ox = OX(), oy = OY()

      // ── Purple center glow ──
      const glow = ctx.createRadialGradient(w * 0.55, h * 0.4, 0, w * 0.55, h * 0.4, w * 0.6)
      glow.addColorStop(0,   'rgba(140,40,200,0.5)')
      glow.addColorStop(0.4, 'rgba(90,15,150,0.3)')
      glow.addColorStop(1,   'transparent')
      ctx.fillStyle = glow
      ctx.fillRect(0, 0, w, h)

      // ── Blue Y-axis dots ──
      ctx.fillStyle = '#4488ff'
      for (let i = 0; i < 6; i++) {
        const dy = (oy * 0.85 / 5) * i + oy * 0.05
        ctx.beginPath()
        ctx.arc(ox - 10, dy, 3, 0, Math.PI * 2)
        ctx.fill()
      }

      // ── White X-axis dots ──
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      for (let i = 0; i <= 8; i++) {
        const dx = ox + (i / 8) * (w - ox - 10)
        ctx.beginPath()
        ctx.arc(dx, oy + 10, 2.5, 0, Math.PI * 2)
        ctx.fill()
      }

      // ── Faint grid ──
      ctx.strokeStyle = 'rgba(255,255,255,0.03)'
      ctx.lineWidth = 0.5
      for (let i = 1; i < 8; i++) {
        const gx = ox + (i / 8) * (w - ox)
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, oy); ctx.stroke()
      }
      for (let i = 1; i < 6; i++) {
        const gy = (oy / 6) * i
        ctx.beginPath(); ctx.moveTo(ox, gy); ctx.lineTo(w, gy); ctx.stroke()
      }

      // ── WAITING ──
      if (isWaiting) {
        stateRef.current.floatT += 0.03
        const ft = stateRef.current.floatT
        const px = ox + 55 + Math.sin(ft * 0.4) * 6
        const py = oy - 45 + Math.sin(ft) * 8
        drawPlane(ctx, px, py, -0.05, false)

      } else {
        let m = 1.0
        const flying = isRunning && startTime

        if (flying) {
          m = Math.E ** (0.00006 * (Date.now() - startTime))
          if (multiplierRef.current) {
            multiplierRef.current.innerText = `${m.toFixed(2)}x`
          }
          gameAudio.updateEngine(m)
        } else if (isCrashed) {
          m = lastCrashPoint || 1.0
          if (multiplierRef.current) {
            multiplierRef.current.innerText = `${m.toFixed(2)}x`
            multiplierRef.current.style.color = '#ff4444'
          }
        }

        const cur = mToPos(m, w, h)

        // Collect path points while flying
        if (flying) {
          const pts = stateRef.current.points
          const last = pts[pts.length - 1]
          if (!last || Math.abs(last.x - cur.x) > 1.2) pts.push({ ...cur })

          // Clear crash animation when newly flying
          stateRef.current.crashPlane = null
          stateRef.current.crashDone  = false
        }

        // ── CRASH FLY-UP: Initialize when crash first detected ──
        if (isCrashed && !stateRef.current.crashPlane && !stateRef.current.crashDone) {
          const lastAngle = computeAngle(stateRef.current.points, cur)
          stateRef.current.crashPlane = {
            x: cur.x,
            y: cur.y,
            // Fly upward-right fast
            vx:  6 + Math.cos(lastAngle) * 3,
            vy: -12,                         // strong upward velocity
            ay:  0.3,                        // slight gravity pulling back
            angle: lastAngle - 0.6,          // nose tilting up
            dAngle: -0.04,                   // rotate as it flies
          }
        }

        const pts = stateRef.current.points

        // ── Draw the curve ──
        if (pts.length > 1) {
          const buildPath = () => {
            ctx.beginPath()
            ctx.moveTo(ox, oy)
            for (let i = 0; i < pts.length; i++) {
              if (i === 0) ctx.lineTo(pts[i].x, pts[i].y)
              else {
                const cp = pts[i-1], np = pts[i]
                ctx.quadraticCurveTo(cp.x, cp.y, (cp.x+np.x)/2, (cp.y+np.y)/2)
              }
            }
            // When crashed, draw to crash position (not animated plane)
            const endX = stateRef.current.crashPlane ? stateRef.current.crashPlane.x : cur.x
            const endY = stateRef.current.crashPlane ? stateRef.current.crashPlane.y : cur.y
            ctx.lineTo(endX, endY)
          }

          // Fill under curve
          buildPath()
          ctx.lineTo(isCrashed ? (stateRef.current.crashPlane?.x || cur.x) : cur.x, oy)
          ctx.lineTo(ox, oy)
          ctx.closePath()
          const fill = ctx.createLinearGradient(0, oy - h * 0.55, 0, oy)
          fill.addColorStop(0,   isCrashed ? 'rgba(220,0,30,0.35)' : 'rgba(200,0,30,0.45)')
          fill.addColorStop(0.6, isCrashed ? 'rgba(160,0,20,0.15)' : 'rgba(160,0,20,0.2)')
          fill.addColorStop(1,   'rgba(100,0,10,0.03)')
          ctx.fillStyle = fill
          ctx.fill()

          // Glow stroke
          ctx.save()
          buildPath()
          ctx.strokeStyle = isCrashed ? '#cc0000' : '#e8001c'
          ctx.lineWidth = 3.5
          ctx.shadowColor = '#ff2200'
          ctx.shadowBlur = 20
          ctx.lineJoin = 'round'; ctx.lineCap = 'round'
          ctx.stroke()
          ctx.restore()

          // Bright white-red highlight
          ctx.save()
          buildPath()
          ctx.strokeStyle = isCrashed ? '#ff7777' : '#ff4444'
          ctx.lineWidth = 1.5
          ctx.stroke()
          ctx.restore()
        }

        // ── PLANE: animate fly-up on crash ──
        if (isCrashed && stateRef.current.crashPlane) {
          const cp = stateRef.current.crashPlane
          // Update position every frame
          cp.x     += cp.vx
          cp.y     += cp.vy
          cp.vy    += cp.ay       // slight gravity
          cp.angle += cp.dAngle   // rotate nose upward as it flies

          // Draw the flying-away plane
          drawPlane(ctx, cp.x, cp.y, cp.angle, true)

          // If it went off-screen, mark done (stop animating)
          if (cp.y < -80 || cp.x > w + 80) {
            stateRef.current.crashDone  = true
            stateRef.current.crashPlane = null
          }
        } else if (!isCrashed) {
          // Flying normally
          const angle = computeAngle(stateRef.current.points, cur)
          drawPlane(ctx, cur.x, cur.y, angle, false)
        }
      }

      ctx.restore()
      animRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, startTime, lastCrashPoint])

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: '#111827' }}>
      <motion.div
        animate={isCrashed ? { x: [-8,8,-6,6,-4,4,-2,2,0], y: [-5,5,-4,4,-2,2,0] } : {}}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="absolute inset-0"
      >
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      </motion.div>

      {/* Multiplier overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <AnimatePresence mode="wait">

          {isWaiting && (
            <motion.div key="w"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <div style={{
                fontSize: 'clamp(2.5rem,12vw,5.5rem)', fontWeight: 900, color: '#ffffff',
                fontFamily: 'Inter, sans-serif', textShadow: '0 2px 30px rgba(255,255,255,0.2)',
              }}>
                1.00x
              </div>
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.8, repeat: Infinity }}
                style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginTop: '8px', letterSpacing: '2px' }}
              >
                WAITING FOR BETS
              </motion.div>
            </motion.div>
          )}

          {isCrashed && (
            <motion.div key="c"
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', damping: 10, stiffness: 180 }}
              className="text-center"
            >
              <motion.div
                animate={{ opacity: [1, 0.6, 1] }}
                transition={{ duration: 0.4, repeat: 4 }}
                style={{
                  color: '#ff4444', fontSize: '14px', fontWeight: 700,
                  letterSpacing: '3px', marginBottom: '6px',
                  textShadow: '0 0 15px rgba(255,50,50,0.8)',
                }}
              >
                FLEW AWAY!
              </motion.div>
              <div ref={multiplierRef} style={{
                fontSize: 'clamp(2.5rem,12vw,5.5rem)', fontWeight: 900, color: '#ff4444',
                fontFamily: 'Inter, sans-serif', textShadow: '0 0 30px rgba(255,30,30,0.7)',
              }}>
                {(lastCrashPoint || 1).toFixed(2)}x
              </div>
            </motion.div>
          )}

          {isRunning && (
            <motion.div key="r"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <div ref={multiplierRef} style={{
                fontSize: 'clamp(2.5rem,12vw,5.5rem)', fontWeight: 900, color: '#ffffff',
                fontFamily: 'Inter, sans-serif', textShadow: '0 2px 30px rgba(255,255,255,0.25)',
              }}>
                1.00x
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────

function computeAngle(pts, cur) {
  if (pts.length < 2) return -0.3
  const prev = pts[pts.length - 2] || pts[pts.length - 1]
  return Math.atan2(cur.y - prev.y, cur.x - prev.x)
}

function drawPlane(ctx, cx, cy, angle, crashed) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(angle)

  const c = crashed ? '#ff5555' : '#ff2222'
  const d = crashed ? '#aa1111' : '#880000'

  // Fuselage
  ctx.beginPath()
  ctx.ellipse(0, 0, 22, 5.5, 0, 0, Math.PI * 2)
  ctx.fillStyle = c
  ctx.shadowColor = '#ff0000'
  ctx.shadowBlur = crashed ? 15 : 8
  ctx.fill()
  ctx.shadowBlur = 0

  // Nose
  ctx.beginPath()
  ctx.moveTo(22, 0); ctx.lineTo(36, -1.5); ctx.lineTo(36, 1.5); ctx.closePath()
  ctx.fillStyle = '#ff8888'; ctx.fill()

  // Main wing
  ctx.beginPath()
  ctx.moveTo(2, 0); ctx.lineTo(-4, -17); ctx.lineTo(-10, -17); ctx.lineTo(-4, 0); ctx.closePath()
  ctx.fillStyle = d; ctx.fill()

  // Lower winglet
  ctx.beginPath()
  ctx.moveTo(2, 0); ctx.lineTo(-1, 11); ctx.lineTo(-6, 11); ctx.lineTo(-4, 0); ctx.closePath()
  ctx.fillStyle = d; ctx.fill()

  // Tail fin
  ctx.beginPath()
  ctx.moveTo(-14, 0); ctx.lineTo(-20, -10); ctx.lineTo(-17, -10); ctx.lineTo(-11, 0); ctx.closePath()
  ctx.fillStyle = c; ctx.fill()

  // Engine exhaust (only when flying)
  if (!crashed) {
    const len = 18 + Math.random() * 8
    const eg = ctx.createLinearGradient(-22, 0, -22 - len, 0)
    eg.addColorStop(0,   'rgba(255,130,0,0.95)')
    eg.addColorStop(0.4, 'rgba(255,200,0,0.55)')
    eg.addColorStop(1,   'transparent')
    ctx.beginPath()
    ctx.moveTo(-22, -4); ctx.lineTo(-22 - len, 0); ctx.lineTo(-22, 4); ctx.closePath()
    ctx.fillStyle = eg
    ctx.shadowColor = '#ff8800'; ctx.shadowBlur = 12
    ctx.fill(); ctx.shadowBlur = 0

    // Bright engine core
    ctx.beginPath(); ctx.arc(-22, 0, 3, 0, Math.PI * 2)
    ctx.fillStyle = '#ffffff'
    ctx.shadowColor = '#ffaa00'; ctx.shadowBlur = 14
    ctx.fill(); ctx.shadowBlur = 0
  }

  ctx.restore()
}

export default PlaneCanvas

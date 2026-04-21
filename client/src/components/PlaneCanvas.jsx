import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../context/GameContext'
import { gameAudio } from '../utils/AudioEngine'

/* ─── Colour palette (matches new design system) ─────────── */
const C = {
  lineFly:    '#00e676',
  lineGlow:   '#00ff87',
  lineCrash:  '#ff1744',
  fillFly:    'rgba(0,230,118,',
  fillCrash:  'rgba(255,23,68,',
  plane:      '#00e676',
  planeCrash: '#ff1744',
  bg1:        '#0b0f1a',
  bg2:        '#07091380',
  gridDot:    'rgba(0,230,118,0.07)',
  axis:       'rgba(0,230,118,0.1)',
}

const PlaneCanvas = () => {
  const { status, startTime, lastCrashPoint } = useGame()
  const canvasRef       = useRef(null)
  const animRef         = useRef(null)
  const multiplierRef   = useRef(null)
  const statusRef       = useRef(null)
  const stateRef        = useRef({ points: [], floatT: 0 })

  const isCrashed = status === 'CRASHED'
  const isRunning = status === 'RUNNING'
  const isWaiting = status === 'WAITING'

  /* Audio + path reset on phase change */
  useEffect(() => {
    if (isWaiting) {
      stateRef.current.points = []
      stateRef.current.floatT = 0
    }
    if (isRunning)  gameAudio.startEngine()
    if (isCrashed)  gameAudio.playCrash()
  }, [isWaiting, isRunning, isCrashed])

  /* HiDPI canvas resize */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width  = canvas.offsetWidth  * dpr
      canvas.height = canvas.offsetHeight * dpr
      const ctx = canvas.getContext('2d')
      ctx.scale(dpr, dpr)
    }
    resize()
    const obs = new ResizeObserver(resize)
    obs.observe(canvas)
    return () => obs.disconnect()
  }, [])

  /* Main rAF loop */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const W  = () => canvas.offsetWidth
    const H  = () => canvas.offsetHeight
    const OX = () => W() * 0.06
    const OY = () => H() * 0.86

    /* Convert multiplier → canvas XY (logarithmic scale) */
    const mToPos = (m, w, h) => {
      const ox = w * 0.06, oy = h * 0.86
      const t = Math.min(Math.log(Math.max(m, 1)) / Math.log(200), 1)
      const x = ox + t * (w * 0.89)
      const y = oy - (t * 0.45 + Math.pow(t, 1.75) * 0.55) * (h * 0.80)
      return { x, y }
    }

    const drawFrame = () => {
      const w = W(), h = H()
      ctx.save()
      ctx.clearRect(0, 0, w, h)

      /* ── Deep background gradient ── */
      const bg = ctx.createLinearGradient(0, 0, 0, h)
      bg.addColorStop(0, '#0c1120')
      bg.addColorStop(0.5, '#0b0f1a')
      bg.addColorStop(1, '#07090f')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)

      const ox = OX(), oy = OY()

      /* ── Radial glow at origin ── */
      const radGlow = ctx.createRadialGradient(ox, oy, 0, ox, oy, w * 0.5)
      radGlow.addColorStop(0, 'rgba(0,230,118,0.06)')
      radGlow.addColorStop(1, 'transparent')
      ctx.fillStyle = radGlow
      ctx.fillRect(0, 0, w, h)

      /* ── Subtle grid dots ── */
      ctx.fillStyle = C.gridDot
      const gapX = w / 10, gapY = h / 7
      for (let gx = ox; gx < w - 20; gx += gapX) {
        for (let gy = 20; gy < oy; gy += gapY) {
          ctx.beginPath()
          ctx.arc(gx, gy, 1, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      /* ── Axis lines ── */
      ctx.strokeStyle = C.axis
      ctx.lineWidth = 1
      ctx.setLineDash([4, 8])
      // Y axis
      ctx.beginPath(); ctx.moveTo(ox, 10); ctx.lineTo(ox, oy); ctx.stroke()
      // X axis
      ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(w - 10, oy); ctx.stroke()
      ctx.setLineDash([])

      /* ── Axis glows ticks ── */
      const tickColor = 'rgba(0,230,118,0.25)'
      ctx.fillStyle = tickColor
      for (let gx = ox; gx < w - 20; gx += gapX) {
        ctx.fillRect(gx - 0.5, oy, 1, 5)
      }

      /* ─────────────────────────────────── Waiting ── */
      if (isWaiting) {
        stateRef.current.floatT += 0.035
        const ft = stateRef.current.floatT
        const px = ox + 40 + Math.sin(ft * 0.4) * 8
        const py = oy - 35 + Math.sin(ft) * 10

        /* Dashed runway */
        ctx.setLineDash([10, 14])
        ctx.strokeStyle = 'rgba(0,230,118,0.15)'
        ctx.lineWidth = 2
        ctx.beginPath(); ctx.moveTo(ox, oy - 1); ctx.lineTo(px - 15, oy - 1); ctx.stroke()
        ctx.setLineDash([])

        drawPlane(ctx, px, py, -0.05, false)

      /* ─────────────────────────────────── Running / Crashed ── */
      } else {
        let m = 1.0
        const flying = isRunning && startTime

        if (flying) {
          const elapsed = Date.now() - startTime
          m = Math.E ** (0.00006 * elapsed)

          /* Update overlay text directly (zero React re-render) */
          if (multiplierRef.current) {
            const glow = m > 10 ? '#cc44ff' : m > 5 ? '#ffd700' : m > 2 ? '#00e5ff' : '#00e676'
            multiplierRef.current.innerText = `${m.toFixed(2)}x`
            multiplierRef.current.style.color = glow
            multiplierRef.current.style.textShadow = `0 0 30px ${glow}88, 0 0 60px ${glow}44`
          }
          if (statusRef.current) {
            statusRef.current.innerText = 'FLYING'
            statusRef.current.className = 'status-flying font-orbitron font-bold text-xs tracking-widest uppercase'
          }

          gameAudio.updateEngine(m)
        } else if (isCrashed) {
          m = lastCrashPoint || 1.0
          if (multiplierRef.current) {
            multiplierRef.current.innerText = `${m.toFixed(2)}x`
            multiplierRef.current.style.color = '#ff5252'
            multiplierRef.current.style.textShadow = '0 0 30px #ff175288, 0 0 60px #ff175244'
          }
          if (statusRef.current) {
            statusRef.current.innerText = 'CRASHED'
            statusRef.current.className = 'status-crashed font-orbitron font-bold text-xs tracking-widest uppercase'
          }
        }

        const cur = mToPos(m, w, h)

        /* Track path */
        if (flying) {
          const pts = stateRef.current.points
          const last = pts[pts.length - 1]
          if (!last || Math.abs(last.x - cur.x) > 1.2) pts.push({ ...cur })
        }

        const pts = stateRef.current.points
        const lineColor = isCrashed ? C.lineCrash : C.lineFly
        const fillBase  = isCrashed ? C.fillCrash : C.fillFly

        if (pts.length > 1) {
          /* ─ Outer glow stroke ─ */
          ctx.save()
          ctx.shadowColor = lineColor
          ctx.shadowBlur  = isCrashed ? 20 : 25
          ctx.beginPath()
          ctx.moveTo(pts[0].x, pts[0].y)
          for (let i = 1; i < pts.length; i++) {
            const cp = pts[i - 1], np = pts[i]
            ctx.quadraticCurveTo(cp.x, cp.y, (cp.x + np.x) / 2, (cp.y + np.y) / 2)
          }
          ctx.lineTo(cur.x, cur.y)
          ctx.strokeStyle = lineColor
          ctx.lineWidth   = 3
          ctx.lineJoin    = 'round'
          ctx.lineCap     = 'round'
          ctx.stroke()
          ctx.restore()

          /* ─ Core bright line ─ */
          ctx.save()
          ctx.shadowColor = isCrashed ? '#ff4444' : '#88ffcc'
          ctx.shadowBlur  = 6
          ctx.beginPath()
          ctx.moveTo(pts[0].x, pts[0].y)
          for (let i = 1; i < pts.length; i++) {
            const cp = pts[i - 1], np = pts[i]
            ctx.quadraticCurveTo(cp.x, cp.y, (cp.x + np.x) / 2, (cp.y + np.y) / 2)
          }
          ctx.lineTo(cur.x, cur.y)
          ctx.strokeStyle = isCrashed ? '#ff8888' : '#88ffcc'
          ctx.lineWidth   = 1.5
          ctx.stroke()
          ctx.restore()

          /* ─ Fill area under curve ─ */
          ctx.beginPath()
          ctx.moveTo(pts[0].x, oy)
          pts.forEach(p => ctx.lineTo(p.x, p.y))
          ctx.lineTo(cur.x, cur.y)
          ctx.lineTo(cur.x, oy)
          ctx.closePath()
          const fill = ctx.createLinearGradient(0, oy - (oy * 0.6), 0, oy)
          fill.addColorStop(0,   fillBase + '0.35)')
          fill.addColorStop(0.5, fillBase + '0.15)')
          fill.addColorStop(1,   fillBase + '0.02)')
          ctx.fillStyle = fill
          ctx.fill()

          /* ─ Glow trail dots along curve ─ */
          if (flying) {
            const trailLen = Math.min(8, pts.length)
            for (let i = pts.length - trailLen; i < pts.length; i++) {
              const idx   = i - (pts.length - trailLen)
              const alpha = (idx / trailLen) * 0.5
              const p = pts[i]
              ctx.beginPath()
              ctx.arc(p.x, p.y, 2, 0, Math.PI * 2)
              ctx.fillStyle = `rgba(0,230,118,${alpha})`
              ctx.shadowColor = '#00e676'
              ctx.shadowBlur  = 8
              ctx.fill()
              ctx.shadowBlur = 0
            }
          }
        }

        /* ─ Plane ─ */
        const angle = isCrashed
          ? 0.5
          : computeAngle(stateRef.current.points, cur)
        drawPlane(ctx, cur.x, cur.y, angle, isCrashed)
      }

      ctx.restore()
      animRef.current = requestAnimationFrame(drawFrame)
    }

    drawFrame()
    return () => cancelAnimationFrame(animRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, startTime, lastCrashPoint])

  return (
    <div className="relative w-full h-full overflow-hidden scanline-overlay">
      {/* Motion wrapper for screen shake on crash */}
      <motion.div
        animate={isCrashed ? {
          x: [-8, 8, -6, 6, -4, 4, -2, 2, 0],
          y: [-4, 4, -3, 3, -2, 2, 0],
        } : {}}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="absolute inset-0"
      >
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      </motion.div>

      {/* ── Overlay: multiplier + status ── */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10"
           style={{ paddingBottom: '8%' }}>
        <AnimatePresence mode="wait">

          {/* WAITING */}
          {isWaiting && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, scale: 0.85, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4 }}
              className="text-center"
            >
              <div
                className="font-orbitron font-bold text-xs tracking-widest uppercase mb-3"
                style={{ color: '#ffd700', textShadow: '0 0 15px rgba(255,215,0,0.6)' }}
              >
                ⏳ WAITING FOR BETS
              </div>
              <div
                className="font-orbitron font-black leading-none"
                style={{
                  fontSize: 'clamp(3.5rem, 10vw, 6.5rem)',
                  color: '#ffd700',
                  textShadow: '0 0 30px rgba(255,215,0,0.7), 0 0 60px rgba(255,215,0,0.3)',
                }}
              >
                1.00x
              </div>
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="mt-3 font-orbitron text-[10px] tracking-[0.3em] uppercase"
                style={{ color: 'rgba(255,215,0,0.5)' }}
              >
                PLACE YOUR BET
              </motion.div>
            </motion.div>
          )}

          {/* CRASHED */}
          {isCrashed && (
            <motion.div
              key="crashed"
              initial={{ scale: 1.4, opacity: 0 }}
              animate={{ scale: 1,   opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', damping: 8, stiffness: 200 }}
              className="text-center"
            >
              <motion.div
                animate={{ opacity: [1, 0.7, 1] }}
                transition={{ duration: 0.5, repeat: 3 }}
                className="font-orbitron font-black text-sm tracking-widest uppercase mb-2"
                style={{ color: '#ff5252', textShadow: '0 0 20px rgba(255,82,82,0.8)' }}
              >
                💥 FLEW AWAY!
              </motion.div>
              <div
                ref={multiplierRef}
                className="font-orbitron font-black leading-none"
                style={{
                  fontSize: 'clamp(3.5rem, 10vw, 6.5rem)',
                  color: '#ff5252',
                  textShadow: '0 0 30px rgb(255,23,68), 0 0 60px rgba(255,23,68,0.5)',
                }}
              >
                {(lastCrashPoint || 1).toFixed(2)}x
              </div>
            </motion.div>
          )}

          {/* RUNNING */}
          {isRunning && (
            <motion.div
              key="running"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <div
                ref={statusRef}
                className="status-flying font-orbitron font-bold text-xs tracking-widest uppercase mb-2"
              >
                FLYING
              </div>
              <div
                ref={multiplierRef}
                className="font-orbitron font-black leading-none select-none"
                style={{
                  fontSize: 'clamp(3.5rem, 10vw, 6.5rem)',
                  color: '#00e676',
                  textShadow: '0 0 30px rgba(0,230,118,0.9), 0 0 60px rgba(0,230,118,0.4)',
                  letterSpacing: '-0.02em',
                }}
              >
                1.00x
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Corner accent lines */}
      <div className="absolute top-0 left-0 w-12 h-12 pointer-events-none opacity-30"
           style={{ borderTop: '2px solid #00e676', borderLeft: '2px solid #00e676' }} />
      <div className="absolute top-0 right-0 w-12 h-12 pointer-events-none opacity-30"
           style={{ borderTop: '2px solid #00e676', borderRight: '2px solid #00e676' }} />
      <div className="absolute bottom-0 left-0 w-12 h-12 pointer-events-none opacity-30"
           style={{ borderBottom: '2px solid #00e676', borderLeft: '2px solid #00e676' }} />
    </div>
  )
}

/* ── Helpers ──────────────────────────────────────────────── */
function computeAngle(pts, cur) {
  if (pts.length < 2) return -0.2
  const prev = pts[pts.length - 2] || pts[pts.length - 1]
  return Math.atan2(cur.y - prev.y, cur.x - prev.x)
}

function drawPlane(ctx, cx, cy, angle, crashed) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(angle)

  const main  = crashed ? '#ff5252' : '#00e676'
  const dark  = crashed ? '#cc1515' : '#008844'
  const glow  = crashed ? 'rgba(255,82,82,' : 'rgba(0,230,118,'

  /* Fuselage */
  const fuseGrad = ctx.createLinearGradient(-26, -5, 26, 5)
  fuseGrad.addColorStop(0, dark)
  fuseGrad.addColorStop(0.4, main)
  fuseGrad.addColorStop(1, dark)
  ctx.fillStyle = fuseGrad
  ctx.beginPath()
  ctx.ellipse(0, 0, 25, 6.5, 0, 0, Math.PI * 2)
  ctx.fill()

  /* Nose */
  ctx.beginPath()
  ctx.moveTo(25, 0)
  ctx.lineTo(40, -1.5)
  ctx.lineTo(40, 1.5)
  ctx.closePath()
  ctx.fillStyle = crashed ? '#ff8888' : '#66ffaa'
  ctx.fill()

  /* Main wing */
  ctx.beginPath()
  ctx.moveTo(4, 0)
  ctx.lineTo(-3, -20)
  ctx.lineTo(-11, -20)
  ctx.lineTo(-5, 0)
  ctx.closePath()
  const wGrad = ctx.createLinearGradient(0, -20, 0, 0)
  wGrad.addColorStop(0, dark)
  wGrad.addColorStop(1, main)
  ctx.fillStyle = wGrad
  ctx.fill()

  /* Lower winglet */
  ctx.beginPath()
  ctx.moveTo(4, 0)
  ctx.lineTo(0, 13)
  ctx.lineTo(-6, 13)
  ctx.lineTo(-5, 0)
  ctx.closePath()
  ctx.fillStyle = dark
  ctx.fill()

  /* Tail fin */
  ctx.beginPath()
  ctx.moveTo(-17, 0)
  ctx.lineTo(-24, -12)
  ctx.lineTo(-20, -12)
  ctx.lineTo(-13, 0)
  ctx.closePath()
  ctx.fillStyle = main
  ctx.fill()

  /* Tail stabilizer */
  ctx.beginPath()
  ctx.moveTo(-20, 3)
  ctx.lineTo(-26, 9)
  ctx.lineTo(-23, 7)
  ctx.lineTo(-18, 3)
  ctx.closePath()
  ctx.fillStyle = dark
  ctx.fill()

  /* Engine glow when flying */
  if (!crashed) {
    const exhaustLen = 14 + Math.random() * 6
    const exGrad = ctx.createLinearGradient(-26, 0, -26 - exhaustLen, 0)
    exGrad.addColorStop(0, 'rgba(0,230,118,0.9)')
    exGrad.addColorStop(0.4, 'rgba(0,200,255,0.6)')
    exGrad.addColorStop(1, 'transparent')
    ctx.beginPath()
    ctx.moveTo(-26, -3)
    ctx.lineTo(-26 - exhaustLen, 0)
    ctx.lineTo(-26, 3)
    ctx.closePath()
    ctx.fillStyle = exGrad
    ctx.shadowColor = '#00e676'
    ctx.shadowBlur  = 10
    ctx.fill()
    ctx.shadowBlur = 0

    /* Engine core */
    ctx.beginPath()
    ctx.arc(-26, 0, 3.5, 0, Math.PI * 2)
    ctx.fillStyle = '#ffffff'
    ctx.shadowColor = '#00ffaa'
    ctx.shadowBlur  = 12
    ctx.fill()
    ctx.shadowBlur = 0
  }

  ctx.restore()
}

export default PlaneCanvas

import { useEffect, useRef } from 'react'

export default function ParticlesBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    let w = canvas.width  = window.innerWidth
    let h = canvas.height = window.innerHeight
    let raf

    const COLORS = ['#00e676', '#00e5ff', '#cc44ff', '#ffffff', '#ffd700']

    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.2 + 0.3,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.5 + 0.1,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.01 + Math.random() * 0.02,
    }))

    const draw = () => {
      ctx.clearRect(0, 0, w, h)

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        p.pulse += p.pulseSpeed

        if (p.x < 0) p.x = w
        if (p.x > w) p.x = 0
        if (p.y < 0) p.y = h
        if (p.y > h) p.y = 0

        const a = p.alpha * (0.6 + 0.4 * Math.sin(p.pulse))

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = p.color.replace(')', `, ${a})`)
          .replace('rgb', 'rgba').replace('#', 'rgba(')

        // Parse hex to rgba manually
        const hex = p.color.replace('#', '')
        const rr = parseInt(hex.substring(0, 2), 16)
        const gg = parseInt(hex.substring(2, 4), 16)
        const bb = parseInt(hex.substring(4, 6), 16)
        ctx.fillStyle = `rgba(${rr},${gg},${bb},${a})`

        // Glow
        ctx.shadowColor = p.color
        ctx.shadowBlur  = 6
        ctx.fill()
        ctx.shadowBlur = 0
      }

      raf = requestAnimationFrame(draw)
    }

    draw()

    const onResize = () => {
      w = canvas.width  = window.innerWidth
      h = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  )
}

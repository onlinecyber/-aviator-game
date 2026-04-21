class AudioEngine {
  constructor() {
    this.ctx = null
    this.engineOsc = null
    this.engineGain = null
    this.tickingInterval = null
    this.isMuted = false
    this.initialized = false
  }

  init() {
    if (this.initialized) return
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      this.ctx = new AudioContext()
      this.initialized = true
    } catch (e) {
      console.warn('Web Audio API not supported')
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted
    if (this.isMuted) {
      this.stopEngine()
    }
    return this.isMuted
  }

  // A subtle synth drone that rises in pitch
  startEngine() {
    if (!this.ctx || this.isMuted) return
    if (this.ctx.state === 'suspended') this.ctx.resume()

    this.stopEngine()

    this.engineOsc = this.ctx.createOscillator()
    this.engineGain = this.ctx.createGain()

    // Base tone - low rumble
    this.engineOsc.type = 'triangle'
    this.engineOsc.frequency.setValueAtTime(50, this.ctx.currentTime)

    this.engineGain.gain.setValueAtTime(0.1, this.ctx.currentTime)

    this.engineOsc.connect(this.engineGain)
    this.engineGain.connect(this.ctx.destination)

    this.engineOsc.start()
  }

  updateEngine(multiplier) {
    if (!this.engineOsc || !this.ctx || this.isMuted) return
    
    // Pitch goes up logarithmically as multiplier climbs
    const freq = 50 + (Math.log10(multiplier) * 150)
    // Max freq at 100x = ~350Hz

    // Smooth transition
    this.engineOsc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.1)
    
    // Gain slightly higher as tension builds (cap at 0.3)
    const vol = Math.min(0.1 + (multiplier * 0.005), 0.3)
    this.engineGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.1)
  }

  stopEngine() {
    if (this.engineOsc) {
      try {
        this.engineOsc.stop()
        this.engineOsc.disconnect()
      } catch (e) {}
      this.engineOsc = null
    }
    if (this.engineGain) {
      this.engineGain.disconnect()
      this.engineGain = null
    }
  }

  playCrash() {
    if (!this.ctx || this.isMuted) return
    this.stopEngine()

    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(100, this.ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(10, this.ctx.currentTime + 0.5)

    gain.gain.setValueAtTime(0.5, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start()
    osc.stop(this.ctx.currentTime + 0.6)
  }

  playCashout(amount) {
    if (!this.ctx || this.isMuted) return

    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    
    osc.type = 'sine'
    // Pitch depends roughly on win amount
    const freq = amount > 1000 ? 880 : 440 // A5 or A4
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime)
    osc.frequency.setTargetAtTime(freq * 1.5, this.ctx.currentTime + 0.1, 0.1)

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start()
    osc.stop(this.ctx.currentTime + 0.6)
  }
}

export const gameAudio = new AudioEngine()

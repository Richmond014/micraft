const KEY = 'sound-enabled'
const listeners = new Set<() => void>()
let ctx: AudioContext | null = null
let enabled = safeRead()
let stopCurrent: (() => void) | null = null
let installed = false

function safeRead() {
  try { return localStorage.getItem(KEY) === '1' } catch { return false }
}
const emit = () => listeners.forEach((l) => l())

export const soundStore = {
  subscribe(l: () => void) { listeners.add(l); return () => void listeners.delete(l) },
  get: () => enabled,
}

export function setSoundEnabled(value: boolean) {
  enabled = value
  try { localStorage.setItem(KEY, value ? '1' : '0') } catch { /* ignore */ }
  if (!value) stopCurrent?.()
  emit()
}

/** Idempotent. Audio only unlocks after a real pointer/key gesture. */
export function installAudioUnlock() {
  if (installed || typeof window === 'undefined') return
  installed = true
  const unlock = () => {
    try {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (Ctor) {
        ctx ??= new Ctor()
        void ctx.resume().catch(() => {})
      }
    } catch {
      /* Audio unavailable: stay silent. */
    }
    window.removeEventListener('pointerdown', unlock)
    window.removeEventListener('keydown', unlock)
  }
  window.addEventListener('pointerdown', unlock)
  window.addEventListener('keydown', unlock)
}

const tones = {
  tick: { type: 'sine', from: 880, to: 880, dur: 0.06 },
  press: { type: 'sine', from: 520, to: 390, dur: 0.09 },
  pop: { type: 'triangle', from: 660, to: 760, dur: 0.12 },
} as const
export type SoundName = keyof typeof tones

export function playSound(name: SoundName) {
  if (!enabled || !ctx || ctx.state !== 'running') return
  stopCurrent?.()
  const t = tones[name]
  const now = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = t.type
  osc.frequency.setValueAtTime(t.from, now)
  osc.frequency.exponentialRampToValueAtTime(t.to, now + t.dur)
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(0.05, now + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + t.dur)
  osc.connect(gain).connect(ctx.destination)
  osc.start(now)
  osc.stop(now + t.dur + 0.02)
  const stop = () => { try { osc.stop() } catch { /* already stopped */ } }
  stopCurrent = stop
  osc.onended = () => { if (stopCurrent === stop) stopCurrent = null }
}

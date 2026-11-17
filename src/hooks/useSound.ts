import { useEffect, useSyncExternalStore } from 'react'
import { installAudioUnlock, playSound, setSoundEnabled, soundStore } from '../lib/audio'

export function useSound() {
  useEffect(installAudioUnlock, [])
  const enabled = useSyncExternalStore(soundStore.subscribe, soundStore.get, () => false)
  return { enabled, setEnabled: setSoundEnabled, play: playSound }
}
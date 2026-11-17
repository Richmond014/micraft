/** `:focus-visible` is unsupported (and throws) in very old browsers; treat that as visible focus. */
export function isFocusVisible(el: EventTarget): boolean {
  try {
    return (el as Element).matches(':focus-visible')
  } catch {
    return true
  }
}

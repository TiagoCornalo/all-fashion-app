import { useEffect, useRef } from 'react'

interface BarcodeScannerOptions {
  enabled?: boolean
  minLength?: number
  maxInterKeyDelay?: number
  onScan: (value: string) => void | Promise<void>
}

export const BARCODE_SCAN_EVENT = 'allfashion:barcode-scan'

export const useBarcodeScanner = ({
  enabled = true,
  minLength = 3,
  maxInterKeyDelay = 70,
  onScan
}: BarcodeScannerOptions) => {
  const callbackRef = useRef(onScan)
  const bufferRef = useRef('')
  const startedAtRef = useRef(0)
  const lastKeyAtRef = useRef(0)

  useEffect(() => {
    callbackRef.current = onScan
  }, [onScan])

  useEffect(() => {
    if (!enabled) return

    const reset = () => {
      bufferRef.current = ''
      startedAtRef.current = 0
      lastKeyAtRef.current = 0
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return

      const now = performance.now()
      const isTerminator = event.key === 'Enter' || event.key === 'Tab'

      if (isTerminator) {
        const value = bufferRef.current
        const duration = startedAtRef.current ? now - startedAtRef.current : Infinity
        const averageDelay = value.length > 1 ? duration / (value.length - 1) : Infinity
        const looksLikeScanner =
          value.length >= minLength &&
          averageDelay <= maxInterKeyDelay &&
          duration <= Math.max(250, value.length * maxInterKeyDelay)

        reset()
        if (looksLikeScanner) {
          event.preventDefault()
          event.stopPropagation()
          event.stopImmediatePropagation()
          window.dispatchEvent(new CustomEvent(BARCODE_SCAN_EVENT, {
            detail: { value }
          }))
          void callbackRef.current(value)
        }
        return
      }

      if (event.key.length !== 1) return
      if (lastKeyAtRef.current && now - lastKeyAtRef.current > maxInterKeyDelay) {
        reset()
      }
      if (!bufferRef.current) startedAtRef.current = now
      bufferRef.current += event.key
      lastKeyAtRef.current = now
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [enabled, maxInterKeyDelay, minLength])
}

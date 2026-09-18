'use client'

import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    cv?: { onRuntimeInitialized?: () => void; getBuildInformation?: () => string }
  }
}

type Scanner = {
  highlightPaper: (image: HTMLCanvasElement) => HTMLCanvasElement
  extractPaper: (image: HTMLCanvasElement, width: number, height: number) => HTMLCanvasElement
}

const OUTPUT_WIDTH = 1000
const OUTPUT_HEIGHT = 1400

function loadOpenCv(): Promise<void> {
  if (window.cv?.getBuildInformation) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const existing = document.getElementById('opencv-script')
    if (existing) {
      existing.addEventListener('load', () => resolve())
      return
    }

    const script = document.createElement('script')
    script.id = 'opencv-script'
    script.src = '/opencv.js'
    script.async = true
    script.onload = () => {
      if (window.cv) {
        window.cv.onRuntimeInitialized = () => resolve()
      } else {
        reject(new Error('OpenCV konnte nicht geladen werden.'))
      }
    }
    script.onerror = () => reject(new Error('OpenCV konnte nicht geladen werden.'))
    document.body.appendChild(script)
  })
}

export default function DocumentScanner({
  onCapture,
  onCancel,
}: {
  onCapture: (file: File) => void
  onCancel: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const frameCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const scannerRef = useRef<Scanner | null>(null)

  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let stream: MediaStream | null = null
    let intervalId: number | undefined
    let cancelled = false

    async function start() {
      frameCanvasRef.current = document.createElement('canvas')

      await loadOpenCv()
      if (cancelled) return

      const { default: JScanify } = await import('jscanify/client')
      scannerRef.current = new JScanify() as Scanner

      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      if (cancelled) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }

      const video = videoRef.current
      if (!video) return
      video.srcObject = stream
      await video.play()

      setReady(true)

      intervalId = window.setInterval(() => {
        const overlay = overlayRef.current
        const frame = frameCanvasRef.current
        if (!video.videoWidth || !overlay || !frame || !scannerRef.current) return

        frame.width = video.videoWidth
        frame.height = video.videoHeight
        frame.getContext('2d')?.drawImage(video, 0, 0)

        overlay.width = video.videoWidth
        overlay.height = video.videoHeight
        const highlighted = scannerRef.current.highlightPaper(frame)
        overlay.getContext('2d')?.drawImage(highlighted, 0, 0)
      }, 150)
    }

    start().catch((err) => {
      setError(err instanceof Error ? err.message : 'Kamera konnte nicht gestartet werden.')
    })

    return () => {
      cancelled = true
      if (intervalId) window.clearInterval(intervalId)
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  function handleCapture() {
    const video = videoRef.current
    const frame = frameCanvasRef.current
    if (!video || !frame || !scannerRef.current || !video.videoWidth) return

    frame.width = video.videoWidth
    frame.height = video.videoHeight
    frame.getContext('2d')?.drawImage(video, 0, 0)

    const resultCanvas = scannerRef.current.extractPaper(frame, OUTPUT_WIDTH, OUTPUT_HEIGHT)

    resultCanvas.toBlob(
      (blob) => {
        if (!blob) return
        onCapture(new File([blob], `rechnung-${Date.now()}.jpg`, { type: 'image/jpeg' }))
      },
      'image/jpeg',
      0.92
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="relative flex-1 overflow-hidden">
        <video ref={videoRef} muted playsInline className="absolute inset-0 h-full w-full object-cover" />
        <canvas ref={overlayRef} className="absolute inset-0 h-full w-full object-cover" />
        {!ready && !error && (
          <p className="absolute inset-0 flex items-center justify-center px-8 text-center text-sm text-white/70">
            Kamera wird gestartet...
          </p>
        )}
        {error && (
          <p className="absolute inset-0 flex items-center justify-center px-8 text-center text-sm text-red-400">
            {error}
          </p>
        )}
      </div>

      <div className="flex items-center justify-center gap-4 bg-black p-6">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-white/30 px-5 py-3 text-sm font-medium text-white active:scale-95"
        >
          Abbrechen
        </button>
        <button
          type="button"
          onClick={handleCapture}
          disabled={!ready}
          className="rounded-full bg-white px-8 py-3 text-sm font-medium text-black transition active:scale-95 disabled:opacity-50"
        >
          Aufnehmen
        </button>
      </div>
    </div>
  )
}

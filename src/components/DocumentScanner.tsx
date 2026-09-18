'use client'

import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    cv?: {
      onRuntimeInitialized?: () => void
      getBuildInformation?: () => string
      imread: (source: HTMLCanvasElement) => CvMat
    }
  }
}

type CvMat = { delete: () => void }
type Point = { x: number; y: number }
type CornerPoints = {
  topLeftCorner: Point
  topRightCorner: Point
  bottomLeftCorner: Point
  bottomRightCorner: Point
}

type Scanner = {
  extractPaper: (
    image: HTMLCanvasElement,
    width: number,
    height: number,
    cornerPoints?: CornerPoints
  ) => HTMLCanvasElement
  findPaperContour: (img: CvMat) => CvMat | null
  getCornerPoints: (contour: CvMat) => Partial<CornerPoints>
}

// Wie stark neue Kantenerkennungen die zuletzt gezeigte Kontur nachziehen
// (0 = bleibt starr, 1 = folgt sofort jedem Wackler der Erkennung).
const SMOOTHING = 0.35
const DETECTION_INTERVAL_MS = 150

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

function lerpPoint(from: Point, to: Point, t: number): Point {
  return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t }
}

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function isComplete(corners: Partial<CornerPoints>): corners is CornerPoints {
  return Boolean(
    corners.topLeftCorner && corners.topRightCorner && corners.bottomLeftCorner && corners.bottomRightCorner
  )
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
  const smoothedCornersRef = useRef<CornerPoints | null>(null)

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
      scannerRef.current = new JScanify() as unknown as Scanner

      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 2560 },
          height: { ideal: 1440 },
        },
      })
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
        const cv = window.cv
        if (!video.videoWidth || !overlay || !frame || !scannerRef.current || !cv) return

        frame.width = video.videoWidth
        frame.height = video.videoHeight
        frame.getContext('2d')?.drawImage(video, 0, 0)

        const img = cv.imread(frame)
        const contour = scannerRef.current.findPaperContour(img)
        const detected = contour ? scannerRef.current.getCornerPoints(contour) : null
        contour?.delete()
        img.delete()

        if (detected && isComplete(detected)) {
          const previous = smoothedCornersRef.current
          smoothedCornersRef.current = previous
            ? {
                topLeftCorner: lerpPoint(previous.topLeftCorner, detected.topLeftCorner, SMOOTHING),
                topRightCorner: lerpPoint(previous.topRightCorner, detected.topRightCorner, SMOOTHING),
                bottomLeftCorner: lerpPoint(previous.bottomLeftCorner, detected.bottomLeftCorner, SMOOTHING),
                bottomRightCorner: lerpPoint(previous.bottomRightCorner, detected.bottomRightCorner, SMOOTHING),
              }
            : detected
        }

        // Nur die transparente Kontur zeichnen, nicht das Kamerabild selbst
        // (das bleibt im <video>-Element und läuft dadurch flüssig statt
        // in 150ms-Schritten zu ruckeln).
        overlay.width = video.videoWidth
        overlay.height = video.videoHeight
        const ctx = overlay.getContext('2d')
        ctx?.clearRect(0, 0, overlay.width, overlay.height)

        const corners = smoothedCornersRef.current
        if (ctx && corners) {
          ctx.strokeStyle = '#ff8a00'
          ctx.lineWidth = 6
          ctx.beginPath()
          ctx.moveTo(corners.topLeftCorner.x, corners.topLeftCorner.y)
          ctx.lineTo(corners.topRightCorner.x, corners.topRightCorner.y)
          ctx.lineTo(corners.bottomRightCorner.x, corners.bottomRightCorner.y)
          ctx.lineTo(corners.bottomLeftCorner.x, corners.bottomLeftCorner.y)
          ctx.closePath()
          ctx.stroke()
        }
      }, DETECTION_INTERVAL_MS)
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
    const corners = smoothedCornersRef.current
    if (!video || !frame || !scannerRef.current || !video.videoWidth) return

    frame.width = video.videoWidth
    frame.height = video.videoHeight
    frame.getContext('2d')?.drawImage(video, 0, 0)

    // Ergebnisgröße an die tatsächlich erkannte Kontur anpassen, statt sie
    // in ein festes Format zu zwingen (das hat vorher krumme/schmale
    // Rechnungen verzerrt und dadurch unscharf wirken lassen).
    const width = corners
      ? Math.round(
          Math.max(
            distance(corners.topLeftCorner, corners.topRightCorner),
            distance(corners.bottomLeftCorner, corners.bottomRightCorner)
          )
        )
      : video.videoWidth
    const height = corners
      ? Math.round(
          Math.max(
            distance(corners.topLeftCorner, corners.bottomLeftCorner),
            distance(corners.topRightCorner, corners.bottomRightCorner)
          )
        )
      : video.videoHeight

    const resultCanvas = scannerRef.current.extractPaper(
      frame,
      Math.max(width, 1),
      Math.max(height, 1),
      corners ?? undefined
    )

    resultCanvas.toBlob(
      (blob) => {
        if (!blob) return
        onCapture(new File([blob], `rechnung-${Date.now()}.jpg`, { type: 'image/jpeg' }))
      },
      'image/jpeg',
      0.95
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

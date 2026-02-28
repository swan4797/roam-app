"use client"

import { useRef, useState, useEffect, useCallback, memo } from "react"

interface Props {
  onSign: (signatureData: string) => void
  width?: number
  height?: number
}

export const SignaturePad = memo(function SignaturePad({
  onSign,
  width = 400,
  height = 200,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set up canvas
    ctx.strokeStyle = "#1E1E2D"
    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    // Fill with white background
    ctx.fillStyle = "#FFFFFF"
    ctx.fillRect(0, 0, width, height)
  }, [width, height])

  const getCoordinates = useCallback(
    (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
      const canvas = canvasRef.current
      if (!canvas) return { x: 0, y: 0 }

      const rect = canvas.getBoundingClientRect()

      if ("touches" in e) {
        return {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top,
        }
      }

      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
    },
    []
  )

  const startDrawing = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext("2d")
      if (!ctx) return

      setIsDrawing(true)
      const { x, y } = getCoordinates(e)
      ctx.beginPath()
      ctx.moveTo(x, y)
    },
    [getCoordinates]
  )

  const draw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing) return

      const canvas = canvasRef.current
      const ctx = canvas?.getContext("2d")
      if (!ctx) return

      const { x, y } = getCoordinates(e)
      ctx.lineTo(x, y)
      ctx.stroke()
      setHasSignature(true)
    },
    [isDrawing, getCoordinates]
  )

  const stopDrawing = useCallback(() => {
    setIsDrawing(false)
  }, [])

  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!ctx) return

    ctx.fillStyle = "#FFFFFF"
    ctx.fillRect(0, 0, width, height)
    setHasSignature(false)
  }, [width, height])

  const saveSignature = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !hasSignature) return

    const signatureData = canvas.toDataURL("image/png")
    onSign(signatureData)
  }, [hasSignature, onSign])

  return (
    <div className="signature-pad">
      <div className="signature-pad__header">
        <label className="signature-pad__label">Draw your signature</label>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={clearSignature}
          aria-label="Clear signature"
        >
          Clear
        </button>
      </div>

      <div className="signature-pad__canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="signature-pad__canvas"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          aria-label="Signature canvas"
          role="img"
        />
        {!hasSignature && (
          <div className="signature-pad__placeholder" aria-hidden="true">
            Sign here
          </div>
        )}
      </div>

      <div className="signature-pad__line" aria-hidden="true" />

      <button
        type="button"
        className="btn btn--primary btn--block"
        onClick={saveSignature}
        disabled={!hasSignature}
      >
        Apply Signature
      </button>
    </div>
  )
})

'use client'

import { useEffect, useRef } from 'react'

/**
 * Renders a 2D front-view of a Minecraft character assembled from
 * the 64×64 skin texture. Each pixel is drawn at SCALE× size.
 *
 * Front-face UV regions (x, y, w, h):
 *   Head front:     (8,8,8,8)
 *   Body front:    (20,20,8,12)
 *   Right arm:     (44,20,4,12)  ← character's right = viewer's left
 *   Left arm:      (36,52,4,12)  ← character's left  = viewer's right
 *   Right leg:      (4,20,4,12)
 *   Left leg:      (20,52,4,12)
 */

const SCALE = 6

// Character assembly (all measurements in Minecraft pixels)
const CHAR = {
  // Head: 8 wide, 8 tall — centered over body
  head:    { sx: 8,  sy: 8,  sw: 8, sh: 8,  dx: 4, dy: 0 },
  // Body: 8 wide, 12 tall
  body:    { sx: 20, sy: 20, sw: 8, sh: 12, dx: 4, dy: 8 },
  // Arms: 4 wide, 12 tall
  rArm:    { sx: 44, sy: 20, sw: 4, sh: 12, dx: 0, dy: 8 },  // viewer left
  lArm:    { sx: 36, sy: 52, sw: 4, sh: 12, dx: 12, dy: 8 }, // viewer right
  // Legs: 4 wide, 12 tall
  rLeg:    { sx: 4,  sy: 20, sw: 4, sh: 12, dx: 4, dy: 20 },
  lLeg:    { sx: 20, sy: 52, sw: 4, sh: 12, dx: 8, dy: 20 },
}

// Canvas size in Minecraft pixels: 16 wide (arm+body+arm), 32 tall (head+body+legs)
const CANVAS_W = 16
const CANVAS_H = 32

interface Props {
  skinUrl: string
  className?: string
}

export default function CharacterPreview({ skinUrl, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width  = CANVAS_W * SCALE
    canvas.height = CANVAS_H * SCALE

    const ctx = canvas.getContext('2d')!
    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const img = new window.Image()
    img.onload = () => {
      for (const part of Object.values(CHAR)) {
        ctx.drawImage(
          img,
          part.sx, part.sy, part.sw, part.sh,
          part.dx * SCALE, part.dy * SCALE,
          part.sw * SCALE, part.sh * SCALE
        )
      }
    }
    img.src = skinUrl
  }, [skinUrl])

  return (
    <canvas
      ref={canvasRef}
      className={`pixel-art ${className ?? ''}`}
      style={{
        imageRendering: 'pixelated',
        width:  CANVAS_W * SCALE,
        height: CANVAS_H * SCALE,
      }}
      aria-label="Vista previa del personaje"
    />
  )
}

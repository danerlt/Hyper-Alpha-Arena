import { useEffect, useState } from 'react'
import type { AvatarPreset } from './pixelData/palettes'
import type { CharacterState, FrameSet } from './pixelData/characters'
import { getFrames } from './pixelData/characters'

interface PixelCharacterProps {
  preset: AvatarPreset
  state: CharacterState
  pixelSize?: number
}

export default function PixelCharacter({
  preset,
  state,
  pixelSize = 3,
}: PixelCharacterProps) {
  const frameSet: FrameSet = getFrames(preset.gender, state)
  const [frameIndex, setFrameIndex] = useState(0)

  useEffect(() => {
    if (frameSet.frames.length <= 1) return
    const timer = setInterval(() => {
      setFrameIndex(prev => (prev + 1) % frameSet.frames.length)
    }, frameSet.intervalMs)
    return () => clearInterval(timer)
  }, [frameSet.frames.length, frameSet.intervalMs])

  const frame = frameSet.frames[frameIndex]
  const rows = frame.length
  const cols = frame[0]?.length || 0
  const width = cols * pixelSize
  const height = rows * pixelSize

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${cols} ${rows}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ imageRendering: 'pixelated' }}
    >
      {frame.map((row, y) =>
        row.split('').map((char, x) => {
          const color = preset.palette[char]
          if (!color || color === 'transparent') return null
          return (
            <rect
              key={`${y}-${x}`}
              x={x}
              y={y}
              width={1}
              height={1}
              fill={color}
            />
          )
        })
      )}
    </svg>
  )
}

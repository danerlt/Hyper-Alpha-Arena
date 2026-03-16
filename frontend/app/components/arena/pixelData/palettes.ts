// Avatar color presets for Arena View pixel characters
// Presets 1-6: male, 7-12: female
// Each key maps a pixel character code to an actual hex color

export interface AvatarPreset {
  id: number
  gender: 'male' | 'female'
  palette: Record<string, string>
}

// Shared palette keys:
// H = hair, S = skin, E = eye, M = mouth
// C = shirt/top, P = pants, B = shoes/boots
// . = transparent, D = desk, N = monitor, G = screen glow

const SKIN_LIGHT = '#f5d0b0'
const SKIN_MEDIUM = '#d4a574'
const SKIN_TAN = '#c08850'
const SKIN_DARK = '#8d5524'

const SHARED = {
  '.': 'transparent',
  E: '#1a1a2e',  // eyes (dark)
  M: '#c0392b',  // mouth
  O: '#2c2c2c',  // outline/hair shadow
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  // --- Male presets (1-6) ---
  {
    id: 1, gender: 'male',
    palette: { ...SHARED, H: '#2c1810', S: SKIN_LIGHT, C: '#3498db', P: '#2c3e50', B: '#1a1a2e' },
  },
  {
    id: 2, gender: 'male',
    palette: { ...SHARED, H: '#8b4513', S: SKIN_MEDIUM, C: '#e74c3c', P: '#34495e', B: '#2c2c2c' },
  },
  {
    id: 3, gender: 'male',
    palette: { ...SHARED, H: '#1a1a2e', S: SKIN_TAN, C: '#2ecc71', P: '#2c3e50', B: '#1a1a2e' },
  },
  {
    id: 4, gender: 'male',
    palette: { ...SHARED, H: '#d4a017', S: SKIN_LIGHT, C: '#9b59b6', P: '#2c3e50', B: '#2c2c2c' },
  },
  {
    id: 5, gender: 'male',
    palette: { ...SHARED, H: '#c0392b', S: SKIN_MEDIUM, C: '#f39c12', P: '#34495e', B: '#1a1a2e' },
  },
  {
    id: 6, gender: 'male',
    palette: { ...SHARED, H: '#2c3e50', S: SKIN_DARK, C: '#1abc9c', P: '#2c3e50', B: '#2c2c2c' },
  },
  // --- Female presets (7-12) ---
  {
    id: 7, gender: 'female',
    palette: { ...SHARED, H: '#8b4513', S: SKIN_LIGHT, C: '#e91e63', P: '#2c3e50', B: '#6c3483' },
  },
  {
    id: 8, gender: 'female',
    palette: { ...SHARED, H: '#1a1a2e', S: SKIN_MEDIUM, C: '#00bcd4', P: '#34495e', B: '#2c2c2c' },
  },
  {
    id: 9, gender: 'female',
    palette: { ...SHARED, H: '#d4a017', S: SKIN_TAN, C: '#ff5722', P: '#2c3e50', B: '#1a1a2e' },
  },
  {
    id: 10, gender: 'female',
    palette: { ...SHARED, H: '#c0392b', S: SKIN_LIGHT, C: '#673ab7', P: '#34495e', B: '#6c3483' },
  },
  {
    id: 11, gender: 'female',
    palette: { ...SHARED, H: '#2c1810', S: SKIN_DARK, C: '#ffeb3b', P: '#2c3e50', B: '#2c2c2c' },
  },
  {
    id: 12, gender: 'female',
    palette: { ...SHARED, H: '#4a0e0e', S: SKIN_MEDIUM, C: '#4caf50', P: '#2c3e50', B: '#1a1a2e' },
  },
]

export function getPreset(id: number | null | undefined): AvatarPreset {
  if (!id) return AVATAR_PRESETS[0]
  return AVATAR_PRESETS.find(p => p.id === id) || AVATAR_PRESETS[0]
}

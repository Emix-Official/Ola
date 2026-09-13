export type Quaternion = { x: number; y: number; z: number; w: number }
export type Tilt = { x: number; y: number }

// Visual choices, rather than the sensor's sampling settings.
export const TILT_SETTINGS = {
  maxAngle: 7,
  deviceRange: 24,
  deadZone: 1.2,
  smoothingMs: 160,
}

const RADIANS = Math.PI / 180

function multiply(a: Quaternion, b: Quaternion): Quaternion {
  return {
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
  }
}

// Sensors use Z-X-Y rotations. A quaternion avoids jumps at angle wraps.
export function readOrientation(
  alpha: number | null,
  beta: number | null,
  gamma: number | null,
  screenAngle: number,
): Quaternion | null {
  if (
    alpha === null || beta === null || gamma === null ||
    !Number.isFinite(alpha) || !Number.isFinite(beta) ||
    !Number.isFinite(gamma) || !Number.isFinite(screenAngle)
  ) return null

  const a = alpha * RADIANS / 2
  const b = beta * RADIANS / 2
  const g = gamma * RADIANS / 2
  const screen = -screenAngle * RADIANS / 2
  const heading = { x: 0, y: 0, z: Math.sin(a), w: Math.cos(a) }
  const pitch = { x: Math.sin(b), y: 0, z: 0, w: Math.cos(b) }
  const roll = { x: 0, y: Math.sin(g), z: 0, w: Math.cos(g) }
  const display = { x: 0, y: 0, z: Math.sin(screen), w: Math.cos(screen) }
  return multiply(multiply(multiply(heading, pitch), roll), display)
}

function limitAngle(degrees: number) {
  const { deadZone, deviceRange, maxAngle } = TILT_SETTINGS
  const amount = Math.max(0, Math.abs(degrees) - deadZone)
  return Math.sign(degrees) * Math.min(1, amount / (deviceRange - deadZone)) * maxAngle
}

export function relativeTilt(neutral: Quaternion, reading: Quaternion): Tilt {
  const inverse = { x: -neutral.x, y: -neutral.y, z: -neutral.z, w: neutral.w }
  const relative = multiply(inverse, reading)
  // q and -q describe the same orientation. Choose the shorter rotation.
  const sign = relative.w < 0 ? -1 : 1
  const length = Math.hypot(relative.x, relative.y, relative.z)
  if (length < 0.000001) return { x: 0, y: 0 }
  const angle = 2 * Math.atan2(length, Math.abs(relative.w)) / RADIANS
  return {
    x: -limitAngle(relative.x * sign / length * angle),
    y: limitAngle(relative.y * sign / length * angle),
  }
}

export function smoothTilt(current: Tilt, target: Tilt, elapsedMs: number): Tilt {
  const amount = 1 - Math.exp(-Math.max(0, elapsedMs) / TILT_SETTINGS.smoothingMs)
  return {
    x: current.x + (target.x - current.x) * amount,
    y: current.y + (target.y - current.y) * amount,
  }
}

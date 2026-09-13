import { useEffect, useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import { createCoreMotion } from '../lib/coreMotion'
import type { TiltStatus } from '../lib/coreMotion'

export function useCoreMotion() {
  const sceneRef = useRef<HTMLDivElement>(null)
  const controllerRef = useRef<ReturnType<typeof createCoreMotion> | null>(null)
  const [status, setStatus] = useState<TiltStatus>('idle')

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return
    const controller = createCoreMotion(scene, setStatus)
    controllerRef.current = controller
    return () => {
      controller.dispose()
      controllerRef.current = null
    }
  }, [])

  return {
    sceneRef,
    status,
    enableTilt: () => { void controllerRef.current?.enableDeviceTilt() },
    disableTilt: () => controllerRef.current?.disableDeviceTilt(),
    recenter: () => controllerRef.current?.recenter(),
    onPointerMove: (event: PointerEvent<HTMLDivElement>) => {
      controllerRef.current?.pointerMove(event.clientX, event.clientY, event.pointerType)
    },
    onPointerLeave: (event: PointerEvent<HTMLDivElement>) => {
      controllerRef.current?.pointerLeave(event.pointerType)
    },
  }
}

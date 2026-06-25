import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function ParticleField({ count = 2000, color = '#88ccff', speed = 0.2, motion = 'float' }) {
  const pointsRef = useRef()
  const materialRef = useRef()

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 10
      arr[i * 3 + 1] = (Math.random() - 0.5) * 10
      arr[i * 3 + 2] = (Math.random() - 0.5) * 10
    }
    return arr
  }, [count])

  // smoothly track the target color so changes fade in, not snap
  const currentColor = useRef(new THREE.Color(color))
  const targetColor = useMemo(() => {
  const c = new THREE.Color(color)
  c.multiplyScalar(2.5)   // push brightness past 1.0 so bloom catches it regardless of hue
  return c
}, [color])

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime

    // smooth color transition (lerp every frame)
    currentColor.current.lerp(targetColor, delta * 1.5)
    if (materialRef.current) {
      materialRef.current.color.copy(currentColor.current)
    }

    if (!pointsRef.current) return

    switch (motion) {
      case 'jitter':
        pointsRef.current.rotation.y += delta * speed
        pointsRef.current.position.x = Math.sin(t * 20) * 0.03
        pointsRef.current.position.y = Math.cos(t * 25) * 0.03
        break
      case 'swirl':
        pointsRef.current.rotation.y += delta * speed
        pointsRef.current.rotation.x = Math.sin(t * 0.3) * 0.2
        break
      case 'drift':
        pointsRef.current.rotation.y += delta * speed * 0.3
        pointsRef.current.position.y = Math.sin(t * 0.2) * 0.3 - 0.1
        break
      case 'float':
      default:
        pointsRef.current.rotation.y += delta * speed
        pointsRef.current.position.y = Math.sin(t * 0.5) * 0.15
        break
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial 
        ref={materialRef} 
        color={color} 
        size={0.05} 
        sizeAttenuation 
        toneMapped={false}
        />
    </points>
  )
}
import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, RoundedBox, Text3D, Center } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import type * as THREE from 'three';

const GOLD = '#B08D57';
const NAVY = '#0B1220';

function GlowCube() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.28;
    }
  });

  return (
    <Float speed={1.3} rotationIntensity={0.25} floatIntensity={0.7}>
      <group ref={groupRef}>
        <RoundedBox args={[2.4, 2.4, 0.75]} radius={0.14} smoothness={4}>
          <meshStandardMaterial color={NAVY} metalness={0.75} roughness={0.28} />
        </RoundedBox>

        {/* Front face: glowing ring + etched mark */}
        <mesh position={[0, 0, 0.376]} rotation={[0, 0, 0]}>
          <ringGeometry args={[0.92, 0.98, 4, 1, Math.PI / 4]} />
          <meshBasicMaterial color={GOLD} toneMapped={false} />
        </mesh>
        <Suspense fallback={null}>
          <Center position={[0, 0, 0.39]}>
            <Text3D
              font="https://unpkg.com/three@0.160.0/examples/fonts/helvetiker_bold.typeface.json"
              size={0.62}
              height={0.05}
              curveSegments={8}
              bevelEnabled
              bevelThickness={0.01}
              bevelSize={0.01}
            >
              AI
              <meshBasicMaterial color={GOLD} toneMapped={false} />
            </Text3D>
          </Center>
        </Suspense>

        {/* Back face: mirrored ring + mark, so it isn't blank when rotated into view */}
        <group rotation={[0, Math.PI, 0]}>
          <mesh position={[0, 0, 0.376]}>
            <ringGeometry args={[0.92, 0.98, 4, 1, Math.PI / 4]} />
            <meshBasicMaterial color={GOLD} toneMapped={false} />
          </mesh>
          <Suspense fallback={null}>
            <Center position={[0, 0, 0.39]}>
              <Text3D
                font="https://unpkg.com/three@0.160.0/examples/fonts/helvetiker_bold.typeface.json"
                size={0.5}
                height={0.05}
                curveSegments={8}
                bevelEnabled
                bevelThickness={0.01}
                bevelSize={0.01}
              >
                LL
                <meshBasicMaterial color={GOLD} toneMapped={false} />
              </Text3D>
            </Center>
          </Suspense>
        </group>

        {/* Emissive edge glow strip around the sides */}
        {[0, 1, 2, 3].map((i) => (
          <mesh
            key={i}
            position={[
              i === 0 ? 1.2 : i === 2 ? -1.2 : 0,
              i === 1 ? 1.2 : i === 3 ? -1.2 : 0,
              0,
            ]}
            rotation={[0, 0, (Math.PI / 2) * i]}
          >
            <boxGeometry args={[0.02, 2.35, 0.76]} />
            <meshBasicMaterial color={GOLD} toneMapped={false} transparent opacity={0.55} />
          </mesh>
        ))}
      </group>
    </Float>
  );
}

export default function Hero3D() {
  return (
    <Canvas
      camera={{ position: [3.2, 1.6, 4.2], fov: 38 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.35} />
      <pointLight position={[4, 4, 4]} intensity={90} color={GOLD} />
      <pointLight position={[-4, -3, -3]} intensity={40} color="#2952CC" />
      <directionalLight position={[0, 5, 2]} intensity={0.4} />

      <GlowCube />

      <EffectComposer>
        <Bloom intensity={1.1} luminanceThreshold={0.2} luminanceSmoothing={0.9} mipmapBlur radius={0.8} />
      </EffectComposer>
    </Canvas>
  );
}

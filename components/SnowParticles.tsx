import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export const SnowParticles: React.FC<{ count?: number }> = ({ count = 2000 }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tempObject = useMemo(() => new THREE.Object3D(), []);

  // Generate random initial data for snow
  const particles = useMemo(() => {
    const data = [];
    for (let i = 0; i < count; i++) {
      data.push({
        x: (Math.random() - 0.5) * 120,
        y: (Math.random() - 0.5) * 80 + 20,
        z: (Math.random() - 0.5) * 120 - 20,
        speed: 0.5 + Math.random() * 2,
        scale: 0.05 + Math.random() * 0.12,
        swaySpeed: 0.2 + Math.random() * 0.8,
        swayOffset: Math.random() * Math.PI * 2
      });
    }
    return data;
  }, [count]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;

    particles.forEach((p, i) => {
      // Fall down
      p.y -= p.speed * delta;
      
      // Reset if too low
      if (p.y < -30) {
        p.y = 50;
        p.x = (Math.random() - 0.5) * 120;
        p.z = (Math.random() - 0.5) * 120 - 20;
      }

      // Sway motion
      const swayX = Math.sin(time * p.swaySpeed + p.swayOffset) * 1.5;
      const swayZ = Math.cos(time * p.swaySpeed + p.swayOffset) * 1.5;

      tempObject.position.set(p.x + swayX, p.y, p.z + swayZ);
      tempObject.scale.setScalar(p.scale);
      tempObject.updateMatrix();
      
      meshRef.current!.setMatrixAt(i, tempObject.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <dodecahedronGeometry args={[0.3, 0]} />
      <meshStandardMaterial 
        color="#ffffff" 
        emissive="#ffffff" 
        emissiveIntensity={0.8}
        roughness={0.4} 
        metalness={0.1}
        transparent
        opacity={0.8}
      />
    </instancedMesh>
  );
};

import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { COLORS, TREE_CONFIG } from '../constants';

export const TreeStar: React.FC<{ isExploded: boolean }> = ({ isExploded }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  const treePos = useMemo(() => new THREE.Vector3(0, TREE_CONFIG.HEIGHT / 2 + 0.5, 0), []);
  const explodedPos = useMemo(() => new THREE.Vector3(0, 30, 0), []);
  const currentPos = useRef(treePos.clone());

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // Rotate star
    groupRef.current.rotation.y += delta;
    groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 2) * 0.2;

    // Move between tree top and exploded position
    const target = isExploded ? explodedPos : treePos;
    currentPos.current.lerp(target, 0.1);
    groupRef.current.position.copy(currentPos.current);
  });

  return (
    <group ref={groupRef}>
      {/* Inner bright core */}
      <mesh>
        <icosahedronGeometry args={[0.3, 1]} />
        <meshStandardMaterial 
          color={COLORS.STAR} 
          emissive={COLORS.STAR_EMISSIVE} 
          emissiveIntensity={4}
          toneMapped={false}
        />
      </mesh>
      
      {/* Outer halo */}
      <mesh>
        <icosahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial 
          color={COLORS.STAR_EMISSIVE}
          wireframe
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      <pointLight color={COLORS.STAR_EMISSIVE} intensity={3} distance={8} decay={2} />
    </group>
  );
};

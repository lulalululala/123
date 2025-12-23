import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { COLORS } from '../constants';

export const LogoParticles: React.FC<{ isExploded: boolean }> = ({ isExploded }) => {
  const pointsRef = useRef<THREE.Points>(null);
  
  const palette = useMemo(() => [COLORS.RIBBON, COLORS.STAR, ...COLORS.GRADIENT_STOPS], []);

  const { positions, colors } = useMemo(() => {
    const canvas = document.createElement('canvas');
    const width = 1024;
    const height = 256;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return { positions: new Float32Array(0), colors: new Float32Array(0) };

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);
    
    // Text drawing
    ctx.font = '900 100px "Microsoft YaHei", "SimHei", "Inter", sans-serif';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText("MERRY CHRISTMAS", width / 2, height / 2);

    const imgData = ctx.getImageData(0, 0, width, height).data;
    const pos = [];
    const col = [];
    const step = 4; // Skip pixels for performance and aesthetic

    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const index = (y * width + x) * 4;
        if (imgData[index] > 100) { // If pixel is bright enough
          // Map to 3D space
          const px = (x - width / 2) * 0.04;
          const py = -(y - height / 2) * 0.04;
          const pz = (Math.random() - 0.5) * 0.2;
          
          pos.push(px, py, pz);

          // Assign random color from palette
          const c = palette[Math.floor(Math.random() * palette.length)];
          col.push(c.r, c.g, c.b);
        }
      }
    }

    return {
      positions: new Float32Array(pos),
      colors: new Float32Array(col)
    };
  }, [palette]);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    
    const mat = pointsRef.current.material as THREE.PointsMaterial;
    
    // Fade in/out based on exploded state
    // If exploded (tree gone), show logo. If not exploded (tree here), hide logo
    const targetOpacity = isExploded ? 0 : 1; 
    // Wait, logical reversal in original code? 
    // Original code: `targetOpacity = isExploded ? 0 : 1`. This means show when tree is formed.
    // Actually, usually you hide the text when the tree is there to avoid clutter, or show it.
    // Let's stick to the reversed logic if that's what the original did, or adjust for UX.
    // Original: `const targetOpacity = n ? 0 : 1;` where n is isExploded. 
    // If isExploded is true, opacity is 0. So text hides when tree explodes.
    // Text shows when tree is formed.
    
    mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, delta * 2);

    // Gentle float
    pointsRef.current.position.y = 10 + Math.sin(state.clock.elapsedTime * 0.5) * 0.5;
    pointsRef.current.rotation.y = -0.2 + Math.sin(state.clock.elapsedTime * 0.2) * 0.05;
  });

  return (
    <group position={[15, 5, -20]}> 
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={positions.length / 3}
            array={positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={colors.length / 3}
            array={colors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.12}
          vertexColors
          transparent
          opacity={0}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
};

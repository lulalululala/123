import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  Environment, 
  Stats, 
  PerspectiveCamera 
} from '@react-three/drei';
import { 
  EffectComposer, 
  Bloom, 
  Noise, 
  Vignette 
} from '@react-three/postprocessing';
import { ACESFilmicToneMapping } from 'three';

import { TreeParticles } from './components/TreeParticles';
import { TreeStar } from './components/TreeStar';
import { SnowParticles } from './components/SnowParticles';
import { LogoParticles } from './components/LogoParticles';
import { GestureController } from './components/GestureController';
import { IntroShockwave } from './components/IntroShockwave';
import { generateTreeData } from './utils/treeData';
import { COLORS, TREE_CONFIG } from './constants';
import { ParticleType } from './types';

// Materials (Shared)
const particleGeometryTiny = new THREE.TetrahedronGeometry(0.5, 0);
const particleGeometryStar = new THREE.OctahedronGeometry(0.5, 0);
const particleGeometryCube = new THREE.BoxGeometry(0.1, 0.1, 0.1);
const particleGeometryOrb = new THREE.DodecahedronGeometry(0.5, 0);

const particleMaterial = new THREE.MeshStandardMaterial({
  color: '#ffffff',
  roughness: 0.9,
  metalness: 0.0,
  emissive: '#ffffff',
  emissiveIntensity: 0.8,
  flatShading: true,
});

const ribbonMaterial = new THREE.MeshStandardMaterial({
  color: '#ffffff',
  emissive: '#ffffff',
  emissiveIntensity: 4,
  toneMapped: false,
  transparent: true,
  opacity: 0.9,
});

const nebulaMaterial = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 1,
    metalness: 0,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    emissive: '#ffffff',
    emissiveIntensity: 1
});

// Scene Component
const SceneContent = ({ isExploded, onExplodeChange, onRotationImpulse, showUI, introShockwaveRef }: any) => {
  const groupRef = useRef<THREE.Group>(null);
  const [shockwaveY, setShockwaveY] = useState(-1000);
  const prevExploded = useRef(isExploded);
  const rotationVelocity = useRef(0);
  const ROTATION_DAMPING = 0.95;
  const IMPULSE_SENSITIVITY = 0.005;

  // Generate Tree Data Once
  const treeData = useMemo(() => generateTreeData(), []);

  // Handle Explosion State Change
  useEffect(() => {
    // If we just crystallized (exploded -> form), trigger a manual shockwave from top
    if (prevExploded.current === true && isExploded === false) {
       setShockwaveY(TREE_CONFIG.HEIGHT / 2 + 5);
    }
    prevExploded.current = isExploded;
  }, [isExploded]);

  useFrame((state, delta) => {
    if (groupRef.current) {
        // Apply rotation impulse from gestures
        rotationVelocity.current += onRotationImpulse.current * IMPULSE_SENSITIVITY;
        onRotationImpulse.current = 0; // Reset impulse
        
        rotationVelocity.current *= ROTATION_DAMPING; // Decay
        if (Math.abs(rotationVelocity.current) < 0.0001) rotationVelocity.current = 0;
        
        // Auto rotate slightly if formed, otherwise spin with impulse
        if (!isExploded && Math.abs(rotationVelocity.current) < 0.001) {
            groupRef.current.rotation.y += delta * 0.1; 
        } else {
            groupRef.current.rotation.y += rotationVelocity.current;
        }
    }

    // Animate manual shockwave down
    if (shockwaveY > -TREE_CONFIG.HEIGHT / 2 - 10) {
      setShockwaveY(prev => prev - delta * 19);
    } else if (shockwaveY > -500 && shockwaveY < -20) {
        setShockwaveY(-1000);
    }
  });

  return (
    <group ref={groupRef} position={[0, -2, 0]}>
      <TreeParticles
        data={treeData.leavesFine}
        type={ParticleType.LEAF_TINY}
        geometry={particleGeometryTiny}
        material={particleMaterial}
        isExploded={isExploded}
        shockwaveY={shockwaveY}
        introShockwaveRef={introShockwaveRef}
      />
      <TreeParticles
        data={treeData.leavesCrystals}
        type={ParticleType.LEAF_STAR}
        geometry={particleGeometryStar}
        material={particleMaterial}
        isExploded={isExploded}
        shockwaveY={shockwaveY}
        introShockwaveRef={introShockwaveRef}
      />
      <TreeParticles
        data={treeData.ribbon}
        type={ParticleType.RIBBON}
        geometry={particleGeometryCube}
        material={ribbonMaterial}
        isExploded={isExploded}
        shockwaveY={shockwaveY}
        introShockwaveRef={introShockwaveRef}
      />
      <TreeParticles
        data={treeData.nebula}
        type={ParticleType.NEBULA}
        geometry={particleGeometryOrb}
        material={nebulaMaterial}
        isExploded={isExploded}
        shockwaveY={-1000} // Nebula doesn't get shocked
        introShockwaveRef={introShockwaveRef}
      />
      
      <SnowParticles count={2500} />
      <TreeStar isExploded={isExploded} />
    </group>
  );
};

// Intro Wrapper
const IntroController = ({ isActive, setIsActive, introShockwaveRef }: any) => {
    const [startTime, setStartTime] = useState<number | null>(null);
    const { clock } = useThree();
    
    useFrame(() => {
        if (isActive && startTime === null) {
            setStartTime(clock.elapsedTime);
        }
        if (!isActive && startTime !== null) {
            setStartTime(null);
        }
    });

    return (isActive && startTime !== null) ? (
        <IntroShockwave 
            isActive={isActive} 
            onFinish={() => setIsActive(false)} 
            startTime={startTime}
            introShockwaveRef={introShockwaveRef}
        />
    ) : null;
};

export default function App() {
  const [isExploded, setIsExploded] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [introActive, setIntroActive] = useState(true);
  const introShockwaveRef = useRef(-1000);
  
  // Gesture velocity ref to avoid re-renders on every frame update from gesture
  const gestureVelocityRef = useRef(0);
  const onRotationImpulse = useCallback((velocity: number) => {
      gestureVelocityRef.current = velocity;
  }, []);

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F7') {
        setShowUI(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const replayIntro = () => {
    setIntroActive(true);
  };

  return (
    <>
      <div className="absolute top-0 left-0 w-full h-full bg-[#020205]">
        <Canvas
          camera={{ position: [0, 55, 0.1], fov: 35 }}
          gl={{ toneMapping: ACESFilmicToneMapping }}
          dpr={[1, 2]}
          shadows
        >
          <color attach="background" args={[COLORS.BACKGROUND]} />
          
          <IntroController 
             isActive={introActive} 
             setIsActive={setIntroActive} 
             introShockwaveRef={introShockwaveRef} 
          />

          <Suspense fallback={null}>
            {/* Environment */}
            <LogoParticles isExploded={isExploded} />
            <Environment files="https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/potsdamer_platz_1k.hdr" />
            
            {/* Lights */}
            <ambientLight intensity={0.05} />
            
            <pointLight position={[0, 25, 0]} intensity={8} color="#F8D6E5" distance={60} decay={2} castShadow />
            <pointLight position={[20, 10, 20]} intensity={4} color="#99BCEC" distance={40} decay={2} />
            <pointLight position={[-20, -10, -20]} intensity={4} color="#034C8C" distance={40} decay={2} />
            <pointLight position={[0, -20, 10]} intensity={5} color="#012340" distance={40} decay={2} />

            <SceneContent 
              isExploded={isExploded} 
              onExplodeChange={setIsExploded}
              onRotationImpulse={gestureVelocityRef}
              showUI={showUI}
              introShockwaveRef={introShockwaveRef}
            />

            {/* Post Processing */}
            <EffectComposer enableNormalPass={false} resolutionScale={0.75}>
               <Bloom luminanceThreshold={0.2} intensity={2.5} radius={0.8} levels={9} mipmapBlur />
               <Noise opacity={0.05} />
               <Vignette eskil={false} offset={0.1} darkness={1.2} />
            </EffectComposer>

            {/* Controls (Disabled during intro) */}
            <OrbitControls 
                enabled={!introActive}
                enablePan={false}
                enableRotate={true}
                enableDamping={true}
                dampingFactor={0.05}
                enableZoom={true}
                maxPolarAngle={Math.PI / 1.6}
                minPolarAngle={0}
                minDistance={10}
                maxDistance={120}
                target={[0, 0, 0]}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* UI Overlay */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${showUI ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute bottom-12 left-0 w-full flex justify-center gap-4 z-10">
          <button
            onClick={() => setIsExploded(!isExploded)}
            className={`
              pointer-events-auto
              px-12 py-5 rounded-none
              text-white font-black tracking-[0.3em] uppercase text-xs
              transition-all duration-700 transform hover:scale-110
              backdrop-blur-xl border border-white/10
              shadow-[0_0_50px_rgba(28,35,89,0.4)]
              ${isExploded 
                ? 'bg-gradient-to-r from-purple-950/80 to-black hover:border-purple-500' 
                : 'bg-gradient-to-r from-blue-950/80 to-black hover:border-blue-400'
              }
            `}
            style={{ clipPath: 'polygon(15% 0, 100% 0, 85% 100%, 0% 100%)' }}
          >
            {isExploded ? "重聚晶体" : "消解形态"}
          </button>

          <button
            onClick={replayIntro}
            className={`
              pointer-events-auto
              px-6 py-5 rounded-none
              text-white font-black tracking-[0.1em] uppercase text-xs
              transition-all duration-500 transform hover:scale-105
              backdrop-blur-xl border border-white/10
              bg-black/40 hover:bg-white/10
            `}
            style={{ clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0% 100%)' }}
          >
            重播开场
          </button>
        </div>

        <div className="absolute top-4 right-4 text-white/30 text-[10px] font-mono">
          [F7] 切换界面
        </div>
      </div>

      {/* Gesture Controller (Webcam) */}
      <GestureController 
        isExploded={isExploded}
        onExplodeChange={setIsExploded}
        onRotationImpulse={onRotationImpulse}
        visible={showUI}
      />
    </>
  );
}
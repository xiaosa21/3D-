
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, ThreeElements } from '@react-three/fiber';
import { OrbitControls, Environment, Stars } from '@react-three/drei';
import * as THREE from 'this-is-not-real-but-fixed-below';
import * as THREE_LIB from 'three';

const THREE = THREE_LIB;

// Fix for JSX intrinsic elements errors in React Three Fiber
declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      mesh: any;
      boxGeometry: any;
      planeGeometry: any;
      cylinderGeometry: any;
      meshBasicMaterial: any;
      lineSegments: any;
      edgesGeometry: any;
      lineBasicMaterial: any;
      gridHelper: any;
      color: any;
    }
  }
}

interface ThreeSceneProps {
  params: CameraParams;
  setParams: (params: CameraParams) => void;
  imageUrl: string | null;
  isLocked: boolean;
  theme: 'light' | 'dark';
}

const HolographicGrid: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const color = isDark ? "#1c212b" : "#e2e8f0";
  const accent = isDark ? "#6366f1" : "#94a3b8";
  
  return (
    <group>
      <gridHelper args={[40, 40, accent, color]} position={[0, 0, 0]} />
      {/* 中心光晕面 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshBasicMaterial color={accent} transparent opacity={isDark ? 0.03 : 0.05} />
      </mesh>
    </group>
  );
};

const SubjectFrame: React.FC<{ imageUrl: string | null; isDark: boolean }> = ({ imageUrl, isDark }) => {
  const texture = useMemo(() => imageUrl ? new THREE.TextureLoader().load(imageUrl) : null, [imageUrl]);
  return (
    <group position={[0, 1.8, 0]}>
      <mesh>
        <planeGeometry args={[2.5, 3.5]} />
        {texture ? (
          <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} />
        ) : (
          <meshBasicMaterial color={isDark ? "#0b0e14" : "#f1f5f9"} />
        )}
      </mesh>
      {/* 科技边框 */}
      <lineSegments>
        <edgesGeometry args={[new THREE.PlaneGeometry(2.55, 3.55)]} />
        <lineBasicMaterial color={isDark ? "#6366f1" : "#4f46e5"} opacity={0.5} transparent />
      </lineSegments>
    </group>
  );
};

const ProCameraModel: React.FC<{ params: CameraParams; isDark: boolean }> = ({ params, isDark }) => {
  const groupRef = useRef<THREE_LIB.Group>(null);
  const { horizontalAngle, verticalAngle, distance } = params;

  useFrame(() => {
    if (groupRef.current) {
      const hRad = THREE.MathUtils.degToRad(horizontalAngle);
      const vRad = THREE.MathUtils.degToRad(verticalAngle);
      const x = distance * Math.cos(vRad) * Math.sin(hRad);
      const y = distance * Math.sin(vRad) + 1.8;
      const z = distance * Math.cos(vRad) * Math.cos(hRad);
      groupRef.current.position.set(x, y, z);
      groupRef.current.lookAt(0, 1.8, 0);
    }
  });

  const frustumScale = useMemo(() => 0.4 + (1 / distance) * 2.5, [distance]);

  return (
    <group ref={groupRef}>
      {/* 机身机芯 */}
      <mesh><boxGeometry args={[0.3, 0.2, 0.2]} /><meshBasicMaterial color={isDark ? "#111" : "#444"} /></mesh>
      <mesh position={[0, 0, -0.1]}><cylinderGeometry args={[0.08, 0.08, 0.1, 12]} rotation={[Math.PI / 2, 0, 0]}/><meshBasicMaterial color="#000" /></mesh>
      
      {/* 科技感线框视锥 */}
      <group position={[0, 0, -0.2]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.4 * frustumScale]}>
          <cylinderGeometry args={[0.8 * frustumScale, 0.02, 0.8 * frustumScale, 4, 1, true]} />
          <meshBasicMaterial color="#6366f1" wireframe transparent opacity={0.6} />
        </mesh>
        {/* 指向中心的光束线 */}
        <mesh position={[0, 0, -distance / 2]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.002, distance]} />
          <meshBasicMaterial color="#6366f1" transparent opacity={0.3} />
        </mesh>
      </group>
    </group>
  );
};

import { CameraParams } from '../types';

export const ThreeScene: React.FC<ThreeSceneProps> = ({ params, setParams, imageUrl, isLocked, theme }) => {
  const isDark = theme === 'dark';
  
  return (
    <div className="w-full h-full relative">
      <Canvas camera={{ fov: 35, position: [15, 10, 15] }}>
        <color attach="background" args={[isDark ? '#02040a' : '#f8fafc']} />
        {isDark && <Stars radius={50} depth={50} count={1500} factor={4} fade speed={1} />}
        <Environment preset={isDark ? "night" : "studio"} />
        
        <HolographicGrid isDark={isDark} />
        <SubjectFrame imageUrl={imageUrl} isDark={isDark} />
        <ProCameraModel params={params} isDark={isDark} />
        
        <OrbitControls 
          target={[0, 1.8, 0]} 
          makeDefault 
          enablePan={false} 
          enabled={!isLocked} 
          maxDistance={25} 
          minDistance={4} 
        />
      </Canvas>

      {/* 3D 浮层标签 */}
      <div className="absolute top-6 left-8 flex gap-3 pointer-events-none">
        <div className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 border shadow-lg ${isDark ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-600'}`}>
          <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" /> 机位 (CAM)
        </div>
        <div className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 border shadow-lg ${isDark ? 'bg-white/5 border-white/10 text-white/30' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
          方位 (AZIMUTH)
        </div>
      </div>

      {/* 实时参数 HUD */}
      <div className={`absolute bottom-6 right-8 px-4 py-1.5 rounded-xl font-mono text-[10px] font-bold border backdrop-blur-md shadow-2xl transition-colors ${isDark ? 'bg-black/60 text-indigo-400/80 border-white/5' : 'bg-white/80 text-slate-500 border-slate-200'}`}>
        {params.horizontalAngle}° H / {params.verticalAngle}° V
      </div>
    </div>
  );
};

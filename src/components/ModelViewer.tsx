"use client";

import React, { Suspense, Component, ReactNode, useState, useEffect, useMemo } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage, Environment, useGLTF } from "@react-three/drei";

interface ModelViewerProps {
  url: string;
}

type EnvPreset = "studio" | "city" | "sunset" | "dawn" | "warehouse";

interface ErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class CanvasErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

/**
 * 3D Model with PBR material calibration and SRGB color space enforcement
 */
function Model({
  url,
  wireframe,
  roughnessFactor,
}: {
  url: string;
  wireframe: boolean;
  roughnessFactor: number;
}) {
  const { scene } = useGLTF(url);

  // Calibrate meshes and textures for accurate colors & PBR response
  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        if (mesh.material) {
          const materials = Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material];

          materials.forEach((rawMat) => {
            if (rawMat instanceof THREE.MeshStandardMaterial) {
              // Ensure diffuse texture maps are decoded in sRGB space for vibrant, true-to-life colors
              if (rawMat.map) {
                rawMat.map.colorSpace = THREE.SRGBColorSpace;
                rawMat.map.needsUpdate = true;
              }
              // Normal map adjustments
              if (rawMat.normalMap) {
                rawMat.normalScale.set(1, 1);
              }
              // PBR material responsiveness
              rawMat.roughness = Math.min(Math.max(rawMat.roughness * roughnessFactor, 0.15), 0.95);
              rawMat.metalness = rawMat.metalness !== undefined ? rawMat.metalness : 0.05;
              rawMat.wireframe = wireframe;
              rawMat.needsUpdate = true;
            }
          });
        }
      }
    });
  }, [scene, wireframe, roughnessFactor]);

  return <primitive object={scene} />;
}

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#8b5cf6" wireframe />
    </mesh>
  );
}

export default function ModelViewer({ url }: ModelViewerProps) {
  const [envPreset, setEnvPreset] = useState<EnvPreset>("studio");
  const [wireframe, setWireframe] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [lightIntensity, setLightIntensity] = useState(1.0);
  const [bgColor, setBgColor] = useState<"dark" | "black" | "slate" | "bright">("dark");

  const bgStyles = {
    dark: "bg-[#0c0d14]",
    black: "bg-black",
    slate: "bg-[#181926]",
    bright: "bg-gray-200",
  };

  return (
    <div className="space-y-3">
      {/* ─── Top Control Toolbar ─── */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-gray-900/80 border border-gray-800 rounded-xl text-xs">
        {/* Environment Presets */}
        <div className="flex items-center gap-1.5">
          <span className="text-gray-400 font-medium">Lighting:</span>
          {(["studio", "city", "sunset", "dawn"] as EnvPreset[]).map((preset) => (
            <button
              key={preset}
              onClick={() => setEnvPreset(preset)}
              className={`px-2.5 py-1 rounded-lg capitalize font-medium transition-all ${
                envPreset === preset
                  ? "bg-violet-600 text-white shadow-sm shadow-violet-500/20"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
              }`}
            >
              {preset}
            </button>
          ))}
        </div>

        {/* View toggles */}
        <div className="flex items-center gap-2">
          {/* Exposure/Light */}
          <div className="flex items-center gap-1 text-gray-400">
            <span>☀️</span>
            <input
              type="range"
              min="0.4"
              max="2.0"
              step="0.1"
              value={lightIntensity}
              onChange={(e) => setLightIntensity(parseFloat(e.target.value))}
              className="w-16 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
              title="Light Intensity"
            />
          </div>

          {/* Auto Rotate Toggle */}
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              autoRotate
                ? "bg-violet-950/60 text-violet-300 border border-violet-700/50"
                : "text-gray-400 hover:bg-gray-800"
            }`}
          >
            {autoRotate ? "⏸ Spin" : "▶ Spin"}
          </button>

          {/* Wireframe Toggle */}
          <button
            onClick={() => setWireframe(!wireframe)}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              wireframe
                ? "bg-violet-950/60 text-violet-300 border border-violet-700/50"
                : "text-gray-400 hover:bg-gray-800"
            }`}
          >
            {wireframe ? "Solid" : "Wireframe"}
          </button>

          {/* Backdrop color */}
          <div className="flex items-center gap-1 pl-1 border-l border-gray-800">
            {(
              [
                { id: "dark", label: "#0c0d14", dot: "bg-gray-900 border-gray-700" },
                { id: "black", label: "#000", dot: "bg-black border-gray-800" },
                { id: "slate", label: "#1e293b", dot: "bg-slate-800 border-slate-600" },
                { id: "bright", label: "#fff", dot: "bg-gray-200 border-gray-300" },
              ] as const
            ).map((b) => (
              <button
                key={b.id}
                onClick={() => setBgColor(b.id)}
                className={`w-4 h-4 rounded-full border ${b.dot} transition-transform ${
                  bgColor === b.id ? "scale-125 ring-2 ring-violet-500" : "opacity-60 hover:opacity-100"
                }`}
                title={`Backdrop: ${b.id}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ─── 3D Canvas Box ─── */}
      <div
        className={`w-full aspect-[4/3] rounded-2xl overflow-hidden border border-gray-800/80 shadow-2xl relative transition-colors duration-300 ${bgStyles[bgColor]}`}
      >
        <CanvasErrorBoundary
          fallback={
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-gray-900 text-gray-300">
              <span className="text-3xl mb-2">⚠️</span>
              <p className="font-semibold">Failed to render 3D model in canvas.</p>
              <p className="text-xs text-gray-500 mt-1 max-w-sm">
                The generated file can still be downloaded using the .GLB or .VRM buttons and opened in Blender or Windows 3D Viewer.
              </p>
            </div>
          }
        >
          <Canvas
            camera={{ position: [0, 0, 3.8], fov: 45 }}
            gl={{
              antialias: true,
              alpha: true,
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: lightIntensity,
              outputColorSpace: THREE.SRGBColorSpace,
            }}
            dpr={[1, 2]}
            shadows
          >
            {/* Ambient base lighting */}
            <ambientLight intensity={0.5 * lightIntensity} />

            {/* Key light casting crisp, soft shadows */}
            <directionalLight
              position={[5, 8, 5]}
              intensity={1.2 * lightIntensity}
              castShadow
              shadow-mapSize-width={1024}
              shadow-mapSize-height={1024}
            />

            {/* Fill light to illuminate backside & enhance color depth */}
            <directionalLight
              position={[-5, 4, -5]}
              intensity={0.6 * lightIntensity}
              color="#e2e8f0"
            />

            {/* Rim light for edge silhouette definition */}
            <directionalLight
              position={[0, -4, 4]}
              intensity={0.3 * lightIntensity}
              color="#a78bfa"
            />

            {/* Studio Environment HDR reflection map */}
            <Environment preset={envPreset} background={false} />

            {/* Stage automatically centers, scales, and drops subtle shadow */}
            <Suspense fallback={<LoadingFallback />}>
              <Stage
                intensity={0.4 * lightIntensity}
                environment={null}
                adjustCamera={1.3}
                shadows="contact"
              >
                <Model
                  url={url}
                  wireframe={wireframe}
                  roughnessFactor={1.0}
                />
              </Stage>
            </Suspense>

            {/* Interactive OrbitControls */}
            <OrbitControls
              makeDefault
              autoRotate={autoRotate}
              autoRotateSpeed={1.5}
              enablePan={true}
              enableZoom={true}
              enableDamping={true}
              dampingFactor={0.05}
              minDistance={0.5}
              maxDistance={25}
            />
          </Canvas>
        </CanvasErrorBoundary>
      </div>
    </div>
  );
}

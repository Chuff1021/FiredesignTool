"use client";

import { Line, OrthographicCamera, PerspectiveCamera, RoundedBox } from "@react-three/drei";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import {
  ACESFilmicToneMapping,
  CanvasTexture,
  Color,
  LinearFilter,
  LinearMipmapLinearFilter,
  MirroredRepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
  type Group,
  type Mesh,
  type OrthographicCamera as ThreeOrthographicCamera,
  type PerspectiveCamera as ThreePerspectiveCamera,
  type Texture,
  type WebGLRenderer,
} from "three";
import { fireplaceProduct, mantelProduct } from "@/domain/catalog";
import {
  calculateOrthographicZoom,
  getMantelBottom,
  getMantelCenter,
  inchesLabel,
} from "@/domain/configuration";
import { useConfigurationStore } from "@/store/configurationStore";

type FeatureWallCanvasProps = {
  onFps: (fps: number) => void;
  onRendererStatus: (status: "ready" | "recovering" | "error") => void;
};

function usePreparedTextures() {
  const [stoneSource, stoneBumpSource, fireSource, pearlSource, pearlBumpSource] = useLoader(
    TextureLoader,
    [
      "/assets/centurion-kentucky-ledge.webp",
      "/assets/centurion-kentucky-ledge-bump.webp",
      "/assets/fpx-864-trv-31k-clean-face.png",
      "/assets/pearl-ncl-60-pearl.webp",
      "/assets/pearl-ncl-60-pearl-bump.webp",
    ],
  ) as [Texture, Texture, Texture, Texture, Texture];
  const maxAnisotropy = useThree((state) => state.gl.capabilities.getMaxAnisotropy());

  return useMemo(() => {
    const stone = stoneSource.clone();
    const stoneBump = stoneBumpSource.clone();
    const fire = fireSource.clone();
    const pearl = pearlSource.clone();
    const pearlBump = pearlBumpSource.clone();

    stone.colorSpace = SRGBColorSpace;
    stone.repeat.set(1, 1);
    stone.anisotropy = maxAnisotropy;
    stone.minFilter = LinearMipmapLinearFilter;
    stone.magFilter = LinearFilter;

    stoneBump.repeat.copy(stone.repeat);
    stoneBump.anisotropy = maxAnisotropy;

    fire.colorSpace = SRGBColorSpace;
    fire.anisotropy = maxAnisotropy;
    fire.minFilter = LinearMipmapLinearFilter;

    pearl.colorSpace = SRGBColorSpace;
    pearl.wrapS = pearl.wrapT = MirroredRepeatWrapping;
    pearl.repeat.set(1.8, 1);
    pearl.anisotropy = maxAnisotropy;

    pearlBump.wrapS = pearlBump.wrapT = MirroredRepeatWrapping;
    pearlBump.repeat.copy(pearl.repeat);
    pearlBump.anisotropy = maxAnisotropy;

    for (const texture of [stone, stoneBump, fire, pearl, pearlBump]) {
      texture.needsUpdate = true;
    }

    return { fire, pearl, pearlBump, stone, stoneBump };
  }, [fireSource, maxAnisotropy, pearlBumpSource, pearlSource, stoneBumpSource, stoneSource]);
}

function makeShadowTexture(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 96;
  const context = canvas.getContext("2d");
  if (context) {
    const gradient = context.createRadialGradient(128, 48, 4, 128, 48, 118);
    gradient.addColorStop(0, "rgba(18,14,11,.34)");
    gradient.addColorStop(0.55, "rgba(18,14,11,.12)");
    gradient.addColorStop(1, "rgba(18,14,11,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 256, 96);
  }
  return new CanvasTexture(canvas);
}

function CameraRig() {
  const mode = useConfigurationStore((state) => state.cameraMode);
  const wallWidth = useConfigurationStore((state) => state.wallWidth);
  const wallHeight = useConfigurationStore((state) => state.wallHeight);
  const { size } = useThree();
  const frontRef = useRef<ThreeOrthographicCamera>(null);
  const perspectiveRef = useRef<ThreePerspectiveCamera>(null);

  useEffect(() => {
    if (!frontRef.current) return;
    const padding = size.width < 900 ? 12 : 22;
    frontRef.current.zoom = calculateOrthographicZoom(
      size.width,
      size.height,
      wallWidth,
      wallHeight,
      padding,
    );
    frontRef.current.position.set(0, wallHeight / 2, 220);
    frontRef.current.lookAt(0, wallHeight / 2, 0);
    frontRef.current.updateProjectionMatrix();
  }, [size.height, size.width, wallHeight, wallWidth]);

  useEffect(() => {
    if (!perspectiveRef.current) return;
    perspectiveRef.current.position.set(wallWidth * 0.58, wallHeight * 0.58, wallWidth * 1.55);
    perspectiveRef.current.lookAt(0, wallHeight * 0.46, 0);
    perspectiveRef.current.updateProjectionMatrix();
  }, [wallHeight, wallWidth]);

  return (
    <>
      <OrthographicCamera far={1000} makeDefault={mode === "front"} near={0.1} ref={frontRef} />
      <PerspectiveCamera
        far={1200}
        fov={31}
        makeDefault={mode === "perspective"}
        near={0.1}
        ref={perspectiveRef}
      />
    </>
  );
}

function DimensionLine({
  from,
  to,
}: {
  from: [number, number, number];
  to: [number, number, number];
}) {
  return (
    <Line
      color="#d9c3a4"
      depthTest={false}
      lineWidth={1}
      opacity={0.92}
      points={[from, to]}
      transparent
    />
  );
}

function DimensionGuides() {
  const wallWidth = useConfigurationStore((state) => state.wallWidth);
  const wallHeight = useConfigurationStore((state) => state.wallHeight);
  const fireplaceElevation = useConfigurationStore((state) => state.fireplaceElevation);
  const mantelClearance = useConfigurationStore((state) => state.mantelClearance);
  const showDimensions = useConfigurationStore((state) => state.showDimensions);
  if (!showDimensions) return null;

  const wallLeft = -wallWidth / 2;
  const fireplaceRight = fireplaceProduct.visibleFace.width / 2;
  const faceTop = fireplaceElevation + fireplaceProduct.applianceHeight;
  const mantelBottom = getMantelBottom({
    schemaVersion: 1,
    wallWidth,
    wallHeight,
    fireplaceElevation,
    mantelClearance,
    cameraMode: "front",
    showDimensions,
  });

  return (
    <group renderOrder={20}>
      <DimensionLine from={[wallLeft, -3, 4]} to={[wallWidth / 2, -3, 4]} />
      <DimensionLine from={[wallLeft, -5, 4]} to={[wallLeft, -1, 4]} />
      <DimensionLine from={[wallWidth / 2, -5, 4]} to={[wallWidth / 2, -1, 4]} />
      <DimensionLine from={[wallWidth / 2 + 4, 0, 4]} to={[wallWidth / 2 + 4, wallHeight, 4]} />
      <DimensionLine from={[wallWidth / 2 + 2, 0, 4]} to={[wallWidth / 2 + 6, 0, 4]} />
      <DimensionLine
        from={[wallWidth / 2 + 2, wallHeight, 4]}
        to={[wallWidth / 2 + 6, wallHeight, 4]}
      />
      <DimensionLine
        from={[fireplaceRight + 4, faceTop, 4.2]}
        to={[fireplaceRight + 4, mantelBottom, 4.2]}
      />
      <DimensionLine
        from={[fireplaceRight + 2, faceTop, 4.2]}
        to={[fireplaceRight + 6, faceTop, 4.2]}
      />
      <DimensionLine
        from={[fireplaceRight + 2, mantelBottom, 4.2]}
        to={[fireplaceRight + 6, mantelBottom, 4.2]}
      />
    </group>
  );
}

function FeatureWall() {
  const wallWidth = useConfigurationStore((state) => state.wallWidth);
  const wallHeight = useConfigurationStore((state) => state.wallHeight);
  const fireplaceElevation = useConfigurationStore((state) => state.fireplaceElevation);
  const mantelClearance = useConfigurationStore((state) => state.mantelClearance);
  const groupRef = useRef<Group>(null);
  const fireRef = useRef<Mesh>(null);
  const textures = usePreparedTextures();
  const shadowTexture = useMemo(() => makeShadowTexture(), []);
  const configuration = {
    schemaVersion: 1 as const,
    wallWidth,
    wallHeight,
    fireplaceElevation,
    mantelClearance,
    cameraMode: "front" as const,
    showDimensions: true,
  };
  const mantelCenter = getMantelCenter(configuration);

  useFrame(({ clock }) => {
    if (!fireRef.current) return;
    const material = fireRef.current.material;
    if (!Array.isArray(material) && "emissiveIntensity" in material) {
      material.emissiveIntensity = 0.045 + Math.sin(clock.elapsedTime * 0.55) * 0.006;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh position={[0, wallHeight / 2, -3]} receiveShadow>
        <boxGeometry args={[wallWidth, wallHeight, 5]} />
        <meshStandardMaterial color="#292421" roughness={0.96} />
      </mesh>
      <mesh position={[0, wallHeight / 2, -0.46]} receiveShadow>
        <planeGeometry args={[wallWidth, wallHeight]} />
        <meshStandardMaterial
          bumpMap={textures.stoneBump}
          bumpScale={0.72}
          color="#f1e7d8"
          map={textures.stone}
          metalness={0}
          roughness={0.88}
        />
      </mesh>

      <mesh
        position={[0, fireplaceElevation + fireplaceProduct.visibleFace.height / 2, 0.25]}
        receiveShadow
      >
        <boxGeometry
          args={[
            fireplaceProduct.visibleFace.width + 0.6,
            fireplaceProduct.visibleFace.height + 0.6,
            1.2,
          ]}
        />
        <meshStandardMaterial color="#171513" metalness={0.34} roughness={0.38} />
      </mesh>
      <mesh
        position={[0, fireplaceElevation + fireplaceProduct.visibleFace.height / 2, 0.9]}
        ref={fireRef}
      >
        <planeGeometry
          args={[fireplaceProduct.visibleFace.width, fireplaceProduct.visibleFace.height]}
        />
        <meshStandardMaterial
          alphaTest={0.025}
          emissive={new Color("#6b2508")}
          emissiveIntensity={0.045}
          map={textures.fire}
          metalness={0.08}
          roughness={0.5}
          transparent
        />
      </mesh>

      <mesh position={[0, fireplaceElevation + 2, 3.15]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[56, 18]} />
        <meshBasicMaterial
          alphaMap={shadowTexture}
          color="#1d1712"
          opacity={0.27}
          transparent
        />
      </mesh>

      <RoundedBox
        args={[
          mantelProduct.dimensions.width,
          mantelProduct.dimensions.height,
          mantelProduct.dimensions.depth,
        ]}
        castShadow
        position={[0, mantelCenter, mantelProduct.dimensions.depth / 2 + 0.15]}
        radius={0.42}
        receiveShadow
        smoothness={6}
      >
        <meshStandardMaterial
          bumpMap={textures.pearlBump}
          bumpScale={0.16}
          color="#f3f1eb"
          map={textures.pearl}
          metalness={0}
          roughness={0.58}
        />
      </RoundedBox>

      <mesh position={[0, -1.05, 30]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[wallWidth * 2.5, 110]} />
        <meshStandardMaterial color="#302b27" roughness={0.83} />
      </mesh>
      <DimensionGuides />
    </group>
  );
}

function FrameRateMonitor({ onFps }: { onFps: (fps: number) => void }) {
  const sample = useRef({ elapsed: 0, frames: 0 });
  useFrame((_, delta) => {
    sample.current.elapsed += delta;
    sample.current.frames += 1;
    if (sample.current.elapsed >= 1) {
      onFps(sample.current.frames / sample.current.elapsed);
      sample.current = { elapsed: 0, frames: 0 };
    }
  });
  return null;
}

function SceneReady({ onReady }: { onReady: () => void }) {
  const reported = useRef(false);
  useFrame(() => {
    if (reported.current) return;
    reported.current = true;
    onReady();
  });
  return null;
}

function RendererReady({ onReady }: { onReady: (renderer: WebGLRenderer) => void }) {
  const renderer = useThree((state) => state.gl);
  useEffect(() => onReady(renderer), [onReady, renderer]);
  return null;
}

export function FeatureWallCanvas({ onFps, onRendererStatus }: FeatureWallCanvasProps) {
  const wallWidth = useConfigurationStore((state) => state.wallWidth);
  const wallHeight = useConfigurationStore((state) => state.wallHeight);
  const cameraMode = useConfigurationStore((state) => state.cameraMode);
  const fireplaceElevation = useConfigurationStore((state) => state.fireplaceElevation);
  const mantelClearance = useConfigurationStore((state) => state.mantelClearance);
  const showDimensions = useConfigurationStore((state) => state.showDimensions);
  const rendererRef = useRef<WebGLRenderer | null>(null);

  const handleRendererReady = (renderer: WebGLRenderer) => {
    if (rendererRef.current === renderer) return;
    rendererRef.current = renderer;
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.03;
    const canvas = renderer.domElement;
    const lost = (event: Event) => {
      event.preventDefault();
      onRendererStatus("recovering");
    };
    const restored = () => {
      onRendererStatus("recovering");
      requestAnimationFrame(() => requestAnimationFrame(() => onRendererStatus("ready")));
    };
    canvas.addEventListener("webglcontextlost", lost, false);
    canvas.addEventListener("webglcontextrestored", restored, false);
  };

  const faceTop = fireplaceElevation + fireplaceProduct.applianceHeight;
  const mantelBottom = faceTop + Math.max(mantelClearance, mantelProduct.minimumClearance);

  return (
    <div className="scene-canvas" data-testid="scene-canvas">
      <Canvas
        dpr={[1, 2]}
        frameloop="always"
        gl={{
          alpha: false,
          antialias: true,
          failIfMajorPerformanceCaveat: true,
          powerPreference: "high-performance",
          preserveDrawingBuffer: false,
          stencil: false,
        }}
        shadows
      >
        <color args={["#171513"]} attach="background" />
        <fog args={["#171513", 230, 520]} attach="fog" />
        <CameraRig />
        <ambientLight color="#fff6e9" intensity={1.2} />
        <hemisphereLight color="#fff3dc" groundColor="#29211c" intensity={1.05} />
        <directionalLight
          castShadow
          color="#fff0d6"
          intensity={2.15}
          position={[-80, 150, 100]}
          shadow-bias={-0.00008}
          shadow-mapSize-height={2048}
          shadow-mapSize-width={2048}
        />
        <Suspense fallback={null}>
          <FeatureWall />
          <SceneReady onReady={() => onRendererStatus("ready")} />
        </Suspense>
        <FrameRateMonitor onFps={onFps} />
        <RendererReady onReady={handleRendererReady} />
      </Canvas>

      {showDimensions && cameraMode === "front" ? (
        <div className="dimension-overlay" aria-label="Scene dimensions">
          <span className="dimension-chip dimension-chip--width">
            Wall {inchesLabel(wallWidth)}
          </span>
          <span className="dimension-chip dimension-chip--height">
            {inchesLabel(wallHeight)}
          </span>
          <span
            className="dimension-chip dimension-chip--clearance"
            style={{ bottom: `${Math.min(72, (mantelBottom / wallHeight) * 100)}%` }}
          >
            {inchesLabel(mantelBottom - faceTop)} min. clearance
          </span>
        </div>
      ) : null}
    </div>
  );
}

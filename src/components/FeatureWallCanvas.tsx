"use client";

import { Line, OrthographicCamera, PerspectiveCamera, RoundedBox } from "@react-three/drei";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import {
  ACESFilmicToneMapping,
  CanvasTexture,
  ClampToEdgeWrapping,
  LinearFilter,
  LinearMipmapLinearFilter,
  MirroredRepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
  type Group,
  type OrthographicCamera as ThreeOrthographicCamera,
  type PerspectiveCamera as ThreePerspectiveCamera,
  type Texture,
  type WebGLRenderer,
} from "three";
import {
  ALL_ASSET_PATHS,
  getFaceOption,
  getFireplaceProduct,
  getMantelFinish,
  getMantelSize,
  getStoneProduct,
} from "@/domain/catalog";
import {
  calculateOrthographicZoom,
  getMantelBottom,
  getMantelCenter,
  inchesLabel,
  type FeatureWallConfiguration,
} from "@/domain/configuration";
import { useConfigurationStore } from "@/store/configurationStore";

type FeatureWallCanvasProps = {
  onFps: (fps: number) => void;
  onRendererStatus: (status: "ready" | "recovering" | "error") => void;
};

function usePreparedTextures() {
  const sources = useLoader(TextureLoader, ALL_ASSET_PATHS) as Texture[];
  const maxAnisotropy = useThree((state) => state.gl.capabilities.getMaxAnisotropy());

  const prepared = useMemo(() => {
    const textures = new Map<string, Texture>();
    ALL_ASSET_PATHS.forEach((path, index) => {
      const source = sources[index];
      if (!source) throw new Error(`Approved texture source is missing: ${path}`);
      const texture = source.clone();
      texture.anisotropy = maxAnisotropy;
      texture.minFilter = LinearMipmapLinearFilter;
      texture.magFilter = LinearFilter;
      if (!path.includes("-bump.")) texture.colorSpace = SRGBColorSpace;
      texture.needsUpdate = true;
      textures.set(path, texture);
    });
    return textures;
  }, [maxAnisotropy, sources]);
  useEffect(
    () => () => {
      prepared.forEach((texture) => texture.dispose());
    },
    [prepared],
  );
  return prepared;
}

function requireTexture(textures: Map<string, Texture>, path: string): Texture {
  const texture = textures.get(path);
  if (!texture) throw new Error(`Approved texture was not preloaded: ${path}`);
  return texture;
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

function DimensionGuides({ configuration }: { configuration: FeatureWallConfiguration }) {
  if (!configuration.showDimensions) return null;
  const face = getFaceOption(configuration.fireplaceId, configuration.faceOptionId);
  const wallLeft = -configuration.wallWidth / 2;
  const stoneLeft = -configuration.stoneWidth / 2;
  const fireplaceRight = face.visibleFace.width / 2;
  const mantelBottom = getMantelBottom(configuration);

  return (
    <group renderOrder={20}>
      <DimensionLine from={[wallLeft, -3, 4]} to={[configuration.wallWidth / 2, -3, 4]} />
      <DimensionLine from={[wallLeft, -5, 4]} to={[wallLeft, -1, 4]} />
      <DimensionLine
        from={[configuration.wallWidth / 2, -5, 4]}
        to={[configuration.wallWidth / 2, -1, 4]}
      />
      <DimensionLine
        from={[stoneLeft, configuration.wallHeight + 3, 4]}
        to={[configuration.stoneWidth / 2, configuration.wallHeight + 3, 4]}
      />
      <DimensionLine
        from={[stoneLeft, configuration.wallHeight + 1, 4]}
        to={[stoneLeft, configuration.wallHeight + 5, 4]}
      />
      <DimensionLine
        from={[configuration.stoneWidth / 2, configuration.wallHeight + 1, 4]}
        to={[configuration.stoneWidth / 2, configuration.wallHeight + 5, 4]}
      />
      <DimensionLine
        from={[configuration.wallWidth / 2 + 4, 0, 4]}
        to={[configuration.wallWidth / 2 + 4, configuration.wallHeight, 4]}
      />
      <DimensionLine
        from={[configuration.wallWidth / 2 + 2, 0, 4]}
        to={[configuration.wallWidth / 2 + 6, 0, 4]}
      />
      <DimensionLine
        from={[configuration.wallWidth / 2 + 2, configuration.wallHeight, 4]}
        to={[configuration.wallWidth / 2 + 6, configuration.wallHeight, 4]}
      />
      <DimensionLine
        from={[fireplaceRight + 5, configuration.fireplaceElevation, 4.2]}
        to={[fireplaceRight + 5, mantelBottom, 4.2]}
      />
      <DimensionLine
        from={[fireplaceRight + 3, configuration.fireplaceElevation, 4.2]}
        to={[fireplaceRight + 7, configuration.fireplaceElevation, 4.2]}
      />
      <DimensionLine
        from={[fireplaceRight + 3, mantelBottom, 4.2]}
        to={[fireplaceRight + 7, mantelBottom, 4.2]}
      />
    </group>
  );
}

function FeatureWall({ configuration }: { configuration: FeatureWallConfiguration }) {
  const groupRef = useRef<Group>(null);
  const textures = usePreparedTextures();
  const shadowTexture = useMemo(() => makeShadowTexture(), []);
  const fireplace = getFireplaceProduct(configuration.fireplaceId);
  const face = getFaceOption(configuration.fireplaceId, configuration.faceOptionId);
  const stone = getStoneProduct(configuration.stoneId);
  const mantelSize = getMantelSize(configuration.mantelWidth);
  const mantelFinish = getMantelFinish(configuration.mantelFinishId);
  const mantelCenter = getMantelCenter(configuration);

  const stoneTextures = useMemo(() => {
    const color = requireTexture(textures, stone.assets[0]!.localPath).clone();
    const bump = requireTexture(textures, stone.assets[1]!.localPath).clone();
    const repeatX = configuration.stoneWidth / 192;
    const repeatY = configuration.wallHeight / 144;
    for (const texture of [color, bump]) {
      texture.wrapS = texture.wrapT = ClampToEdgeWrapping;
      texture.repeat.set(repeatX, repeatY);
      texture.offset.set((1 - repeatX) / 2, (1 - repeatY) / 2);
      texture.needsUpdate = true;
    }
    return { color, bump };
  }, [configuration.stoneWidth, configuration.wallHeight, stone.assets, textures]);

  const mantelTextures = useMemo(() => {
    const color = requireTexture(textures, mantelFinish.assets[0]!.localPath).clone();
    const bump = requireTexture(textures, mantelFinish.assets[1]!.localPath).clone();
    for (const texture of [color, bump]) {
      texture.wrapS = texture.wrapT = MirroredRepeatWrapping;
      texture.repeat.set(1, 1);
      texture.needsUpdate = true;
    }
    return { color, bump };
  }, [mantelFinish.assets, textures]);

  const fireTexture = requireTexture(textures, face.asset.localPath);

  useEffect(
    () => () => {
      stoneTextures.color.dispose();
      stoneTextures.bump.dispose();
    },
    [stoneTextures],
  );
  useEffect(
    () => () => {
      mantelTextures.color.dispose();
      mantelTextures.bump.dispose();
    },
    [mantelTextures],
  );
  useEffect(() => () => shadowTexture.dispose(), [shadowTexture]);

  return (
    <group ref={groupRef}>
      <mesh position={[0, configuration.wallHeight / 2, -3]} receiveShadow>
        <boxGeometry args={[configuration.wallWidth, configuration.wallHeight, 5]} />
        <meshStandardMaterial color="#d4d0c9" roughness={0.94} />
      </mesh>
      <mesh position={[0, configuration.wallHeight / 2, -0.48]} receiveShadow>
        <planeGeometry args={[configuration.wallWidth, configuration.wallHeight]} />
        <meshStandardMaterial color="#d8d4cd" metalness={0} roughness={0.93} />
      </mesh>
      <mesh position={[0, configuration.wallHeight / 2, -0.32]} receiveShadow>
        <planeGeometry args={[configuration.stoneWidth, configuration.wallHeight]} />
        <meshStandardMaterial
          bumpMap={stoneTextures.bump}
          bumpScale={0.08}
          map={stoneTextures.color}
          metalness={0}
          roughness={0.88}
        />
      </mesh>

      <mesh
        position={[0, configuration.fireplaceElevation + face.visibleFace.height / 2, 0.25]}
        receiveShadow
      >
        <boxGeometry
          args={[face.visibleFace.width + 0.5, face.visibleFace.height + 0.5, 1.2]}
        />
        <meshStandardMaterial color="#171513" metalness={0.34} roughness={0.38} />
      </mesh>
      <mesh position={[0, configuration.fireplaceElevation + face.visibleFace.height / 2, 0.9]}>
        <planeGeometry args={[face.visibleFace.width, face.visibleFace.height]} />
        <meshBasicMaterial alphaTest={0.02} map={fireTexture} toneMapped={false} transparent />
      </mesh>

      <mesh
        position={[0, configuration.fireplaceElevation + 2, 3.15]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[Math.max(56, face.visibleFace.width + 12), 18]} />
        <meshBasicMaterial
          alphaMap={shadowTexture}
          color="#1d1712"
          opacity={0.27}
          transparent
        />
      </mesh>

      <RoundedBox
        args={[mantelSize.width, mantelSize.height, mantelSize.depth]}
        castShadow
        position={[0, mantelCenter, mantelSize.depth / 2 + 0.15]}
        radius={0.42}
        receiveShadow
        smoothness={6}
      >
        <meshStandardMaterial
          bumpMap={mantelTextures.bump}
          bumpScale={0.16}
          map={mantelTextures.color}
          metalness={0}
          roughness={0.58}
        />
      </RoundedBox>

      <mesh position={[0, -1.05, 30]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[configuration.wallWidth * 2.5, 110]} />
        <meshStandardMaterial color="#302b27" roughness={0.83} />
      </mesh>
      <DimensionGuides configuration={configuration} />
      <group name={fireplace.id} />
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
  const stoneWidth = useConfigurationStore((state) => state.stoneWidth);
  const cameraMode = useConfigurationStore((state) => state.cameraMode);
  const fireplaceElevation = useConfigurationStore((state) => state.fireplaceElevation);
  const mantelHeightAboveBase = useConfigurationStore((state) => state.mantelHeightAboveBase);
  const fireplaceId = useConfigurationStore((state) => state.fireplaceId);
  const faceOptionId = useConfigurationStore((state) => state.faceOptionId);
  const stoneId = useConfigurationStore((state) => state.stoneId);
  const mantelWidth = useConfigurationStore((state) => state.mantelWidth);
  const mantelFinishId = useConfigurationStore((state) => state.mantelFinishId);
  const showDimensions = useConfigurationStore((state) => state.showDimensions);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const configuration: FeatureWallConfiguration = {
    schemaVersion: 2,
    wallWidth,
    wallHeight,
    stoneWidth,
    fireplaceElevation,
    mantelHeightAboveBase,
    fireplaceId,
    faceOptionId,
    stoneId,
    mantelWidth,
    mantelFinishId,
    cameraMode,
    showDimensions,
  };

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

  const fireplace = getFireplaceProduct(fireplaceId);
  const mantelBottom = getMantelBottom(configuration);

  return (
    <div className="scene-canvas" data-fireplace={fireplaceId} data-testid="scene-canvas">
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
        shadows="basic"
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
          <FeatureWall configuration={configuration} />
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
          <span className="dimension-chip dimension-chip--stone">
            Stone {inchesLabel(stoneWidth)}
          </span>
          <span className="dimension-chip dimension-chip--height">
            {inchesLabel(wallHeight)}
          </span>
          <span
            className="dimension-chip dimension-chip--clearance"
            style={{ bottom: `${Math.min(76, (mantelBottom / wallHeight) * 100)}%` }}
          >
            Mantel {inchesLabel(mantelHeightAboveBase)} from unit base · p.
            {fireplace.mantelRule.manualPage}
          </span>
        </div>
      ) : null}
    </div>
  );
}

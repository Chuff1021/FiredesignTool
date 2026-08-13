"use client";

import { Line, OrthographicCamera, PerspectiveCamera, RoundedBox } from "@react-three/drei";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import {
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
} from "three";
import { catalogRepository, getApprovedDesignAssetPaths } from "@/domain/catalogRepository";
import {
  calculateOrthographicZoom,
  getHearthStoneSegments,
  getHearthWidth,
  getMantelBottom,
  getMantelCenter,
  inchesLabel,
  type FeatureWallConfiguration,
} from "@/domain/configuration";
import { centeredStoneTextureTransform } from "@/domain/stoneTextureMapping";
import { useConfigurationStore } from "@/store/configurationStore";
import { FireboxMedia, type FireboxMediaStatus } from "@/components/FireboxMedia";

type FeatureWallCanvasProps = {
  onFps: (fps: number) => void;
  onMediaStatus: (status: FireboxMediaStatus) => void;
  onRendererStatus: (status: "ready" | "recovering" | "error") => void;
};

function usePreparedTextures(configuration: FeatureWallConfiguration) {
  const textureAssetPaths = useMemo(
    () =>
      getApprovedDesignAssetPaths({
        fireplaceId: configuration.fireplaceId,
        stoneId: configuration.stoneId,
        mantelFinishId: configuration.mantelFinishId,
      }).filter((path) => !path.endsWith(".mp4")),
    [configuration.fireplaceId, configuration.mantelFinishId, configuration.stoneId],
  );
  const sources = useLoader(TextureLoader, textureAssetPaths) as Texture[];
  const maxAnisotropy = useThree((state) => state.gl.capabilities.getMaxAnisotropy());

  const prepared = useMemo(() => {
    const textures = new Map<string, Texture>();
    textureAssetPaths.forEach((path, index) => {
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
  }, [maxAnisotropy, sources, textureAssetPaths]);
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
    perspectiveRef.current.position.set(wallWidth * 0.3, wallHeight * 0.57, wallWidth * 1.8);
    perspectiveRef.current.lookAt(0, wallHeight * 0.47, 0);
    perspectiveRef.current.updateProjectionMatrix();
  }, [wallHeight, wallWidth]);

  return (
    <>
      <OrthographicCamera far={1000} makeDefault={mode === "front"} near={0.1} ref={frontRef} />
      <PerspectiveCamera
        far={1200}
        fov={30}
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
  if (!configuration.showDimensions || configuration.cameraMode !== "front") return null;
  const face = catalogRepository.getFace(configuration.fireplaceId, configuration.faceOptionId);
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

function FeatureWall({
  configuration,
  onMediaStatus,
}: {
  configuration: FeatureWallConfiguration;
  onMediaStatus: (status: FireboxMediaStatus) => void;
}) {
  const groupRef = useRef<Group>(null);
  const textures = usePreparedTextures(configuration);
  const shadowTexture = useMemo(() => makeShadowTexture(), []);
  const fireplace = catalogRepository.getFireplace(configuration.fireplaceId);
  const face = catalogRepository.getFace(configuration.fireplaceId, configuration.faceOptionId);
  const fireback = catalogRepository.getFireback(
    configuration.fireplaceId,
    configuration.firebackOptionId,
  );
  const stone = catalogRepository.getStone(configuration.stoneId);
  const mantelProduct = catalogRepository.getMantel(configuration.mantelProductId);
  const mantelSize = catalogRepository.getMantelSize(
    configuration.mantelProductId,
    configuration.mantelWidth,
  );
  const mantelFinish = catalogRepository.getMantelFinish(
    configuration.mantelProductId,
    configuration.mantelFinishId,
  );
  const hearthstone = stone.hearthstone;
  const hearthWidth = getHearthWidth(configuration);
  const hearthSegments = useMemo(
    () => getHearthStoneSegments(configuration.stoneWidth),
    [configuration.stoneWidth],
  );
  const mantelCenter = getMantelCenter(configuration);

  const stoneTextures = useMemo(() => {
    const color = requireTexture(textures, stone.assets[0]!.localPath).clone();
    const bump = requireTexture(textures, stone.assets[1]!.localPath).clone();
    const transform = centeredStoneTextureTransform(
      configuration.stoneWidth,
      configuration.wallHeight,
      stone.textureCoverage,
    );
    for (const texture of [color, bump]) {
      texture.wrapS = texture.wrapT = MirroredRepeatWrapping;
      texture.repeat.set(transform.repeatX, transform.repeatY);
      texture.offset.set(transform.offsetX, transform.offsetY);
      texture.needsUpdate = true;
    }
    return { color, bump };
  }, [
    configuration.stoneWidth,
    configuration.wallHeight,
    stone.assets,
    stone.textureCoverage,
    textures,
  ]);

  const mantelTextures = useMemo(() => {
    const front = requireTexture(textures, mantelFinish.assets[0]!.localPath).clone();
    const top = requireTexture(textures, mantelFinish.assets[1]!.localPath).clone();
    const bump = requireTexture(textures, mantelFinish.assets[2]!.localPath).clone();
    for (const texture of [front, top, bump]) {
      texture.wrapS = texture.wrapT = ClampToEdgeWrapping;
      texture.needsUpdate = true;
    }
    return { front, top, bump };
  }, [mantelFinish.assets, textures]);

  const hearthTextures = useMemo(() => {
    const colorSource = requireTexture(textures, hearthstone.assets[0]!.localPath);
    const bumpSource = requireTexture(textures, hearthstone.assets[1]!.localPath);
    const caps = hearthSegments.map((segment, index) => {
      const color = colorSource.clone();
      const bump = bumpSource.clone();
      for (const texture of [color, bump]) {
        texture.wrapS = texture.wrapT = ClampToEdgeWrapping;
        texture.repeat.set(0.72 * (segment.width / 18), 0.72);
        texture.offset.set(0.05 + ((index * 0.07) % 0.18), 0.06 + ((index * 0.05) % 0.16));
        texture.needsUpdate = true;
      }
      return { color, bump };
    });
    return caps;
  }, [hearthSegments, hearthstone.assets, textures]);

  const hearthRiserTextures = useMemo(() => {
    const color = requireTexture(textures, stone.assets[0]!.localPath).clone();
    const bump = requireTexture(textures, stone.assets[1]!.localPath).clone();
    const riserHeight = Math.max(1, configuration.fireplaceElevation - 1.5);
    const transform = centeredStoneTextureTransform(
      hearthWidth,
      riserHeight,
      stone.textureCoverage,
    );
    for (const texture of [color, bump]) {
      texture.wrapS = texture.wrapT = MirroredRepeatWrapping;
      texture.repeat.set(transform.repeatX, transform.repeatY);
      texture.offset.set(transform.offsetX, transform.offsetY);
      texture.needsUpdate = true;
    }
    return { color, bump };
  }, [
    configuration.fireplaceElevation,
    hearthWidth,
    stone.assets,
    stone.textureCoverage,
    textures,
  ]);

  const fireTexture = requireTexture(textures, fireback.asset.localPath);
  const faceTexture = requireTexture(textures, face.asset.localPath);
  const faceOverlayTexture = requireTexture(textures, face.overlayAsset.localPath);
  const fireboxMaskTexture = requireTexture(textures, face.maskAsset.localPath);
  const burnPosterTexture = fireplace.burnMedia
    ? requireTexture(textures, fireplace.burnMedia.poster.localPath)
    : undefined;
  const liveBurnEnabled =
    fireplace.burnMedia?.compatibleFirebackIds.includes(fireback.id) ?? false;

  useEffect(() => {
    if (!liveBurnEnabled) onMediaStatus("static");
  }, [liveBurnEnabled, onMediaStatus]);

  useEffect(
    () => () => {
      stoneTextures.color.dispose();
      stoneTextures.bump.dispose();
    },
    [stoneTextures],
  );
  useEffect(
    () => () => {
      mantelTextures.front.dispose();
      mantelTextures.top.dispose();
      mantelTextures.bump.dispose();
    },
    [mantelTextures],
  );
  useEffect(
    () => () => {
      hearthTextures.forEach(({ color, bump }) => {
        color.dispose();
        bump.dispose();
      });
    },
    [hearthTextures],
  );
  useEffect(
    () => () => {
      hearthRiserTextures.color.dispose();
      hearthRiserTextures.bump.dispose();
    },
    [hearthRiserTextures],
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
        <boxGeometry args={[fireplace.viewingArea.width, fireplace.viewingArea.height, 1.2]} />
        <meshStandardMaterial color="#171513" metalness={0.34} roughness={0.38} />
      </mesh>
      <mesh position={[0, configuration.fireplaceElevation + face.visibleFace.height / 2, 0.9]}>
        <planeGeometry args={[face.visibleFace.width, face.visibleFace.height]} />
        <meshBasicMaterial alphaTest={0.02} map={faceTexture} toneMapped={false} transparent />
      </mesh>
      {fireback.renderMode === "base-layer" ? (
        <mesh
          position={[
            face.mediaWindow.offsetX,
            configuration.fireplaceElevation +
              face.visibleFace.height / 2 +
              face.mediaWindow.offsetY,
            0.95,
          ]}
          renderOrder={1}
        >
          <planeGeometry args={[face.mediaWindow.width, face.mediaWindow.height]} />
          <meshBasicMaterial
            alphaMap={fireboxMaskTexture}
            alphaTest={0.01}
            map={fireTexture}
            toneMapped={false}
            transparent
          />
        </mesh>
      ) : null}
      {liveBurnEnabled && fireplace.burnMedia && burnPosterTexture ? (
        <>
          <group
            position={[
              face.mediaWindow.offsetX,
              configuration.fireplaceElevation +
                face.visibleFace.height / 2 +
                face.mediaWindow.offsetY,
              0.97,
            ]}
          >
            <FireboxMedia
              faceOptionId={face.id}
              height={face.mediaWindow.height}
              key={fireplace.burnMedia.video.localPath}
              mask={fireboxMaskTexture}
              media={fireplace.burnMedia}
              onStatus={onMediaStatus}
              poster={burnPosterTexture}
              width={face.mediaWindow.width}
            />
          </group>
        </>
      ) : null}
      {face.overlayMode === "always" ? (
        <mesh
          position={[0, configuration.fireplaceElevation + face.visibleFace.height / 2, 1.05]}
          renderOrder={4}
        >
          <planeGeometry args={[face.visibleFace.width, face.visibleFace.height]} />
          <meshBasicMaterial
            alphaTest={0.02}
            depthWrite={false}
            map={faceOverlayTexture}
            toneMapped={false}
            transparent
          />
        </mesh>
      ) : null}

      <mesh
        position={[
          0,
          configuration.hearthEnabled ? configuration.fireplaceElevation + 0.04 : 0.04,
          configuration.hearthEnabled ? hearthstone.dimensions.depth / 2 : 3.15,
        ]}
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
        radius={
          mantelProduct.id === "tavern" ? 0.55 : mantelProduct.id === "linear" ? 0.34 : 0.18
        }
        receiveShadow
        smoothness={6}
      >
        <meshStandardMaterial color={mantelFinish.colorHex} metalness={0} roughness={0.66} />
      </RoundedBox>
      <mesh position={[0, mantelCenter, mantelSize.depth + 0.17]}>
        <planeGeometry args={[mantelSize.width - 0.22, mantelSize.height - 0.16]} />
        <meshStandardMaterial
          bumpMap={mantelTextures.bump}
          bumpScale={0.08}
          map={mantelTextures.front}
          metalness={0}
          roughness={0.64}
        />
      </mesh>
      <mesh
        position={[0, mantelCenter + mantelSize.height / 2 + 0.02, mantelSize.depth / 2 + 0.15]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[mantelSize.width - 0.22, mantelSize.depth - 0.16]} />
        <meshStandardMaterial
          bumpMap={mantelTextures.bump}
          bumpScale={0.05}
          map={mantelTextures.top}
          metalness={0}
          roughness={0.66}
        />
      </mesh>

      {configuration.hearthEnabled && configuration.fireplaceElevation >= 1.5 ? (
        <group name="centurion-hearthstone-860">
          {configuration.fireplaceElevation > hearthstone.dimensions.thickness ? (
            <>
              <mesh
                position={[
                  0,
                  (configuration.fireplaceElevation - hearthstone.dimensions.thickness) / 2,
                  hearthstone.dimensions.depth / 2,
                ]}
                receiveShadow
              >
                <boxGeometry
                  args={[
                    hearthWidth,
                    configuration.fireplaceElevation - hearthstone.dimensions.thickness,
                    hearthstone.dimensions.depth,
                  ]}
                />
                <meshStandardMaterial color="#4b423a" roughness={0.92} />
              </mesh>
              <mesh
                position={[
                  0,
                  (configuration.fireplaceElevation - hearthstone.dimensions.thickness) / 2,
                  hearthstone.dimensions.depth + 0.02,
                ]}
              >
                <planeGeometry
                  args={[
                    hearthWidth,
                    configuration.fireplaceElevation - hearthstone.dimensions.thickness,
                  ]}
                />
                <meshStandardMaterial
                  bumpMap={hearthRiserTextures.bump}
                  bumpScale={0.09}
                  map={hearthRiserTextures.color}
                  roughness={0.9}
                />
              </mesh>
            </>
          ) : null}
          {hearthTextures.map((texture, index) => {
            const segment = hearthSegments[index];
            if (!segment) return null;
            const bodyColor = hearthstone.colorName === "Kentucky" ? "#817c78" : "#80624f";

            return (
              <group key={index}>
                <RoundedBox
                  args={[
                    segment.width - 0.16,
                    hearthstone.dimensions.thickness,
                    hearthstone.dimensions.depth,
                  ]}
                  castShadow
                  position={[
                    segment.centerX,
                    configuration.fireplaceElevation - hearthstone.dimensions.thickness / 2,
                    hearthstone.dimensions.depth / 2 + 0.05,
                  ]}
                  radius={0.24}
                  receiveShadow
                  smoothness={4}
                >
                  <meshStandardMaterial color={bodyColor} metalness={0} roughness={0.9} />
                </RoundedBox>
                <mesh
                  position={[
                    segment.centerX,
                    configuration.fireplaceElevation + 0.01,
                    hearthstone.dimensions.depth / 2 + 0.05,
                  ]}
                  receiveShadow
                  rotation={[-Math.PI / 2, 0, 0]}
                >
                  <planeGeometry
                    args={[segment.width - 0.38, hearthstone.dimensions.depth - 0.38]}
                  />
                  <meshStandardMaterial
                    bumpMap={texture.bump}
                    bumpScale={0.035}
                    map={texture.color}
                    metalness={0}
                    roughness={0.88}
                  />
                </mesh>
              </group>
            );
          })}
        </group>
      ) : null}

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

function RendererReady({
  onRendererStatus,
}: {
  onRendererStatus: FeatureWallCanvasProps["onRendererStatus"];
}) {
  const renderer = useThree((state) => state.gl);
  useEffect(() => {
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
    return () => {
      canvas.removeEventListener("webglcontextlost", lost, false);
      canvas.removeEventListener("webglcontextrestored", restored, false);
    };
  }, [onRendererStatus, renderer]);
  return null;
}

export function FeatureWallCanvas({
  onFps,
  onMediaStatus,
  onRendererStatus,
}: FeatureWallCanvasProps) {
  const wallWidth = useConfigurationStore((state) => state.wallWidth);
  const wallHeight = useConfigurationStore((state) => state.wallHeight);
  const stoneWidth = useConfigurationStore((state) => state.stoneWidth);
  const cameraMode = useConfigurationStore((state) => state.cameraMode);
  const fireplaceElevation = useConfigurationStore((state) => state.fireplaceElevation);
  const mantelHeightAboveBase = useConfigurationStore((state) => state.mantelHeightAboveBase);
  const fireplaceId = useConfigurationStore((state) => state.fireplaceId);
  const faceOptionId = useConfigurationStore((state) => state.faceOptionId);
  const firebackOptionId = useConfigurationStore((state) => state.firebackOptionId);
  const stoneId = useConfigurationStore((state) => state.stoneId);
  const mantelProductId = useConfigurationStore((state) => state.mantelProductId);
  const mantelWidth = useConfigurationStore((state) => state.mantelWidth);
  const mantelFinishId = useConfigurationStore((state) => state.mantelFinishId);
  const hearthEnabled = useConfigurationStore((state) => state.hearthEnabled);
  const showDimensions = useConfigurationStore((state) => state.showDimensions);
  const configuration: FeatureWallConfiguration = {
    schemaVersion: 6,
    catalogVersion: catalogRepository.release.version,
    wallWidth,
    wallHeight,
    stoneWidth,
    fireplaceElevation,
    mantelHeightAboveBase,
    fireplaceId,
    faceOptionId,
    firebackOptionId,
    stoneId,
    mantelProductId,
    mantelWidth,
    mantelFinishId,
    hearthEnabled,
    cameraMode,
    showDimensions,
  };

  const fireplace = catalogRepository.getFireplace(fireplaceId);
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
          outputColorSpace: SRGBColorSpace,
          powerPreference: "high-performance",
          preserveDrawingBuffer: false,
          stencil: false,
        }}
        shadows="basic"
      >
        <color args={["#171513"]} attach="background" />
        <CameraRig />
        <ambientLight color="#ffffff" intensity={1.05} />
        <hemisphereLight color="#ffffff" groundColor="#302e2c" intensity={0.72} />
        <directionalLight
          castShadow
          color="#ffffff"
          intensity={1.35}
          position={[-80, 150, 100]}
          shadow-bias={-0.00008}
          shadow-mapSize-height={2048}
          shadow-mapSize-width={2048}
        />
        <Suspense fallback={null}>
          <FeatureWall configuration={configuration} onMediaStatus={onMediaStatus} />
          <SceneReady onReady={() => onRendererStatus("ready")} />
        </Suspense>
        <FrameRateMonitor onFps={onFps} />
        <RendererReady onRendererStatus={onRendererStatus} />
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

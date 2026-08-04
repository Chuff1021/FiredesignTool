"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import {
  LinearFilter,
  MeshBasicMaterial,
  SRGBColorSpace,
  VideoTexture,
  type Texture,
} from "three";
import type { BurnMedia, FaceOptionId } from "@/domain/catalog";

export type FireboxMediaStatus = "preparing" | "playing" | "paused" | "fallback";

type FireboxMediaProps = {
  faceOptionId: FaceOptionId;
  height: number;
  mask: Texture;
  media: BurnMedia;
  onStatus: (status: FireboxMediaStatus) => void;
  poster: Texture;
  width: number;
};

export function FireboxMedia({
  faceOptionId,
  height,
  mask,
  media,
  onStatus,
  poster,
  width,
}: FireboxMediaProps) {
  const [decoded, setDecoded] = useState(false);
  const [playback] = useState(() => {
    const video = document.createElement("video");
    video.src = media.video.localPath;
    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "auto";
    video.setAttribute("aria-hidden", "true");
    video.dataset.fpxBurnMedia = media.video.localPath;
    video.style.display = "none";
    const texture = new VideoTexture(video);
    texture.colorSpace = SRGBColorSpace;
    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;
    texture.generateMipmaps = false;
    return { texture, video };
  });
  const videoMaterial = useRef<MeshBasicMaterial>(null);
  const posterMaterial = useRef<MeshBasicMaterial>(null);
  const fade = useRef(0);
  const disposeTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    let disposed = false;
    let retried = false;
    const { texture, video } = playback;
    if (disposeTimer.current) window.clearTimeout(disposeTimer.current);
    document.body.append(video);
    onStatus("preparing");

    const play = async () => {
      if (disposed || document.hidden) return;
      try {
        await video.play();
      } catch {
        // A poster remains visible if browser policy or decoding blocks playback.
      }
    };
    const showVideo = () => {
      if (disposed || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
      setDecoded(true);
      onStatus("playing");
    };
    const recover = () => {
      if (disposed) return;
      if (!retried) {
        retried = true;
        video.load();
        void play();
        return;
      }
      setDecoded(false);
      onStatus("fallback");
    };
    const visibility = () => {
      if (document.hidden) {
        video.pause();
        onStatus("paused");
      } else {
        void play();
      }
    };

    video.addEventListener("loadeddata", showVideo);
    video.addEventListener("canplay", showVideo);
    video.addEventListener("playing", showVideo);
    video.addEventListener("error", recover);
    video.addEventListener("stalled", recover);
    document.addEventListener("visibilitychange", visibility);
    video.load();
    queueMicrotask(showVideo);
    void play();

    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", visibility);
      video.removeEventListener("loadeddata", showVideo);
      video.removeEventListener("canplay", showVideo);
      video.removeEventListener("playing", showVideo);
      video.removeEventListener("error", recover);
      video.removeEventListener("stalled", recover);
      disposeTimer.current = window.setTimeout(() => {
        video.pause();
        video.remove();
        video.removeAttribute("src");
        video.load();
        texture.dispose();
      }, 100);
    };
  }, [media.video.localPath, onStatus, playback]);

  useFrame((_, delta) => {
    const target = decoded ? 1 : 0;
    fade.current += (target - fade.current) * Math.min(1, delta * 7);
    if (videoMaterial.current) videoMaterial.current.opacity = fade.current;
    if (posterMaterial.current) posterMaterial.current.opacity = 1 - fade.current;
  });

  // The complete official face is rendered above this surface. Its exact
  // enclosed-opening mask keeps moving footage out of face and door pixels.
  return (
    <group name={`burn-media-${faceOptionId}`}>
      <mesh position={[0, 0, 0]} renderOrder={2}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial
          alphaMap={mask}
          alphaTest={0.01}
          map={poster}
          ref={posterMaterial}
          toneMapped={false}
          transparent
        />
      </mesh>
      <mesh position={[0, 0, 0.01]} renderOrder={3}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial
          alphaMap={mask}
          alphaTest={0.01}
          depthWrite={false}
          map={playback.texture}
          opacity={0}
          ref={videoMaterial}
          toneMapped={false}
          transparent
        />
      </mesh>
    </group>
  );
}

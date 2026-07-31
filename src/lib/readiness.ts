import { z } from "zod";

const assetFileSchema = z.object({
  path: z.string().startsWith("/assets/"),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  size: z.number().int().positive(),
});

const assetManifestSchema = z.object({
  version: z.string().min(1),
  generatedAt: z.string(),
  files: z.array(assetFileSchema).min(1),
});

export type AssetManifest = z.infer<typeof assetManifestSchema>;

export type GraphicsSupport = {
  supported: boolean;
  webgl2: boolean;
  renderer: string;
  vendor: string;
  reason?: string;
};

export type ReadinessResult = {
  manifest: AssetManifest;
  graphics: GraphicsSupport;
  verifiedAssets: number;
};

function bytesToHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function detectGraphicsSupport(): GraphicsSupport {
  const canvas = document.createElement("canvas");
  const options: WebGLContextAttributes = {
    antialias: true,
    failIfMajorPerformanceCaveat: true,
    powerPreference: "high-performance",
  };

  const gl2 = canvas.getContext("webgl2", options);
  const gl = gl2 ?? canvas.getContext("webgl", options);
  if (!gl) {
    return {
      supported: false,
      webgl2: false,
      renderer: "Unavailable",
      vendor: "Unavailable",
      reason: "This computer could not start the showroom graphics renderer.",
    };
  }

  const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
  const renderer = debugInfo
    ? String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL))
    : String(gl.getParameter(gl.RENDERER));
  const vendor = debugInfo
    ? String(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL))
    : String(gl.getParameter(gl.VENDOR));

  return {
    supported: true,
    webgl2: Boolean(gl2),
    renderer,
    vendor,
  };
}

async function verifyImage(bytes: ArrayBuffer, contentType: string | null): Promise<void> {
  if (!contentType?.startsWith("image/")) return;
  const blob = new Blob([bytes], { type: contentType });
  if ("createImageBitmap" in window) {
    const bitmap = await createImageBitmap(blob);
    bitmap.close();
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("A showroom image could not be decoded."));
    };
    image.src = url;
  });
}

async function verifyVideo(bytes: ArrayBuffer, contentType: string | null): Promise<void> {
  if (!contentType?.startsWith("video/")) return;
  if (bytes.byteLength > 20 * 1024 * 1024) {
    throw new Error("An approved burn loop exceeds the 20 MB showroom limit.");
  }
  const support = document
    .createElement("video")
    .canPlayType('video/mp4; codecs="avc1.640028"');
  if (!support) throw new Error("This browser cannot decode the approved H.264 burn footage.");

  await new Promise<void>((resolve, reject) => {
    const url = URL.createObjectURL(new Blob([bytes], { type: contentType }));
    const video = document.createElement("video");
    const timeout = window.setTimeout(
      () => finish(new Error("Burn video decode timed out.")),
      12000,
    );
    const finish = (error?: Error) => {
      window.clearTimeout(timeout);
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(url);
      if (error) reject(error);
      else resolve();
    };
    video.muted = true;
    video.preload = "auto";
    video.onloadeddata = () => {
      if (
        video.videoWidth < 1280 ||
        video.videoHeight < 720 ||
        !Number.isFinite(video.duration)
      ) {
        finish(new Error("Burn video metadata does not meet the approved showroom profile."));
        return;
      }
      finish();
    };
    video.onerror = () => finish(new Error("An approved burn video could not be decoded."));
    video.src = url;
    video.load();
  });
}

export async function runReadinessChecks(
  onProgress?: (completed: number, total: number) => void,
): Promise<ReadinessResult> {
  console.info("[FireDesign] Starting approved asset verification.");
  const graphics = detectGraphicsSupport();
  if (!graphics.supported) {
    throw new Error(graphics.reason);
  }

  const manifestResponse = await fetch("/assets/manifest.json", { cache: "no-store" });
  if (!manifestResponse.ok) {
    throw new Error("The approved showroom asset manifest is unavailable.");
  }
  const manifest = assetManifestSchema.parse(await manifestResponse.json());

  let verifiedAssets = 0;
  for (const file of manifest.files) {
    const response = await fetch(file.path);
    if (!response.ok) {
      throw new Error(`Required showroom asset failed to load: ${file.path}`);
    }
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength !== file.size) {
      throw new Error(`Required showroom asset has an unexpected size: ${file.path}`);
    }
    const digest = bytesToHex(await crypto.subtle.digest("SHA-256", bytes));
    if (digest !== file.sha256) {
      throw new Error(`Required showroom asset failed its integrity check: ${file.path}`);
    }
    await verifyImage(bytes, response.headers.get("content-type"));
    await verifyVideo(bytes, response.headers.get("content-type"));
    verifiedAssets += 1;
    onProgress?.(verifiedAssets, manifest.files.length);
  }

  return { manifest, graphics, verifiedAssets };
}

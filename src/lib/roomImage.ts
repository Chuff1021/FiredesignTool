const MAX_ROOM_IMAGE_EDGE = 2560;

function fileToDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("The room photograph could not be read."));
    reader.readAsDataURL(file);
  });
}

export function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("The room photograph could not be decoded."));
    image.src = source;
  });
}

export async function prepareRoomImage(file: File): Promise<{
  dataUrl: string;
  fileName: string;
  width: number;
  height: number;
}> {
  const isHeic =
    file.type === "image/heic" || file.type === "image/heif" || /\.hei[cf]$/i.test(file.name);
  if (!file.type.startsWith("image/") && !isHeic)
    throw new Error("Choose a JPEG, PNG, or HEIC photograph.");
  if (file.size > 30 * 1024 * 1024)
    throw new Error("The room photograph must be smaller than 30 MB.");
  let preparedBlob: Blob = file;
  if (isHeic) {
    const { default: convertHeic } = await import("heic2any");
    const converted = await convertHeic({
      blob: file,
      toType: "image/jpeg",
      quality: 0.94,
    });
    preparedBlob = Array.isArray(converted) ? (converted[0] ?? file) : converted;
  }
  const input = await fileToDataUrl(preparedBlob);
  const image = await loadImage(input);
  if (Math.max(image.naturalWidth, image.naturalHeight) < 1200) {
    throw new Error("Choose a sharper photograph at least 1200 pixels across.");
  }
  const scale = Math.min(
    1,
    MAX_ROOM_IMAGE_EDGE / Math.max(image.naturalWidth, image.naturalHeight),
  );
  const width = Math.round(image.naturalWidth * scale);
  const height = Math.round(image.naturalHeight * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("The browser could not prepare this photograph.");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, width, height);
  return {
    dataUrl: canvas.toDataURL("image/jpeg", 0.92),
    fileName: file.name,
    width,
    height,
  };
}

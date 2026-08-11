export type ViewportSize = {
  width: number;
  height: number;
};

export function fitContainedSize(
  containerWidth: number,
  containerHeight: number,
  contentWidth: number,
  contentHeight: number,
): ViewportSize {
  if (
    !Number.isFinite(containerWidth) ||
    !Number.isFinite(containerHeight) ||
    !Number.isFinite(contentWidth) ||
    !Number.isFinite(contentHeight) ||
    containerWidth <= 0 ||
    containerHeight <= 0 ||
    contentWidth <= 0 ||
    contentHeight <= 0
  ) {
    return { width: 0, height: 0 };
  }

  const scale = Math.min(containerWidth / contentWidth, containerHeight / contentHeight);
  return {
    width: contentWidth * scale,
    height: contentHeight * scale,
  };
}

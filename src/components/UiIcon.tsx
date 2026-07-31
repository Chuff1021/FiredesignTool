import type { ReactNode } from "react";

type UiIconName =
  | "arrow"
  | "check"
  | "collapse"
  | "diagnostics"
  | "dimensions"
  | "expand"
  | "front"
  | "image"
  | "perspective"
  | "upload"
  | "download"
  | "reset"
  | "warning";

type UiIconProps = {
  name: UiIconName;
  size?: number;
};

const paths: Record<UiIconName, ReactNode> = {
  arrow: <path d="m9 18 6-6-6-6" />,
  check: <path d="m5 12 4 4L19 6" />,
  collapse: (
    <>
      <path d="M9 9H4V4M15 9h5V4M9 15H4v5M15 15h5v5" />
      <path d="M4 4l5 5M20 4l-5 5M4 20l5-5M20 20l-5-5" />
    </>
  ),
  diagnostics: (
    <>
      <path d="M4 14h4l2-8 4 12 2-6h4" />
      <path d="M4 4v16h16" />
    </>
  ),
  dimensions: (
    <>
      <path d="M5 5v14M19 5v14M5 12h14" />
      <path d="m8 9-3 3 3 3M16 9l3 3-3 3" />
    </>
  ),
  expand: (
    <>
      <path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" />
      <path d="m3 8 5-5M21 8l-5-5M3 16l5 5M21 16l-5 5" />
    </>
  ),
  front: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="1" />
      <rect x="7" y="8" width="10" height="9" rx="1" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9" r="1.5" />
      <path d="m4 17 4.5-4.5 3 3 2.5-2.5 6 6" />
    </>
  ),
  perspective: (
    <>
      <path d="m4 6 12-3 4 3v12l-12 3-4-3Z" />
      <path d="M8 9v12M8 9l12-3" />
    </>
  ),
  upload: (
    <>
      <path d="M12 16V4M7 9l5-5 5 5" />
      <path d="M4 15v5h16v-5" />
    </>
  ),
  download: (
    <>
      <path d="M12 4v12M7 11l5 5 5-5" />
      <path d="M4 15v5h16v-5" />
    </>
  ),
  reset: (
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
    </>
  ),
  warning: (
    <>
      <path d="M12 3 2.5 20h19Z" />
      <path d="M12 9v4M12 17h.01" />
    </>
  ),
};

export function UiIcon({ name, size = 18 }: UiIconProps) {
  return (
    <svg
      aria-hidden="true"
      className="ui-icon"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7">
        {paths[name]}
      </g>
    </svg>
  );
}

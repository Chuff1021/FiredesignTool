import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FireDesign Showroom",
    short_name: "FireDesign",
    description: "Dimensionally accurate fireplace showroom visualization.",
    start_url: "/",
    display: "standalone",
    background_color: "#171513",
    theme_color: "#171513",
    orientation: "landscape",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}

import { catalogRepository } from "@/domain/catalogRepository";
import type { FeatureWallConfiguration } from "@/domain/configuration";
import type { RoomProject } from "@/domain/roomProject";

function dataUrlBytes(dataUrl: string): Uint8Array {
  const encoded = dataUrl.split(",")[1];
  if (!encoded) throw new Error("The project image could not be prepared for PDF export.");
  const binary = atob(encoded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export async function createProjectPdf(
  project: RoomProject,
  configuration: FeatureWallConfiguration,
  renderedImage: string,
): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const document = await PDFDocument.create();
  document.setTitle(`${project.name} · FireDesign`);
  document.setSubject("Conceptual fireplace visualization and product selections");
  document.setCreator("FireDesign Showroom");
  const page = document.addPage([792, 612]);
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  const image = await document.embedJpg(dataUrlBytes(renderedImage));
  const background = rgb(0.075, 0.069, 0.063);
  const ink = rgb(0.96, 0.94, 0.91);
  const muted = rgb(0.64, 0.61, 0.57);
  const gold = rgb(0.79, 0.65, 0.46);
  page.drawRectangle({ x: 0, y: 0, width: 792, height: 612, color: background });
  page.drawText("FIREDESIGN · SHOWROOM CONCEPT", {
    x: 34,
    y: 576,
    font: bold,
    size: 9,
    color: gold,
  });
  page.drawText(project.name, { x: 34, y: 548, font: bold, size: 20, color: ink });
  const imageBox = { x: 34, y: 118, width: 520, height: 405 };
  const scale = Math.min(imageBox.width / image.width, imageBox.height / image.height);
  const imageWidth = image.width * scale;
  const imageHeight = image.height * scale;
  page.drawImage(image, {
    x: imageBox.x + (imageBox.width - imageWidth) / 2,
    y: imageBox.y + (imageBox.height - imageHeight) / 2,
    width: imageWidth,
    height: imageHeight,
  });

  const fireplace = catalogRepository.getFireplace(configuration.fireplaceId);
  const face = catalogRepository.getFace(configuration.fireplaceId, configuration.faceOptionId);
  const stone = catalogRepository.getStone(configuration.stoneId);
  const mantel = catalogRepository.getMantel(configuration.mantelProductId);
  const finish = catalogRepository.getMantelFinish(
    configuration.mantelProductId,
    configuration.mantelFinishId,
  );
  let y = 506;
  const line = (label: string, value: string) => {
    page.drawText(label.toUpperCase(), { x: 582, y, font: bold, size: 7, color: gold });
    y -= 14;
    page.drawText(value, { x: 582, y, font: regular, size: 9, color: ink, maxWidth: 175 });
    y -= 28;
  };
  line("Fireplace", fireplace.model);
  line("Face / trim", face.name);
  line("Stone", `${stone.name} · ${configuration.stoneWidth} in field`);
  line("Mantel", `${finish.name} ${mantel.shortLabel} · ${configuration.mantelWidth} in`);
  line("Installation concept", project.scenario === "insert" ? "Insert only" : "Full remodel");
  line("Measured wall", `${project.referenceInches} in · four-corner calibrated`);

  page.drawLine({
    start: { x: 34, y: 88 },
    end: { x: 758, y: 88 },
    thickness: 0.5,
    color: rgb(0.25, 0.23, 0.21),
  });
  page.drawText(
    "Conceptual sales visualization. Verify appliance fit, venting, framing, clearances, materials, and installation onsite using current manufacturer instructions and local code.",
    { x: 34, y: 61, font: regular, size: 7.5, color: muted, maxWidth: 724, lineHeight: 10 },
  );
  page.drawText(`Generated ${new Date().toLocaleDateString()} · FireDesign v0.8.0`, {
    x: 34,
    y: 25,
    font: regular,
    size: 7,
    color: muted,
  });
  return document.save();
}

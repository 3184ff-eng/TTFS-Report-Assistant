import { analyzePhotoWithVision } from "../../../lib/photo-vision-server.js";

export async function POST(request) {
  const { image, imageInfo, location } = await request.json();

  if (!image || typeof image !== "string" || !image.startsWith("data:image/")) {
    return Response.json({ error: "A base64 image data URL is required." }, { status: 400 });
  }

  return Response.json(await analyzePhotoWithVision({ image, imageInfo, location }));
}

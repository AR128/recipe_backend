import cloudinary from "../config/cloudinary.js";
import sharp from "sharp";
import { requireObjectBody } from "../utils/requestValidation.js";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 8_192;
const MAX_IMAGE_PIXELS = 20_000_000;
const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp"]);

const uploadBuffer = (buffer) =>
  new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      { folder: "food_recipes", resource_type: "image" },
      (error, result) => {
        if (error) return reject(error);
        if (!result?.secure_url || !result.public_id) {
          return reject(
            new Error("Cloudinary returned an incomplete upload result.")
          );
        }
        resolve(result);
      }
    );
    upload.end(buffer);
  });

export const uploadImage = async (req, res) => {
  const bodyError = requireObjectBody(req.body, ["image"]);
  if (bodyError) {
    return res.status(400).json({ error: "Validation", message: bodyError });
  }

  const { image } = req.body;
  if (typeof image !== "string") {
    return res.status(400).json({
      error: "Validation",
      message: "Image must be a base64-encoded JPEG, PNG, or WebP data URL.",
    });
  }

  const match = image.match(
    /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/i
  );
  if (!match) {
    return res.status(400).json({
      error: "Validation",
      message:
        "Only base64-encoded JPEG, PNG, and WebP image data is accepted.",
    });
  }

  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length > MAX_IMAGE_BYTES) {
    return res.status(413).json({
      error: "Payload Too Large",
      message: "The decoded image must be no larger than 5 MB.",
    });
  }
  if (!buffer.length || buffer.toString("base64") !== match[2]) {
    return res.status(400).json({
      error: "Validation",
      message: "The supplied base64 image data is invalid.",
    });
  }

  let sanitizedImage;
  try {
    const source = sharp(buffer, {
      limitInputPixels: MAX_IMAGE_PIXELS,
      failOn: "error",
    });
    const metadata = await source.metadata();
    if (
      !ALLOWED_FORMATS.has(metadata.format) ||
      metadata.format !== match[1].toLowerCase() ||
      !metadata.width ||
      !metadata.height ||
      metadata.width > MAX_IMAGE_DIMENSION ||
      metadata.height > MAX_IMAGE_DIMENSION ||
      metadata.width * metadata.height > MAX_IMAGE_PIXELS
    ) {
      return res.status(400).json({
        error: "Validation",
        message:
          "Image must be a valid JPEG, PNG, or WebP no larger than 8192 pixels per side or 20 megapixels.",
      });
    }

    sanitizedImage = await source.rotate().toBuffer();
    if (sanitizedImage.length > MAX_IMAGE_BYTES) {
      return res.status(413).json({
        error: "Payload Too Large",
        message: "The processed image must be no larger than 5 MB.",
      });
    }
  } catch (error) {
    console.warn("Rejected invalid image:", {
      requestId: req.requestId,
      code: error.code,
    });
    return res.status(400).json({
      error: "Validation",
      message: "The uploaded file is not a valid supported image.",
    });
  }

  try {
    const result = await uploadBuffer(sanitizedImage);
    return res.status(200).json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    console.error("Image upload failed:", {
      requestId: req.requestId,
      error,
    });
    return res.status(502).json({
      error: "Upload failed",
      message: "The image upload failed. Please try again.",
      requestId: req.requestId,
    });
  }
};

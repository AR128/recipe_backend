import cloudinary from "../config/cloudinary.js";

// POST /api/upload
// Accepts base64 image data or file URL and uploads to Cloudinary
export const uploadImage = async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
        error: "Validation",
        message: "Image data is required",
      });
    }

    // Upload to Cloudinary under 'food_recipes' folder
    const result = await cloudinary.uploader.upload(image, {
      folder: "food_recipes",
      resource_type: "auto",
    });

    return res.status(200).json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return res.status(500).json({
      error: "Upload failed",
      message: error.message || "Failed to upload image to Cloudinary",
    });
  }
};

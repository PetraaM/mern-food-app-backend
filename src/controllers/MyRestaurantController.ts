import { Request, Response } from "express";
import Restaurant from "../models/restaurant";
import cloudinary from "cloudinary";
import mongoose from "mongoose";

const createMyRestaurant = async (req: Request, res: Response) => {
  try {
    // Check if the restaurant already exists for the user
    const existingRestaurant = await Restaurant.findOne({ user: req.userId });

    if (existingRestaurant) {
      return res
        .status(409)
        .json({ message: "User restaurant already exists" });
    }

    // Check if the file exists in the request
    if (!req.file) {
      return res.status(400).json({ message: "Image file is required" });
    }

    const image = req.file as Express.Multer.File;

    // Validate file type (optional)
    const validMimeTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!validMimeTypes.includes(image.mimetype)) {
      return res.status(400).json({ message: "Invalid image type" });
    }

    // Convert the file to base64 format for Cloudinary upload
    const base64Image = Buffer.from(image.buffer).toString("base64");
    const dataURI = `data:${image.mimetype};base64,${base64Image}`;

    // Upload the image to Cloudinary
    let uploadResponse;
    try {
      uploadResponse = await cloudinary.v2.uploader.upload(dataURI);
    } catch (uploadError) {
      console.error("Cloudinary upload error:", uploadError);
      return res.status(500).json({ message: "Failed to upload image" });
    }

    // Create a new restaurant with the uploaded image URL
    const restaurant = new Restaurant({
      ...req.body,
      imageUrl: uploadResponse.url,
      user: new mongoose.Types.ObjectId(req.userId),
      lastUpdated: new Date(),
    });

    // Save the restaurant in the database
    await restaurant.save();

    res.status(201).json(restaurant);
  } catch (error: any) {
    console.error("Error creating restaurant:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
};

export default {
  createMyRestaurant,
};

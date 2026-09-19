import { Admin } from "../models/Admin.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// It's a good practice to store refresh tokens in a database,
// but for simplicity, we'll just verify them via JWT signature.
// In a production app, you might want a RefreshToken model or store in Redis.

const generateAccessToken = (id, role) => {
  return jwt.sign({ id: id.toString(), role }, process.env.ACCESS_TOKEN, {
    expiresIn: "15m",
  });
};

const generateRefreshToken = (id, role) => {
  return jwt.sign({ id: id.toString(), role }, process.env.REFRESH_TOKEN, {
    expiresIn: "7d",
  });
};

export const loginAdmin = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({
          error: "Failed",
          message: "Username, email, and password are required",
        });
    }

    const admin = await Admin.findOne({ username, email });

    if (!admin) {
      return res
        .status(401)
        .json({ error: "Failed", message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ error: "Failed", message: "Invalid credentials" });
    }

    // Generate tokens
    const accessToken = generateAccessToken(admin._id, "admin");
    const refreshToken = generateRefreshToken(admin._id, "admin");

    // Set refresh token in httpOnly cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // true if in production
      sameSite: "strict", // prevent CSRF
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      message: "Login Successful",
      accessToken,
      // We omit refreshToken from JSON body as it's now in the cookie
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Internal server error", message: error.message });
  }
};

export const refreshAdminToken = async (req, res) => {
  try {
    // Read refresh token from cookies
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res
        .status(401)
        .json({ error: "Failed", message: "Refresh token is required" });
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN);
    if (decoded.role !== "admin") {
      return res
        .status(401)
        .json({ error: "Failed", message: "Invalid or expired refresh token" });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(decoded.id, "admin");
    return res.status(200).json({ accessToken: newAccessToken });
  } catch (error) {
    return res
      .status(401)
      .json({ error: "Failed", message: "Invalid or expired refresh token" });
  }
};

export const logoutAdmin = async (req, res) => {
  try {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

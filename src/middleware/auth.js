import { getAuth } from "firebase-admin/auth";
import { User } from "../models/User.js";
import { Recipe } from "../models/Recipe.js";
import { UserAccess } from "../models/UserAccess.js";
import { firebaseAdminEmail, firebaseApp } from "../config/firebase.js";
import {
  findAvailableUsername,
  isDuplicateUsernameError,
} from "../utils/username.js";

const firebaseAuth = getAuth(firebaseApp);
const INVALID_TOKEN_CODES = new Set([
  "auth/argument-error",
  "auth/id-token-expired",
  "auth/id-token-revoked",
  "auth/invalid-id-token",
  "auth/tenant-id-mismatch",
  "auth/user-disabled",
  "auth/user-not-found",
]);

const getBearerToken = (req) => {
  const authHeader = req.headers.authorization;
  return authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
};

const isGoogleSignIn = (decodedToken) =>
  decodedToken.firebase?.sign_in_provider === "google.com";

const getOrCreateUser = async (firebaseUser) => {
  if (!firebaseUser.uid || !firebaseUser.email) {
    throw new Error("Firebase account must include a user ID and email.");
  }

  let user = await User.findOne({ firebaseUid: firebaseUser.uid });
  if (!user && firebaseUser.email_verified) {
    user = await User.findOne({ email: firebaseUser.email.toLowerCase() });
  }

  if (!user) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const username = await findAvailableUsername({
        displayName: firebaseUser.name,
        email: firebaseUser.email,
      });
      user = new User({
        firebaseUid: firebaseUser.uid,
        username,
        name: firebaseUser.name?.trim() || username,
        fullName: firebaseUser.name?.trim() || username,
        email: firebaseUser.email,
      });

      try {
        await user.save();
        return user;
      } catch (error) {
        if (error.code !== 11000) throw error;

        const existingUser = await User.findOne({
          firebaseUid: firebaseUser.uid,
        });
        if (existingUser) return existingUser;
        if (!isDuplicateUsernameError(error)) throw error;
      }
    }

    throw new Error("Unable to create a unique username for this account.");
  } else {
    const previousFullName = user.fullName || user.name || user.username;
    user.firebaseUid = firebaseUser.uid;
    user.email = firebaseUser.email;
    user.fullName =
      user.fullName || firebaseUser.name?.trim() || previousFullName;
    user.name = user.fullName;
    if (previousFullName !== user.fullName) {
      await Recipe.updateMany(
        { author: user._id },
        { $set: { authorName: user.fullName } }
      );
    }
  }

  await user.save();
  return user;
};

const attachFirebaseUser = async (decodedToken, req, res, next) => {
  try {
    const accessFilter = [{ firebaseUid: decodedToken.uid }];
    if (decodedToken.email_verified && decodedToken.email) {
      accessFilter.push({ email: decodedToken.email.toLowerCase() });
    }
    const access = await UserAccess.findOne({
      $or: accessFilter,
    }).select("status firebaseUid");

    if (access && access.status !== "approved") {
      const code =
        access.status === "requested"
          ? "ACCESS_REQUEST_PENDING"
          : access.status === "denied"
            ? "ACCESS_REQUEST_DENIED"
            : "ACCOUNT_REMOVED";
      const message =
        access.status === "requested"
          ? "Your request to rejoin the platform is awaiting admin review."
          : access.status === "denied"
            ? "Your request to rejoin the platform was not approved."
            : "Your account has been removed. You can request access to rejoin.";
      return res.status(403).json({ error: "Forbidden", code, message });
    }
    if (access && access.firebaseUid !== decodedToken.uid) {
      access.firebaseUid = decodedToken.uid;
      await access.save();
    }

    const user = await getOrCreateUser(decodedToken);
    req.user = {
      id: user._id.toString(),
      firebaseUid: decodedToken.uid,
      role: "user",
      email: user.email,
      username: user.username,
      name: user.fullName,
      fullName: user.fullName,
    };
    next();
  } catch (error) {
    next(error);
  }
};

const verifyFirebaseTokenWithRevocation = async (
  req,
  res,
  next,
  checkRevoked = false
) => {
  const token = getBearerToken(req);
  if (!token) {
    return res
      .status(401)
      .json({ error: "Unauthorized", message: "No Firebase token provided" });
  }

  let decodedToken;
  try {
    decodedToken = await firebaseAuth.verifyIdToken(token, checkRevoked);
  } catch (error) {
    if (checkRevoked && error.code === "app/invalid-credential") {
      console.error("Firebase revocation check is not configured:", {
        requestId: req.requestId,
        errorCode: error.code,
      });
      return res.status(503).json({
        error: "Service Unavailable",
        message:
          "Firebase Admin credentials are required for this operation. Configure FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.",
        requestId: req.requestId,
      });
    }
    if (!INVALID_TOKEN_CODES.has(error.code)) return next(error);
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid or expired Firebase token",
    });
  }

  if (!isGoogleSignIn(decodedToken)) {
    return res.status(403).json({
      error: "Forbidden",
      message: "Only Google sign-in is supported.",
    });
  }

  await attachFirebaseUser(decodedToken, req, res, next);
};

export const verifyFirebaseToken = (req, res, next) =>
  verifyFirebaseTokenWithRevocation(req, res, next);

export const verifyFirebaseTokenRevoked = (req, res, next) =>
  verifyFirebaseTokenWithRevocation(req, res, next, true);

export const optionalVerifyFirebaseToken = async (req, res, next) => {
  const token = getBearerToken(req);
  if (!token) return next();

  let decodedToken;
  try {
    decodedToken = await firebaseAuth.verifyIdToken(token);
  } catch (error) {
    if (INVALID_TOKEN_CODES.has(error.code)) return next();
    return next(error);
  }

  if (!isGoogleSignIn(decodedToken)) {
    return res.status(403).json({
      error: "Forbidden",
      message: "Only Google sign-in is supported.",
    });
  }

  await attachFirebaseUser(decodedToken, req, res, next);
};

export const verifyFirebaseIdentity = async (req, res, next) => {
  const token = getBearerToken(req);
  if (!token) {
    return res
      .status(401)
      .json({ error: "Unauthorized", message: "No Firebase token provided" });
  }

  let decodedToken;
  try {
    decodedToken = await firebaseAuth.verifyIdToken(token);
  } catch (error) {
    if (!INVALID_TOKEN_CODES.has(error.code)) return next(error);
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid or expired Firebase token",
    });
  }

  if (
    !isGoogleSignIn(decodedToken) ||
    !decodedToken.email ||
    !decodedToken.email_verified
  ) {
    return res.status(403).json({
      error: "Forbidden",
      message: "A verified Google account is required.",
    });
  }

  req.firebaseIdentity = decodedToken;
  next();
};

export const verifyAdminFirebaseToken = async (req, res, next) => {
  const token = getBearerToken(req);
  if (!token) {
    return res
      .status(401)
      .json({ error: "Unauthorized", message: "No Firebase token provided" });
  }

  let decodedToken;
  try {
    decodedToken = await firebaseAuth.verifyIdToken(token);
  } catch (error) {
    if (!INVALID_TOKEN_CODES.has(error.code)) return next(error);
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid or expired Firebase token",
    });
  }

  if (
    !isGoogleSignIn(decodedToken) ||
    !decodedToken.email ||
    !decodedToken.email_verified ||
    decodedToken.email.toLowerCase() !== firebaseAdminEmail
  ) {
    return res.status(403).json({
      error: "Forbidden",
      message: "Admin access requires an authorized Google account.",
    });
  }

  req.user = {
    id: decodedToken.uid,
    firebaseUid: decodedToken.uid,
    role: "admin",
    email: decodedToken.email,
  };
  next();
};

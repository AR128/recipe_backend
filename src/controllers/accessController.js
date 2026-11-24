import { UserAccess } from "../models/UserAccess.js";
import { sendControllerError } from "../utils/controllerError.js";

export const requestPlatformAccess = async (req, res) => {
  try {
    const identity = req.firebaseIdentity;
    let access = await UserAccess.findOne({ firebaseUid: identity.uid });
    if (!access) {
      access = await UserAccess.findOne({
        email: identity.email.toLowerCase(),
      });
    }

    if (!access) {
      return res.status(409).json({
        error: "Conflict",
        message: "There is no removal record for this account.",
      });
    }
    if (access.status === "approved") {
      return res.status(409).json({
        error: "Conflict",
        code: "ACCESS_ALREADY_APPROVED",
        message:
          "Your access has already been approved. Sign in again to continue.",
      });
    }
    access.email = identity.email.toLowerCase();
    access.firebaseUid = identity.uid;
    access.displayName = identity.name || access.displayName;
    if (access.status === "requested") {
      await access.save();
      return res.status(200).json({
        message: "Your request is already awaiting admin review.",
        status: access.status,
      });
    }

    access.status = "requested";
    access.requestedAt = new Date();
    await access.save();

    res.status(200).json({
      message: "Your request to rejoin has been sent to the admin.",
      status: access.status,
    });
  } catch (error) {
    return sendControllerError(req, res, error, "requestPlatformAccess");
  }
};

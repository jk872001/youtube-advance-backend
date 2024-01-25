import { Router } from "express";
import {
  changeCurrentPassword,
  getCurrentUser,
  getUserChannelProfile,
  getWatchHistory,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares.js/multer.middleware.js";
import { verifyJWT } from "../middlewares.js/auth.mddleware.js";

const userRouter = Router();

userRouter.post(
  "/registerUser",
  upload.fields([
    {
      name: "avatar",
      maxfile: 1,
    },
    {
      name: "coverImage",
      maxfile: 1,
    },
  ]),

  registerUser
);
userRouter.post("/loginUser", loginUser);
userRouter.post("/logoutUser", verifyJWT, logoutUser);
userRouter.post("/refresh-token", refreshAccessToken);
userRouter.post("/change-password", verifyJWT, changeCurrentPassword);
userRouter.get("/get-current-user", verifyJWT, getCurrentUser);
userRouter.post("/update-account-details", verifyJWT, updateAccountDetails);
userRouter.post(
  "/update-user-avatar",
  upload.single("avatar"),
  verifyJWT,
  updateUserAvatar
);
userRouter.post(
  "/update-user-coverImage",
  upload.single("coverImage"),
  verifyJWT,
  updateUserCoverImage
);
userRouter.get("/c/:username", verifyJWT, getUserChannelProfile);
userRouter.get("/history", verifyJWT, getWatchHistory);
export { userRouter };

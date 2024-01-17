import { Router } from "express";
import {
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
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
userRouter.post("/logoutUser",verifyJWT, logoutUser);
userRouter.post("/refresh-token", refreshAccessToken);

export { userRouter };

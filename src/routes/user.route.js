import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares.js/multer.middleware.js";

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

export { userRouter };

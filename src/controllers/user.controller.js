import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, username, email, password } = req.body;

  //  All fields non-empty validation
  if (
    [fullName, username, email, password].some((field) => field?.trim === "")
  ) {
    throw new ApiError(400, "Please fill all the fields");
  }

  const isUserExists = await User.findOne({ $or: [{ username }, { email }] });
  if (isUserExists) {
    throw new ApiError(409, "User already exists");
  }

  let avatarLocalFilePath;
  if (req.files && Array.isArray(req.files.avatar) && req.files.avatar.length>0) {
     avatarLocalFilePath = req.files.avatar[0]?.path;
  } 
  let coverImageLocalFilePath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalFilePath = req.files.coverImage[0]?.path;
  }

  if (!avatarLocalFilePath) {
    throw new ApiError(400, "Please upload avatar ");
  }

  const avatar = await uploadOnCloudinary(avatarLocalFilePath);
  const coverImage = await uploadOnCloudinary(coverImageLocalFilePath);

      if (!avatar) {
    throw new ApiError(400, "Please upload avatar");
  }

  const createUser = await User.create({
    fullName,
    email,
    username: username.toLowerCase(),
    password,
    avatar: avatar?.url,
    coverImage: coverImage?.url || "",
  });

  const userFind =  await User.findById(createUser._id).select("-password -refreshToken");
  

  if (!userFind) {
    throw new ApiError(500, "Something went wrong in creating the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200,userFind,"User registered successfully"));
});

export { registerUser };

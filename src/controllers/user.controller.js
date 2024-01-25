import jwt from "jsonwebtoken";
import { options } from "../constants/cookie.js";
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
  if (
    req.files &&
    Array.isArray(req.files.avatar) &&
    req.files.avatar.length > 0
  ) {
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

  // here we are finding user again by id for ensuring user is created or not
  const userFind = await User.findById(createUser._id).select(
    "-password -refreshToken"
  );

  if (!userFind) {
    throw new ApiError(500, "Something went wrong in creating the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, userFind, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if (!(email || username)) {
    throw new ApiError(400, "Please fill the username or email");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(400, "User not exists");
  }

  const isPasswordCorrect = await user.isPasswordCorrect(password);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessOrRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1, // this removes the field from document
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookie?.refreshToken || req.body?.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorised access");
  }

  const decodedToken = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );
  if (!decodedToken) {
    throw new ApiError(401, "Unauthorised access");
  }

  const user = await User.findById(decodedToken?._id);
  if (!user) {
    throw new ApiError(401, "Invalid token");
  }

  if (incomingRefreshToken !== user?.refreshToken) {
    throw new ApiError(401, "Invalid token");
  }

  const { accessToken, refreshToken } = await generateAccessOrRefreshToken(
    user?._id
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken)
    .cookie("refreshToken", refreshToken)
    .json(
      new ApiResponse(
        200,
        { accessToken, refreshToken },
        "Access token refreshed"
      )
    );
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!(oldPassword && newPassword)) {
    throw new ApiError(400, "Please fill all the fields");
  }

  const user = await User.findById(req.user?._id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Wrong credentials");
  }

  user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
});

const getCurrentUser=asyncHandler(async(req,res)=>{
     return res.status(200).json(new ApiResponse(200,req.user,"User fetched"))
})

const updateAccountDetails=asyncHandler(async(req,res)=>{
       const {fullName,email}=req.body
       if([fullName,email].some((ele)=>ele?.trim==="")){
          throw new ApiError(400,"Please fill all the fields")
       }
       
       const user=await User.findByIdAndUpdate(req.user?._id,{
        $set:{
          fullName,email
        }
       },{new:true}).select("-password")

       return res.status(200).json(new ApiResponse(200,user,"Account details updated"))


})

const updateUserAvatar=asyncHandler(async(req,res)=>{
    const avatarLocalPath= req.file?.path;
    if(!avatarLocalPath){
      throw new ApiError(400,"Please upload the file")
    }

    // todo -> delete the imag from the cloudinary

    const avatar=await uploadOnCloudinary(avatarLocalPath)

    if(!avatar?.url){
      throw new ApiError(400,"Error in uploading the avatar")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,{
      $set:{
        avatar:avatar.url
      }
    },{new:true}).select("-password")

    return res.status(200).json(new ApiResponse(200,user,"Avatar updated"))


    
})

const updateUserCoverImage=asyncHandler(async(req,res)=>{
    const coverImageLocalPath= req.file?.path;

    if(!coverImageLocalPath){
      throw new ApiError(400,"Please upload the file")
    }

    // todo -> delete the imag from the cloudinary

    const coverImage=await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage?.url){
      throw new ApiError(400,"Error in uploading the avatar")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,{
      $set:{
        coverImage:coverImage.url
      }
    },{new:true}).select("-password")

    return res.status(200).json(new ApiResponse(200,user,"Cover Image updated"))


    
})

const getUserChannelProfile = asyncHandler(async(req, res) => {
  const {username} = req.params

  if (!username?.trim()) {
      throw new ApiError(400, "username is missing")
  }

  const channel = await User.aggregate([
      {
          $match: {
              username: username?.toLowerCase()
          }
      },
      {
          $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribers"
          }
      },
      {
          $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "subscriber",
              as: "subscribedTo"
          }
      },
      {
          $addFields: {
              subscribersCount: {
                  $size: "$subscribers"
              },
              channelsSubscribedToCount: {
                  $size: "$subscribedTo"
              },
              isSubscribed: {
                  $cond: {
                      if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                      then: true,
                      else: false
                  }
              }
          }
      },
      {
          $project: {
              fullName: 1,
              username: 1,
              subscribersCount: 1,
              channelsSubscribedToCount: 1,
              isSubscribed: 1,
              avatar: 1,
              coverImage: 1,
              email: 1

          }
      }
  ])

  if (!channel?.length) {
      throw new ApiError(404, "channel does not exists")
  }

  return res
  .status(200)
  .json(
      new ApiResponse(200, channel[0], "User channel fetched successfully")
  )
})

const getWatchHistory = asyncHandler(async(req, res) => {
  const user = await User.aggregate([
      {
          $match: {
              _id: new mongoose.Types.ObjectId(req.user._id)
          }
      },
      {
          $lookup: {
              from: "videos",
              localField: "watchHistory",
              foreignField: "_id",
              as: "watchHistory",
              pipeline: [
                  {
                      $lookup: {
                          from: "users",
                          localField: "owner",
                          foreignField: "_id",
                          as: "owner",
                          pipeline: [
                              {
                                  $project: {
                                      fullName: 1,
                                      username: 1,
                                      avatar: 1
                                  }
                              }
                          ]
                      }
                  },
                  {
                      $addFields:{
                          owner:{
                              $first: "$owner"
                          }
                      }
                  }
              ]
          }
      }
  ])

  return res
  .status(200)
  .json(
      new ApiResponse(
          200,
          user[0].watchHistory,
          "Watch history fetched successfully"
      )
  )
})


const generateAccessOrRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (err) {
    throw new ApiError(500, err.message);
  }
};

export { registerUser, loginUser, logoutUser, refreshAccessToken ,changeCurrentPassword,getCurrentUser,updateAccountDetails,updateUserCoverImage,updateUserAvatar,getUserChannelProfile,getWatchHistory};

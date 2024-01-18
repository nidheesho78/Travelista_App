import asyncHandler from 'express-async-handler'
import User from '../models/userModels.js'
import generateToken from '../utils/userJWT.js'
import Blog from '../models/createBlog.js';
import jwt from 'jsonwebtoken'
import axios from 'axios';
import nodemailer from 'nodemailer'
import Banner from '../models/bannerSchema.js';
import Comment from '../models/commentBlog.js'
import { formatDistanceToNow } from 'date-fns'




// Orginal sign in
const authUser = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user) {
      if (user.status) {
        res.status(401);
        throw new Error("Your account is temporarily blocked");
      }

      if (!user.verified) {
        res.status(401);
        throw new Error("Your account is not verified");
      }

      if (await user.matchPassword(password)) {
        const token = generateToken(res, user._id);
        console.log("token:", token);

        res.status(201).json({
          _id: user._id,
          name: user.name,
          email: user.email,
          profileImage: user.profileImage,
          mobile: user.mobile,
          status: user.status,
          token,
        });
      } else {
        res.status(401);
        throw new Error("Invalid email or password");
      }
    } else {
      res.status(401);
      throw new Error("Invalid email or password");
    }
  } catch (error) {
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
});





//^----------------testing-otp----------------------------------------
//verification


const verifyOTP = asyncHandler(async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Compare the user's stored OTP with the provided OTP
    if (user.otp === otp) {
      // Update the verified field to true
      user.verified = true;

      // Save the user object with the updated verified field
      await user.save();

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        status: user.status,
        verified: user.verified,
      });
    } else {
      res.status(400).json({ message: "Invalid OTP" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
});




//resendOtp

const resendOtp = asyncHandler(async(req,res)=>{
  try {
    const userId = req.user._id; // Assuming you have access to the user ID from the authenticated session
    // console.log("---------");
    // console.log(userId);
    // console.log("-------------");
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate a new OTP
    const newOtp = Math.floor(1000 + Math.random() * 9000);
    
    // Update the user's OTP in the database
    user.otp = newOtp;
    await user.save();

    // Send the new OTP to the user's email
    await sendOTPByEmail(user.email, newOtp);

    res.status(200).json({ message: 'OTP resent successfully' });
  } catch (error) {
    console.error('Error while resending OTP:', error);
    res.status(500).json({ message: 'An error occurred while resending OTP' });
  }
})







//?--------------------------------------------------------------------------------
const sendOTPByEmail = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: {
        user: process.env.SENDER_EMAIL,
        pass: process.env.GENERATE_ETHREAL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: "OTP Verification",
      text: `Your OTP for verification is: ${otp}`,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    // Handle errors, log, or throw as needed
    console.error("Error sending OTP email:", error.message);
    throw new Error("Error sending OTP email");
  }
};





const registerUser = asyncHandler(async (req, res) => {
  try {
    const { name, email, password, mobile } = req.body;
    console.log(req.body);
    const userExists = await User.findOne({ email: email });

    if (password.length < 6) {
      res.status(400);
      throw new Error("Password must be at least 6 characters long");
    }

    // Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000);

    if (userExists) {
      // User exists, update user data if verified is false
      if (!userExists.verified) {
        userExists.name = name;
        userExists.mobile = mobile;
        userExists.password = password;
        userExists.otp = otp;
        await userExists.save();

        // Send OTP to user's email
        await sendOTPByEmail(email, otp);

        const token = generateToken(res, userExists._id);
        res.status(200).json({
          message: "User data updated successfully",
          token,
        });
      } else {
        res.status(400);
        throw new Error("User already exists and is verified");
      }
    } else {
      // User doesn't exist, create a new user
      const user = await User.create({
        name,
        email,
        password,
        mobile,
        otp,
      });

      if (user) {
        // Send OTP to user's email
        await sendOTPByEmail(email, otp);

        const token = generateToken(res, user._id);
        res.status(201).json({
          message: "User registered successfully",
          token,
        });
      } else {
        res.status(400);
        throw new Error("Invalid user data");
      }
    }
  } catch (error) {
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
});





//^----------------GOOGLE-AUTH-----------------------------------------

const googleAuth = asyncHandler(async (req, res) => {
  try {
    const { user_id, name, email, profileGoogleImage } = req.body; // Assuming these fields are part of the user object from Google Sign-In

    // Check if the user already exists
    let user = await User.findOne({ email });

    if (user) {
      if (!user.verified) {
        res.status(401);
        throw new Error("Your account is not verified");
      }

      if (user.status) {
        res.status(401);
        throw new Error("Your account is temporarily blocked");
      }

      // User exists, generate token and send success response
      generateToken(res, user._id);
      res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        profileGoogleImage: user.profileGoogleImage,
        status: user.status,
      });
    } else {
      // User doesn't exist, create a new user
      user = await User.create({
        name,
        email,
        profileGoogleImage,
        verified: true,
      });

      if (user) {
        generateToken(res, user._id);
        res.status(201).json({
          _id: user._id,
          name: user.name,
          email: user.email,
          profileGoogleImage: user.profileGoogleImage,
        });
      } else {
        res.status(400);
        throw new Error("Invalid user data");
      }
    }
  } catch (error) {
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
});



//^--------------------------------------------------------------------


const logoutUser = asyncHandler(async (req, res) => {
  try {
    res.cookie("jwt", "", {
      httpOnly: true,
      expires: new Date(0),
    });

    res.status(200).json({ message: "User logged out" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
});


const getUserProfile = asyncHandler(async (req, res) => {
  try {
    const user = {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      mobile: req.user.mobile,
    };

    console.log("user", user);

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
});


const updateUserProfile = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.mobile = req.body.mobile || user.mobile;

      if (req.body.password) {
        user.password = req.body.password;
      }

      if (req.file) {
        // Assuming you have a 'profileImage' field in the User schema
        user.profileImage = req.file.filename;
      }

      const updatedUser = await user.save();

      res.status(200).json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        mobile: updatedUser.mobile,
        profileImage: updatedUser.profileImage, // Include profileImage in the response
      });
    } else {
      res.status(404);
      throw new Error("User not found");
    }
  } catch (error) {
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
});



const getUserStatus = asyncHandler(async (req, res) => {
  try {
    const userId = req.params.userId; // Get user ID from the route parameter
    const user = await User.findById(userId);

    if (user) {
      res.status(200).json({ status: user.status }); // Send the user's status
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
});


 

const getAuthorDetailsById = asyncHandler(async (req, res) => {
  const userId = req.params.userId;

  try {
    const foundUser = await User.findById(userId);

    if (!foundUser) {
      res.status(404);
      throw new Error('User not found');
    }

    res.status(200).json({
      _id: foundUser._id,
      name: foundUser.name,
      email: foundUser.email,
      profileImage: foundUser.profileImage,
      // Include other user details as needed
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Follow a user
const followUser = asyncHandler(async (req, res) => {
  const authorId = req.params.userId;
  const currentUserId = req.user._id; // Assuming you have the user object in req.user

  try {
    // Update author's followers
    await User.findByIdAndUpdate(authorId, { $addToSet: { followers: currentUserId } });

    // Update current user's following
    await User.findByIdAndUpdate(currentUserId, { $addToSet: { following: authorId } });

    res.status(200).json({ message: 'Followed successfully' });
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Unfollow a user
const unfollowUser = asyncHandler(async (req, res) => {
  const authorId = req.params.userId;
  const currentUserId = req.user._id; // Assuming you have the user object in req.user

  try {
    // Update author's followers
    await User.findByIdAndUpdate(authorId, { $pull: { followers: currentUserId } });

    // Update current user's following
    await User.findByIdAndUpdate(currentUserId, { $pull: { following: authorId } });

    res.status(200).json({ message: 'Unfollowed successfully' });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Check if the current user is following the specified user
const checkFollowing = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id; // Assuming you've set req.user from the authentication middleware
  const targetUserId = req.params.userId;

  try {
    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ message: 'Current user not found' });
    }

    const isFollowing = currentUser.following.includes(targetUserId);
    res.json({ isFollowing });
  } catch (error) {
    console.error('Error checking following status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
 const checkAuth = async (req, res) => {
   const token = req.cookies.jwt;

   if (!token) {
     return res.status(401).json({ message: "Unauthorized" });
   }

   try {
     const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
     // Perform any necessary checks or queries using decodedToken.userId
     // ...

     res.status(200).json({ message: "Authorized" });
   } catch (error) {
     return res.status(401).json({ message: "Unauthorized" });
   }
 };

const getFollowerFollowingCount = asyncHandler(async (req, res) => {
  const userId = req.params.userId;

  try {
    const user = await User.findById(userId);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    const followerCount = user.followers.length;
    const followingCount = user.following.length;

    res.status(200).json({ followerCount, followingCount });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

const followingList = asyncHandler(async (req, res) => {
  const currentUserID = req.user._id; // User object attached by the authentication middleware

  try {
    // Find the current user by their ID
    const currentUser = await User.findById(currentUserID);

    if (!currentUser) {
      res.status(404);
      throw new Error('User not found');
    }

    // Fetch the following list of the current user with profileImage and name
    const followingList = await User.find({ _id: { $in: currentUser.following } })
      .select('profileImage profileGoogleImage name')
      .lean(); // Convert Mongoose documents to plain JavaScript objects

    res.json(followingList);
  } catch (error) {
    res.status(500);
    throw new Error('Server error');
  }
});

const followersList = asyncHandler(async (req, res) => {
  const currentUserID = req.user._id; // User object attached by the authentication middleware

  try {
    // Find the current user by their ID
    const currentUser = await User.findById(currentUserID);

    if (!currentUser) {
      res.status(404);
      throw new Error('User not found');
    }

    // Fetch the following list of the current user with profileImage and name
    const followersList = await User.find({ _id: { $in: currentUser.followers } })
      .select('profileImage profileGoogleImage name')
      .lean(); // Convert Mongoose documents to plain JavaScript objects

    res.json(followersList);
  } catch (error) {
    res.status(500);
    throw new Error('Server error');
  }
});
  
const getOtherUserFollowersList = asyncHandler(async (req, res) => {
  const userId = req.params.OtherUserId; // Get the user ID from the URL parameter

  try {
    // Find the user by ID
    const otheruser = await User.findById(userId);

    if (!otheruser) {
      res.status(404);
      throw new Error('User not found');
    }

    // Fetch the followers list of the other user with profileImage and name
    const followersList = await User.find({ _id: { $in: otheruser.followers } })
      .select('profileImage profileGoogleImage name')
      .lean(); // Convert Mongoose documents to plain JavaScript objects

    res.json(followersList);
  } catch (error) {
    res.status(500);
    throw new Error('Server error');
  }
});

const getOtherUserFollowingList = asyncHandler(async (req, res) => {
  const userId = req.params.OtherUserId; // Get the user ID from the URL parameter

  try {
    // Find the user by ID
    const otheruser = await User.findById(userId);

    if (!otheruser) {
      res.status(404);
      throw new Error('User not found');
    }

    // Fetch the followers list of the other user with profileImage and name
    const followingList = await User.find({ _id: { $in: otheruser.following } })
      .select('profileImage profileGoogleImage name')
      .lean(); // Convert Mongoose documents to plain JavaScript objects

    res.json(followingList);
  } catch (error) {
    res.status(500);
    throw new Error('Server error');
  }
});


const LikedUsers = asyncHandler(async (req, res) => {
  const blogId = req.params.blogId; // Get the blog ID from the URL parameter

  try {
    // Find the blog by ID
    const blog = await Blog.findById(blogId);

    if (!blog) {
      res.status(404);
      throw new Error('Blog not found');
    }

    // Fetch the liked users based on their IDs in the 'likes' array of the blog
    const likedUserIds = blog.likes; // Array of user IDs who liked the blog
    const likedUsers = await User.find({ _id: { $in: likedUserIds } })
      .select('profileImage profileGoogleImage name') // Select the desired fields
      .lean(); // Convert Mongoose documents to plain JavaScript objects

    res.json(likedUsers);
  } catch (error) {
    res.status(500);
    throw new Error('Server error');
  }
});


const getSelectedBanner = asyncHandler(async (req, res) => {
  try {
    const selectedBanner = await Banner.findOne({ selected: true });
    if (!selectedBanner) {
      // return res.status(404).json({ message: 'No selected banner found' });
      return res.status(200).send();
    }

    res.status(200).json(selectedBanner);
  } catch (error) {
    console.error('Error fetching selected banner:', error);
    res.status(500).json({ message: 'Error fetching selected banner' });
  }
});


export {
    authUser,
    registerUser,
    logoutUser,
    getUserProfile,
    updateUserProfile,
    getUserStatus,
    checkAuth,
    getAuthorDetailsById,
    unfollowUser,
    followUser,
    checkFollowing,
    getFollowerFollowingCount,
    resendOtp,
    verifyOTP,
    googleAuth,
    followingList,
    followersList,
    getOtherUserFollowersList,
    getOtherUserFollowingList,
    LikedUsers,
    getSelectedBanner,
  
   
};
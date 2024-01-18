import express from "express";
import multer from 'multer';
import {
  authUser,
  registerUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  LikedUsers,
  getSelectedBanner,
  getOtherUserFollowingList,
  getOtherUserFollowersList,
  followingList,
  followersList,
  resendOtp,
  googleAuth,
  verifyOTP,
  getFollowerFollowingCount,
  followUser,
  checkFollowing,
  unfollowUser,
  getAuthorDetailsById,
  getUserStatus,
  checkAuth,
 
} from "../controllers/userControllers.js";
import { protect } from "../middleware/authMiddleware.js";
import checkUserStatus from "../middleware/checkStatus.js";
const router = express.Router();


// Configure Multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads'); // Destination folder for uploaded images
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + '-' + file.originalname);
    },
  });
  



  const upload = multer({ storage: storage });

  


router.post('/auth',authUser)
router.post('/register',registerUser)
router.post('/logout',logoutUser)
router.get('/profile',protect,getUserProfile)//--------------------------------preventing blockeduser
router.use('/uploads', express.static('uploads'));
router.put('/editProfile',protect,upload.single('profileImage'),updateUserProfile);
router.get('/status/:userId', getUserStatus);
router.get('/checkAuth', checkAuth);
router.get('/authorProfile/:userId', getAuthorDetailsById);
router.post('/follow/:userId', protect, followUser);
router.post('/unfollow/:userId', protect, unfollowUser);
router.get('/checkFollowing/:userId', protect, checkFollowing);
router.get('/followerFollowingCount/:userId', protect,getFollowerFollowingCount);
router.post('/googleAuth',googleAuth)
router.post('/verifyOtp', verifyOTP);
router.get('/resendOtp',protect,resendOtp)
router.get('/followingList',protect,followingList)
router.get('/followersList',protect,followersList)
router.get('/otherUserfollowersList/:OtherUserId', getOtherUserFollowersList);
router.get('/otherUserfollowingList/:OtherUserId', getOtherUserFollowingList);
router.get('/LikedUsers/:blogId', LikedUsers);
router.get('/selectedBanner', getSelectedBanner);





export default router;

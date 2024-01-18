import express from 'express';

import { protect } from '../middleware/authMiddleware.js';
import multer from 'multer';
import {
  allUsersBlogs,
  allUsersBlogsInLadning,
  createBlog,
  getOneBlog,
  getUserBlogs,
  deleteBlog,
  saveBlogToUser,
  getSavedBlogs,
  getSavedSingleBlog,
  deleteSavedBlog,
  updateBlog,
  likeBlog,
  getBlogLikeCount,
  checkBlogLikeStatus,
  getAuthorBlogs,
  reportBlog,
  topThreePost,
} from "../controllers/blogControllers.js";
const blogRoutes = express.Router();

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

 
blogRoutes.use('/uploads', express.static('uploads'));
blogRoutes.post('/blogs', protect, upload.array('images',10), createBlog);
blogRoutes.get("/blogs", protect, getUserBlogs);
blogRoutes.get("/allBlogs", allUsersBlogs);
blogRoutes.get("/getOneBlog/:blogId", getOneBlog);
blogRoutes.get("/allBlogsLanding", allUsersBlogsInLadning);
blogRoutes.delete("/deleteBlog/:blogId", protect, deleteBlog);
blogRoutes.post("/saveBlog/:blogId", protect, saveBlogToUser);
blogRoutes.get("/getSavedBlogs", protect, getSavedBlogs);
blogRoutes.get("/getSavedSingleBlog/:blogId", getSavedSingleBlog);
blogRoutes.delete("/deleteSavedBlog/:blogId", protect, deleteSavedBlog);
blogRoutes.put("/updateBlog/:blogId", protect, updateBlog);
blogRoutes.post("/likeBlog/:blogId", protect, likeBlog);
blogRoutes.get("/countLike/:blogId", getBlogLikeCount);
blogRoutes.get("/checkLike/:blogId", protect, checkBlogLikeStatus);
blogRoutes.route("/getUserBlogs/:userId").get(protect, getAuthorBlogs); 
blogRoutes.post("/reportBlog/:blogId", protect, reportBlog);
blogRoutes.get("/topThreepost", topThreePost);






export default blogRoutes;
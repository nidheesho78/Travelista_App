
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






export const createBlog = asyncHandler(async (req, res) => {
  try {
    // console.log(req.body); // Check the received body
    // console.log(req.files);
    const { title, summary, content, author } = req.body;
    
    const files = req.files.map(file => file.path); // Get an array of file paths
    console.log('Uploaded Files:', files);

    const newBlog = new Blog({
      title,
      summary,
      content,
      images: files,
      author,
    });
  
    const createdBlog = await newBlog.save();
  
    res.status(201).json(createdBlog);
  } catch (error) {
    res.status(500).json({ message: 'Blog creation failed.' });
  }
});

 export const getUserBlogs = asyncHandler(async (req, res) => {
    try {
      // Get the user ID from the authenticated user
      const userId = req.user._id;
  
      // Fetch blogs with the given user ID
      const blogs = await Blog.find({ author: userId })
        .select('title summary createdAt images') // Only select specific fields
        .sort({ createdAt: -1 }); // Sort by creation date in descending order
  
      res.status(200).json(blogs);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching blogs.' });
    }
  });


export const allUsersBlogs = asyncHandler(async (req, res) => {
    try {
      // Fetch all blogs in db oredr like latest first
      const blogs = await Blog.find({})
        .select("title summary createdAt images") // Only select specific fields
        .sort({ createdAt: -1 }); // Sort by creation date in descending order

      res.status(200).json(blogs);
    } catch (error) {
      res.status(500).json({ message: "Error fetching blogs." });
    }
  });

  export const allUsersBlogsInLadning = asyncHandler(async (req, res) => {
    try {
      // Fetch all blogs in db oredr like latest first
      const blogs = await Blog.find({})
        .select("title summary createdAt images") // Only select specific fields
        .sort({ createdAt: -1 }); // Sort by creation date in descending order

      res.status(200).json(blogs);
    } catch (error) {
      res.status(500).json({ message: "Error fetching blogs." });
    }
  });

  export const getOneBlog = async (req, res) => {
    const { blogId } = req.params;

    try {
      const blog = await Blog.findById(blogId)
        .populate("author", "name") // Populate author info
        .exec();

      if (!blog) {
        return res.status(404).json({ message: "Blog not found." });
      }

      res.status(200).json(blog);
    } catch (error) {
      res.status(500).json({ message: "Error fetching the blog." });
    }
  };


  
export const deleteBlog = asyncHandler(async (req, res) => {
  const blogId = req.params.blogId;
  // console.log('Deleting blog with ID:', blogId);

  try {
    const blog = await Blog.findByIdAndDelete(blogId);
    // console.log('Deleted blog:', blog);
    if (!blog) {
      res.status(404).json({ message: "Blog not found" });
    } else {
      res.json({ message: "Blog deleted successfully" });
    }
  } catch (error) {
    console.error("Error deleting blog:", error);
    res
      .status(500)
      .json({ message: "An error occurred while deleting the blog" });
  }
});

export const saveBlogToUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const blogId = req.params.blogId;

  try {
    const user = await User.findById(userId); // Find the user

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const blog = await Blog.findById(blogId); // Find the blog

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // Check if the blog is already saved, if not, add it
    const alreadySaved = user.savedTales.some((savedBlog) =>
      savedBlog.blogId.equals(blogId)
    );

    if (!alreadySaved) {
      user.savedTales.push({
        blogId: blogId,
        title: blog.title,
        summary: blog.summary,
        createdAt: blog.createdAt,
        images: blog.images.length > 0 ? [blog.images[0]] : [], // Store the first image URL if available
      });

      await user.save();
      res.json({ message: "Blog saved successfully" });
    } else {
      res.json({ message: "Blog already saved" });
    }
  } catch (error) {
    console.error("Error saving blog:", error);
    res
      .status(500)
      .json({ message: "An error occurred while saving the blog" });
  }
});

export const getSavedBlogs = asyncHandler(async (req, res) => {
  const userId = req.user._id; // Assuming req.user contains the authenticated user's data

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const savedBlogs = user.savedTales;
    res.json(savedBlogs);
  } catch (error) {
    console.error("Error fetching saved blogs:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching saved blogs" });
  }
});

export const getSavedSingleBlog = async (req, res) => {
  const blogId = req.params.blogId;

  try {
    const blog = await Blog.findOne({ _id: blogId })
      .populate("author", "name")
      .exec();

    if (!blog) {
      return res.status(404).json({ message: "Blog not found." });
    }

    res.status(200).json(blog);
  } catch (error) {
    console.error("Error fetching the blog:", error);
    res.status(500).json({ message: "Error fetching the blog." });
  }
};

// Delete a saved blog
export const deleteSavedBlog = async (req, res) => {
  const userId = req.user._id; // Assuming you have the user's ID from authentication
  const blogId = req.params.blogId;

  try {
    // Find the user by ID and update the savedTales array
    const user = await User.findByIdAndUpdate(userId, {
      $pull: { savedTales: { blogId } },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({ message: "Blog deleted successfully." });
  } catch (error) {
    console.error("Error deleting saved blog:", error);
    res.status(500).json({ message: "Error deleting saved blog." });
  }
};

export const updateBlog = asyncHandler(async (req, res) => {
  const { blogId } = req.params;
  const { title, summary, content } = req.body;

  try {
    const updatedBlog = await Blog.findByIdAndUpdate(
      blogId,
      {
        title,
        summary,
        content,
      },
      { new: true } // Return the updated document
    );

    if (!updatedBlog) {
      return res.status(404).json({ message: "Blog not found." });
    }

    // Update the savedTales field in user collection
    const updatedUsers = await User.updateMany(
      { "savedTales.blogId": blogId },
      { $set: { "savedTales.$.title": title, "savedTales.$.summary": summary } }
    );

    if (updatedUsers.nModified > 0) {
      // nModified indicates the number of documents modified
      res.json({
        message: "Blog and savedTales updated successfully",
        updatedBlog,
      });
    } else {
      res.json({ message: "Blog updated successfully", updatedBlog });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// controllers/userControllers.js
export const likeBlog = asyncHandler(async (req, res) => {
  const { blogId } = req.params;
  const userId = req.user._id;

  try {
    const blog = await Blog.findById(blogId);

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    const userLikedIndex = blog.likes.indexOf(userId);

    if (userLikedIndex === -1) {
      // User hasn't liked the blog, add their ID to the likes array
      blog.likes.push(userId);
    } else {
      // User has liked the blog, remove their ID from the likes array
      blog.likes.splice(userLikedIndex, 1);
    }

    await blog.save();

    res.json({ message: "Like/unlike successful" });
  } catch (error) {
    console.error("Error liking/unliking blog:", error);
    res
      .status(500)
      .json({ message: "An error occurred while liking/unliking the blog" });
  }
});

// controllers/userControllers.js
export const getBlogLikeCount = asyncHandler(async (req, res) => {
  const { blogId } = req.params;

  try {
    const blog = await Blog.findById(blogId);

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    const likeCount = blog.likes.length;
    res.json({ likeCount });
  } catch (error) {
    console.error("Error fetching like count:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching the like count" });
  }
});

export const checkBlogLikeStatus = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const blogId = req.params.blogId;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const blog = await Blog.findById(blogId);

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    const userLiked = blog.likes.includes(userId);

    res.json({ userLiked });
  } catch (error) {
    console.error("Error checking like status:", error);
    res
      .status(500)
      .json({ message: "An error occurred while checking like status" });
  }
});

  
export const getAuthorBlogs = asyncHandler(async (req, res) => {
  try {
    const userId = req.params.userId;

    // Fetch blogs with the given user ID
    const blogs = await Blog.find({ author: userId })
      .select("title summary createdAt images") // Only select specific fields
      .sort({ createdAt: -1 }); // Sort by creation date in descending order

    res.status(200).json(blogs);
  } catch (error) {
    res.status(500).json({ message: "Error fetching blogs." });
  }
});

export const reportBlog = asyncHandler(async (req, res) => {
  const { blogId } = req.params;
  const { reason } = req.body;
  const userId = req.user._id;

  try {
    const blog = await Blog.findById(blogId);

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    const hasReported = blog.reportBlog.some(
      (report) => report.userId.toString() === userId.toString()
    );

    if (hasReported) {
      return res
        .status(400)
        .json({ message: "You have already reported this blog" });
    }

    blog.reportBlog.push({ userId, reason });
    await blog.save();

    res.status(200).json({ message: "Blog reported successfully" });
  } catch (error) {
    console.error("Error reporting blog:", error);
    res.status(500).json({ message: "Error reporting blog" });
  }
});

export const topThreePost = asyncHandler(async (req, res) => {
  try {
    // Find the top 3 most liked blogs, sorted in descending order by the number of likes
    const topBlogs = await Blog.find()
      .sort({ likes: -1 })
      .limit(3)
      .select("_id images title summary")
      .lean(); // Use lean() to convert Mongoose document to plain JavaScript object

    res.status(200).json(topBlogs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

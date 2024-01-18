
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


export const postComment = asyncHandler(async (req, res) => {
  const { blogId } = req.params;
  const { text } = req.body;
  const userId = req.user._id;

  // console.log(blogId, text, userId);

  const comment = new Comment({
    user: userId,
    content: text,
    blog: blogId
  });

  try {
    const savedComment = await comment.save();
    res.status(200).json(savedComment);
  } catch (error) {
    res.status(500).json({ message: 'Comment could not be added' });
  }
});





export const getComments = asyncHandler(async (req, res) => {
  const { blogId } = req.params;
  const currentUserId = req.user._id; // Assuming req.user is properly populated

  try {
    let comments = await Comment.find({ blog: blogId })
      .populate('user', 'name')
      .select('content createdAt user');

    const currentUserComments = [];
    const otherComments = [];

    // Separate comments made by the current user and other comments
    comments.forEach(comment => {
      if (comment.user._id.toString() === currentUserId.toString()) {
        currentUserComments.push(comment);
      } else {
        otherComments.push(comment);
      }
    });

    // Sort the comments array: current user's comments first, then by createdAt for other comments
    comments = [...currentUserComments, ...otherComments.sort((a, b) => b.createdAt - a.createdAt)];

 // Format the createdAt field to a readable date and time
 comments.forEach(comment => {
  comment.createdAt = formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true });
});
    // console.log('Fetched comments:', comments);
    res.json({ comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Error fetching comments' });
  }
});



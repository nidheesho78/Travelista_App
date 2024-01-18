import express from 'express';
import { getComments, postComment } from '../controllers/commentControllers.js';
import { protect } from '../middleware/authMiddleware.js';

const commentRoutes = express.Router();


commentRoutes.post('/postComment/:blogId', protect, postComment);
commentRoutes.get('/getComments/:blogId', protect, getComments);


export default commentRoutes
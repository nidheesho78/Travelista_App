import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  chatMessages,
  chatRooms,
  chatSend,
  checkHeadingNotification,
  createOrGetChatRoom,
  deleteMessagesByChatRoom,
  getChatRoomId,
  getMessageById,
  getNotificationStatus,
  makeNotifi,
  participants,
  removeNotifications,
  updateNotificationStatus,
} from "../controllers/chatControllers.js";
const chatRoutes = express.Router();

chatRoutes.get("/createOrGetChatRoom/:userId", protect, createOrGetChatRoom);
chatRoutes.get("/chatRooms", protect, chatRooms);
chatRoutes.post("/chatSend/:chatRoomId", protect, chatSend);
chatRoutes.get("/chatMessages/:chatRoomId", protect, chatMessages);
chatRoutes.get("/participants/:chatRoomId", protect, participants);
chatRoutes.get("/getChatRoomId/:userId", protect, getChatRoomId);
chatRoutes.post("/updateNoti/:chatRoomId", makeNotifi);
chatRoutes.get("/messages/:messageId", getMessageById);
chatRoutes.delete("/deleteMessageId/:chatRoomId", deleteMessagesByChatRoom);
chatRoutes.get("/notificationStatus", protect, getNotificationStatus);
chatRoutes.get("/checkHeadingNotification", protect, checkHeadingNotification);
chatRoutes.post("/updateNotificationStatus/:roomId", updateNotificationStatus);
chatRoutes.post("/removeNotifications/:userId", removeNotifications);

export default chatRoutes;

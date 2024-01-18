
import asyncHandler from "express-async-handler";
import User from "../models/userModels.js";
import generateToken from "../utils/userJWT.js";
import Blog from "../models/createBlog.js";
import jwt from "jsonwebtoken";
import axios from "axios";
import nodemailer from "nodemailer";
import Banner from "../models/bannerSchema.js";
import Comment from "../models/commentBlog.js";
import ChatRoom from "../models/chatRoom.js";
import ChatMessage from "../models/chatArea.js";
import { formatDistanceToNow } from "date-fns";





export const createOrGetChatRoom = asyncHandler(async (req, res) => {
  try {
    const currentUser = req.user._id; // Current user's ID
    const otherUser = req.params.userId; // Selected user's ID

    // Check if a chat room exists for the two users
    let chatRoom = await ChatRoom.findOne({
      participants: { $all: [currentUser, otherUser] },
    });

    // If no chat room exists, create a new one
    if (!chatRoom) {
      chatRoom = new ChatRoom({
        participants: [currentUser, otherUser],
        messages: [], // Initialize with no messages
      });
      await chatRoom.save();
    }

    res.json({ chatRoomId: chatRoom._id });
  } catch (error) {
    console.error("Error creating or getting chat room:", error);
    res.status(500).json({ message: "Error creating or getting chat room" });
  }
});

//testing
export const chatRooms = asyncHandler(async (req, res) => {
  try {
    const currentUser = req.user._id;

    // Find chat rooms where the current user is a participant
    const chatRooms = await ChatRoom.find({
      participants: currentUser,
    }).populate({
      path: "messages",
      model: "ChatMessage",
    });

    const chatRoomsData = await Promise.all(
      chatRooms.map(async (chatRoom) => {
        const otherParticipantId = chatRoom.participants.find(
          (participantId) => participantId.toString() !== currentUser.toString()
        );
        const otherParticipant = await User.findById(
          otherParticipantId,
          "name profileImage"
        );

        // Find the latest message for the chat room
        const latestMessage = await ChatMessage.findOne(
          { room: chatRoom._id },
          {},
          { sort: { createdAt: -1 } }
        ).lean();

        return {
          _id: chatRoom._id,
          otherParticipant,
          messages: chatRoom.messages,
          lastMessage: latestMessage, // Include the latest message
        };
      })
    );

    // Sort the chat rooms based on the latest message timestamp
    chatRoomsData.sort((a, b) => {
      if (a.lastMessage && b.lastMessage) {
        return b.lastMessage.createdAt - a.lastMessage.createdAt;
      }
      return 0;
    });

    res.json({ chatRooms: chatRoomsData });
  } catch (error) {
    console.error("Error fetching chat rooms:", error);
    res.status(500).json({ message: "Error fetching chat rooms" });
  }
});

export const chatSend = asyncHandler(async (req, res) => {
  try {
    const { content } = req.body;
    const chatRoomId = req.params.chatRoomId;
    const senderId = req.user._id; // Assuming you have the user's ID from authentication

    // Create a new chat message
    const newChatMessage = new ChatMessage({
      room: chatRoomId,
      sender: senderId,
      content: content,
    });

    // Save the message to the database
    await newChatMessage.save();

    // Fetch the newly created message along with sender and chat info
    const message = await ChatMessage.findById(newChatMessage._id)
      .populate("sender", "name pic")
      .populate({
        path: "room",
        populate: {
          path: "participants",
          select: "name pic email",
        },
      })
      .exec();

    res.status(201).json({ newChatMessage: message });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Error sending message" });
  }
});

export const chatMessages = asyncHandler(async (req, res) => {
  try {
    const chatRoomId = req.params.chatRoomId;
    const messages = await ChatMessage.find({ room: chatRoomId })
      .sort({ createdAt: 1 })
      .populate("sender");

    const messagesWithSenderNames = messages.map((msg) => {
      return {
        _id: msg._id,
        sender: msg.sender._id,
        senderName: msg.sender.name,
        content: msg.content,
        createdAt: msg.createdAt,
      };
    });

    res.json({ messages: messagesWithSenderNames });
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    res.status(500).json({ message: "Error fetching chat messages" });
  }
});

export const participants = asyncHandler(async (req, res) => {
  try {
    const chatRoom = await ChatRoom.findById(req.params.chatRoomId)
      .populate("participants", "_id name profileImage")
      .select("participants");

    const participantDetails = chatRoom.participants.map((participant) => ({
      _id: participant._id,
      name: participant.name,
      profileImage: participant.profileImage,
    }));

    // console.log(participantDetails);
    res.status(200).json(participantDetails);
  } catch (error) {
    res.status(500).json({ error: "Error fetching participants" });
  }
});

export const getChatRoomId = asyncHandler(async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    const currentUserId = req.user._id;
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });

  }
});

export const makeNotifi = asyncHandler(async (req, res) => {
  try {
    const { chatRoomId } = req.params;
    const { messageId } = req.body; // Assuming you pass messageId in the request body

    // Find the chat room by ID
    const chatRoom = await ChatRoom.findById(chatRoomId);

    if (!chatRoom) {
      return res.status(404).json({ message: "Chat room not found" });
    }

    // Use addToSet to add the message ID to the chat room's messages array
    chatRoom.messages.addToSet(messageId);

    // Save the chat room with the updated messages array
    await chatRoom.save();

    res.status(200).json({ message: "Message added to chat room" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export const getMessageById = async (req, res) => {
  const { messageId } = req.params;

  try {
    // Find the message by its ID and populate the sender field
    const message = await ChatMessage.findById(messageId).populate(
      "sender",
      "_id"
    );
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    res.status(200).json(message);
  } catch (error) {
    console.error("Error fetching message:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteMessagesByChatRoom = async (req, res) => {
  const { chatRoomId } = req.params;

  try {
    // Find the ChatRoom document by its ID and update it to remove all messages
    const result = await ChatRoom.findByIdAndUpdate(chatRoomId, {
      $set: { messages: [] },
    });

    if (result) {
      // Messages were removed successfully
      res.status(204).send(); // No content response for successful removal
    } else {
      // ChatRoom not found
      res.status(404).json({ message: "ChatRoom not found" });
    }
  } catch (error) {
    console.error("Error deleting messages from chat room:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getNotificationStatus = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  try {
    const chatRooms = await ChatRoom.find({
      participants: userId,
    });

    const notificationStatus = {};

    // Iterate through each chat room
    for (const chatRoom of chatRooms) {
      let hasUnreadMessage = false;

      // Check if the chat room has any messages
      if (chatRoom.messages.length > 0) {
        // Find the latest message ID in the chat room
        const latestMessageId = chatRoom.messages[chatRoom.messages.length - 1];

        // Fetch the latest message details from the ChatMessage collection
        const latestMessage = await ChatMessage.findById(latestMessageId);

        // Check if the latest message sender is not the current user
        if (
          latestMessage &&
          latestMessage.sender.toString() !== userId.toString()
        ) {
          hasUnreadMessage = true;
        }
      }

      notificationStatus[chatRoom._id] = hasUnreadMessage;
    }

    res.json(notificationStatus);
  } catch (error) {
    console.error("Error fetching notification status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export const checkHeadingNotification = asyncHandler(async (req, res) => {
  try {
    const currentUserId = req.user._id;

    // Find chat rooms for the current user
    const chatRooms = await ChatRoom.find({
      participants: currentUserId,
    });

    // Initialize the response as false
    let hasUnreadedMessage = false;

    for (const room of chatRooms) {
      if (
        room.notification &&
        room.notification.length > 0 &&
        !room.notification.includes(currentUserId)
      ) {
        // If the notification array contains other user IDs, set response to true
        hasUnreadedMessage = true;
        break;
      }
    }

    res.json(hasUnreadedMessage);
  } catch (error) {
    // Handle errors
    res.status(500).json({ message: "Server error" });
  }
});

export const updateNotificationStatus = asyncHandler(async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const currentUserId = req.body.userId;
    const senderId = req.body.senderId; // Get senderId from the request body

    // Find the chat room by ID
    const chatRoom = await ChatRoom.findById(roomId);

    if (!chatRoom) {
      return res.status(404).json({ message: "Chat room not found" });
    }

    // Check if the current user is a participant in the chat room
    if (chatRoom.participants.includes(currentUserId)) {
      // Update the notification status by adding senderId to the array (without duplicates)
      chatRoom.notification.addToSet(senderId); // Add senderId to the notification array (without duplicates)
      await chatRoom.save();
      res.json({ message: "Notification status updated" });
    } else {
      res
        .status(403)
        .json({
          message:
            "You do not have permission to update notification status for this room",
        });
    }
  } catch (error) {
    // Handle errors
    res.status(500).json({ message: "Server error" });
  }
});

export const removeNotifications = asyncHandler(async (req, res) => {
  try {
    const userId = req.params.userId;

    // Find all chat rooms where the user is a participant
    const chatRooms = await ChatRoom.find({ participants: userId });

    // Clear the notification array in all chat rooms
    chatRooms.forEach(async (chatRoom) => {
      chatRoom.notification = [];
      await chatRoom.save();
    });

    res.json({ message: "Notifications removed successfully" });
  } catch (error) {
    // Handle errors
    res.status(500).json({ message: "Server error" });
  }
});



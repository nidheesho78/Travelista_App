import express from "express";
import dotenv from "dotenv";
import cors from "cors";
dotenv.config();
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import connectDB from "./config/db.js";
import cookieParser from "cookie-parser";
import path from "path";
const port = process.env.PORT || 5000;
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { Server } from "Socket.io"
import commentRoutes from "./routes/commentRoutes.js";
import blogRoutes from "./routes/blogRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
// import messageRoutes from "./routes/messageRoutes.js";

connectDB();

const app = express();
const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true,
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/chats", chatRoutes);
// app.use("/api/messages", messageRoutes);


if (process.env.NODE_ENV === "production") {
  console.log("hai");
  const __dirname = path.resolve();
  const parentDir = path.join(__dirname, "..");
  console.log(parentDir);
  app.use(express.static(path.join(parentDir, '/frontend/dist')));
  app.get("*", (req, res) =>
    res.sendFile(path.resolve(parentDir, "frontend", "dist", "index.html"))
  );
} else {
  app.get("/", (req, res) => {
    res.send("Server is Ready");
  });
}

app.use(notFound);
app.use(errorHandler);
const server = app.listen(port, () =>
  console.log(`server start on port ${port}`)
);

const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: ["http://localhost:5000",'http://localhost:3000'],
  },
});
io.on("connection", (socket) => {
  console.log("Connected with Socket.IO");

  socket.on("setup", (userData) => {
    socket.join(userData._id);
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User joined room: " + room);
  });

  socket.on("new message", (newMessageReceived) => {
    const chatRoomId = newMessageReceived.room;
    io.to(chatRoomId).emit("message received", newMessageReceived);
  });

  socket.on("leaveRoom", ({ room }) => {
    socket.leave(room);
    console.log("User left room: " + room);
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected");
  });
});


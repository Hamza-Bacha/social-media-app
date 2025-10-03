// backend/server.js
import messageRoutes from './routes/messageRoutes.js';
// ... other imports


import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import { Server } from "socket.io";

// Import routes


// ... existing routes ...

import authRoutes from "./routes/authRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import storyRoutes from "./routes/storyRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import conversationRoutes from "./routes/conversationRoutes.js"; // ✅ NEW

// Load env vars
dotenv.config();

const app = express();

// Setup HTTP + Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Get __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Static uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use('/api/messages', messageRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/stories", storyRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/conversations", conversationRoutes); // ✅ NEW

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    message: "Server is running!",
    timestamp: new Date(),
    features: [
      "auth",
      "posts",
      "comments",
      "users",
      "upload",
      "stories",
      "notifications",
      "search",
      "conversations",
    ],
  });
});

// Database connection
const connectToDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is undefined. Check your .env file");
    }

    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ Connected to MongoDB Atlas");
  } catch (error) {
    console.error("❌ Database connection error:", error.message);
    process.exit(1);
  }
};

// Socket.IO
io.on("connection", (socket) => {
  console.log("🔌 New client connected:", socket.id);

  // Join personal room for direct messages
  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`👤 User ${userId} joined their room`);
  });

  // Handle sending messages
  socket.on("sendMessage", ({ senderId, receiverId, message }) => {
    console.log(`💬 Message from ${senderId} to ${receiverId}: ${message}`);

    // Send message to the receiver
    io.to(receiverId).emit("receiveMessage", { senderId, message });
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Start server
const startServer = () => {
  const port = process.env.PORT || 5000;
  server.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`📱 Frontend: http://localhost:5173`);
    console.log(`🔗 Routes available:`);
    console.log(`   - /api/auth`);
    console.log(`   - /api/posts`);
    console.log(`   - /api/comments`);
    console.log(`   - /api/users`);
    console.log(`   - /api/upload`);
    console.log(`   - /api/stories`);
    console.log(`   - /api/notifications`);
    console.log(`   - /api/search`);
    console.log(`   - /api/conversations ✨ NEW`);
    console.log(`⚡ Socket.IO running at ws://localhost:${port}`);
  });
};

// Initialize
const initializeApp = async () => {
  await connectToDB();
  startServer();
};

process.on("unhandledRejection", (err) => {
  console.log("❌ Unhandled Promise Rejection:", err.message);
  process.exit(1);
});

initializeApp();

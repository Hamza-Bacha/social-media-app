// backend/routes/conversationRoutes.js
import express from "express";
import Conversation from "../models/Conversation.js";
import { authenticate as protect } from "../middlewares/authMiddleware.js";


const router = express.Router();

// ✅ Get all conversations of logged-in user
router.get("/my", protect, async (req, res) => {
  try {
    const conversations = await Conversation.getUserConversations(req.user._id);
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ Start a new conversation (1-on-1)
router.post("/start", protect, async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "User ID required" });

    let conversation = await Conversation.findBetweenUsers(req.user._id, userId);

    if (!conversation) {
      conversation = new Conversation({
        participants: [req.user._id, userId],
      });
      await conversation.save();
    }

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ Get a single conversation by ID
router.get("/:id", protect, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate("participants", "username avatar")
      .populate("lastMessage");

    if (!conversation) return res.status(404).json({ message: "Conversation not found" });

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

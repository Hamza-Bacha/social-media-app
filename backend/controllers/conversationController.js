// backend/controllers/conversationController.js
import Conversation from "../models/Conversation.js";
import User from "../models/User.js";

export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.getUserConversations(req.user.id);
    res.json(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ message: "Failed to fetch conversations" });
  }
};

export const createConversation = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "User ID required" });

    // Check if conversation already exists
    let conversation = await Conversation.findBetweenUsers(req.user.id, userId);
    if (conversation) return res.json(conversation);

    // Create new conversation
    conversation = new Conversation({
      participants: [req.user.id, userId],
    });
    await conversation.save();

    res.status(201).json(conversation);
  } catch (error) {
    console.error("Error creating conversation:", error);
    res.status(500).json({ message: "Failed to create conversation" });
  }
};


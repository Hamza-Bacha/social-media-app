import express from "express";
import { authenticate, optionalAuth } from "../middlewares/authMiddleware.js";
import { 
  getPosts, 
  getPost, 
  createPost, 
  likePost, 
  deletePost, 
  getFeed 
} from "../controllers/postController.js";

const router = express.Router();

// Public routes (can work with or without authentication)
router.get("/", optionalAuth, getPosts);
router.get("/:postId", optionalAuth, getPost);

// Protected routes (require authentication)
router.post("/", authenticate, createPost);
router.post("/:postId/like", authenticate, likePost);
router.delete("/:postId", authenticate, deletePost);
router.get("/feed/timeline", authenticate, getFeed);

export default router;
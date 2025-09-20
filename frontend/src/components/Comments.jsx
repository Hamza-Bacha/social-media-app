import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  HeartIcon, 
  TrashIcon,
  PaperAirplaneIcon
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import api from "../api/config";
import LoadingSpinner from "./LoadingSpinner";

export default function Comments({ postId, onCommentAdded, onCommentDeleted }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/comments/${postId}`);
      setComments(response.data.comments || []);
    } catch (err) {
      console.error("Error fetching comments:", err);
      setError("Failed to load comments");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;

    if (newComment.length > 300) {
      setError("Comment must be less than 300 characters");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await api.post(`/api/comments/${postId}`, {
        content: newComment.trim()
      });
      
      setComments(prev => [response.data.comment, ...prev]);
      setNewComment("");
      
      if (onCommentAdded) {
        onCommentAdded(response.data.comment);
      }
    } catch (err) {
      console.error("Error creating comment:", err);
      setError(err.response?.data?.message || "Failed to create comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      const response = await api.post(`/api/comments/${commentId}/like`);
      
      setComments(prev => prev.map(comment => 
        comment._id === commentId 
          ? { 
              ...comment, 
              isLiked: response.data.liked, 
              likesCount: response.data.likesCount 
            }
          : comment
      ));
    } catch (err) {
      console.error("Error liking comment:", err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    try {
      await api.delete(`/api/comments/${commentId}`);
      setComments(prev => prev.filter(comment => comment._id !== commentId));
      
      if (onCommentDeleted) {
        onCommentDeleted();
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
      alert("Failed to delete comment");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return "now";
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  return (
    <div className="p-4">
      {/* Add Comment Form */}
      <form onSubmit={handleSubmitComment} className="mb-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {user?.username?.charAt(0).toUpperCase() || "U"}
            </div>
          </div>
          <div className="flex-1">
            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 px-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={submitting}
                maxLength={300}
              />
              <button
                type="submit"
                disabled={submitting || !newComment.trim()}
                className={`p-2 rounded-full transition-colors ${
                  submitting || !newComment.trim()
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              >
                <PaperAirplaneIcon className="w-4 h-4" />
              </button>
            </div>
            {error && (
              <p className="text-red-500 text-xs mt-1">{error}</p>
            )}
            <div className="flex justify-end mt-1">
              <span className={`text-xs ${
                newComment.length > 250 
                  ? 'text-red-500' 
                  : newComment.length > 200 
                  ? 'text-yellow-500' 
                  : 'text-gray-400'
              }`}>
                {newComment.length}/300
              </span>
            </div>
          </div>
        </div>
      </form>

      {/* Comments List */}
      {loading ? (
        <LoadingSpinner size="small" text="Loading comments..." />
      ) : comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment._id} className="flex gap-3">
              <Link 
                to={`/user/${comment.user?.username}`}
                className="flex-shrink-0"
              >
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm hover:bg-blue-600 transition-colors">
                  {comment.user?.username?.charAt(0).toUpperCase() || "U"}
                </div>
              </Link>
              
              <div className="flex-1 min-w-0">
                <div className="bg-gray-50 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Link 
                      to={`/user/${comment.user?.username}`}
                      className="font-semibold text-sm text-gray-900 hover:text-blue-600 transition-colors"
                    >
                      {comment.user?.username || "Unknown User"}
                    </Link>
                    <span className="text-xs text-gray-500">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 break-words">
                    {comment.content}
                  </p>
                </div>
                
                <div className="flex items-center gap-4 mt-2">
                  <button
                    onClick={() => handleLikeComment(comment._id)}
                    className={`flex items-center gap-1 text-xs ${
                      comment.isLiked 
                        ? "text-red-600" 
                        : "text-gray-500 hover:text-red-600"
                    } transition-colors`}
                  >
                    {comment.isLiked ? (
                      <HeartIconSolid className="w-4 h-4" />
                    ) : (
                      <HeartIcon className="w-4 h-4" />
                    )}
                    {comment.likesCount > 0 && (
                      <span>{comment.likesCount}</span>
                    )}
                  </button>
                  
                  {comment.canDelete && (
                    <button
                      onClick={() => handleDeleteComment(comment._id)}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-sm text-center py-4">
          No comments yet. Be the first to comment!
        </p>
      )}
    </div>
  );
}
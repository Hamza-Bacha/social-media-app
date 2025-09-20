import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  HeartIcon, 
  ChatBubbleOvalLeftIcon, 
  ShareIcon,
  EllipsisHorizontalIcon,
  TrashIcon
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import api from "../api/config";
import Comments from "./Comments";

export default function PostCard({ post, onPostUpdate, onPostDelete }) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(post.isLiked || post.likes?.includes(user?.id) || false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [showComments, setShowComments] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleLike = async () => {
    if (isLiking) return;
    
    setIsLiking(true);
    const previousState = { isLiked, likesCount };

    // Optimistic update
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);

    try {
      const response = await api.post(`/api/posts/${post._id}/like`);
      
      // Update with server response
      setIsLiked(response.data.liked);
      setLikesCount(response.data.likesCount);
      
      if (onPostUpdate) {
        onPostUpdate(post._id, { 
          likes: response.data.likes, 
          likesCount: response.data.likesCount,
          isLiked: response.data.liked
        });
      }
    } catch (err) {
      // Revert on error
      setIsLiked(previousState.isLiked);
      setLikesCount(previousState.likesCount);
      console.error("Error liking post:", err);
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) {
      return;
    }

    setIsDeleting(true);
    try {
      await api.delete(`/api/posts/${post._id}`);
      if (onPostDelete) {
        onPostDelete(post._id);
      }
    } catch (err) {
      console.error("Error deleting post:", err);
      alert("Failed to delete post");
    } finally {
      setIsDeleting(false);
      setShowMenu(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return diffInMinutes < 1 ? "now" : `${diffInMinutes}m`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const isOwner = post.user?._id === user?.id || post.user?.id === user?.id;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="p-4">
        {/* Post Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Link 
              to={`/user/${post.user?.username}`}
              className="flex-shrink-0"
            >
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold hover:bg-blue-600 transition-colors">
                {post.user?.username?.charAt(0).toUpperCase() || "U"}
              </div>
            </Link>
            <div>
              <Link 
                to={`/user/${post.user?.username}`}
                className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
              >
                {post.user?.username || "Unknown User"}
              </Link>
              <p className="text-xs text-gray-500">
                {formatDate(post.createdAt)}
              </p>
            </div>
          </div>

          {/* Post Menu */}
          {isOwner && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                disabled={isDeleting}
              >
                <EllipsisHorizontalIcon className="w-5 h-5" />
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <TrashIcon className="w-4 h-4" />
                    {isDeleting ? "Deleting..." : "Delete Post"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Post Content */}
        <div className="mb-4">
          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>
          
          {/* Post Image */}
          {post.image && (
            <div className="mt-3">
              <img
                src={post.image}
                alt="Post image"
                className="w-full max-h-96 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-95 transition-opacity"
                onClick={() => {
                  // Open image in new tab
                  window.open(post.image, '_blank');
                }}
                onError={(e) => {
                  // Hide image if it fails to load
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

        {/* Post Actions */}
        <div className="flex items-center gap-6 pt-3 border-t border-gray-100">
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              isLiked
                ? "text-red-600 bg-red-50 hover:bg-red-100"
                : "text-gray-600 hover:text-red-600 hover:bg-red-50"
            } ${isLiking ? "opacity-75 cursor-not-allowed" : ""}`}
          >
            {isLiked ? (
              <HeartIconSolid className="w-5 h-5" />
            ) : (
              <HeartIcon className="w-5 h-5" />
            )}
            <span>{likesCount}</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all"
          >
            <ChatBubbleOvalLeftIcon className="w-5 h-5" />
            <span>{post.commentsCount || 0}</span>
          </button>

          <button
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium text-gray-600 hover:text-green-600 hover:bg-green-50 transition-all"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: `Post by ${post.user?.username}`,
                  text: post.content,
                  url: window.location.href
                });
              }
            }}
          >
            <ShareIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-gray-100">
          <Comments 
            postId={post._id}
            onCommentAdded={(newComment) => {
              if (onPostUpdate) {
                onPostUpdate(post._id, { 
                  commentsCount: (post.commentsCount || 0) + 1 
                });
              }
            }}
            onCommentDeleted={() => {
              if (onPostUpdate) {
                onPostUpdate(post._id, { 
                  commentsCount: Math.max((post.commentsCount || 1) - 1, 0) 
                });
              }
            }}
          />
        </div>
      )}

      {/* Click outside handler for menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
}
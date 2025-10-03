// frontend/src/pages/Home.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/config";
import CreatePost from "../components/CreatePost";
import PostCard from "../components/PostCard";
import LoadingSpinner from "../components/LoadingSpinner";
import StoriesSection from "../components/StoriesSection";

export default function Home() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Only fetch posts once when component mounts
    fetchPosts();
  }, []); // Remove user dependency to prevent duplicate calls

  const fetchPosts = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");
      
      const response = await api.get("/api/posts");
      setPosts(response.data.posts || []);
      console.log('Fetched posts:', response.data); // Keep this for debugging
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError("Failed to load posts");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handlePostCreated = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
  };

  const handlePostUpdate = (postId, updates) => {
    setPosts(prev => prev.map(post => 
      post._id === postId ? { ...post, ...updates } : post
    ));
  };

  const handlePostDelete = (postId) => {
    setPosts(prev => prev.filter(post => post._id !== postId));
  };

  const handleRefresh = () => {
    fetchPosts(true);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <LoadingSpinner size="large" text="Loading your feed..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Stories Section */}
      <StoriesSection />

      {/* Main Feed */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Welcome Message */}
        <div className="text-center py-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.username}!
          </h1>
          <p className="text-gray-600">
            What's happening in your world today?
          </p>
        </div>

        {/* Create Post */}
        <CreatePost onPostCreated={handlePostCreated} />

        {/* Refresh Button */}
        <div className="flex justify-center">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              refreshing
                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                : "bg-white text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
            }`}
          >
            {refreshing ? "Refreshing..." : "Refresh Feed"}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 text-center">{error}</p>
            <button
              onClick={() => fetchPosts()}
              className="mt-2 w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Posts Feed */}
        {posts.length > 0 ? (
          <div className="space-y-6">
            {posts.map(post => (
              <PostCard
                key={post._id}
                post={post}
                onPostUpdate={handlePostUpdate}
                onPostDelete={handlePostDelete}
              />
            ))}
          </div>
        ) : !loading && !error ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No posts yet
            </h3>
            <p className="text-gray-600 mb-4">
              Be the first to share something with your community!
            </p>
          </div>
        ) : null}

        {/* Load More (Future Enhancement) */}
        {posts.length > 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">
              You're all caught up! 🎉
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  PencilIcon,
  CalendarIcon,
  CogIcon
} from "@heroicons/react/24/outline";
import api from "../api/config";
import PostCard from "../components/PostCard";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    postsCount: 0,
    followersCount: 0,
    followingCount: 0
  });

  useEffect(() => {
    if (user) {
      fetchUserPosts();
      fetchUserStats();
    }
  }, [user]);

  const fetchUserPosts = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const response = await api.get(`/api/users/${user.id}/posts`);
      setPosts(response.data.posts || []);
    } catch (err) {
      console.error("Error fetching user posts:", err);
      // If posts endpoint fails, try getting posts by user ID from posts endpoint
      try {
        const fallbackResponse = await api.get(`/api/posts?userId=${user.id}`);
        setPosts(fallbackResponse.data.posts || []);
      } catch (fallbackErr) {
        console.error("Fallback posts fetch also failed:", fallbackErr);
        setPosts([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await api.get("/api/auth/profile");
      setStats({
        postsCount: response.data.postsCount || 0,
        followersCount: response.data.followersCount || 0,
        followingCount: response.data.followingCount || 0
      });
      updateUser(response.data);
    } catch (err) {
      console.error("Error fetching user stats:", err);
    }
  };

  const handlePostUpdate = (postId, updates) => {
    setPosts(prev => prev.map(post => 
      post._id === postId ? { ...post, ...updates } : post
    ));
  };

  const handlePostDelete = (postId) => {
    setPosts(prev => prev.filter(post => post._id !== postId));
    setStats(prev => ({ ...prev, postsCount: Math.max(prev.postsCount - 1, 0) }));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long'
    });
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <LoadingSpinner size="large" text="Loading profile..." />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-3xl flex-shrink-0">
              {user.username?.charAt(0).toUpperCase() || "U"}
            </div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {user.username}
                  </h1>
                  <p className="text-gray-600 mt-1">{user.email}</p>
                  {user.bio && (
                    <p className="text-gray-700 mt-2">{user.bio}</p>
                  )}
                  <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
                    <CalendarIcon className="w-4 h-4" />
                    <span>
                      Joined {formatDate(user.createdAt || new Date())}
                    </span>
                  </div>
                </div>

                {/* Edit Profile Button */}
                <Link
                  to="/settings"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-800 rounded-full font-medium hover:bg-gray-200 transition-colors"
                >
                  <PencilIcon className="w-4 h-4" />
                  Edit Profile
                </Link>
              </div>

              {/* Stats */}
              <div className="flex gap-6 mt-4">
                <div className="text-center">
                  <div className="font-bold text-lg text-gray-900">
                    {stats.postsCount}
                  </div>
                  <div className="text-sm text-gray-600">Posts</div>
                </div>
                <Link 
                  to="/followers" 
                  className="text-center hover:text-blue-600 transition-colors"
                >
                  <div className="font-bold text-lg text-gray-900">
                    {stats.followersCount}
                  </div>
                  <div className="text-sm text-gray-600">Followers</div>
                </Link>
                <Link 
                  to="/following" 
                  className="text-center hover:text-blue-600 transition-colors"
                >
                  <div className="font-bold text-lg text-gray-900">
                    {stats.followingCount}
                  </div>
                  <div className="text-sm text-gray-600">Following</div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Link
          to="/"
          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="font-medium text-gray-900">Create Post</h3>
            <p className="text-sm text-gray-600 mt-1">Share something new</p>
          </div>
        </Link>

        <Link
          to="/explore"
          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="font-medium text-gray-900">Discover</h3>
            <p className="text-sm text-gray-600 mt-1">Find new people</p>
          </div>
        </Link>

        <Link
          to="/settings"
          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <CogIcon className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-medium text-gray-900">Settings</h3>
            <p className="text-sm text-gray-600 mt-1">Manage account</p>
          </div>
        </Link>
      </div>

      {/* Posts Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Your Posts</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <LoadingSpinner size="medium" text="Loading your posts..." />
          </div>
        ) : posts.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {posts.map(post => (
              <div key={post._id} className="p-4">
                <PostCard
                  post={post}
                  onPostUpdate={handlePostUpdate}
                  onPostDelete={handlePostDelete}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No posts yet
            </h3>
            <p className="text-gray-600 mb-4">
              Share your first post to get started!
            </p>
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Your First Post
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
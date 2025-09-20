import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  UserPlusIcon, 
  UserMinusIcon,
  CalendarIcon,
  MapPinIcon
} from "@heroicons/react/24/outline";
import api from "../api/config";
import PostCard from "../components/PostCard";
import LoadingSpinner from "../components/LoadingSpinner";

export default function UserProfile() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");

  useEffect(() => {
    if (username) {
      fetchUserProfile();
      fetchUserPosts();
    }
  }, [username]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/users/${username}`);
      setProfileUser(response.data);
      setIsFollowing(response.data.isFollowing || false);
    } catch (err) {
      console.error("Error fetching user profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      setPostsLoading(true);
      const response = await api.get(`/api/users/${profileUser?._id || username}/posts`);
      setPosts(response.data.posts || []);
    } catch (err) {
      console.error("Error fetching user posts:", err);
    } finally {
      setPostsLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!profileUser || followLoading) return;
    
    setFollowLoading(true);
    try {
      const response = await api.post(`/api/users/${profileUser._id}/follow`);
      setIsFollowing(response.data.isFollowing);
      setProfileUser(prev => ({
        ...prev,
        followersCount: response.data.followersCount
      }));
    } catch (err) {
      console.error("Error following user:", err);
    } finally {
      setFollowLoading(false);
    }
  };

  const handlePostUpdate = (postId, updates) => {
    setPosts(prev => prev.map(post => 
      post._id === postId ? { ...post, ...updates } : post
    ));
  };

  const handlePostDelete = (postId) => {
    setPosts(prev => prev.filter(post => post._id !== postId));
    if (profileUser) {
      setProfileUser(prev => ({
        ...prev,
        postsCount: Math.max((prev.postsCount || 1) - 1, 0)
      }));
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long'
    });
  };

  const isOwnProfile = profileUser?._id === currentUser?.id;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <LoadingSpinner size="large" text="Loading profile..." />
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">User not found</h1>
          <p className="text-gray-600">The user you're looking for doesn't exist.</p>
          <Link to="/" className="mt-4 inline-block text-blue-600 hover:text-blue-800">
            Go back home
          </Link>
        </div>
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
              {profileUser.username?.charAt(0).toUpperCase() || "U"}
            </div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {profileUser.username}
                  </h1>
                  {profileUser.bio && (
                    <p className="text-gray-600 mt-2">{profileUser.bio}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="w-4 h-4" />
                      <span>Joined {formatDate(profileUser.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Follow Button */}
                {!isOwnProfile && (
                  <button
                    onClick={handleFollow}
                    disabled={followLoading}
                    className={`px-6 py-2 rounded-full font-medium transition-colors ${
                      isFollowing
                        ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
                        : "bg-blue-500 text-white hover:bg-blue-600"
                    } ${followLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className="flex items-center gap-2">
                      {isFollowing ? (
                        <UserMinusIcon className="w-4 h-4" />
                      ) : (
                        <UserPlusIcon className="w-4 h-4" />
                      )}
                      {followLoading 
                        ? "Loading..." 
                        : isFollowing 
                        ? "Unfollow" 
                        : "Follow"
                      }
                    </div>
                  </button>
                )}

                {isOwnProfile && (
                  <Link
                    to="/settings"
                    className="px-6 py-2 bg-gray-100 text-gray-800 rounded-full font-medium hover:bg-gray-200 transition-colors"
                  >
                    Edit Profile
                  </Link>
                )}
              </div>

              {/* Stats */}
              <div className="flex gap-6 mt-4">
                <div className="text-center">
                  <div className="font-bold text-lg text-gray-900">
                    {profileUser.postsCount || 0}
                  </div>
                  <div className="text-sm text-gray-600">Posts</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg text-gray-900">
                    {profileUser.followersCount || 0}
                  </div>
                  <div className="text-sm text-gray-600">Followers</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg text-gray-900">
                    {profileUser.followingCount || 0}
                  </div>
                  <div className="text-sm text-gray-600">Following</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab("posts")}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === "posts"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Posts
            </button>
            <button
              onClick={() => setActiveTab("media")}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === "media"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Media
            </button>
          </nav>
        </div>
      </div>

      {/* Posts Section */}
      {activeTab === "posts" && (
        <div>
          {postsLoading ? (
            <div className="text-center py-8">
              <LoadingSpinner size="medium" text="Loading posts..." />
            </div>
          ) : posts.length > 0 ? (
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
          ) : (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No posts yet
              </h3>
              <p className="text-gray-600">
                {isOwnProfile 
                  ? "Share your first post to get started!" 
                  : `${profileUser.username} hasn't shared anything yet.`
                }
              </p>
            </div>
          )}
        </div>
      )}

      {/* Media Section */}
      {activeTab === "media" && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No media yet
          </h3>
          <p className="text-gray-600">
            Media posts will appear here
          </p>
        </div>
      )}
    </div>
  );
}
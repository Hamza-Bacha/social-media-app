import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { PhotoIcon, XMarkIcon } from "@heroicons/react/24/outline";
import api from "../api/config";
import ImageUpload from "./ImageUpload";

export default function CreatePost({ onPostCreated }) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !selectedImage) {
      setError("Please add some content or an image");
      return;
    }
    if (content.length > 500) {
      setError("Content must be less than 500 characters");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      let imageUrl = null;

      // Upload image if selected
      if (selectedImage) {
        const formData = new FormData();
        formData.append("image", selectedImage.file);
        const imageResponse = await api.post("/api/upload/image", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        imageUrl = imageResponse.data.imageUrl;
      }

      // Create post with proper type
      const response = await api.post("/api/posts", {
        content: content.trim(),
        image: imageUrl,
        type: selectedImage ? "image" : "text",
      });

      if (onPostCreated) onPostCreated(response.data.post);

      // Reset form
      setContent("");
      setSelectedImage(null);
      setShowImageUpload(false);
    } catch (err) {
      console.error("Error creating post:", err);
      setError(err.response?.data?.message || "Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSubmit(e);
  };

  const handleImageSelect = (imageData) => {
    setSelectedImage(imageData);
    setShowImageUpload(false);
  };

  const handleImageRemove = () => setSelectedImage(null);

  const handlePhotoClick = (e) => {
    e.preventDefault();
    setShowImageUpload(true);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4">
        <div className="flex gap-3">
          {/* User Avatar */}
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
              {user?.username?.charAt(0).toUpperCase() || "U"}
            </div>
          </div>

          {/* Post Form */}
          <form onSubmit={handleSubmit} className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="What's happening?"
              className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="3"
              disabled={isSubmitting}
              maxLength={500}
            />

            {/* Image Upload Section */}
            {(showImageUpload || selectedImage) && (
              <div className="mt-3">
                <ImageUpload
                  onImageSelect={handleImageSelect}
                  onImageRemove={handleImageRemove}
                  selectedImage={selectedImage}
                />
              </div>
            )}

            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

            <div className="flex justify-between items-center mt-3">
              <div className="flex items-center gap-4">
                {/* Image Upload Button */}
                {selectedImage ? (
                  <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    <PhotoIcon className="w-5 h-5" />
                    <span className="text-sm">Image added</span>
                    <button
                      type="button"
                      onClick={handleImageRemove}
                      className="ml-1 hover:bg-red-100 rounded-full p-1 transition-colors"
                      title="Remove image"
                    >
                      <XMarkIcon className="w-3 h-3 text-red-500" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handlePhotoClick}
                    className="flex items-center gap-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-full transition-colors"
                    disabled={isSubmitting}
                    title="Add photo"
                  >
                    <PhotoIcon className="w-5 h-5" />
                    <span className="text-sm">Photo</span>
                  </button>
                )}

                <span
                  className={`text-xs ${
                    content.length > 450
                      ? "text-red-500"
                      : content.length > 400
                      ? "text-yellow-500"
                      : "text-gray-400"
                  }`}
                >
                  {content.length}/500
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">Ctrl+Enter to post</span>
                <button
                  type="submit"
                  disabled={
                    isSubmitting || (!content.trim() && !selectedImage) || content.length > 500
                  }
                  className={`px-6 py-2 rounded-full font-medium transition-colors ${
                    isSubmitting || (!content.trim() && !selectedImage) || content.length > 500
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                >
                  {isSubmitting ? "Posting..." : "Post"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

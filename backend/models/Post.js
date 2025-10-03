import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  content: { 
    type: String, 
    // Make content required only if no image is present
    required: function() {
      return !this.image; // Content required only when there's no image
    },
    trim: true,
    maxlength: 500
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  likesCount: {
    type: Number,
    default: 0
  },
  commentsCount: {
    type: Number,
    default: 0
  },
  image: {
    type: String,
    default: null
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Custom validation to ensure at least content OR image exists
postSchema.pre('validate', function(next) {
  if (!this.content && !this.image) {
    this.invalidate('content', 'Either content or image must be provided');
  }
  next();
});

// Virtual for comments
postSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'post'
});

// Update likes count when likes array changes
postSchema.pre('save', function(next) {
  this.likesCount = this.likes.length;
  next();
});

// Index for better performance
postSchema.index({ createdAt: -1 });
postSchema.index({ user: 1 });

const Post = mongoose.model("Post", postSchema);
export default Post;
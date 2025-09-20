import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  content: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 300
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  post: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Post", 
    required: true 
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  likesCount: {
    type: Number,
    default: 0
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Update likes count when likes array changes
commentSchema.pre('save', function(next) {
  this.likesCount = this.likes.length;
  next();
});

// Index for better performance
commentSchema.index({ post: 1, createdAt: -1 });

const Comment = mongoose.model("Comment", commentSchema);
export default Comment;
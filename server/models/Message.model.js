import mongoose from 'mongoose';

const reactionSchema = new mongoose.Schema(
  {
    emoji: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { _id: false }
);

const attachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String },
    name: { type: String },
    size: { type: Number },
    mimeType: { type: String },
    resourceType: {
      type: String,
      enum: ['image', 'video', 'audio', 'raw'],
      default: 'raw',
    },
  },
  { _id: false }
);

const readReceiptSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    readAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      maxlength: [4000, 'Message cannot exceed 4000 characters'],
      default: '',
    },
    type: {
      type: String,
      enum: ['text', 'image', 'file', 'audio', 'video', 'system'],
      default: 'text',
    },
    attachments: [attachmentSchema],
    reactions: [reactionSchema],
    readBy: [readReceiptSchema],
    deliveredTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Soft-delete content on deletion
messageSchema.pre('save', function (next) {
  if (this.isModified('isDeleted') && this.isDeleted) {
    this.content = 'This message was deleted';
    this.attachments = [];
    this.deletedAt = new Date();
  }
  next();
});

// Compound index for paginated chat history
messageSchema.index({ chat: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ content: 'text' }); // full-text search

const Message = mongoose.model('Message', messageSchema);
export default Message;

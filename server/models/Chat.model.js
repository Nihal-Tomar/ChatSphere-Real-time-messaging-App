import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Chat name cannot exceed 100 characters'],
    },
    isGroup: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      maxlength: [300, 'Description cannot exceed 300 characters'],
      default: '',
    },
    avatar: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    pinnedMessages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
      },
    ],
    // Per-participant mute / unread tracking
    participantMeta: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        isMuted: { type: Boolean, default: false },
        unreadCount: { type: Number, default: 0 },
        lastRead: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Validation: group chat must have a name
chatSchema.pre('save', function (next) {
  if (this.isGroup && !this.name) {
    return next(new Error('Group chats must have a name'));
  }
  next();
});

chatSchema.index({ participants: 1 });
chatSchema.index({ updatedAt: -1 });

const Chat = mongoose.model('Chat', chatSchema);
export default Chat;

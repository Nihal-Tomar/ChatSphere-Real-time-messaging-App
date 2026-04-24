import Message from '../models/Message.model.js';
import Chat from '../models/Chat.model.js';
import ApiError from '../utils/apiError.js';
import apiResponse from '../utils/apiResponse.js';
import { uploadToCloudinary } from '../config/cloudinary.js';
import { io } from '../index.js';

const PAGE_SIZE = 30;

// ─── Get messages (paginated) ─────────────────────────────────────────────────
export const getMessages = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { cursor, limit = PAGE_SIZE } = req.query;

    const chat = await Chat.findOne({ _id: chatId, participants: req.user._id });
    if (!chat) throw new ApiError('Chat not found or access denied.', 404);

    const query = { chat: chatId };
    if (cursor) query.createdAt = { $lt: new Date(cursor) };

    const messages = await Message.find(query)
      .populate('sender', 'username displayName avatar')
      .populate({ path: 'replyTo', select: 'content sender type', populate: { path: 'sender', select: 'username displayName' } })
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean();

    const hasMore = messages.length === Number(limit);
    const nextCursor = hasMore ? messages[messages.length - 1].createdAt : null;

    return apiResponse(res, 200, 'Messages fetched', {
      messages: messages.reverse(),
      hasMore,
      nextCursor,
    });
  } catch (err) { next(err); }
};

// ─── Send message ─────────────────────────────────────────────────────────────
export const sendMessage = async (req, res, next) => {
  try {
    const { chatId, content, replyTo, type = 'text' } = req.body;

    const chat = await Chat.findOne({ _id: chatId, participants: req.user._id });
    if (!chat) throw new ApiError('Chat not found.', 404);

    let attachments = [];
    if (req.file) {
      const resourceType = req.file.mimetype.startsWith('image/') ? 'image'
        : req.file.mimetype.startsWith('video/') ? 'video'
        : req.file.mimetype.startsWith('audio/') ? 'video'
        : 'raw';
      const result = await uploadToCloudinary(req.file.buffer, 'chatsphere/attachments', resourceType);
      attachments.push({
        url: result.secure_url,
        publicId: result.public_id,
        name: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
        resourceType,
      });
    }

    if (!content?.trim() && attachments.length === 0) {
      throw new ApiError('Message must have content or attachment.', 400);
    }

    const message = await Message.create({
      chat: chatId,
      sender: req.user._id,
      content: content?.trim() || '',
      type: attachments.length > 0 ? attachments[0].resourceType : type,
      attachments,
      replyTo: replyTo || null,
    });

    // Update chat lastMessage + unread counts
    chat.lastMessage = message._id;
    chat.participantMeta.forEach((meta) => {
      if (meta.user?.toString() !== req.user._id.toString()) {
        meta.unreadCount = (meta.unreadCount || 0) + 1;
      }
    });
    chat.updatedAt = new Date();
    await chat.save();

    const populated = await Message.findById(message._id)
      .populate('sender', 'username displayName avatar')
      .populate({ path: 'replyTo', select: 'content sender', populate: { path: 'sender', select: 'username displayName' } });

    // Emit real-time event
    io.to(chatId).emit('new_message', populated);

    return apiResponse(res, 201, 'Message sent', { message: populated });
  } catch (err) { next(err); }
};

// ─── Edit message ─────────────────────────────────────────────────────────────
export const editMessage = async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) throw new ApiError('Content is required.', 400);

    const message = await Message.findOne({ _id: req.params.id, sender: req.user._id, isDeleted: false });
    if (!message) throw new ApiError('Message not found or not yours.', 404);

    message.content = content.trim();
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    io.to(message.chat.toString()).emit('message_edited', { messageId: message._id, content: message.content, editedAt: message.editedAt });
    return apiResponse(res, 200, 'Message edited', { message });
  } catch (err) { next(err); }
};

// ─── Delete message ───────────────────────────────────────────────────────────
export const deleteMessage = async (req, res, next) => {
  try {
    const message = await Message.findOne({ _id: req.params.id, sender: req.user._id });
    if (!message) throw new ApiError('Message not found or not yours.', 404);

    message.isDeleted = true;
    await message.save();

    io.to(message.chat.toString()).emit('message_deleted', { messageId: message._id, chatId: message.chat });
    return apiResponse(res, 200, 'Message deleted');
  } catch (err) { next(err); }
};

// ─── React to message ─────────────────────────────────────────────────────────
export const reactToMessage = async (req, res, next) => {
  try {
    const { emoji } = req.body;
    if (!emoji) throw new ApiError('Emoji is required.', 400);

    const message = await Message.findById(req.params.id);
    if (!message) throw new ApiError('Message not found.', 404);

    const existingIdx = message.reactions.findIndex(
      (r) => r.user.toString() === req.user._id.toString() && r.emoji === emoji
    );

    if (existingIdx > -1) {
      message.reactions.splice(existingIdx, 1); // toggle off
    } else {
      // Remove any other reaction by same user for same emoji slot
      message.reactions = message.reactions.filter((r) => r.user.toString() !== req.user._id.toString() || r.emoji !== emoji);
      message.reactions.push({ emoji, user: req.user._id });
    }

    await message.save();
    io.to(message.chat.toString()).emit('message_reaction', { messageId: message._id, reactions: message.reactions });
    return apiResponse(res, 200, 'Reaction updated', { reactions: message.reactions });
  } catch (err) { next(err); }
};

// ─── Pin / Unpin message ──────────────────────────────────────────────────────
export const pinMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) throw new ApiError('Message not found.', 404);

    const chat = await Chat.findOne({ _id: message.chat, participants: req.user._id });
    if (!chat) throw new ApiError('Access denied.', 403);

    const isPinned = chat.pinnedMessages.map(String).includes(req.params.id);
    if (isPinned) {
      chat.pinnedMessages = chat.pinnedMessages.filter((m) => m.toString() !== req.params.id);
      message.isPinned = false;
    } else {
      chat.pinnedMessages.push(message._id);
      message.isPinned = true;
    }
    await Promise.all([chat.save(), message.save()]);
    io.to(message.chat.toString()).emit('message_pinned', { messageId: message._id, isPinned: message.isPinned });
    return apiResponse(res, 200, isPinned ? 'Message unpinned' : 'Message pinned', { isPinned: message.isPinned });
  } catch (err) { next(err); }
};

// ─── Search messages ──────────────────────────────────────────────────────────
export const searchMessages = async (req, res, next) => {
  try {
    const { q, chatId } = req.query;
    if (!q || !chatId) throw new ApiError('Query and chatId are required.', 400);

    const chat = await Chat.findOne({ _id: chatId, participants: req.user._id });
    if (!chat) throw new ApiError('Chat not found.', 404);

    const messages = await Message.find({
      chat: chatId,
      $text: { $search: q },
      isDeleted: false,
    })
      .populate('sender', 'username displayName avatar')
      .sort({ score: { $meta: 'textScore' } })
      .limit(20)
      .lean();

    return apiResponse(res, 200, 'Search results', { messages });
  } catch (err) { next(err); }
};

// ─── Mark messages as read ────────────────────────────────────────────────────
export const markMessagesRead = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const now = new Date();
    await Message.updateMany(
      { chat: chatId, 'readBy.user': { $ne: req.user._id }, isDeleted: false },
      { $push: { readBy: { user: req.user._id, readAt: now } } }
    );
    io.to(chatId).emit('messages_read', { chatId, userId: req.user._id, readAt: now });
    return apiResponse(res, 200, 'Messages marked as read');
  } catch (err) { next(err); }
};

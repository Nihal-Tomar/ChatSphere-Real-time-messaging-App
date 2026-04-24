import Chat from '../models/Chat.model.js';
import Message from '../models/Message.model.js';
import User from '../models/User.model.js';
import ApiError from '../utils/apiError.js';
import apiResponse from '../utils/apiResponse.js';
import { uploadToCloudinary } from '../config/cloudinary.js';

export const getMyChats = async (req, res, next) => {
  try {
    const chats = await Chat.find({ participants: req.user._id })
      .populate('participants', 'username displayName avatar status lastSeen')
      .populate({ path: 'lastMessage', select: 'content type sender createdAt isDeleted', populate: { path: 'sender', select: 'username displayName' } })
      .sort({ updatedAt: -1 }).lean();

    const enriched = chats.map((chat) => {
      const meta = chat.participantMeta?.find((m) => m.user?.toString() === req.user._id.toString());
      return { ...chat, unreadCount: meta?.unreadCount || 0 };
    });
    return apiResponse(res, 200, 'Chats fetched', { chats: enriched });
  } catch (err) { next(err); }
};

export const accessOrCreateChat = async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId) throw new ApiError('Target user ID required.', 400);
    if (userId === req.user._id.toString()) throw new ApiError('Cannot chat with yourself.', 400);

    const targetUser = await User.findById(userId);
    if (!targetUser) throw new ApiError('User not found.', 404);

    let chat = await Chat.findOne({ isGroup: false, participants: { $all: [req.user._id, userId], $size: 2 } })
      .populate('participants', 'username displayName avatar status lastSeen')
      .populate('lastMessage');

    if (chat) return apiResponse(res, 200, 'Chat found', { chat });

    chat = await Chat.create({
      isGroup: false, participants: [req.user._id, userId],
      participantMeta: [{ user: req.user._id, unreadCount: 0 }, { user: userId, unreadCount: 0 }],
    });
    chat = await Chat.findById(chat._id).populate('participants', 'username displayName avatar status lastSeen');
    return apiResponse(res, 201, 'Chat created', { chat });
  } catch (err) { next(err); }
};

export const createGroupChat = async (req, res, next) => {
  try {
    const { name, participantIds, description } = req.body;
    if (!name) throw new ApiError('Group name is required.', 400);
    if (!participantIds || participantIds.length < 2) throw new ApiError('Group needs at least 3 members.', 400);

    const allIds = [...new Set([...participantIds, req.user._id.toString()])];
    const chat = await Chat.create({
      name, isGroup: true, description: description || '',
      participants: allIds, admins: [req.user._id], createdBy: req.user._id,
      participantMeta: allIds.map((id) => ({ user: id, unreadCount: 0 })),
    });
    const populated = await Chat.findById(chat._id).populate('participants', 'username displayName avatar status');
    return apiResponse(res, 201, 'Group created', { chat: populated });
  } catch (err) { next(err); }
};

export const getChatById = async (req, res, next) => {
  try {
    const chat = await Chat.findOne({ _id: req.params.id, participants: req.user._id })
      .populate('participants', 'username displayName avatar status lastSeen bio')
      .populate({ path: 'pinnedMessages', populate: { path: 'sender', select: 'username displayName avatar' } })
      .lean();
    if (!chat) throw new ApiError('Chat not found.', 404);
    return apiResponse(res, 200, 'Chat fetched', { chat });
  } catch (err) { next(err); }
};

export const renameGroup = async (req, res, next) => {
  try {
    const chat = await Chat.findOne({ _id: req.params.id, isGroup: true, admins: req.user._id });
    if (!chat) throw new ApiError('Not found or not admin.', 403);
    chat.name = req.body.name;
    await chat.save();
    return apiResponse(res, 200, 'Group renamed', { name: chat.name });
  } catch (err) { next(err); }
};

export const addGroupMembers = async (req, res, next) => {
  try {
    const chat = await Chat.findOne({ _id: req.params.id, isGroup: true, admins: req.user._id });
    if (!chat) throw new ApiError('Not found or not admin.', 403);
    const newIds = req.body.userIds.filter((id) => !chat.participants.map(String).includes(id));
    chat.participants.push(...newIds);
    newIds.forEach((id) => chat.participantMeta.push({ user: id, unreadCount: 0 }));
    await chat.save();
    const populated = await Chat.findById(chat._id).populate('participants', 'username displayName avatar status');
    return apiResponse(res, 200, 'Members added', { chat: populated });
  } catch (err) { next(err); }
};

export const removeGroupMember = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const chat = await Chat.findOne({ _id: req.params.id, isGroup: true, admins: req.user._id });
    if (!chat) throw new ApiError('Not found or not admin.', 403);
    chat.participants = chat.participants.filter((p) => p.toString() !== userId);
    chat.participantMeta = chat.participantMeta.filter((m) => m.user?.toString() !== userId);
    await chat.save();
    return apiResponse(res, 200, 'Member removed');
  } catch (err) { next(err); }
};

export const leaveGroup = async (req, res, next) => {
  try {
    const chat = await Chat.findOne({ _id: req.params.id, isGroup: true, participants: req.user._id });
    if (!chat) throw new ApiError('Chat not found.', 404);
    const myId = req.user._id.toString();
    chat.participants = chat.participants.filter((p) => p.toString() !== myId);
    chat.participantMeta = chat.participantMeta.filter((m) => m.user?.toString() !== myId);
    if (chat.admins.map(String).includes(myId) && chat.participants.length > 0) chat.admins = [chat.participants[0]];
    await chat.save();
    return apiResponse(res, 200, 'Left group');
  } catch (err) { next(err); }
};

export const markChatAsRead = async (req, res, next) => {
  try {
    const chat = await Chat.findOne({ _id: req.params.id, participants: req.user._id });
    if (!chat) throw new ApiError('Chat not found.', 404);
    const meta = chat.participantMeta.find((m) => m.user?.toString() === req.user._id.toString());
    if (meta) { meta.unreadCount = 0; meta.lastRead = new Date(); }
    await chat.save();
    return apiResponse(res, 200, 'Marked as read');
  } catch (err) { next(err); }
};

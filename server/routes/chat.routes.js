import { Router } from 'express';
import {
  getMyChats, accessOrCreateChat, createGroupChat, getChatById,
  renameGroup, addGroupMembers, removeGroupMember, leaveGroup, markChatAsRead,
} from '../controllers/chat.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();
router.use(protect);

router.get('/', getMyChats);
router.post('/access', accessOrCreateChat);
router.post('/group', createGroupChat);
router.get('/:id', getChatById);
router.patch('/:id/rename', renameGroup);
router.post('/:id/members', addGroupMembers);
router.delete('/:id/members', removeGroupMember);
router.post('/:id/leave', leaveGroup);
router.post('/:id/read', markChatAsRead);

export default router;

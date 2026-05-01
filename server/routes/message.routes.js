import { Router } from 'express';
import {
  getMessages, sendMessage, editMessage, deleteMessage,
  reactToMessage, pinMessage, searchMessages, markMessagesRead,
} from '../controllers/message.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { upload, handleUploadError } from '../middleware/upload.middleware.js';

const router = Router();
router.use(protect);

// Static routes MUST come before parameterised ones
router.get('/search', searchMessages);
router.post('/', upload.single('file'), handleUploadError, sendMessage);
router.get('/:chatId', getMessages);
router.post('/:chatId/read', markMessagesRead);
router.patch('/:id', editMessage);
router.delete('/:id', deleteMessage);
router.post('/:id/react', reactToMessage);
router.post('/:id/pin', pinMessage);

export default router;

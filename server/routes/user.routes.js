import { Router } from 'express';
import { searchUsers, getUserById, updateProfile, uploadAvatar, updateStatus, blockUser } from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { upload, handleUploadError } from '../middleware/upload.middleware.js';

const router = Router();

router.use(protect);

router.get('/search', searchUsers);
router.get('/:id', getUserById);
router.patch('/profile', updateProfile);
router.post('/avatar', upload.single('avatar'), handleUploadError, uploadAvatar);
router.patch('/status', updateStatus);
router.post('/block/:id', blockUser);

export default router;

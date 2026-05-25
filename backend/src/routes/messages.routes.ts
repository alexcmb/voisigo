import { Router } from 'express';
import { startConversation, listConversations, getMessages, sendMessage, deleteConversationsController } from '../controllers/messages.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// All messaging routes require authentication
router.post('/conversations', authenticateToken, startConversation);
router.get('/conversations', authenticateToken, listConversations);
router.post('/conversations/delete', authenticateToken, deleteConversationsController);
router.get('/conversations/:id', authenticateToken, getMessages);
router.post('/conversations/:id', authenticateToken, sendMessage);

export default router;

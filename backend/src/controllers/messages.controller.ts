import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
    findOrCreateConversation,
    getConversationsForUser,
    getMessagesForConversation,
    createMessage,
    findConversationById,
    findUserById,
    findTripById,
    findServiceById,
    createNotification,
    deleteConversations,
    Message,
    Notification,
} from '../utils/db';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';

const createConversationSchema = z.object({
    recipientId: z.string(),
    relatedType: z.enum(['trip', 'service']).optional(),
    relatedId: z.string().optional(),
    initialMessage: z.string().min(1).optional(),
});

const sendMessageSchema = z.object({
    content: z.string().min(1),
});

// POST /api/messages/conversations
export const startConversation = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const data = createConversationSchema.parse(req.body);

        if (data.recipientId === req.user.userId) {
            res.status(400).json({ message: 'Cannot start a conversation with yourself' });
            return;
        }

        const recipient = await findUserById(data.recipientId);
        if (!recipient) {
            res.status(404).json({ message: 'Recipient not found' });
            return;
        }

        const conversation = await findOrCreateConversation(
            uuidv4(),
            req.user.userId,
            data.recipientId,
            data.relatedType,
            data.relatedId,
        );

        if (data.initialMessage) {
            const sender = await findUserById(req.user.userId);
            const msg: Message = {
                id: uuidv4(),
                conversationId: conversation.id,
                senderId: req.user.userId,
                senderName: sender?.name || 'Unknown',
                content: data.initialMessage,
                createdAt: new Date().toISOString(),
            };
            await createMessage(msg);
        }

        res.status(201).json({ conversation });
    } catch (error: any) {
        res.status(400).json({ message: error.message || 'Error creating conversation' });
    }
};

// GET /api/messages/conversations
export const listConversations = async (req: AuthRequest, res: Response) => {
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    const conversations = await getConversationsForUser(req.user.userId);
    res.json(conversations);
};

// GET /api/messages/conversations/:id
export const getMessages = async (req: AuthRequest, res: Response) => {
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    const conversationId = req.params.id as string;
    const conversation = await findConversationById(conversationId);

    if (!conversation) {
        res.status(404).json({ message: 'Conversation not found' });
        return;
    }

    const participants: string[] = JSON.parse(conversation.participants);
    if (!participants.includes(req.user.userId)) {
        res.status(403).json({ message: 'Access denied' });
        return;
    }

    const messages = await getMessagesForConversation(conversationId);

    const otherId = participants.find(p => p !== req.user!.userId) || participants[0];
    const otherUser = await findUserById(otherId);

    let relatedItem = null;
    if (conversation.relatedType === 'trip' && conversation.relatedId) {
        relatedItem = await findTripById(conversation.relatedId);
    } else if (conversation.relatedType === 'service' && conversation.relatedId) {
        relatedItem = await findServiceById(conversation.relatedId);
    }

    res.json({
        conversation,
        otherUser: otherUser ? { id: otherUser.id, name: otherUser.name, avatarUrl: otherUser.avatarUrl } : null,
        messages,
        relatedItem,
    });
};

// POST /api/messages/conversations/:id
export const sendMessage = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const conversationId = req.params.id as string;
        const conversation = await findConversationById(conversationId);

        if (!conversation) {
            res.status(404).json({ message: 'Conversation not found' });
            return;
        }

        const participants: string[] = JSON.parse(conversation.participants);
        if (!participants.includes(req.user.userId)) {
            res.status(403).json({ message: 'Access denied' });
            return;
        }

        const data = sendMessageSchema.parse(req.body);
        const sender = await findUserById(req.user.userId);

        const msg: Message = {
            id: uuidv4(),
            conversationId,
            senderId: req.user.userId,
            senderName: sender?.name || 'Unknown',
            content: data.content,
            createdAt: new Date().toISOString(),
        };

        await createMessage(msg);

        const recipientId = participants.find(p => p !== req.user!.userId);
        if (recipientId) {
            const notif: Notification = {
                id: uuidv4(),
                userId: recipientId,
                type: 'new_message',
                title: 'Nouveau message',
                message: `${sender?.name || 'Quelqu\'un'} : ${data.content.substring(0, 80)}${data.content.length > 80 ? '...' : ''}`,
                relatedType: 'conversation',
                relatedId: conversationId,
                read: 0,
                createdAt: new Date().toISOString(),
            };
            await createNotification(notif);
        }

        res.status(201).json({ message: msg });
    } catch (error: any) {
        res.status(400).json({ message: error.message || 'Error sending message' });
    }
};

// POST /api/messages/conversations/delete
export const deleteConversationsController = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const { conversationIds } = req.body;
        if (!Array.isArray(conversationIds) || conversationIds.length === 0) {
            res.status(400).json({ message: 'Invalid conversation IDs' });
            return;
        }

        await deleteConversations(conversationIds, req.user.userId);
        res.json({ message: 'Conversations deleted' });
    } catch (error: any) {
        res.status(400).json({ message: error.message || 'Error deleting conversations' });
    }
};

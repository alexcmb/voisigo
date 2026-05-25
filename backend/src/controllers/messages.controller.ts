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

// POST /api/messages/conversations — Create or find existing conversation
export const startConversation = (req: AuthRequest, res: Response) => {
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

        const recipient = findUserById(data.recipientId);
        if (!recipient) {
            res.status(404).json({ message: 'Recipient not found' });
            return;
        }

        const conversation = findOrCreateConversation(
            uuidv4(),
            req.user.userId,
            data.recipientId,
            data.relatedType,
            data.relatedId,
        );

        // Send initial message if provided
        if (data.initialMessage) {
            const sender = findUserById(req.user.userId);
            const msg: Message = {
                id: uuidv4(),
                conversationId: conversation.id,
                senderId: req.user.userId,
                senderName: sender?.name || 'Unknown',
                content: data.initialMessage,
                createdAt: new Date().toISOString(),
            };
            createMessage(msg);
        }

        res.status(201).json({ conversation });
    } catch (error: any) {
        res.status(400).json({ message: error.message || 'Error creating conversation' });
    }
};

// GET /api/messages/conversations — List my conversations
export const listConversations = (req: AuthRequest, res: Response) => {
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    const conversations = getConversationsForUser(req.user.userId);
    res.json(conversations);
};

// GET /api/messages/conversations/:id — Get messages for a conversation
export const getMessages = (req: AuthRequest, res: Response) => {
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    const conversationId = req.params.id as string;
    const conversation = findConversationById(conversationId);

    if (!conversation) {
        res.status(404).json({ message: 'Conversation not found' });
        return;
    }

    // Verify user is a participant
    const participants: string[] = JSON.parse(conversation.participants);
    if (!participants.includes(req.user.userId)) {
        res.status(403).json({ message: 'Access denied' });
        return;
    }

    const messages = getMessagesForConversation(conversationId);

    // Get other participant info
    const otherId = participants.find(p => p !== req.user.userId) || participants[0];
    const otherUser = findUserById(otherId);

    // Get related item info
    let relatedItem = null;
    if (conversation.relatedType === 'trip' && conversation.relatedId) {
        relatedItem = findTripById(conversation.relatedId);
    } else if (conversation.relatedType === 'service' && conversation.relatedId) {
        relatedItem = findServiceById(conversation.relatedId);
    }

    res.json({
        conversation,
        otherUser: otherUser ? { id: otherUser.id, name: otherUser.name, avatarUrl: otherUser.avatarUrl } : null,
        messages,
        relatedItem,
    });
};

// POST /api/messages/conversations/:id — Send a message
export const sendMessage = (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const conversationId = req.params.id as string;
        const conversation = findConversationById(conversationId);

        if (!conversation) {
            res.status(404).json({ message: 'Conversation not found' });
            return;
        }

        // Verify user is a participant
        const participants: string[] = JSON.parse(conversation.participants);
        if (!participants.includes(req.user.userId)) {
            res.status(403).json({ message: 'Access denied' });
            return;
        }

        const data = sendMessageSchema.parse(req.body);
        const sender = findUserById(req.user.userId);

        const msg: Message = {
            id: uuidv4(),
            conversationId,
            senderId: req.user.userId,
            senderName: sender?.name || 'Unknown',
            content: data.content,
            createdAt: new Date().toISOString(),
        };

        createMessage(msg);

        // Notify the other participant
        const recipientId = participants.find(p => p !== req.user.userId);
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
            createNotification(notif);
        }

        res.status(201).json({ message: msg });
    } catch (error: any) {
        res.status(400).json({ message: error.message || 'Error sending message' });
    }
};

// POST /api/messages/conversations/delete — Delete conversations
export const deleteConversationsController = (req: AuthRequest, res: Response) => {
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

        deleteConversations(conversationIds, req.user.userId);
        res.json({ message: 'Conversations deleted' });
    } catch (error: any) {
        res.status(400).json({ message: error.message || 'Error deleting conversations' });
    }
};

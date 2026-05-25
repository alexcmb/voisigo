import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { findUserByEmail, createUser as dbCreateUser, User } from '../utils/db';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_123';

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

export const register = async (req: any, res: Response) => {
    try {
        const data = registerSchema.parse(req.body);

        const existingUser = findUserByEmail(data.email);
        if (existingUser) {
            res.status(409).json({ message: 'Email already registered' });
            return;
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);
        const newUser: User = {
            id: uuidv4(),
            email: data.email,
            password: hashedPassword,
            name: data.name,
            bio: '',
            avatarUrl: '',
            createdAt: new Date().toISOString(),
        };

        dbCreateUser(newUser);

        const token = jwt.sign({ userId: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '24h' });
        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: { id: newUser.id, name: newUser.name, email: newUser.email, avatarUrl: newUser.avatarUrl },
        });
    } catch (error: any) {
        res.status(400).json({ message: error.message || 'Validation error' });
    }
};

export const login = async (req: any, res: Response) => {
    try {
        const data = loginSchema.parse(req.body);

        const user = findUserByEmail(data.email);
        if (!user) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }

        const validPassword = await bcrypt.compare(data.password, user.password);
        if (!validPassword) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }

        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
        res.json({
            message: 'Login successful',
            token,
            user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl },
        });
    } catch (error: any) {
        res.status(400).json({ message: error.message || 'Validation error' });
    }
};

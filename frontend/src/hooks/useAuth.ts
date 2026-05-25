import { useNavigate } from 'react-router-dom';
import type { User } from '../types';

export function useAuth() {
    const navigate = useNavigate();

    const getToken = (): string | null => {
        return localStorage.getItem('token');
    };

    const getUser = (): User | null => {
        const userStr = localStorage.getItem('user');
        if (!userStr) return null;
        try {
            return JSON.parse(userStr);
        } catch {
            return null;
        }
    };

    const isAuthenticated = (): boolean => {
        return !!getToken();
    };

    const login = (token: string, user: User): void => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
    };

    const logout = (): void => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const requireAuth = (): boolean => {
        if (!isAuthenticated()) {
            navigate('/login');
            return false;
        }
        return true;
    };

    return {
        token: getToken(),
        user: getUser(),
        isAuthenticated: isAuthenticated(),
        login,
        logout,
        requireAuth,
    };
}

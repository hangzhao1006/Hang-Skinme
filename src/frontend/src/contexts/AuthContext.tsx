'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_ENDPOINTS } from '@/lib/api-config';

export interface User {
    id: string;
    email: string;
    name: string;
    createdAt: string;
}

export interface AuthResponse {
    success: boolean;
    user?: User;
    error?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    initialized: boolean;
    login: (email: string, password: string) => Promise<AuthResponse>;
    signup: (email: string, password: string, name?: string) => Promise<AuthResponse>;
    logout: () => void;
    getToken: () => string | null;
    isAuthenticated: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(() => {
        // 同步从 localStorage 恢复，避免首屏闪烁未登录视图
        const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
        const storedToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (storedUser && storedToken) {
            try {
                return JSON.parse(storedUser) as User;
            } catch (error) {
                console.error('Failed to parse stored user:', error);
                localStorage.removeItem('user');
                localStorage.removeItem('token');
            }
        }
        return null;
    });
    const [loading, setLoading] = useState<boolean>(true);
    const [initialized, setInitialized] = useState<boolean>(false);

    // async verification / hydrate flag
    useEffect(() => {
        // 如果未来需要对 token 做后端校验，可以在这里处理
        setLoading(false);
        setInitialized(true);
    }, []);

    // login
    const login = async (email: string, password: string): Promise<AuthResponse> => {
        try {
            const response = await fetch(API_ENDPOINTS.LOGIN, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: data.error || 'Login failed'
                };
            }

            if (data.success && data.user && data.token) {
                const user: User = {
                    id: data.user.id,
                    email: data.user.email,
                    name: data.user.name,
                    createdAt: data.user.createdAt
                };

                // save to state and localStorage
                setUser(user);
                localStorage.setItem('user', JSON.stringify(user));
                localStorage.setItem('token', data.token);

                return { success: true, user };
            } else {
                return {
                    success: false,
                    error: data.error || 'Login failed'
                };
            }
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Network error. Please check your connection.'
            };
        }
    };

    // register
    const signup = async (email: string, password: string, name?: string): Promise<AuthResponse> => {
        try {
            const response = await fetch(API_ENDPOINTS.REGISTER, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    password,
                    name: name || email.split('@')[0]
                })
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: data.error || 'Registration failed'
                };
            }

            if (data.success && data.user && data.token) {
                const user: User = {
                    id: data.user.id,
                    email: data.user.email,
                    name: data.user.name,
                    createdAt: data.user.createdAt
                };

                // save to state and localStorage
                setUser(user);
                localStorage.setItem('user', JSON.stringify(user));
                localStorage.setItem('token', data.token);

                return { success: true, user };
            } else {
                return {
                    success: false,
                    error: data.error || 'Registration failed'
                };
            }
        } catch (error) {
            console.error('Signup error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Network error. Please check your connection.'
            };
        }
    };

    // logout
    const logout = (): void => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    };

    // get token
    const getToken = (): string | null => {
        return localStorage.getItem('token');
    };

    // check if authenticated
    const isAuthenticated = (): boolean => {
        return initialized && !!user && !!getToken();
    };

    const value: AuthContextType = {
        user,
        loading,
        initialized,
        login,
        signup,
        logout,
        getToken,
        isAuthenticated
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

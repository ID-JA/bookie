import { createContext, useState, useContext, useEffect } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            // minimal decode or just assume valid until 401
            // Ideally we call /auth/profile or something.
            // For now, let's just assume we are logged in if token exists, 
            // maybe store user info in localstorage too for simplicity.
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        }
        setLoading(false);
    }, [token]);

    const login = async (email, password) => {
        try {
            // Auth service route: /auth/login
            const response = await client.post('/auth/login', { email, password });
            const { accessToken, ...userData } = response.data; // Adjust based on actual auth service response

            // If nestjs returns accessToken
            setToken(accessToken);
            setUser(userData); // If user data is sent back, otherwise we might need to fetch it

            localStorage.setItem('token', accessToken);
            // localStorage.setItem('user', JSON.stringify(userData)); // optional

            return true;
        } catch (error) {
            console.error("Login failed", error);
            return false;
        }
    };

    const signup = async (email, password, name) => {
        try {
            // Auth service route: /auth/signup
            await client.post('/auth/signup', { email, password, name });
            return true;
        } catch (error) {
            console.error("Signup failed", error);
            return false;
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, signup, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

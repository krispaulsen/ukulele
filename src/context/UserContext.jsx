import { createContext, useEffect, useState } from 'react';
import { apiRequest } from '../lib/api';

// 1. Initialize the context
export const UserContext = createContext(null);

// 2. Create a provider component
export const UserProvider = ({ children }) => {
    const loggedOutUser = { isLoggedIn: false, favorites: new Set() };

    const [user, setUser] = useState(loggedOutUser);
    const [favorites, setFavorites] = useState(new Set());

    useEffect(() => {
        setUser(prev => ({ ...prev, favorites }));
    }, [favorites])

    const login = async (email, password) => {
        try {
            const userData = await apiRequest("/api/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, password })
            });

            const favoritesArray = await apiRequest("/api/favorites");
            const favoritesSet = new Set(favoritesArray);
            setFavorites(favoritesSet);

            const updatedUserData = {
                ...userData.user,
                isLoggedIn: true,
                favorites: favoritesSet
            };
            console.log("User Logged In", updatedUserData);
            setUser(updatedUserData);

            // set theme
            if (updatedUserData.darkMode !== undefined) {
                // use the user's preference
                const theme =  updatedUserData.darkMode ? "dark" : "light";
                localStorage.setItem("theme", theme);
                document.documentElement.classList.remove('dark', 'light');
                document.documentElement.classList.add(theme);
            }
        } catch (submitError) {
            console.error(submitError.message || "Authentication failed");
            logout();
        };
    };

    const logout = () => {
        localStorage.removeItem("theme");
        setUser(loggedOutUser);
    }

    const register = async (email, password, screenName) => {
        try {
            const userData = await apiRequest("/api/auth/register", {
                method: "POST",
                body: JSON.stringify({ email, password, screenName })
            });

            setFavorites(new Set());

            const updatedUserData = { ...userData, isLoggedIn: true, favorites: new Set() };
            setUser(updatedUserData);
        } catch (submitError) {
            console.error(submitError.message || "Registration failed");
            logout();
        }
    };
    
    const refreshUser = async () => {
        try {
            const profileData = await apiRequest("/api/users/profile");

            console.log('profileData', profileData);
            
            setUser(prev => ({
                ...prev,
                ...profileData,
            }));
        } catch (error) {
            console.error("Failed to refresh user:", error);
        }
    };

    const toggleFavorite = async (slug) => {
        const isFavorite = favorites.has(slug);
        try {
            if (isFavorite) {
                await apiRequest(`/api/favorites/${encodeURIComponent(slug)}`, { method: "DELETE" });
            } else {
                await apiRequest(`/api/favorites/${encodeURIComponent(slug)}`, { method: "POST" });
            }
            await refreshFavorites();
        } catch (error) {
            console.error(error.message || "Failed to update favorites");
        }
    };

    async function refreshFavorites() {
        try {
            const favoritesArray = await apiRequest("/api/favorites");
            setFavorites(new Set(favoritesArray));
        } catch {
            setFavorites(new Set());
        }
        setUser({ ...user, favorites });
    }

    return (
        <UserContext value={{ user, login, logout, register, refreshUser, toggleFavorite }}>
            {children}
        </UserContext>
    );
};

// 3. Access the user in subcomponents
// import { use } from "react";
// import { UserContext } from "./context/UserContext";
// const { user, login, logout } = use(UserContext);
// if (user.isLoggedIn) {
//     console.log(user.screenName)
//     logout();
// }

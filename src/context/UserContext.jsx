import { createContext, useContext, useState } from 'react';
import { apiRequest } from '../lib/api';

// 1. Initialize the context
export const UserContext = createContext(null);

// 2. Create a provider component
export const UserProvider = ({ children }) => {
    const loggedOutUser = { isLoggedIn: false, favorites: new Set() };

    const [user, setUser] = useState(loggedOutUser);
    const [favorites, setFavorites] = useState(new Set());

    const login = async (email, password) => {
        try {
            const userData = await apiRequest("/api/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, password })
            });

            const favoritesArray = await apiRequest("/api/favorites");
            const favoritesSet = new Set(favoritesArray);
            setFavorites(favoritesSet);

            const updatedUserData = { ...userData, isLoggedIn: true, favorites: favoritesSet };
            console.log("User Logged In", updatedUserData);
            setUser(updatedUserData);
        } catch (submitError) {
            console.error(submitError.message || "Authentication failed");
            logout();
        };
    };

    const logout = () => setUser(loggedOutUser);

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

    const toggleFavorite = async (songId) => {
        const isFavorite = favorites.has(songId);
        try {
            if (isFavorite) {
                await apiRequest(`/api/favorites/${encodeURIComponent(songId)}`, { method: "DELETE" });
            } else {
                await apiRequest(`/api/favorites/${encodeURIComponent(songId)}`, { method: "POST" });
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
        <UserContext value={{ user, login, logout, register, toggleFavorite }}>
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

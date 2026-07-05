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
    }, [favorites]);

    // Hydrate login state and favorites from cookie on mount.
    // /api/auth/me is public and returns { user: null } when unauthenticated,
    // so we avoid spurious 401 errors in the console for guests.
    useEffect(() => {
        const hydrate = async () => {
            try {
                const meData = await apiRequest("/api/auth/me");
                const meUser = meData && meData.user;

                if (!meUser) {
                    // no valid session
                    setUser(loggedOutUser);
                    setFavorites(new Set());
                    return;
                }

                let favArray = await apiRequest("/api/favorites").catch(() => []);
                if (!Array.isArray(favArray)) favArray = [];
                const favSet = new Set(favArray);
                const normalizedUser = {
                    ...meUser,
                    userId: meUser.userId || (meUser._id ? String(meUser._id) : undefined),
                    isLoggedIn: true,
                    favorites: favSet
                };
                setFavorites(favSet);
                setUser(normalizedUser);
            } catch (e) {
                // network error or unexpected failure -> stay logged out
                setUser(loggedOutUser);
                setFavorites(new Set());
            }
        };
        hydrate();
    }, []);

    const login = async (email, password) => {
        try {
            const userData = await apiRequest("/api/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, password })
            });

            let favoritesArray = await apiRequest("/api/favorites");
            if (!Array.isArray(favoritesArray)) favoritesArray = [];
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
            throw submitError;
        }
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
            throw submitError;
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
        const wasFavorite = favorites.has(slug);
        try {
            if (wasFavorite) {
                await apiRequest(`/api/favorites/${encodeURIComponent(slug)}`, { method: "DELETE" });
                const newSet = new Set(favorites);
                newSet.delete(slug);
                setFavorites(newSet);
                setUser(prev => ({ ...prev, favorites: newSet }));
            } else {
                await apiRequest(`/api/favorites/${encodeURIComponent(slug)}`, { method: "POST" });
                const newSet = new Set(favorites);
                newSet.add(slug);
                setFavorites(newSet);
                setUser(prev => ({ ...prev, favorites: newSet }));
            }
            // refresh in background for server truth (e.g. count), but UI already updated
            refreshFavorites().catch(() => {});
        } catch (error) {
            console.error(error.message || "Failed to update favorites");
            // on error, re-sync
            refreshFavorites().catch(() => {});
        }
    };

    async function refreshFavorites() {
        try {
            let favoritesArray = await apiRequest("/api/favorites");
            if (!Array.isArray(favoritesArray)) favoritesArray = [];
            const newSet = new Set(favoritesArray);
            setFavorites(newSet);
            setUser(prev => ({ ...prev, favorites: newSet }));
        } catch {
            setFavorites(new Set());
            setUser(prev => ({ ...prev, favorites: new Set() }));
        }
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

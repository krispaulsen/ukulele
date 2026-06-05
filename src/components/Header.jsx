import { use, useState, useEffect } from "react";
import { UserContext } from "../context/UserContext";
import { apiRequest } from "../lib/api";
import { Nav } from "./ui/Nav";
import { Button, Flex, Link } from "./ui";
import { IconButton } from "@material-tailwind/react";

export default function Header() {
    const { user, login, logout } = use(UserContext);
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('theme');
        if (saved) return saved; // try to use the theme in local storage
        return user.darkMode ? 'dark' : 'light'; // otherwise, use profile value or default value
    });

    async function handleLogout() {
        await apiRequest("/api/auth/logout", { method: "POST" });
        logout();
    }

    function handleThemeToggle() {
        document.documentElement.classList.remove(theme);
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    }

    useEffect(() => {
        document.documentElement.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    return (
        <header className="p-4">
            <Flex className="justify-between">
                <h1>My Ukulele Songbook</h1>
                <div>
                    <IconButton onClick={handleThemeToggle} color={theme === 'dark' ? "primary" : "secondary"}>
                        <i className={theme === 'dark' ? "fa-solid fa-moon" : "fa-regular fa-sun"}></i>
                    </IconButton>
                </div>
            </Flex>
            <Nav>
                <Link to="/">Home</Link>
                <Link to="/theme">Theme</Link>
                {user.isLoggedIn ? (
                    <>
                        <Link to="/song/new">Add Song</Link>
                        <Link to="/favorites">My Songbook</Link>
                        <Link to="/profile">My Profile</Link>
                        <Button variant="link" type="button" onClick={handleLogout}>
                            Log out
                        </Button>
                    </>
                ) : (
                    <>
                        <Link to="/auth">Login</Link>
                        <Link to="/auth/register">Register</Link>
                    </>
                )}
            </Nav>
        </header>
    );
};

import { use, useEffect, useState } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import { apiRequest } from "./lib/api";
import { UserContext } from "./context/UserContext";
import Header from "./components/Header";
import AuthPage from "./pages/AuthPage";
import FavoritesPage from "./pages/FavoritesPage";
import SearchPage from "./pages/SearchPage";
import SongPage from "./pages/SongPage";
import SongEditorPage from "./pages/SongEditorPage";
import ProfilePage from "./pages/ProfilePage";

export default function App() {
    const { user } = use(UserContext);

    // if (isAuthLoading) {
    //   return (
    //     <main className="container">
    //       <p>Loading session...</p>
    //     </main>
    //   );
    // }

    return (
        <>
            <Header />
            <section className="body p-4">

                <Routes>
                    <Route path="/" element={<SearchPage />} />
                    <Route path="/song/:songId" element={<SongPage />} />
                    {user?.isLoggedIn ? (
                        <>
                            <Route path="/profile" element={<ProfilePage />} />
                            <Route path="/favorites" element={<FavoritesPage />} />
                            <Route path="/song/new" element={<SongEditorPage mode="new" />} />
                            <Route path="/song/:songId/edit" element={<SongEditorPage mode="edit" />} />
                            <Route path="/song/:songId/fork" element={<SongEditorPage mode="fork" />} />
                        </>
                    ) : (
                        <>
                            <Route path="/auth" element={<AuthPage />} />
                            <Route path="/auth/register" element={<AuthPage defaultMode="register" />} />
                        </>
                    )}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>

            </section>
        </>
    );
}

import { use, useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { apiRequest } from "./lib/api";
import { UserContext } from "./context/UserContext";
import Header from "./components/Header";
import AuthPage from "./pages/AuthPage";
import FavoritesPage from "./pages/FavoritesPage";
import SearchPage from "./pages/SearchPage";
import SongPage from "./pages/SongPage";
import SongEditorPage from "./pages/SongEditorPage";
import ProfilePage from "./pages/ProfilePage";
import ThemePage from "./pages/ThemePage";
import TabEditorPage from "./pages/TabEditorPage";
import TunerPage from "./pages/TunerPage";

// Guard for protected routes. Captures the attempted location so we can
// return the user here after they log in.
function RequireAuth({ children }) {
  const { user } = use(UserContext);
  const loc = useLocation();
  if (!user?.isLoggedIn) {
    // Normalize so the stored "from" only has the path parts we care about (incl. search for pagination).
    const from = loc && typeof loc === "object"
      ? { pathname: loc.pathname || "/", search: loc.search || "", hash: loc.hash || "" }
      : { pathname: "/" };
    return <Navigate to="/auth" state={{ from }} replace />;
  }
  return children;
}

export default function App() {
    const { user } = use(UserContext);
    const loc = useLocation();

    // Build a clean "to" value from a captured `from` (or fallback).
    // Normalizing prevents any extra location fields and preserves search (e.g. ?page=4).
    const getFromTarget = () => {
        const from = loc.state?.from;
        if (from && typeof from === "object") {
            return {
                pathname: from.pathname || "/",
                search: from.search || "",
                hash: from.hash || "",
            };
        }
        return "/";
    };

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
                    <Route path="/theme" element={<ThemePage />} />
                    <Route path="/tabs" element={<TabEditorPage />} />
                    <Route path="/tuner" element={<TunerPage />} />
                    <Route path="/song/:slug" element={<SongPage />} />

                    {/* Auth routes are always present. Redirect away if already logged in.
                        Use any `from` captured in state so we return to the previous page (incl. search params). */}
                    <Route
                        path="/auth"
                        element={user?.isLoggedIn ? <Navigate to={getFromTarget()} replace /> : <AuthPage />}
                    />
                    <Route
                        path="/auth/register"
                        element={user?.isLoggedIn ? <Navigate to={getFromTarget()} replace /> : <AuthPage defaultMode="register" />}
                    />

                    {/* Protected routes are always declared so they can match when logged out
                        and forward the attempted `from` location via the guard. */}
                    <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
                    <Route path="/favorites" element={<RequireAuth><FavoritesPage /></RequireAuth>} />
                    <Route path="/song/new" element={<RequireAuth><SongEditorPage mode="new" /></RequireAuth>} />
                    <Route path="/song/:slug/edit" element={<RequireAuth><SongEditorPage mode="edit" /></RequireAuth>} />
                    <Route path="/song/:slug/fork" element={<RequireAuth><SongEditorPage mode="fork" /></RequireAuth>} />

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>

            </section>
        </>
    );
}

import { use } from "react";
import { UserContext } from "../context/UserContext";
import { Flex, Link } from "./ui";
import { Button, IconButton } from "@material-tailwind/react";

// function getVisiblePages(current, total) {
//     if (total <= 1) return [];
//     const pages = new Set([1, total]);
//     for (let i = current - 2; i <= current + 2; i++) {
//         if (i > 1 && i < total) pages.add(i);
//     }
//     const sorted = Array.from(pages).sort((a, b) => a - b);
//     const result = [];
//     for (let i = 0; i < sorted.length; i++) {
//         result.push(sorted[i]);
//         if (i < sorted.length - 1 && sorted[i + 1] - sorted[i] > 1) {
//             result.push("…");
//         }
//     }
//     return result;
// }

function getVisiblePages(current, total) {
    if (total <= 1) return [];
    const padding = 2; // number of pages before and after current page
    const pages = [];
    if (current > padding + 1) pages.push("…");
    for (let i = current - padding; i <= current + padding; i++) {
        if (i > 0 && i <= total) pages.push(i);
    }
    if (current < total - padding) pages.push("…");
    return pages;
}

export default function SongList({ items = [], updatePopularList = () => {}, pagination, onPageChange }) {
    const { user, toggleFavorite } = use(UserContext);

    const handleToggleFavorite = async (slug) => {
        await toggleFavorite(slug);
        updatePopularList();
    };

    const p = pagination?.page ?? 1;
    const totalP = pagination?.totalPages ?? 1;
    const pageItems = pagination ? getVisiblePages(p, totalP) : [];

    return (
        <>
            <table className="dataTable">
                <thead>
                    <tr>
                        {user?.isLoggedIn && <th></th>}
                        <th>Song</th>
                        <th>Artist</th>
                        <th>Chords</th>
                        <th>Submitted By</th>
                    </tr>
                </thead>
                <tbody>
                    {(items || []).map((song) => {
                        const isFavorited = user?.favorites?.has(song.slug);

                        return (
                            <tr key={song.slug}>
                                {user?.isLoggedIn && (
                                    <td>
                                        <IconButton
                                            onClick={() => handleToggleFavorite(song.slug)}
                                            aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
                                            variant={isFavorited ? "filled" : "outlined"}
                                            size="sm"
                                        >
                                            {isFavorited ? (
                                                <i className="fa-solid fa-heart"></i>
                                            ) : (
                                                <i className="fa-regular fa-heart"></i>
                                            )}
                                        </IconButton>
                                    </td>
                                )}
                                <td>
                                    <Link className="song-btn" to={`/song/${song.slug}`}>
                                        {song.isOwner && !song.isPublic ? <i className="fa-solid fa-eye-slash" title="Private"></i> : null}
                                        {' '}{song.title}
                                    </Link>
                                </td>
                                <td>{song.artist}</td>
                                <td>
                                    {(song.chords ?? []).join(', ')}
                                    {song.hasTabs ? (
                                        <span className="ml-2 whitespace-nowrap text-orange-500" title="Includes tablature">
                                            <i className="fa-solid fa-table-cells" aria-hidden="true"></i>
                                            {' '}Tabs
                                        </span>
                                    ) : null}
                                </td>
                                <td>
                                    {song.screenName || "Unknown"} • {new Date(song.updatedAt).toLocaleDateString()}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {pagination && (
                <Flex gap="gap-2" className="w-full mt-3 items-center justify-center text-sm">
                    {/* <span className="mr-2">{pagination.total ?? 0} result{(pagination.total ?? 0) === 1 ? "" : "s"}</span> */}
                    {totalP > 1 && (
                        <Flex gap="gap-1" className="items-center">
                            <IconButton color="secondary" disabled={p <= 1} onClick={() => onPageChange?.(1)}><i className="fa-solid fa-angles-left"></i></IconButton>
                            <IconButton color="secondary" disabled={p <= 1} onClick={() => onPageChange?.(p - 1)}><i className="fa-solid fa-angle-left"></i></IconButton>

                            {pageItems.map((item, idx) =>
                                item === "…"
                                    ? <span key={"e" + idx} className="px-1">…</span>
                                    : <Button
                                        key={item}
                                        color={item === p ? "primary" : "secondary"}
                                        onClick={() => onPageChange?.(item)}
                                      >
                                          {item}
                                      </Button>
                            )}

                            <IconButton color="secondary" disabled={p >= totalP} onClick={() => onPageChange?.(p + 1)}><i className="fa-solid fa-angle-right"></i></IconButton>
                            <IconButton color="secondary" disabled={p >= totalP} onClick={() => onPageChange?.(totalP)}><i className="fa-solid fa-angles-right"></i></IconButton>
                        </Flex>
                    )}
                </Flex>
            )}
        </>
    );
}

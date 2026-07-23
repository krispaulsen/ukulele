// import { Input, Textarea } from "@material-tailwind/react";
// import { Input, Textarea } from "./Forms";
import { useEffect, useId, useState } from "react";
import { Flex } from "./ui/Flex";
import { Button, IconButton, Menu, MenuHandler, MenuList, MenuItem } from "@material-tailwind/react";

const INSERT_CHORDS = ["[C]Lyrics"];
const INSERT_COMMENT = ["[(Comment)]"];
const INSERT_TABS = ["[|", "A|----------------", "E|----------------", "C|----------------", "G|----------------", "|]"];
const INSERT_SPACE = [""];

function newBlockId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function Label({ htmlFor, children }) {
    return (
        <label htmlFor={htmlFor} className="text-xs w-14 shrink-0 text-right text-gray-500">{children}</label>
    );
}

function Comment({ str, id, onChange }) {
    return (
        <input
            id={id}
            value={str}
            onChange={(event) => onChange(event.target.value)}
            className="grow text-gray-700"
        />
    );
}

function TabsBlock({ str, id, onChange }) {
    return (
        <textarea
            id={id}
            className="grow block font-mono"
            rows="4"
            value={str}
            onChange={(event) => onChange(event.target.value)}
        />
    );
}

/** Split an inline chord/lyrics line into a chords row and a lyrics row. */
function splitChordLine(str) {
    const parts = String(str ?? "").split(/(\[[^\]]+\])/g);
    let lyricsStr = "";
    let chordsStr = "";
    let prevPartLength = 0;
    let chordCharCount = 0;
    parts.forEach((part) => {
        if (part.startsWith("[") && part.endsWith("]")) {
            const numSpaces = prevPartLength - chordCharCount;
            const spaces = " ".repeat(numSpaces < 0 ? 1 : numSpaces);
            const chord = part.substring(1, part.length - 1);
            chordsStr += spaces + chord;
            chordCharCount = chord.length;
        } else {
            prevPartLength = part.length;
            lyricsStr += part;
        }
    });
    return { chordsStr, lyricsStr };
}

/**
 * Merge a chords row + lyrics row back into inline `[Chord]lyrics` form.
 * Chord column indices are relative to the lyrics string.
 */
function mergeChordsAndLyrics(chordsStr, lyricsStr) {
    const chords = [];
    const re = /\S+/g;
    let match;
    while ((match = re.exec(chordsStr ?? "")) !== null) {
        chords.push({ name: match[0], col: match.index });
    }
    if (chords.length === 0) {
        return lyricsStr ?? "";
    }

    let result = lyricsStr ?? "";
    const maxCol = Math.max(...chords.map((c) => c.col));
    if (result.length < maxCol) {
        result += " ".repeat(maxCol - result.length);
    }

    for (let i = chords.length - 1; i >= 0; i--) {
        const { name, col } = chords[i];
        result = result.slice(0, col) + `[${name}]` + result.slice(col);
    }
    return result;
}

function Chords({ str, chordsId, lyricsId, onChange }) {
    const { chordsStr, lyricsStr } = splitChordLine(str);

    return (
        <div className="grow">
            <Flex gap="gap-2" className="items-end">
                <Label htmlFor={chordsId}>Chords</Label>
                <input
                    id={chordsId}
                    className="grow font-mono !rounded-b-none !border-b-0 !pb-0 text-orange-800 dark:text-orange-300"
                    value={chordsStr}
                    onChange={(event) => onChange(mergeChordsAndLyrics(event.target.value, lyricsStr))}
                />
            </Flex>
            <Flex gap="gap-2" className="items-start">
                <Label htmlFor={lyricsId}>Lyrics</Label>
                <input
                    id={lyricsId}
                    className="grow font-mono !rounded-t-none !border-t-0 !pt-0"
                    value={lyricsStr}
                    onChange={(event) => onChange(mergeChordsAndLyrics(chordsStr, event.target.value))}
                />
            </Flex>
        </div>
    );
}

function BlockWrapper({ children, onRemove, onAddChords, onAddTabs, onAddComment, onAddSpace }) {
    return (
        <Flex gap="gap-2" className="items-center mb-2">
            {children}
            <div className="shrink-0">
                <Menu>
                    <MenuHandler>
                        <IconButton size="sm">
                            <i className="fa-solid fa-ellipsis"></i>
                        </IconButton>
                    </MenuHandler>
                    <MenuList className="p-0">
                        {onRemove ? (
                            <MenuItem onClick={onRemove}>
                                <i className="fa-solid fa-trash"></i> Remove This Line
                            </MenuItem>
                        ) : null}
                        <MenuItem onClick={onAddChords}>
                            <i className="fa-solid fa-arrow-turn-down fa-rotate-90"></i> Add Chords/Lyrics
                        </MenuItem>
                        <MenuItem onClick={onAddTabs}>
                            <i className="fa-solid fa-arrow-turn-down fa-rotate-90"></i> Add Tablature
                        </MenuItem>
                        <MenuItem onClick={onAddComment}>
                            <i className="fa-solid fa-arrow-turn-down fa-rotate-90"></i> Add Comment
                        </MenuItem>
                        <MenuItem onClick={onAddSpace}>
                            <i className="fa-solid fa-arrow-turn-down fa-rotate-90"></i> Add Space
                        </MenuItem>
                    </MenuList>
                </Menu>
            </div>
        </Flex>
    );
}

function ApplyChangesButton({ disabled, onClick, className }) {
    return (
        <Button type="button" disabled={disabled} onClick={onClick} className={className}>
            Apply Changes
        </Button>
    );
}

/**
 * Parse lyrics string into ordered block descriptors with raw line content.
 * @returns {{ id: string, type: "space"|"comment"|"tabs"|"chords", lines: string[] }[]}
 */
function parseBlocks(lyrics) {
    const lines = lyrics == null || lyrics === "" ? [] : String(lyrics).split("\n");
    const blocks = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        if (line.trim() === "") {
            blocks.push({ id: newBlockId(), type: "space", lines: [line] });
            i++;
            continue;
        }

        if (line.startsWith("[(") && line.endsWith(")]")) {
            blocks.push({ id: newBlockId(), type: "comment", lines: [line] });
            i++;
            continue;
        }

        if (line.startsWith("[|")) {
            const tabLines = [];
            let j = i;
            for (; j < lines.length; j++) {
                tabLines.push(lines[j]);
                if (lines[j].includes("|]")) {
                    break;
                }
            }
            blocks.push({ id: newBlockId(), type: "tabs", lines: tabLines });
            i = j + 1;
            continue;
        }

        blocks.push({ id: newBlockId(), type: "chords", lines: [line] });
        i++;
    }

    return blocks;
}

/**
 * Build block descriptors from an explicit line array (used for inserts).
 * Unlike parseBlocks(""), this preserves a blank-line space block.
 */
function parseBlocksFromLines(lines) {
    if (!lines || lines.length === 0) return [];
    if (lines.length === 1 && lines[0] === "") {
        return [{ id: newBlockId(), type: "space", lines: [""] }];
    }
    return parseBlocks(lines.join("\n"));
}

function serializeBlocks(blocks) {
    return blocks.flatMap((block) => block.lines).join("\n");
}

function stripTabMarkers(tabLines) {
    let tabStr = tabLines.join("\n");
    if (tabStr.startsWith("[|")) tabStr = tabStr.substring(2);
    if (tabStr.endsWith("|]")) tabStr = tabStr.substring(0, tabStr.length - 2);
    return tabStr.replace(/^\n/, "").replace(/\n$/, "");
}

function tabContentToLines(content) {
    const inner = String(content ?? "").replace(/\r\n/g, "\n");
    return ["[|", ...inner.split("\n"), "|]"];
}

export default function SongEditor({ lyrics, onChange, showTabEditorModal }) {
    const [blocks, setBlocks] = useState(() => parseBlocks(lyrics ?? ""));
    const baseId = useId();
    const committed = lyrics ?? "";
    const draft = serializeBlocks(blocks);
    const isDirty = draft !== committed;

    // Re-sync when parent lyrics change (load, raw textarea edit, after Apply).
    useEffect(() => {
        setBlocks(parseBlocks(lyrics ?? ""));
    }, [lyrics]);

    function removeBlock(index) {
        setBlocks((prev) => prev.filter((_, i) => i !== index));
    }

    function insertLinesAfter(index, insertLines) {
        const inserted = parseBlocksFromLines(insertLines);
        setBlocks((prev) => {
            const next = [...prev];
            // index -1 means insert at start (empty editor)
            next.splice(index + 1, 0, ...inserted);
            return next;
        });
    }

    function updateBlockLines(index, lines) {
        setBlocks((prev) =>
            prev.map((block, i) => (i === index ? { ...block, lines } : block))
        );
    }

    function handleApply() {
        onChange?.(serializeBlocks(blocks));
    }

    const applyDisabled = !isDirty || !onChange;

    const emptyMenuProps = {
        onAddChords: () => insertLinesAfter(-1, INSERT_CHORDS),
        onAddTabs: () => insertLinesAfter(-1, INSERT_TABS),
        onAddComment: () => insertLinesAfter(-1, INSERT_COMMENT),
        onAddSpace: () => insertLinesAfter(-1, INSERT_SPACE),
    };

    const renderedBlocks = blocks.map((block, index) => {
        const menuProps = {
            onRemove: () => removeBlock(index),
            onAddChords: () => insertLinesAfter(index, INSERT_CHORDS),
            onAddTabs: () => insertLinesAfter(index, INSERT_TABS),
            onAddComment: () => insertLinesAfter(index, INSERT_COMMENT),
            onAddSpace: () => insertLinesAfter(index, INSERT_SPACE),
        };

        if (block.type === "space") {
            return (
                <BlockWrapper key={block.id} {...menuProps}>
                    <hr className="grow border-dashed opacity-40 my-3" />
                </BlockWrapper>
            );
        }

        if (block.type === "comment") {
            const line = block.lines[0] ?? "[()]";
            const str = line.startsWith("[(") && line.endsWith(")]")
                ? line.substring(2, line.length - 2)
                : line;
            const commentId = `${baseId}-comment-${block.id}`;
            return (
                <BlockWrapper key={block.id} {...menuProps}>
                    <Label htmlFor={commentId}>Comment</Label>
                    <Comment
                        str={str}
                        id={commentId}
                        onChange={(value) => updateBlockLines(index, [`[(${value})]`])}
                    />
                </BlockWrapper>
            );
        }

        if (block.type === "tabs") {
            const tabStr = stripTabMarkers(block.lines);
            const tabsId = `${baseId}-tab-${block.id}`;
            return (
                <BlockWrapper key={block.id} {...menuProps}>
                    <Label htmlFor={tabsId}>Tabs</Label>
                    <TabsBlock
                        str={tabStr}
                        id={tabsId}
                        onChange={(value) => updateBlockLines(index, tabContentToLines(value))}
                    />
                </BlockWrapper>
            );
        }

        // chords
        const chordsId = `${baseId}-chords-${block.id}`;
        const lyricsId = `${baseId}-lyrics-${block.id}`;
        return (
            <BlockWrapper key={block.id} {...menuProps}>
                <Chords
                    str={block.lines[0] ?? ""}
                    chordsId={chordsId}
                    lyricsId={lyricsId}
                    onChange={(value) => updateBlockLines(index, [value])}
                />
            </BlockWrapper>
        );
    });

    return (
        <div>
            <BlockWrapper {...emptyMenuProps}>
                    <Button
                        type="button"
                        color="secondary"
                        onClick={() => showTabEditorModal(true)}
                        className="ml-auto"
                    >
                        Open Tab Editor
                    </Button>
                    <ApplyChangesButton disabled={applyDisabled} onClick={handleApply} />
            </BlockWrapper>
            {blocks.length === 0 ? (
                <BlockWrapper {...emptyMenuProps}>
                    <p className="grow text-sm text-gray-500 m-0">No lines yet — use the menu to add content.</p>
                </BlockWrapper>
            ) : (
                renderedBlocks
            )}
            <div className="text-right">
                <ApplyChangesButton disabled={applyDisabled} onClick={handleApply} className="mr-8" />
            </div>
        </div>
    );
}

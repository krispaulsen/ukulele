import { Fragment, use, useState } from "react";
import { UserContext } from "../context/UserContext";
import { formatChordDisplay } from "../lib/chords";
import { IconButton } from "@material-tailwind/react";
import PlayableTabs from "./PlayableTabs";

function TabsBlock({ children }) {
    const tabLines = children.split("\n");
    const numLines = tabLines.length;
    return (
        <div className="tabs">
            {tabLines.map((line, index) => (
                <Fragment key={`tabsLine-${index}`}>
                    {line}
                    {index < numLines - 1 ? <br /> : null}
                </Fragment>
            ))}
        </div>
    );
}

/**
 * Compact tabs + Play; expands to PlayableTabs when activated.
 * Only one block expanded at a time (controlled by parent).
 */
function ExpandableTabsBlock({ id, tabsString, activeId, onActivate, onDeactivate }) {
    const isActive = activeId === id;

    if (isActive) {
        return (
            <PlayableTabs
                markup={tabsString}
                autoPlay
                showControls
                showClose
                onClose={onDeactivate}
                className="mb-4"
            />
        );
    }

    return (
        <div className="tabs-block-wrap flex items-start gap-2 mb-4">
            <IconButton
                size="sm"
                className="shrink-0 mt-0.5"
                aria-label="Play tablature"
                title="Play tablature"
                onClick={() => onActivate(id)}
            >
                <i className="fa-solid fa-play text-xs" />
            </IconButton>
            <TabsBlock>{tabsString}</TabsBlock>
        </div>
    );
}

function VerseBlock({ children }) {
    return <div className="part">{children}</div>;
}

function CommentBlock({ children }) {
    return <div className="comment">{children}</div>;
}

function LyricsLine({ children }) {
    return <div className="line">{children}</div>;
}

function LyricsChord({ chordName, color, position }) {
    const style = { color: `#${color}` };
    if (position === "inline") {
        return (
            <span className="chord inline" style={style}>
                [{chordName}]
            </span>
        );
    }
    return (
        <div className="chord above" style={style}>
            {chordName}
        </div>
    );
}

export default function Lyrics({
    columns = 1,
    transpose = 0,
    preferredAccidentals = "flats",
    children,
}) {
    const { user } = use(UserContext);
    const [activeTabId, setActiveTabId] = useState(null);

    function parseVerseBlock(part, partIndex) {
        /*
            [(Intro)]
                [C]   [D]   [G]   [G7]
            [|
            A|---3-2-0-------2-----2---|
            E|---0-----2---0-3---0-1---|
            C|---0-----2-----2-----2---|
            G|---0-----2-----0-----0---|
            |]
            Deep in the hundred acre woods
        */
        const elements = [];

        // find tabsStrings before splitting the part into lines
        const subParts = part.trim().split(/(\[\|\n?.+?\n?\|\])/gs); // look for [| ... |]
        subParts.forEach((subPart, subPartIndex) => {
            if (subPart.startsWith("[|") && subPart.endsWith("|]")) {
                const tabsString = subPart.substring(2, subPart.length - 2).trim();
                const tabId = `tabs-${partIndex}-${subPartIndex}`;
                elements.push(
                    <ExpandableTabsBlock
                        key={tabId}
                        id={tabId}
                        tabsString={tabsString}
                        activeId={activeTabId}
                        onActivate={setActiveTabId}
                        onDeactivate={() => setActiveTabId(null)}
                    />
                );
                return;
            }

            // else split into strings and look for comments and chords
            const lines = subPart.trim().split("\n");
            const partLines = [];

            lines.forEach((line, lineIndex) => {
                const trimmedLine = line.trim();
                if (trimmedLine === "") {
                    return;
                }

                if (trimmedLine.startsWith("[(") && trimmedLine.endsWith(")]")) {
                    const commentString = trimmedLine.substring(2, trimmedLine.length - 2);
                    partLines.push(
                        <CommentBlock key={`comment-${partIndex}-${lineIndex}`}>
                            {commentString}
                        </CommentBlock>
                    );
                    return;
                }

                const lineParts = line.split(/(\[[^\]]+\])/g);
                const lineElements = [];

                lineParts.forEach((linePart, linePartIndex) => {
                    if (linePart.startsWith("[") && linePart.endsWith("]")) {
                        const chordString = linePart.substring(1, linePart.length - 1);
                        const displayName = formatChordDisplay(chordString, {
                            transpose,
                            preferredAccidentals,
                        });
                        lineElements.push(
                            <LyricsChord
                                key={`chord-${partIndex}-${lineIndex}-${linePartIndex}`}
                                chordName={displayName}
                                color={user.chordColor}
                                position={user.chordPosition}
                            />
                        );
                        return;
                    }
                    lineElements.push(linePart);
                });
                partLines.push(
                    <LyricsLine key={`line-${partIndex}-${lineIndex}`}>{...lineElements}</LyricsLine>
                );
            });
            elements.push(<Fragment key={`sub-${partIndex}-${subPartIndex}`}>{...partLines}</Fragment>);
        });
        return (
            <VerseBlock key={`part-${partIndex}`}>{...elements}</VerseBlock>
        );
    }

    function parseLyrics(lyrics) {
        const parts = lyrics?.trim().split("\n\n") || [];
        const elements = [];
        parts.forEach((part, partIndex) => {
            const verse = parseVerseBlock(part, partIndex);
            elements.push(verse);
        });

        return (
            <div className="song" style={{ columnCount: columns }}>
                {...elements}
            </div>
        );
    }

    return parseLyrics(children);
}

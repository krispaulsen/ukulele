// import { Input, Textarea } from "@material-tailwind/react";
// import { Input, Textarea } from "./Forms";
import { useId } from "react";
import { Flex } from "./ui/Flex";
import { Button, IconButton, Menu, MenuHandler, MenuList, MenuItem } from "@material-tailwind/react";

function Label({ htmlFor, children }) {
    return (
        <label htmlFor={htmlFor} className="text-xs w-14 shrink-0 text-right text-gray-500">{children}</label>
    );
}

function Comment({str, id}) {
    return (
        <input id={id} defaultValue={str} className="grow" />
    );
}

function TabsBlock({str, id}) {
    return (
        <textarea id={id} className="grow block font-mono" rows="4" defaultValue={str}></textarea>
    );
}

function Chords({str, chordsId, lyricsId}) {
    const parts = str.split(/(\[[^\]]+\])/g); // Look for [ ... ]
    let lyricsStr = '';
    let chordsStr = '';
    let prevPartLength = 0;
    let chordCharCount = 0;
    parts.forEach((part) => {
        if (part.startsWith('[') && part.endsWith(']')) {
            let numSpaces = prevPartLength - chordCharCount;
            let spaces = " ".repeat(numSpaces < 0 ? 1 : numSpaces);
            let chord = part.substring(1, part.length - 1);
            chordsStr += spaces + chord;
            chordCharCount = chord.length;
        } else {
            prevPartLength = part.length;
            lyricsStr += part;
        }
    })

    return (
        <div className="grow">
            <Flex gap="gap-2" className="items-center">
                <Label htmlFor={chordsId}>Chords</Label>
                <input id={chordsId} className="grow font-mono !rounded-b-none" defaultValue={chordsStr} />
            </Flex>
            <Flex gap="gap-2" className="items-center">
                <Label htmlFor={lyricsId}>Lyrics</Label>
                <input id={lyricsId} className="grow font-mono !rounded-t-none" defaultValue={lyricsStr.trim()} />
            </Flex>
        </div>
    );
}

function BlockWrapper({ children }) {
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
                        <MenuItem><i className="fa-solid fa-trash"></i> Remove This Line</MenuItem>
                        <MenuItem><i className="fa-solid fa-arrow-turn-down fa-rotate-90"></i> Add Chords/Lyrics</MenuItem>
                        <MenuItem><i className="fa-solid fa-arrow-turn-down fa-rotate-90"></i> Add Tablature</MenuItem>
                        <MenuItem><i className="fa-solid fa-arrow-turn-down fa-rotate-90"></i> Add Comment</MenuItem>
                        <MenuItem><i className="fa-solid fa-arrow-turn-down fa-rotate-90"></i> Add Space</MenuItem>
                    </MenuList>
                </Menu>
            </div>
        </Flex>
    );
}

export default function SongEditor({lyrics}) {
    const lines = lyrics?.split('\n') || [];
    const baseId = useId();
    const blocks = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        if (line.trim() === "") {
            blocks.push(
                <BlockWrapper key={`hr-${i}`}>
                    <hr className="grow border-dashed opacity-40 my-3" />
                </BlockWrapper>
            );
            i++;
            continue;
        }

        if (line.startsWith('[(') && line.endsWith(')]')) {
            const str = line.substring(2, line.length - 2).trim();
            const commentId = `${baseId}-comment-${i}`;
            blocks.push(
                <BlockWrapper key={`Comment-${i}`}>
                    <Label htmlFor={commentId}>Comment</Label>
                    <Comment str={str} id={commentId} />
                </BlockWrapper>
            );
            i++;
            continue;
        }

        if (line.startsWith('[|')) {
            // Collect the full tab block (including start and end lines)
            const tabLines = [];
            let j = i;
            for (; j < lines.length; j++) {
                tabLines.push(lines[j]);
                if (lines[j].includes('|]')) {
                    break;
                }
            }
            // Strip the outer [| and |] markers for the textarea (consistent with Comment stripping and Lyrics.jsx extraction)
            let tabStr = tabLines.join('\n');
            if (tabStr.startsWith('[|')) tabStr = tabStr.substring(2);
            if (tabStr.endsWith('|]')) tabStr = tabStr.substring(0, tabStr.length - 2);
            tabStr = tabStr.trim();

            const tabsId = `${baseId}-tab-${i}`;
            blocks.push(
                <BlockWrapper key={`Tabs-${i}`}>
                    <Label htmlFor={tabsId}>Tabs</Label>
                    <TabsBlock str={tabStr} id={tabsId} />
                </BlockWrapper>
            );
            i = j + 1;
            continue;
        }

        // Normal chord/lyrics line
        const chordsId = `${baseId}-chords-${i}`;
        const lyricsId = `${baseId}-lyrics-${i}`;
        blocks.push(
            <BlockWrapper key={`Chords-${i}`}>
                <Chords str={line} chordsId={chordsId} lyricsId={lyricsId} />
            </BlockWrapper>
        );
        i++;
    }

    return <>{blocks}</>;
}
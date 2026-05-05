// import { Input, Textarea } from "@material-tailwind/react";
// import { Input, Textarea } from "./Forms";
import { Flex } from "./ui/Flex";
import { Button, IconButton, Menu, MenuHandler, MenuList, MenuItem } from "@material-tailwind/react";

function Comment({str}) {
    return (<div className="mb-2">
        <input aria-label="Comment" defaultValue={str} className="w-full" />
    </div>);
}

function Chords({str}) {
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

    return (<div className="mb-2">
        <input aria-label="Chords" className="font-mono w-full !rounded-b-none" defaultValue={chordsStr} />
        <input aria-label="Lyrics" className="font-mono w-full !rounded-t-none" defaultValue={lyricsStr.trim()} />
    </div>);
}

function TabsBlock({str}) {
    return (<>
        <textarea className="font-mono w-full">{str}</textarea>
    </>);
}

export default function SongEditor({lyrics}) {
        const lines = lyrics?.split('\n') || [];

    function LineBlock({line, i}) {
        function getChildren() {
            if (line.trim() === "") {
                return <hr className="my-4" />
            }
            let str = line;
            if (line.startsWith('[(') && line.endsWith(')]')) {
                str = line.substring(2, line.length - 2).trim();
                return <Comment str={str} key={`Comment-${i}`} />
            }
            if (line.startsWith('[|')) {
                // find the end of the tabsBlock
                let tabsString = '';
                for (let j = i; ; j++) {
                    let nextLine = lines[j];
                    if (!nextLine.includes('|]')) {
                        tabsString += '\n' + nextLine;
                    } else {
                        i = j;
                        break;
                    }
                }
                const trimmedStr = tabsString.substring(3, tabsString.length).trim();
                return <TabsBlock str={trimmedStr} key={`Tabs-${i}`} />
            }
            return <Chords str={line} key={`Chords-${i}`} />
        }
        return (<>
            <Flex gap="gap-2">
                <div className="flex-grow">{getChildren()}</div>
                <Menu>
                    <MenuHandler>
                        <IconButton size="sm">
                            <i className="fa-solid fa-ellipsis"></i>
                        </IconButton>
                    </MenuHandler>
                    <MenuList className="p-0">
                        <MenuItem><i className="fa-solid fa-xmark"></i> Remove This Line</MenuItem>
                        <MenuItem><i className="fa-solid fa-arrow-turn-down fa-rotate-90"></i> Add Lyrics/Chords</MenuItem>
                        <MenuItem><i className="fa-solid fa-arrow-turn-down fa-rotate-90"></i> Add Tablature</MenuItem>
                        <MenuItem><i className="fa-solid fa-arrow-turn-down fa-rotate-90"></i> Add Comment</MenuItem>
                        <MenuItem><i className="fa-solid fa-arrow-turn-down fa-rotate-90"></i> Add Space</MenuItem>
                    </MenuList>
                </Menu>
            </Flex>
        </>);
    }

    return (<>
        {lines.map((line, lineIndex) => {
            return <LineBlock line={line} i={lineIndex} key={`Line-${lineIndex}`} />
        })}
    </>);
}
import {
    Flex
} from "../components/ui";
import {
    Button,
    IconButton,
    Input,
    Checkbox,
    Select,
    Option,
    Textarea,
    Switch,
} from "@material-tailwind/react";

export default function ThemePage() {
    return (
        <>
            <ul className="mb-4">
                <li>
                    <a href="https://www.material-tailwind.com/docs/react/button" target="_blank">
                        Material-tailwind Components
                        <i className="text-xs ml-1 fa-solid fa-arrow-up-right-from-square"></i>
                    </a></li>
                <li>
                    <a href="https://tailwindcss.com/docs/colors" target="_blank">
                        Tailwind Style Classes
                        <i className="text-xs ml-1 fa-solid fa-arrow-up-right-from-square"></i>
                    </a>
                </li>
                <li>
                    <a href="https://fontawesome.com/search?ic=free-collection" target="_blank">
                        FontAwesome Icons
                        <i className="text-xs ml-1 fa-solid fa-arrow-up-right-from-square"></i>
                    </a>
                </li>
            </ul>
            
            <Flex className="mb-4">
                <Button size="sm">Button sm</Button>
                <Button size="sm" color="secondary">Secondary sm</Button>
                <IconButton size="sm">
                    <i className="fa-regular fa-star"></i>
                </IconButton>
                <IconButton variant="outlined" color="secondary" size="sm">
                    <i className="fa-solid fa-star"></i>
                </IconButton>
            </Flex>

            <Flex className="mb-4">
                <Button>Button</Button>
                <Button color="secondary">Secondary</Button>
                <IconButton>
                    <i className="fa-regular fa-star"></i>
                </IconButton>
                <IconButton variant="outlined" color="secondary">
                    <i className="fa-solid fa-star"></i>
                </IconButton>
            </Flex>

            <Flex className="mb-4">
                <Button size="lg">Button lg</Button>
                <Button size="lg" color="secondary">Secondary lg</Button>
                <IconButton size="lg">
                    <i className="fa-regular fa-star"></i>
                </IconButton>
                <IconButton variant="outlined" color="secondary" size="lg">
                    <i className="fa-solid fa-star"></i>
                </IconButton>
            </Flex>

            <form className="w-1/2 flex flex-col gap-4">
                <Input label="Input" />
                <Select label="Select">
                    <Option value="o1">Option 1</Option>
                    <Option value="o2">Option 2</Option>
                    <Option value="o3">Option 3</Option>
                </Select>
                <Textarea label="Textarea">
                    Lorem ipsum dolor sit amet.
                </Textarea>
                <Flex gap="gap-8">
                    <Checkbox label="Chedkbox" />
                    <Switch label="Switch" />
                </Flex>
            </form>
        </>
    )
}

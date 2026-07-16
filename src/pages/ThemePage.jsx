import { useState } from "react";
import {
    Flex
} from "../components/ui";
import {
    Checkbox,
    Form,
    Input,
    Option,
    Select,
    Switch,
    Textarea,
} from "../components/Forms";
import {
    Button,
    Checkbox as MTCheckbox,
    IconButton,
    Input as MTInput,
    Option as MTOption,
    Select as MTSelect,
    Switch as MTSwitch,
    Textarea as MTTextarea,
} from "@material-tailwind/react";

export default function ThemePage() {
    const [isChecked, setIsChecked] = useState(false);

    const handleSwitchChange = (e) => {
        setIsChecked(e.target.checked);
    }

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
                <div><Button size="sm">Button sm</Button></div>
                <div><Button>Button md</Button></div>
                <div><Button size="lg">Button lg</Button></div>
                <IconButton size="sm">
                    <i className="fa-solid fa-star"></i>
                </IconButton>
                <IconButton>
                    <i className="fa-solid fa-star"></i>
                </IconButton>
                <IconButton size="lg">
                    <i className="fa-solid fa-star"></i>
                </IconButton>
            </Flex>

            <Flex className="mb-4">
                <div><Button>Primary</Button></div>
                <div><Button variant="outlined">Outlined</Button></div>
                <IconButton>
                    <i className="fa-regular fa-star"></i>
                </IconButton>
                <IconButton variant="outlined">
                    <i className="fa-regular fa-star"></i>
                </IconButton>
                <div><Button variant="link">Link</Button></div>
            </Flex>

            <Flex className="mb-4">
                <div><Button color="secondary">Secondary</Button></div>
                <div><Button variant="outlined" color="secondary">Secondary</Button></div>
                <IconButton color="secondary">
                    <i className="fa-regular fa-star"></i>
                </IconButton>
                <IconButton variant="outlined" color="secondary">
                    <i className="fa-regular fa-star"></i>
                </IconButton>
                <div><Button variant="link" color="secondary">Link</Button></div>
            </Flex>

            <hr />
            <p className="my-4">Material-tailwind form components:</p>
            <form className="w-1/2 flex flex-col gap-4">
                <MTInput label="Input" />
                <MTSelect label="Select">
                    <MTOption value="o1">Option 1</MTOption>
                    <MTOption value="o2">Option 2</MTOption>
                    <MTOption value="o3">Option 3</MTOption>
                </MTSelect>
                <MTTextarea label="Textarea">
                    Lorem ipsum dolor sit amet.
                </MTTextarea>
                <Flex gap="gap-8">
                    <MTCheckbox label="Chedkbox" />
                    <MTSwitch label="Switch" />
                </Flex>
            </form>

            <hr />
            <p className="my-4">Custom UI form components:</p>
            <Form className="w-1/2">
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
                    <Checkbox label="Checkbox" />
                    <Switch
                        checked={isChecked}
                        onChange={handleSwitchChange}
                    />
                </Flex>
            </Form>
        </>
    )
}

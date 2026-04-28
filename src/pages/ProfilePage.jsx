import { use, useEffect, useState } from "react";
import { UserContext } from "../context/UserContext";
import { Checkbox, Input, Select } from "../components/Forms";

export default function ProfilePage() {
    const { user } = use(UserContext);
    const [screenName, setScreenName] = useState(user.screenName);
    const [email, setEmail] = useState(user.email);

    useEffect(() => {
        setScreenName(user.screenName);
        setEmail(user.email);
    }, [user])

    return (
        <>
            <section className="details page-panel">

                <Input type="text" label="Screen Name" value={screenName} onChange={(event) => setScreenName(event.target.value)} />
                <Input type="email" label="Email Address" value={email} onChange={(event) => setEmail(event.target.value)} />

            </section>

            <section className="details page-panel">

                <p>Change password:</p>
                <Input type="email" label="Current PW" />
                <Input type="email" label="New PW" />
                <Input type="email" label="Confirm New PW" />

            </section>

            <section className="details page-panel">

                <Checkbox label="Dark Mode" />
                <Select label="Chord Color" value="red" options={[
                    { label: "Red", value: "red" },
                    { label: "Blue", value: "blue" },
                    { label: "Green", value: "green" },
                ]} />
                <Select label="Chord Position" value="above" options={[
                    { label: "Above Lyrics", value: "above" },
                    { label: "Inline", value: "inline" },
                ]} />

            </section>
        </>
    );
};
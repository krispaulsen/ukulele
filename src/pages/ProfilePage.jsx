import { use, useEffect, useState } from "react";
import { UserContext } from "../context/UserContext";
import { apiRequest } from "../lib/api";
import { Checkbox, Input, Option, Select } from "../components/Forms";
import { Drawer, Flex } from "../components/ui";
import { Button } from "@material-tailwind/react";

export default function ProfilePage() {
    const { user, refreshUser } = use(UserContext);

    const [screenName, setScreenName] = useState("");
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState({ type: "", text: "" });

    // Change Password Drawer
    const [showPasswordDrawer, setShowPasswordDrawer] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState({ type: "", text: "" });

    const [chordColor, setChordColor] = useState("");
    const [chordPosition, setChordPosition] = useState("");

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const data = await apiRequest("/api/users/profile");
                setScreenName(data.screenName || "");
                setEmail(data.email || "");
                setChordColor(data.chordColor || "red");
                setChordPosition(data.chordPosition || "above");
            } catch (error) {
                console.error("Failed to load profile:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadProfile();
    }, []);

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setSaveMessage({ type: "", text: "" });

        try {
            await apiRequest("/api/users/profile", {
                method: "PUT",
                body: { screenName: screenName.trim(), email: email.trim() }
            });
            setSaveMessage({ type: "success", text: "✅ Profile updated successfully!" });
            refreshUser();
        } catch (error) {
            setSaveMessage({ type: "error", text: "❌ Failed to update profile" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSavePreferences = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setSaveMessage({ type: "", text: "" });

        try {
            await apiRequest("/api/users/profile", {
                method: "PUT",
                body: { chordColor, chordPosition }
            });
            setSaveMessage({ type: "success", text: "✅ Preferences updated successfully!" });
            refreshUser();
        } catch (error) {
            setSaveMessage({ type: "error", text: "❌ Failed to update preferences" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setPasswordMessage({ type: "error", text: "Passwords do not match" });
            return;
        }

        setIsChangingPassword(true);
        setPasswordMessage({ type: "", text: "" });

        try {
            await apiRequest("/api/users/change-password", {
                method: "PUT",
                body: JSON.stringify({ currentPassword, newPassword })
            });

            setPasswordMessage({ type: "success", text: "✅ Password changed successfully!" });
            setTimeout(() => {
                setShowPasswordDrawer(false);
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
            }, 1500);
        } catch (error) {
            setPasswordMessage({ type: "error", text: error.message || "Failed to change password" });
        } finally {
            setIsChangingPassword(false);
        }
    };

    if (isLoading) return <p>Loading profile...</p>;

    return (
        <>
            <h1 className="text-3xl font-bold mb-8">My Profile</h1>

            <Flex gap="8" growChildren>
                <form onSubmit={handleSaveProfile}>
                    <h2 className="text-xl font-semibold mb-6">Profile Information</h2>

                    <Input
                        type="text"
                        label="Screen Name"
                        value={screenName}
                        onChange={(e) => setScreenName(e.target.value)}
                        required
                    />
                    <Input
                        type="email"
                        label="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <Button type="submit" disabled={isSaving} className="mt-4">
                        {isSaving ? "Saving..." : "Save Profile"}
                    </Button>
                </form>

                {/* Preferences */}
                <form onSubmit={handleSavePreferences}>
                    <h2 className="text-xl font-semibold mb-4">Preferences</h2>

                    <Checkbox
                        label="Dark Mode"
                    />

                    <Select
                        label="Chord Diagram Color"
                        value={chordColor}
                        onChange={(e) => setChordColor(e.target.value)}
                    >
                        <Option value="red">Red</Option>
                        <Option value="blue">Blue</Option>
                        <Option value="green">Green</Option>
                        <Option value="purple">Purple</Option>
                    </Select>

                    <Select
                        label="Chord Position"
                        value={chordPosition}
                        onChange={(e) => setChordPosition(e.target.value)}
                    >
                        <Option value="above">Above Lyrics</Option>
                        <Option value="inline">Inline with Lyrics</Option>
                    </Select>

                    <fieldset className="border px-4 py-2">
                        <legend className="-mx-2 px-2">Preview</legend>
                        [C]Somewhere [Em]over the rainbow, [F]way up [C]high
                    </fieldset>

                    <Button type="submit" disabled={isSaving} className="mt-4">
                        {isSaving ? "Saving..." : "Update Preferences"}
                    </Button>
                </form>
            </Flex>

            {saveMessage.text && (
                <p className={`mt-4 ${saveMessage.type === "success" ? "text-green-600" : "text-red-600"}`}>
                    {saveMessage.text}
                </p>
            )}

            {/* Change Password Drawer */}
            <Button color="secondary" onClick={() => setShowPasswordDrawer(true)} className="mt-4">
                Change Password
            </Button>

            <Drawer
                isOpen={showPasswordDrawer}
                onClose={() => setShowPasswordDrawer(false)}
                title="Change Password"
            >
                <form onSubmit={handleChangePassword}>
                    <Input
                        type="password"
                        label="Current Password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                    />
                    <Input
                        type="password"
                        label="New Password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                    />
                    <Input
                        type="password"
                        label="Confirm New Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />

                    {passwordMessage.text && (
                        <p className={`text-sm ${passwordMessage.type === "success" ? "text-green-600" : "text-red-600"}`}>
                            {passwordMessage.text}
                        </p>
                    )}

                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            color="secondary"
                            onClick={() => setShowPasswordDrawer(false)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isChangingPassword} className="flex-1">
                            {isChangingPassword ? "Changing..." : "Update Password"}
                        </Button>
                    </div>
                </form>
            </Drawer>
        </>
    );
}
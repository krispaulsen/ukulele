import { Router } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { requireAuth } from "../middleware.js";

const router = Router();

// GET /api/users/profile - Get current user's profile
router.get("/profile", requireAuth, async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.user.userId })
            .select("-password")
            .lean();

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({
            userId: user.userId,
            screenName: user.screenName || "",
            email: user.email,
            createdAt: user.createdAt,
            // Add more fields later (bio, preferences, etc.)
        });
    } catch (error) {
        console.error("Failed to fetch profile:", error);
        res.status(500).json({ error: "Failed to fetch profile" });
    }
});

// PUT /api/users/profile - Update profile
router.put("/profile", requireAuth, async (req, res) => {
    const { screenName, email } = req.body;

    try {
        const updateData = {};
        if (screenName !== undefined) updateData.screenName = screenName.trim();
        if (email !== undefined) updateData.email = email.toLowerCase().trim();

        const user = await User.findOneAndUpdate(
            { _id: req.user.userId },
            { $set: updateData },
            { new: true, runValidators: true }
        ).select("-password");

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({
            message: "Profile updated successfully",
            user: {
                userId: user.userId,
                screenName: user.screenName,
                email: user.email
            }
        });
    } catch (error) {
        console.error("Failed to update profile:", error);
        
        if (error.code === 11000) {
            return res.status(409).json({ error: "Email already in use" });
        }
        
        res.status(500).json({ error: "Failed to update profile" });
    }
});

// PUT /api/users/change-password
router.put("/change-password", requireAuth, async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword || newPassword.length < 8) {
        return res.status(400).json({ 
            error: "New password must be at least 8 characters" 
        });
    }

    try {
        const user = await User.findOne({ _id: req.user.userId });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Current password is incorrect" });
        }

        // Hash and save new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.json({ message: "Password changed successfully" });
    } catch (error) {
        console.error("Change password error:", error);
        res.status(500).json({ error: "Failed to change password" });
    }
});

export default router;

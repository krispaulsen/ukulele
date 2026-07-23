import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  screenName: {
    type: String,
    trim: true
  },
  chordColor: {
    type: String,
    enum: ["06c", "00c", "60c", "909", "c06", "c00", "c60", "990", "6c0", "0c0", "0c6", "099", "999"]
  },
  chordPosition: {
    type: String,
    enum: ["above", "inline"],
    default: "above"
  },
  darkMode: {
    type: Boolean,
    default: true
  },
  preferredAccidentals: {
    type: String,
    enum: ["sharps", "flats"],
    default: "flats"
  },
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);
export default User;
import mongoose from 'mongoose';

const songSchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  artist: {
    type: String,
    required: true,
    trim: true
  },
  key: String,
  capo: Number,
  chords: [String],
  lyrics: String,
  ownerUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  originalSlug: String,
  isPublic: {
    type: Boolean,
    default: true
  },
  favorites: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true        // This automatically adds createdAt + updatedAt
});

const Song = mongoose.model('Song', songSchema);
export default Song;
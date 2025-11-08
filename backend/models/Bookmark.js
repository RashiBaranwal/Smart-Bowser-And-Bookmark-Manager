import mongoose from 'mongoose';

const bookmarkSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  bookmarkId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  dateAdded: {
    type: Date,
    required: true
  },
  parentFolder: {
    type: String,
    default: 'Other Bookmarks'
  },
  folderPath: {
    type: [String],
    default: []
  },
  domain: {
    type: String,
    trim: true
  },
  favicon: {
    type: String,
    default: ''
  },
  tags: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

// Index for faster queries
bookmarkSchema.index({ userId: 1, bookmarkId: 1 });
bookmarkSchema.index({ userId: 1, dateAdded: -1 });
bookmarkSchema.index({ userId: 1, domain: 1 });
bookmarkSchema.index({ title: 'text', url: 'text', parentFolder: 'text', tags: 'text' });
bookmarkSchema.index({ parentFolder: 1 });

const Bookmark = mongoose.model('Bookmark', bookmarkSchema);

export default Bookmark;

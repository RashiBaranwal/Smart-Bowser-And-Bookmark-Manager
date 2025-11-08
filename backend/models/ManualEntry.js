import mongoose from 'mongoose';

const manualEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
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
  description: {
    type: String,
    default: '',
    trim: true
  },
  keywords: {
    type: [String],
    default: []
  },
  imageUrl: {
    type: String,
    default: ''
  },
  imageData: {
    type: String, // Base64 encoded image
    default: ''
  },
  category: {
    type: String,
    default: 'General'
  },
  domain: {
    type: String,
    trim: true
  },
  favicon: {
    type: String,
    default: ''
  },
  dateAdded: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster search queries
manualEntrySchema.index({ userId: 1, dateAdded: -1 });
manualEntrySchema.index({
  title: 'text',
  description: 'text',
  keywords: 'text',
  category: 'text',
  url: 'text'
});

const ManualEntry = mongoose.model('ManualEntry', manualEntrySchema);

export default ManualEntry;

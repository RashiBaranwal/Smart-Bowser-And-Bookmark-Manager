import mongoose from 'mongoose';

const semanticContentSchema = new mongoose.Schema({
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
  description: {
    type: String,
    default: '',
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  contentType: {
    type: String,
    enum: ['webpage', 'pdf', 'image', 'note', 'bookmark', 'history'],
    required: true
  },
  url: {
    type: String,
    default: '',
    trim: true
  },
  domain: {
    type: String,
    default: '',
    trim: true
  },
  keywords: {
    type: [String],
    default: []
  },
  category: {
    type: String,
    default: 'General'
  },
  sourceType: {
    type: String,
    enum: ['manual', 'chrome_extension', 'api'],
    default: 'manual'
  },
  filePath: {
    type: String,
    default: ''
  },
  fileType: {
    type: String,
    default: ''
  },
  metadata: {
    wordCount: { type: Number, default: 0 },
    pageCount: { type: Number, default: 0 },
    confidence: { type: Number, default: 0 },
    language: { type: String, default: 'en' }
  },
  vectorId: {
    type: String,
    default: '',
    index: true
  },
  isIndexed: {
    type: Boolean,
    default: false
  },
  favicon: {
    type: String,
    default: ''
  },
  dateAdded: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Indexes for faster queries
semanticContentSchema.index({ userId: 1, contentType: 1 });
semanticContentSchema.index({ userId: 1, category: 1 });
semanticContentSchema.index({ userId: 1, dateAdded: -1 });
semanticContentSchema.index({ userId: 1, isIndexed: 1 });
semanticContentSchema.index({ title: 'text', description: 'text', content: 'text' });

const SemanticContent = mongoose.model('SemanticContent', semanticContentSchema);

export default SemanticContent;

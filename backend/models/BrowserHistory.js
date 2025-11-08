import mongoose from 'mongoose';

const browserHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  visitTime: {
    type: Date,
    required: true
  },
  visitCount: {
    type: Number,
    default: 1
  },
  historyId: {
    type: String,
    required: true
  },
  domain: {
    type: String,
    trim: true
  },
  favicon: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for faster queries
browserHistorySchema.index({ userId: 1, url: 1 });
browserHistorySchema.index({ userId: 1, visitTime: -1 });
browserHistorySchema.index({ userId: 1, domain: 1 });
browserHistorySchema.index({ url: 'text', title: 'text', domain: 'text' });

const BrowserHistory = mongoose.model('BrowserHistory', browserHistorySchema);

export default BrowserHistory;

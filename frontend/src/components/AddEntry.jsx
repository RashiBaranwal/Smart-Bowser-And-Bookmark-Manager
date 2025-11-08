import { useState } from 'react';
import { manualEntryAPI } from '../services/api';
import './AddEntry.css';

const AddEntry = ({ onEntryAdded }) => {
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    description: '',
    category: 'General',
    imageData: ''
  });
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const categories = ['General', 'Recipes', 'Tutorials', 'Articles', 'Tools', 'Resources', 'Other'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Image size should be less than 5MB' });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setImagePreview(base64String);
        setFormData(prev => ({
          ...prev,
          imageData: base64String
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview('');
    setFormData(prev => ({
      ...prev,
      imageData: ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim() || !formData.url.trim()) {
      setMessage({ type: 'error', text: 'Title and URL are required' });
      return;
    }

    // Validate URL format
    try {
      new URL(formData.url);
    } catch (err) {
      setMessage({ type: 'error', text: 'Please enter a valid URL' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await manualEntryAPI.create(formData);

      setMessage({ type: 'success', text: 'Entry saved successfully!' });

      // Reset form
      setFormData({
        title: '',
        url: '',
        description: '',
        category: 'General',
        imageData: ''
      });
      setImagePreview('');

      // Call callback if provided
      if (onEntryAdded) {
        onEntryAdded();
      }

      // Clear success message after 3 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save entry. Please try again.' });
      console.error('Error saving entry:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-entry-container">
      <header className="add-entry-header">
        <h1>Add Manual Entry</h1>
        <p>Save custom links with images and descriptions for easy retrieval</p>
      </header>

      <form className="add-entry-form" onSubmit={handleSubmit}>
        {/* Title Input */}
        <div className="form-group">
          <label htmlFor="title">
            Title <span className="required">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            className="form-input"
            placeholder="e.g., Best Pancake Recipe"
            value={formData.title}
            onChange={handleInputChange}
            required
          />
        </div>

        {/* URL Input */}
        <div className="form-group">
          <label htmlFor="url">
            URL <span className="required">*</span>
          </label>
          <input
            type="url"
            id="url"
            name="url"
            className="form-input"
            placeholder="https://example.com/recipe"
            value={formData.url}
            onChange={handleInputChange}
            required
          />
        </div>

        {/* Category Select */}
        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            name="category"
            className="form-select"
            value={formData.category}
            onChange={handleInputChange}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Description Textarea */}
        <div className="form-group">
          <label htmlFor="description">
            Description
            <span className="hint"> (Add keywords like "pancake", "breakfast", "easy recipe")</span>
          </label>
          <textarea
            id="description"
            name="description"
            className="form-textarea"
            placeholder="Add a short description and keywords to make it easy to find later..."
            rows="4"
            value={formData.description}
            onChange={handleInputChange}
          />
        </div>

        {/* Image Upload */}
        <div className="form-group">
          <label htmlFor="image">
            Upload Image
            <span className="hint"> (Optional - Max 5MB)</span>
          </label>

          {!imagePreview ? (
            <div className="image-upload-area">
              <input
                type="file"
                id="image"
                className="image-input"
                accept="image/*"
                onChange={handleImageUpload}
              />
              <label htmlFor="image" className="image-upload-label">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                <span>Click to upload image</span>
                <span className="image-hint">PNG, JPG, GIF up to 5MB</span>
              </label>
            </div>
          ) : (
            <div className="image-preview-container">
              <img src={imagePreview} alt="Preview" className="image-preview" />
              <button
                type="button"
                className="remove-image-btn"
                onClick={removeImage}
              >
                Remove Image
              </button>
            </div>
          )}
        </div>

        {/* Message Display */}
        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="submit-btn"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Entry'}
        </button>
      </form>

      {/* Tips */}
      <div className="tips-box">
        <h3>Tips for Better Search</h3>
        <ul>
          <li>Use descriptive titles that you'll remember</li>
          <li>Add relevant keywords in the description (e.g., "pancake", "breakfast", "easy")</li>
          <li>Upload images for visual recognition (great for recipes!)</li>
          <li>Choose appropriate categories for better organization</li>
        </ul>
      </div>
    </div>
  );
};

export default AddEntry;

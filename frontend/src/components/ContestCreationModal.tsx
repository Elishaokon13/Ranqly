import React, { useState } from 'react';

interface ContestFormData {
  title: string;
  description: string;
  reward_amount: string;
  reward_token: string;
  submission_deadline: string;
  voting_deadline: string;
  rules: string[];
  tags: string[];
  category: string;
  difficulty: string;
  content_type: string;
  max_submissions: number;
  min_word_count: number;
  max_word_count: number;
  required_fields: string[];
  scoring_weights: {
    algorithm: number;
    community: number;
    judges: number;
  };
}

interface ContestCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ContestFormData) => void;
}

const ContestCreationModal: React.FC<ContestCreationModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<ContestFormData>({
    title: '',
    description: '',
    reward_amount: '',
    reward_token: 'USDC',
    submission_deadline: '',
    voting_deadline: '',
    rules: [''],
    tags: [''],
    category: 'gaming',
    difficulty: 'intermediate',
    content_type: 'text',
    max_submissions: 100,
    min_word_count: 100,
    max_word_count: 5000,
    required_fields: ['title', 'description', 'content'],
    scoring_weights: {
      algorithm: 40,
      community: 30,
      judges: 30
    }
  });

  const categories = [
    { value: 'gaming', label: 'Gaming', icon: '🎮' },
    { value: 'defi', label: 'DeFi', icon: '💰' },
    { value: 'art', label: 'Art', icon: '🎨' },
    { value: 'governance', label: 'Governance', icon: '🏛️' },
    { value: 'education', label: 'Education', icon: '📚' },
    { value: 'technology', label: 'Technology', icon: '⚡' }
  ];

  const difficulties = [
    { value: 'beginner', label: 'Beginner', color: 'green' },
    { value: 'intermediate', label: 'Intermediate', color: 'yellow' },
    { value: 'advanced', label: 'Advanced', color: 'orange' },
    { value: 'expert', label: 'Expert', color: 'red' }
  ];

  const contentTypes = [
    { value: 'text', label: 'Text/Article' },
    { value: 'video', label: 'Video' },
    { value: 'image', label: 'Image/Design' },
    { value: 'code', label: 'Code' },
    { value: 'audio', label: 'Audio' },
    { value: 'mixed', label: 'Mixed Media' }
  ];

  const handleInputChange = (field: keyof ContestFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRuleChange = (index: number, value: string) => {
    const newRules = [...formData.rules];
    newRules[index] = value;
    setFormData(prev => ({
      ...prev,
      rules: newRules
    }));
  };

  const addRule = () => {
    setFormData(prev => ({
      ...prev,
      rules: [...prev.rules, '']
    }));
  };

  const removeRule = (index: number) => {
    const newRules = formData.rules.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      rules: newRules
    }));
  };

  const handleTagChange = (index: number, value: string) => {
    const newTags = [...formData.tags];
    newTags[index] = value;
    setFormData(prev => ({
      ...prev,
      tags: newTags
    }));
  };

  const addTag = () => {
    setFormData(prev => ({
      ...prev,
      tags: [...prev.tags, '']
    }));
  };

  const removeTag = (index: number) => {
    const newTags = formData.tags.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      tags: newTags
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.title || !formData.description || !formData.reward_amount) {
      alert('Please fill in all required fields');
      return;
    }

    if (new Date(formData.submission_deadline) >= new Date(formData.voting_deadline)) {
      alert('Voting deadline must be after submission deadline');
      return;
    }

    // Clean up empty rules and tags
    const cleanData = {
      ...formData,
      rules: formData.rules.filter(rule => rule.trim() !== ''),
      tags: formData.tags.filter(tag => tag.trim() !== ''),
      reward_amount: parseInt(formData.reward_amount),
      max_submissions: parseInt(formData.max_submissions.toString()),
      min_word_count: parseInt(formData.min_word_count.toString()),
      max_word_count: parseInt(formData.max_word_count.toString())
    };

    onSubmit(cleanData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-dark-700">
        <div className="p-6 border-b border-dark-700">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">Create New Contest</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Contest Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter contest title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-label="Contest category"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Describe the contest theme, goals, and what you're looking for..."
                required
              />
            </div>
          </div>

          {/* Rewards & Timeline */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Rewards & Timeline</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Reward Amount *
                </label>
                <input
                  type="number"
                  value={formData.reward_amount}
                  onChange={(e) => handleInputChange('reward_amount', e.target.value)}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="10000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Reward Token
                </label>
                <select
                  value={formData.reward_token}
                  onChange={(e) => handleInputChange('reward_token', e.target.value)}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-label="Reward token"
                >
                  <option value="USDC">USDC</option>
                  <option value="USDT">USDT</option>
                  <option value="ETH">ETH</option>
                  <option value="DAI">DAI</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Difficulty
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => handleInputChange('difficulty', e.target.value)}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-label="Contest difficulty"
                >
                  {difficulties.map(diff => (
                    <option key={diff.value} value={diff.value}>
                      {diff.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Submission Deadline *
                </label>
                <input
                  type="datetime-local"
                  value={formData.submission_deadline}
                  onChange={(e) => handleInputChange('submission_deadline', e.target.value)}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Voting Deadline *
                </label>
                <input
                  type="datetime-local"
                  value={formData.voting_deadline}
                  onChange={(e) => handleInputChange('voting_deadline', e.target.value)}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
            </div>
          </div>

          {/* Content Requirements */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Content Requirements</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Content Type
                </label>
                <select
                  value={formData.content_type}
                  onChange={(e) => handleInputChange('content_type', e.target.value)}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-label="Content type"
                >
                  {contentTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Submissions
                </label>
                  <input
                    type="number"
                    value={formData.max_submissions}
                    onChange={(e) => handleInputChange('max_submissions', parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="100"
                    aria-label="Maximum submissions"
                  />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Min Word Count
                </label>
                  <input
                    type="number"
                    value={formData.min_word_count}
                    onChange={(e) => handleInputChange('min_word_count', parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="100"
                    aria-label="Minimum word count"
                  />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Word Count
                </label>
                  <input
                    type="number"
                    value={formData.max_word_count}
                    onChange={(e) => handleInputChange('max_word_count', parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="5000"
                    aria-label="Maximum word count"
                  />
              </div>
            </div>
          </div>

          {/* Rules */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Contest Rules</h3>
            
            {formData.rules.map((rule, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={rule}
                  onChange={(e) => handleRuleChange(index, e.target.value)}
                  className="flex-1 px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={`Rule ${index + 1}`}
                />
                {formData.rules.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRule(index)}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            
            <button
              type="button"
              onClick={addRule}
              className="px-4 py-2 bg-dark-700 text-gray-300 border border-dark-600 rounded-lg hover:bg-dark-600 transition-colors"
            >
              + Add Rule
            </button>
          </div>

          {/* Tags */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Tags</h3>
            
            {formData.tags.map((tag, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={tag}
                  onChange={(e) => handleTagChange(index, e.target.value)}
                  className="flex-1 px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={`Tag ${index + 1}`}
                />
                {formData.tags.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTag(index)}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            
            <button
              type="button"
              onClick={addTag}
              className="px-4 py-2 bg-dark-700 text-gray-300 border border-dark-600 rounded-lg hover:bg-dark-600 transition-colors"
            >
              + Add Tag
            </button>
          </div>

          {/* Scoring Weights */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Scoring Weights</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Algorithm (%)
                </label>
                  <input
                    type="number"
                    value={formData.scoring_weights.algorithm}
                    onChange={(e) => handleInputChange('scoring_weights', {
                      ...formData.scoring_weights,
                      algorithm: parseInt(e.target.value)
                    })}
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    min="0"
                    max="100"
                    aria-label="Algorithm scoring weight percentage"
                  />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Community (%)
                </label>
                  <input
                    type="number"
                    value={formData.scoring_weights.community}
                    onChange={(e) => handleInputChange('scoring_weights', {
                      ...formData.scoring_weights,
                      community: parseInt(e.target.value)
                    })}
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    min="0"
                    max="100"
                    aria-label="Community scoring weight percentage"
                  />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Judges (%)
                </label>
                  <input
                    type="number"
                    value={formData.scoring_weights.judges}
                    onChange={(e) => handleInputChange('scoring_weights', {
                      ...formData.scoring_weights,
                      judges: parseInt(e.target.value)
                    })}
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    min="0"
                    max="100"
                    aria-label="Judges scoring weight percentage"
                  />
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-dark-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-dark-700 text-gray-300 border border-dark-600 rounded-lg hover:bg-dark-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Create Contest
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContestCreationModal;

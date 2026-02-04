import React, { useState, useEffect } from 'react';
import ApiService from '../services/api';

const DisputeSystem = ({ contestId, entryId, isOpen, onClose, userAddress }) => {
  const [disputeData, setDisputeData] = useState({
    reasonCode: '',
    explanation: '',
    evidence: '',
    evidenceFiles: [],
    anonymousFiling: true
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [entry, setEntry] = useState(null);

  useEffect(() => {
    loadEntryData();
  }, [entryId]);

  const loadEntryData = async () => {
    try {
      // Load entry data for context
      // This would normally fetch from API
      setEntry({
        id: entryId,
        title: 'DeFi Portfolio Manager',
        content: 'A comprehensive DeFi portfolio management tool...',
        submitter_address: '0x1234...5678'
      });
    } catch (error) {
      console.error('Failed to load entry data:', error);
    }
  };

  const disputeReasons = [
    {
      code: 'A1',
      title: 'Plagiarism',
      description: 'Content appears to be copied from another source without proper attribution',
      examples: ['Copy-pasted content', 'Uncredited sources', 'Duplicate submissions']
    },
    {
      code: 'A2',
      title: 'Off-brief',
      description: 'Content does not meet the contest requirements or theme',
      examples: ['Wrong topic', 'Missing requirements', 'Incorrect format']
    },
    {
      code: 'A3',
      title: 'Fabrication',
      description: 'Content contains false or misleading information',
      examples: ['False claims', 'Misleading data', 'Fabricated results']
    },
    {
      code: 'A4',
      title: 'Low Originality',
      description: 'Content lacks sufficient originality or creativity',
      examples: ['Generic content', 'Minimal effort', 'Templated responses']
    },
    {
      code: 'A5',
      title: 'Prohibited Content',
      description: 'Content violates community guidelines or contest rules',
      examples: ['Inappropriate content', 'Spam', 'Harmful material']
    }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setDisputeData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setDisputeData(prev => ({
      ...prev,
      evidenceFiles: [...prev.evidenceFiles, ...files]
    }));
  };

  const removeFile = (index) => {
    setDisputeData(prev => ({
      ...prev,
      evidenceFiles: prev.evidenceFiles.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!disputeData.reasonCode) {
      newErrors.reasonCode = 'Please select a dispute reason';
    }

    if (!disputeData.explanation.trim() || disputeData.explanation.length < 20) {
      newErrors.explanation = 'Please provide a detailed explanation (minimum 20 characters)';
    }

    if (!disputeData.evidence.trim() && disputeData.evidenceFiles.length === 0) {
      newErrors.evidence = 'Please provide evidence (URLs or file uploads)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm() || !userAddress) {
      return;
    }

    setLoading(true);
    try {
      const disputeSubmission = {
        contest_id: contestId,
        entry_id: entryId,
        reason_code: disputeData.reasonCode,
        explanation: disputeData.explanation,
        evidence: disputeData.evidence,
        evidence_files: disputeData.evidenceFiles,
        anonymous_filing: disputeData.anonymousFiling,
        filer_address: userAddress,
        timestamp: new Date().toISOString()
      };

      // Submit dispute (mock API call)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert('Dispute submitted successfully! It will be reviewed by our triage team within 24 hours.');
      onClose();
      
    } catch (error) {
      console.error('Failed to submit dispute:', error);
      setErrors({ submit: 'Failed to submit dispute. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const selectedReason = disputeReasons.find(r => r.code === disputeData.reasonCode);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">File Dispute</h2>
              <p className="text-gray-600">Report potential violations or issues</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Entry Context */}
          {entry && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Disputing Entry</h3>
              <div className="text-sm text-gray-600">
                <div className="font-medium">{entry.title}</div>
                <div>by {entry.submitter_address}</div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Dispute Reason */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Reason for Dispute *
              </label>
              <div className="space-y-3">
                {disputeReasons.map(reason => (
                  <div key={reason.code} className="border border-gray-200 rounded-lg p-4">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="reasonCode"
                        value={reason.code}
                        checked={disputeData.reasonCode === reason.code}
                        onChange={handleChange}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {reason.code} - {reason.title}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {reason.description}
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          Examples: {reason.examples.join(', ')}
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
              {errors.reasonCode && (
                <p className="text-red-500 text-xs mt-2">{errors.reasonCode}</p>
              )}
            </div>

            {/* Explanation */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Detailed Explanation *
              </label>
              <textarea
                name="explanation"
                value={disputeData.explanation}
                onChange={handleChange}
                rows="4"
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.explanation ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Provide a detailed explanation of why you believe this entry violates the contest rules..."
                required
              />
              {errors.explanation && (
                <p className="text-red-500 text-xs mt-1">{errors.explanation}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {disputeData.explanation.length}/20 characters minimum
              </p>
            </div>

            {/* Evidence */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Evidence *
              </label>
              
              {/* URL Evidence */}
              <div className="mb-4">
                <input
                  type="url"
                  name="evidence"
                  value={disputeData.evidence}
                  onChange={handleChange}
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.evidence ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Provide links to evidence (e.g., original source, similar content)"
                />
              </div>
              
              {/* File Upload */}
              <div>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Upload supporting documents or images (PDF, DOC, TXT, JPG, PNG)
                </p>
              </div>

              {/* Uploaded Files */}
              {disputeData.evidenceFiles.length > 0 && (
                <div className="mt-3">
                  <div className="text-sm font-medium text-gray-700 mb-2">Uploaded Files:</div>
                  <div className="space-y-2">
                    {disputeData.evidenceFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 rounded p-2">
                        <span className="text-sm text-gray-600">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {errors.evidence && (
                <p className="text-red-500 text-xs mt-2">{errors.evidence}</p>
              )}
            </div>

            {/* Anonymous Filing */}
            <div className="mb-6">
              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  name="anonymousFiling"
                  checked={disputeData.anonymousFiling}
                  onChange={handleChange}
                  className="mt-1"
                />
                <div>
                  <div className="text-sm font-medium text-gray-700">
                    File anonymously
                  </div>
                  <div className="text-xs text-gray-500">
                    We will not reveal your identity to the submitter. Triage reviewers will see only the evidence.
                  </div>
                </div>
              </label>
            </div>

            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <div className="text-yellow-400 mr-3">⚠️</div>
                <div>
                  <h4 className="font-medium text-yellow-800">Important Notice</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Filing false disputes may result in account restrictions. 
                    Please ensure you have valid evidence before submitting.
                  </p>
                </div>
              </div>
            </div>

            {/* Error Messages */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800 text-sm">{errors.submit}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-md font-medium transition-colors"
              >
                {loading ? 'Submitting...' : 'Submit Dispute'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Dispute Status Component
export const DisputeStatus = ({ dispute }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'under_review': return 'bg-blue-100 text-blue-800';
      case 'validated': return 'bg-red-100 text-red-800';
      case 'invalid': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'under_review': return '👀';
      case 'validated': return '✅';
      case 'invalid': return '❌';
      default: return '❓';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <span className="text-lg">{getStatusIcon(dispute.status)}</span>
          <div>
            <h4 className="font-medium text-gray-900">Dispute #{dispute.id}</h4>
            <p className="text-sm text-gray-600">{dispute.reason_code} - {dispute.reason}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(dispute.status)}`}>
          {dispute.status.replace('_', ' ')}
        </span>
      </div>
      
      <div className="text-sm text-gray-600 mb-3">
        {dispute.explanation}
      </div>
      
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>Filed: {new Date(dispute.timestamp).toLocaleDateString()}</span>
        {dispute.reviewer_notes && (
          <span>Reviewer: {dispute.reviewer_notes}</span>
        )}
      </div>
    </div>
  );
};

export default DisputeSystem;

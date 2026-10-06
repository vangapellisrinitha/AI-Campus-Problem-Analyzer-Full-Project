import React, { useState } from 'react';
import { submitProblem } from '../services/api';

const CATEGORIES = [
  'Classroom',
  'Laboratory',
  'Hostel',
  'Wi-Fi / Network',
  'Electrical',
  'Cleanliness',
  'Infrastructure',
  'Transportation',
  'Other'
];

const INITIAL_FORM_STATE = {
  studentName: '',
  studentId: '',
  category: '',
  location: '',
  description: '',
  additionalDetails: ''
};

export default function ProblemSubmissionForm() {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [submittedData, setSubmittedData] = useState(null);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    // Clear validation error when user types
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Client-side validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.studentName.trim()) {
      newErrors.studentName = 'Student name is required.';
    }

    if (!formData.studentId.trim()) {
      newErrors.studentId = 'Student ID / Roll number is required.';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a problem category.';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Campus location is required (e.g., Block B, Room 204).';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Problem description is required.';
    } else if (formData.description.trim().length < 15) {
      newErrors.description = `Description must be at least 15 characters (currently ${formData.description.trim().length} chars).`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    const result = await submitProblem(formData);

    setIsSubmitting(false);

    if (result.success) {
      setSubmittedData(result.data);
      setFormData(INITIAL_FORM_STATE);
      setErrors({});
    } else {
      setServerError(
        result.errors && result.errors.length > 0
          ? result.errors.join(' ')
          : result.message || 'Failed to submit problem.'
      );
    }
  };

  // Reset to submit another complaint
  const handleReset = () => {
    setSubmittedData(null);
    setServerError(null);
    setErrors({});
    setFormData(INITIAL_FORM_STATE);
  };

  return (
    <div className="card submission-card">
      <div className="form-header">
        <div className="form-header-title">
          <h2>Submit a Campus Problem</h2>
          <p className="card-description">
            Report any issue across campus. Provide specific details so the issue can be accurately routed and addressed.
          </p>
        </div>
      </div>

      {/* Success Confirmation State */}
      {submittedData ? (
        <div className="submission-success-card">
          <div className="success-icon-banner">
            <span className="success-check-icon">✓</span>
            <h3>Complaint Registered Successfully!</h3>
            <p>Your problem report has been officially logged in the system.</p>
          </div>

          <div className="complaint-id-container">
            <span className="complaint-id-label">Assigned Complaint ID:</span>
            <span className="complaint-id-badge">{submittedData.complaintId}</span>
            <small className="complaint-id-hint">Please keep this ID for tracking status updates.</small>
          </div>

          <div className="complaint-summary-box">
            <h4>Submission Summary</h4>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="summary-label">Student Name:</span>
                <span className="summary-value">{submittedData.studentName}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Student ID:</span>
                <span className="summary-value">{submittedData.studentId}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Category:</span>
                <span className="summary-value category-tag">{submittedData.category}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Campus Location:</span>
                <span className="summary-value">{submittedData.location}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Initial Status:</span>
                <span className="summary-value status-pill-pending">{submittedData.status}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Submission Time:</span>
                <span className="summary-value">{new Date(submittedData.createdAt).toLocaleString()}</span>
              </div>
            </div>

            <div className="summary-description">
              <span className="summary-label">Description:</span>
              <p>{submittedData.description}</p>
            </div>

            {submittedData.additionalDetails && (
              <div className="summary-description">
                <span className="summary-label">Additional Details:</span>
                <p>{submittedData.additionalDetails}</p>
              </div>
            )}
          </div>

          {/* AI Analysis Result Section */}
          {submittedData.priority || submittedData.aiSummary || submittedData.ai_summary ? (
            <div className="ai-analysis-card">
              <div className="ai-analysis-header">
                <div className="ai-title-wrap">
                  <span className="ai-sparkle-icon">🤖</span>
                  <div>
                    <h4>AI Problem Analysis</h4>
                    <p className="ai-subtitle">Automated categorization & triage by AI engine</p>
                  </div>
                </div>
                <span className={`priority-badge priority-${(submittedData.priority || 'medium').toLowerCase()}`}>
                  {submittedData.priority} Priority
                </span>
              </div>

              <div className="ai-details-grid">
                <div className="ai-detail-block ai-summary-block">
                  <span className="ai-field-label">AI Summary</span>
                  <p className="ai-summary-text">{submittedData.aiSummary || submittedData.ai_summary}</p>
                </div>

                <div className="ai-two-col">
                  <div className="ai-detail-block">
                    <span className="ai-field-label">Responsible Department</span>
                    <span className="department-pill">
                      🏢 {submittedData.responsibleDepartment || submittedData.responsible_department}
                    </span>
                  </div>

                  <div className="ai-detail-block">
                    <span className="ai-field-label">Recommended Action</span>
                    <p className="ai-action-text">
                      {submittedData.recommendedAction || submittedData.recommended_action}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="ai-notice-box">
              <span className="ai-notice-icon">ℹ️</span>
              <div>
                <strong>AI Analysis Status:</strong>
                <p>
                  {submittedData.aiNotice ||
                    'Automated AI analysis is pending or AI_API_KEY is not configured in backend/.env. The complaint is safely recorded in the SQLite database.'}
                </p>
              </div>
            </div>
          )}

          <div className="success-actions">
            <button onClick={handleReset} className="btn btn-primary">
              Submit Another Problem
            </button>
          </div>
        </div>
      ) : (
        /* Submission Form */
        <form onSubmit={handleSubmit} noValidate className="problem-form">
          {serverError && (
            <div className="alert alert-error form-alert">
              <strong>Submission Error:</strong> {serverError}
            </div>
          )}

          <div className="form-row">
            {/* Student Name */}
            <div className="form-group">
              <label htmlFor="studentName" className="form-label">
                Student Full Name <span className="required-star">*</span>
              </label>
              <input
                type="text"
                id="studentName"
                name="studentName"
                className={`form-input ${errors.studentName ? 'input-error' : ''}`}
                placeholder="e.g., Alex Johnson"
                value={formData.studentName}
                onChange={handleChange}
                disabled={isSubmitting}
              />
              {errors.studentName && <span className="field-error">{errors.studentName}</span>}
            </div>

            {/* Student ID / Roll Number */}
            <div className="form-group">
              <label htmlFor="studentId" className="form-label">
                Student ID / Roll Number <span className="required-star">*</span>
              </label>
              <input
                type="text"
                id="studentId"
                name="studentId"
                className={`form-input ${errors.studentId ? 'input-error' : ''}`}
                placeholder="e.g., CS2024-082"
                value={formData.studentId}
                onChange={handleChange}
                disabled={isSubmitting}
              />
              {errors.studentId && <span className="field-error">{errors.studentId}</span>}
            </div>
          </div>

          <div className="form-row">
            {/* Problem Category */}
            <div className="form-group">
              <label htmlFor="category" className="form-label">
                Problem Category <span className="required-star">*</span>
              </label>
              <select
                id="category"
                name="category"
                className={`form-select ${errors.category ? 'input-error' : ''}`}
                value={formData.category}
                onChange={handleChange}
                disabled={isSubmitting}
              >
                <option value="">-- Select Problem Category --</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {errors.category && <span className="field-error">{errors.category}</span>}
            </div>

            {/* Campus Location */}
            <div className="form-group">
              <label htmlFor="location" className="form-label">
                Campus Location <span className="required-star">*</span>
              </label>
              <input
                type="text"
                id="location"
                name="location"
                className={`form-input ${errors.location ? 'input-error' : ''}`}
                placeholder="e.g., Science Block B, Room 302 or Central Library"
                value={formData.location}
                onChange={handleChange}
                disabled={isSubmitting}
              />
              {errors.location && <span className="field-error">{errors.location}</span>}
            </div>
          </div>

          {/* Problem Description */}
          <div className="form-group">
            <div className="label-with-counter">
              <label htmlFor="description" className="form-label">
                Problem Description <span className="required-star">*</span>
              </label>
              <span className={`char-counter ${formData.description.trim().length < 15 ? 'char-counter-low' : ''}`}>
                {formData.description.trim().length} chars (min 15)
              </span>
            </div>
            <textarea
              id="description"
              name="description"
              rows="4"
              className={`form-textarea ${errors.description ? 'input-error' : ''}`}
              placeholder="Describe the issue clearly (e.g., The projector in room 302 won't turn on and flashes red light since morning class)."
              value={formData.description}
              onChange={handleChange}
              disabled={isSubmitting}
            />
            {errors.description && <span className="field-error">{errors.description}</span>}
          </div>

          {/* Optional Additional Details */}
          <div className="form-group">
            <label htmlFor="additionalDetails" className="form-label">
              Optional Additional Details <span className="optional-tag">(Optional)</span>
            </label>
            <input
              type="text"
              id="additionalDetails"
              name="additionalDetails"
              className="form-input"
              placeholder="e.g., Nearby landmarks, urgency notes, or preferred times for inspection"
              value={formData.additionalDetails}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary btn-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner"></span>
                  Submitting Problem...
                </>
              ) : (
                'Submit Problem'
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

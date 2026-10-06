const dbHelper = require('../database/db');
const { analyzeComplaint, ALLOWED_CATEGORIES } = require('../services/aiService');

/**
 * Handle student problem submission, persist to SQLite, and run AI analysis
 * POST /api/problems
 */
const submitProblem = async (req, res) => {
  try {
    const {
      studentName,
      studentId,
      category,
      description,
      location,
      campus_location,
      additionalDetails
    } = req.body;

    const campusLocation = (campus_location || location || '').trim();
    const errors = [];

    // Validation rules
    if (!studentName || typeof studentName !== 'string' || studentName.trim().length === 0) {
      errors.push('Student name is required.');
    }

    if (!studentId || typeof studentId !== 'string' || studentId.trim().length === 0) {
      errors.push('Student ID / Roll Number is required.');
    }

    if (!category || !ALLOWED_CATEGORIES.includes(category)) {
      errors.push(`Please select a valid problem category: ${ALLOWED_CATEGORIES.join(', ')}`);
    }

    if (!campusLocation || campusLocation.length === 0) {
      errors.push('Campus location is required (e.g., Room number, Block, or Building).');
    }

    if (!description || typeof description !== 'string') {
      errors.push('Problem description is required.');
    } else if (description.trim().length < 15) {
      errors.push('Problem description must be at least 15 characters long to provide adequate context.');
    }

    // Return 400 Bad Request if validation errors exist
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed. Please correct the errors and try again.',
        errors
      });
    }

    // Generate formatted unique complaint ID (CMP-2026-XXXX)
    const timestamp = Date.now().toString().slice(-4);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const complaintId = `CMP-${new Date().getFullYear()}-${timestamp}${randomSuffix}`;

    const now = new Date().toISOString();
    const fullDescription = additionalDetails && typeof additionalDetails === 'string' && additionalDetails.trim().length > 0
      ? `${description.trim()}\n\nAdditional Details: ${additionalDetails.trim()}`
      : description.trim();

    // 1. Insert complaint into SQLite database first (status = 'Pending', AI fields = NULL)
    const insertSql = `
      INSERT INTO complaints (
        complaint_id,
        student_name,
        student_id,
        category,
        description,
        campus_location,
        priority,
        ai_summary,
        responsible_department,
        recommended_action,
        status,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, NULL, NULL, 'Pending', ?, ?)
    `;

    await dbHelper.run(insertSql, [
      complaintId,
      studentName.trim(),
      studentId.trim(),
      category,
      fullDescription,
      campusLocation,
      now,
      now
    ]);

    // 2. Run AI analysis
    let finalCategory = category;
    let priority = null;
    let aiSummary = null;
    let responsibleDepartment = null;
    let recommendedAction = null;
    let aiAnalysisSuccess = false;
    let aiNotice = null;

    const aiResult = await analyzeComplaint({
      description: fullDescription,
      campusLocation,
      category
    });

    if (aiResult.success && aiResult.data) {
      finalCategory = aiResult.data.category || category;
      priority = aiResult.data.priority || null;
      aiSummary = aiResult.data.ai_summary || null;
      responsibleDepartment = aiResult.data.responsible_department || null;
      recommendedAction = aiResult.data.recommended_action || null;
      aiAnalysisSuccess = true;

      // 3. Update SQLite record with AI analysis results
      const updateSql = `
        UPDATE complaints
        SET
          category = ?,
          priority = ?,
          ai_summary = ?,
          responsible_department = ?,
          recommended_action = ?,
          updated_at = ?
        WHERE complaint_id = ?
      `;

      await dbHelper.run(updateSql, [
        finalCategory,
        priority,
        aiSummary,
        responsibleDepartment,
        recommendedAction,
        new Date().toISOString(),
        complaintId
      ]);
    } else {
      aiNotice = aiResult.reason === 'AI_KEY_NOT_CONFIGURED'
        ? 'AI API key not configured in backend/.env. Complaint saved successfully without automated analysis.'
        : `AI analysis unavailable (${aiResult.error || 'unknown error'}). Complaint saved successfully.`;
    }

    // 4. Construct response object (compatible with both camelCase and snake_case)
    const complaintData = {
      complaintId,
      complaint_id: complaintId,
      studentName: studentName.trim(),
      student_name: studentName.trim(),
      studentId: studentId.trim(),
      student_id: studentId.trim(),
      category: finalCategory,
      location: campusLocation,
      campus_location: campusLocation,
      description: fullDescription,
      additionalDetails: additionalDetails && typeof additionalDetails === 'string' ? additionalDetails.trim() : '',
      priority,
      ai_summary: aiSummary,
      aiSummary,
      responsible_department: responsibleDepartment,
      responsibleDepartment,
      recommended_action: recommendedAction,
      recommendedAction,
      status: 'Pending',
      createdAt: now,
      created_at: now,
      updatedAt: now,
      updated_at: now,
      aiAnalysisSuccess,
      aiNotice
    };

    return res.status(201).json({
      success: true,
      message: aiAnalysisSuccess
        ? 'Problem submitted and successfully analyzed by AI.'
        : 'Problem submitted successfully and registered in campus records.',
      data: complaintData
    });
  } catch (error) {
    console.error('Error handling complaint submission:', error);
    return res.status(500).json({
      success: false,
      message: 'Database error: Failed to process complaint.',
      error: error.message
    });
  }
};

/**
 * Retrieve all complaints stored in SQLite
 * GET /api/problems
 */
const getProblems = async (req, res) => {
  try {
    const querySql = `
      SELECT
        complaint_id,
        student_name,
        student_id,
        category,
        description,
        campus_location,
        priority,
        ai_summary,
        responsible_department,
        recommended_action,
        status,
        created_at,
        updated_at
      FROM complaints
      ORDER BY id DESC
    `;

    const rows = await dbHelper.all(querySql);

    const complaints = rows.map((row) => ({
      ...row,
      complaintId: row.complaint_id,
      studentName: row.student_name,
      studentId: row.student_id,
      campusLocation: row.campus_location,
      location: row.campus_location,
      aiSummary: row.ai_summary,
      responsibleDepartment: row.responsible_department,
      recommendedAction: row.recommended_action,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    return res.status(200).json({
      success: true,
      count: complaints.length,
      data: complaints
    });
  } catch (error) {
    console.error('Error retrieving complaints from SQLite:', error);
    return res.status(500).json({
      success: false,
      message: 'Database error: Failed to fetch complaints.',
      error: error.message
    });
  }
};

module.exports = {
  submitProblem,
  getProblems,
  ALLOWED_CATEGORIES
};

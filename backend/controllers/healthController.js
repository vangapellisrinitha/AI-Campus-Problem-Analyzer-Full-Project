// Controller to handle health check requests
const getHealthStatus = (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'AI Campus Problem Analyzer Backend is running successfully',
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  getHealthStatus
};

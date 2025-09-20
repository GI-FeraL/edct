const { cleanupOldProjects, getAllProjects } = require('./storage');

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Run cleanup
    cleanupOldProjects();
    
    // Get current projects count
    const projects = getAllProjects();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: 'Cleanup completed',
        activeProjects: projects.length,
        projects: projects.map(p => ({ id: p.id, stationName: p.stationName, createdAt: p.createdAt }))
      }),
    };
  } catch (error) {
    console.error('Error in cleanup:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

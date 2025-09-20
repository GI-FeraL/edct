const { v4: uuidv4 } = require('uuid');
const { saveProject } = require('./storage');

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const project = JSON.parse(event.body);
    
    // Validate project data
    if (!project.id || !project.stationType || !project.requiredMaterials) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid project data' }),
      };
    }

    // Save project using storage
    const savedProject = saveProject(project);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(savedProject),
    };
  } catch (error) {
    console.error('Error in save-project:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

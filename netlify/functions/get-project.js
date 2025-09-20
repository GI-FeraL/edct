// Simple file-based storage for persistence
const fs = require('fs');
const path = require('path');

function getProjectsFilePath() {
  return path.join('/tmp', 'projects.json');
}

function loadProjects() {
  try {
    const filePath = getProjectsFilePath();
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return new Map(JSON.parse(data));
    }
  } catch (error) {
    console.error('Error loading projects:', error);
  }
  return new Map();
}

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
    const projectId = event.queryStringParameters?.id;
    
    if (!projectId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Project ID required' }),
      };
    }

    // Load projects from file
    const projects = loadProjects();
    const project = projects.get(projectId);
    
    if (!project) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Project not found' }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(project),
    };
  } catch (error) {
    console.error('Error in get-project:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

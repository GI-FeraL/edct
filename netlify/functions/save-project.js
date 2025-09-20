const { v4: uuidv4 } = require('uuid');

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

function saveProjects(projects) {
  try {
    const filePath = getProjectsFilePath();
    const data = JSON.stringify(Array.from(projects.entries()));
    fs.writeFileSync(filePath, data);
  } catch (error) {
    console.error('Error saving projects:', error);
  }
}

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

    // Load existing projects
    const projects = loadProjects();
    
    // Save project
    projects.set(project.id, project);
    saveProjects(projects);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(project),
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

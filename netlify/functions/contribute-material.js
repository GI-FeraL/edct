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
    const { projectId, material, amount, contributorName } = JSON.parse(event.body);
    
    // Validate input
    if (!projectId || !material || !amount || amount <= 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid contribution data' }),
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

    // Check if material exists in project
    if (!project.requiredMaterials[material]) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid material' }),
      };
    }

    // Check if contribution exceeds remaining amount
    const remaining = project.requiredMaterials[material] - project.contributedMaterials[material];
    if (amount > remaining) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: `Cannot contribute more than ${remaining}` }),
      };
    }

    // Add contribution
    project.contributedMaterials[material] += amount;

    // Save updated project
    projects.set(projectId, project);
    saveProjects(projects);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(project),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

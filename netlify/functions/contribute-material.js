const { getProject, updateProject } = require('./storage');

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

    // Get project from shared storage
    const project = getProject(projectId);
    
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

    // Update project in storage
    const updatedProject = updateProject(projectId, project);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(updatedProject),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

const fs = require('fs');
const path = require('path');

// Simple in-memory storage for project data
let projectsStore = new Map();

// Function to get project file path
function getProjectFilePath(projectName) {
  return path.join('/tmp', `${projectName}.html`);
}

// Function to regenerate project HTML
function regenerateProjectHTML(project) {
  const template = fs.readFileSync(path.join(__dirname, '../project-template.html'), 'utf8');
  
  // Generate materials HTML
  const materialsHTML = Object.entries(project.requiredMaterials).map(([material, required]) => {
    const contributed = project.contributedMaterials[material];
    const progress = Math.min((contributed / required) * 100, 100);
    const remaining = Math.max(0, required - contributed);
    
    return `
      <div class="material-item">
        <div class="material-name">${material}</div>
        
        <div class="material-progress">
          <div class="material-progress-bar" style="width: ${progress}%"></div>
        </div>
        
        <div class="material-stats">
          <span>${contributed.toLocaleString()} / ${required.toLocaleString()}</span>
          <span>${Math.round(progress)}%</span>
        </div>
        
        ${remaining > 0 ? `
          <div class="contribution-form">
            <input type="number" class="input contribution-input" 
                   placeholder="Amount" min="1" max="${remaining}" 
                   onkeypress="handleMaterialInput(event, '${material}')">
            <button class="btn btn-success" 
                    onclick="contributeMaterial('${material}')">
              Contribute
            </button>
          </div>
        ` : `
          <div style="color: #2ed573; font-weight: bold; text-align: center;">
            ✓ Complete
          </div>
        `}
      </div>`;
  }).join('');

  // Replace template placeholders
  return template
    .replace(/{{PROJECT_NAME}}/g, project.id)
    .replace(/{{STATION_NAME}}/g, project.stationName)
    .replace(/{{CURRENT_URL}}/g, `${process.env.URL || 'https://edct.netlify.app'}/${project.id}`)
    .replace(/{{MATERIALS_HTML}}/g, materialsHTML)
    .replace(/{{PROJECT_DATA}}/g, JSON.stringify(project));
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
    const { projectName, material, amount, contributorName } = JSON.parse(event.body);
    
    // Validate input
    if (!projectName || !material || !amount || amount <= 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid contribution data' }),
      };
    }

    const project = projectsStore.get(projectName);
    
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

    // Update project data
    projectsStore.set(projectName, project);

    // Regenerate HTML file
    const htmlContent = regenerateProjectHTML(project);
    const filePath = getProjectFilePath(projectName);
    fs.writeFileSync(filePath, htmlContent, 'utf8');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(project),
    };
  } catch (error) {
    console.error('Error contributing material:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
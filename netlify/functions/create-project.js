const fs = require('fs');
const path = require('path');

// Station types and their material requirements
const stationTypes = {
  'coriolis_starport': {
    name: 'Coriolis Starport',
    materials: {
      'Aluminium': 2500000,
      'Beryllium': 350000,
      'Copper': 750000,
      'Gold': 25000,
      'Indium': 125000,
      'Lithium': 125000,
      'Nickel': 750000,
      'Palladium': 25000,
      'Platinum': 5000,
      'Silver': 25000,
      'Titanium': 250000,
      'Uranium': 125000
    }
  },
  'orbis_starport': {
    name: 'Orbis Starport',
    materials: {
      'Aluminium': 1250000,
      'Beryllium': 175000,
      'Copper': 375000,
      'Gold': 12500,
      'Indium': 62500,
      'Lithium': 62500,
      'Nickel': 375000,
      'Palladium': 12500,
      'Platinum': 2500,
      'Silver': 12500,
      'Titanium': 125000,
      'Uranium': 62500
    }
  },
  'ocellus_starport': {
    name: 'Ocellus Starport',
    materials: {
      'Aluminium': 750000,
      'Beryllium': 105000,
      'Copper': 225000,
      'Gold': 7500,
      'Indium': 37500,
      'Lithium': 37500,
      'Nickel': 225000,
      'Palladium': 7500,
      'Platinum': 1500,
      'Silver': 7500,
      'Titanium': 75000,
      'Uranium': 37500
    }
  },
  'asteroid_base': {
    name: 'Asteroid Base',
    materials: {
      'Aluminium': 250000,
      'Beryllium': 35000,
      'Copper': 75000,
      'Gold': 2500,
      'Indium': 12500,
      'Lithium': 12500,
      'Nickel': 75000,
      'Palladium': 2500,
      'Platinum': 500,
      'Silver': 2500,
      'Titanium': 25000,
      'Uranium': 12500
    }
  },
  'planetary_outpost': {
    name: 'Planetary Outpost',
    materials: {
      'Aluminium': 125000,
      'Beryllium': 17500,
      'Copper': 37500,
      'Gold': 1250,
      'Indium': 6250,
      'Lithium': 6250,
      'Nickel': 37500,
      'Palladium': 1250,
      'Platinum': 250,
      'Silver': 1250,
      'Titanium': 12500,
      'Uranium': 6250
    }
  },
  'ground_settlement': {
    name: 'Ground Settlement',
    materials: {
      'Aluminium': 75000,
      'Beryllium': 10500,
      'Copper': 22500,
      'Gold': 750,
      'Indium': 3750,
      'Lithium': 3750,
      'Nickel': 22500,
      'Palladium': 750,
      'Platinum': 150,
      'Silver': 750,
      'Titanium': 7500,
      'Uranium': 3750
    }
  }
};

// Simple in-memory storage for project data
let projectsStore = new Map();

// Function to get project file path
function getProjectFilePath(projectName) {
  return path.join('/tmp', `${projectName}.html`);
}

// Function to generate project HTML
function generateProjectHTML(project) {
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
    const { projectName, stationType } = JSON.parse(event.body);
    
    // Validate input
    if (!projectName || !stationType) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Project name and station type are required' }),
      };
    }

    // Validate project name
    if (!/^[A-Z0-9]+$/.test(projectName)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Project name can only contain letters and numbers' }),
      };
    }

    // Check if project already exists
    if (projectsStore.has(projectName)) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ error: 'Project already exists' }),
      };
    }

    // Get station data
    const stationData = stationTypes[stationType];
    if (!stationData) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid station type' }),
      };
    }

    // Create project
    const project = {
      id: projectName,
      stationType: stationType,
      stationName: stationData.name,
      requiredMaterials: { ...stationData.materials },
      contributedMaterials: {},
      createdAt: new Date().toISOString()
    };

    // Initialize contributed materials
    Object.keys(stationData.materials).forEach(material => {
      project.contributedMaterials[material] = 0;
    });

    // Store project data
    projectsStore.set(projectName, project);

    // Generate and save HTML file
    const htmlContent = generateProjectHTML(project);
    const filePath = getProjectFilePath(projectName);
    
    // Ensure /tmp directory exists
    if (!fs.existsSync('/tmp')) {
      fs.mkdirSync('/tmp');
    }
    
    fs.writeFileSync(filePath, htmlContent, 'utf8');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        projectName: projectName,
        url: `/${projectName}`,
        message: 'Project created successfully'
      }),
    };
  } catch (error) {
    console.error('Error creating project:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

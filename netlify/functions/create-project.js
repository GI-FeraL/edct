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

  // Complete HTML template embedded in function
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${project.id} - ED Colonization Tracker</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%); color: white; min-height: 100vh; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        .card { background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 15px; padding: 25px; margin: 20px 0; box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37); }
        .btn { background: linear-gradient(45deg, #ff6b6b, #ee5a24); border: none; color: white; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600; margin: 5px; transition: all 0.3s ease; }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(255, 107, 107, 0.4); }
        .btn-secondary { background: linear-gradient(45deg, #3742fa, #2f3542); }
        .btn-success { background: linear-gradient(45deg, #2ed573, #1e90ff); }
        .input { background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 8px; padding: 12px 16px; color: white; font-size: 16px; width: 100%; margin: 8px 0; }
        .input::placeholder { color: rgba(255, 255, 255, 0.6); }
        .input:focus { outline: none; border-color: #ff6b6b; box-shadow: 0 0 0 2px rgba(255, 107, 107, 0.2); }
        .material-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; margin: 20px 0; }
        .material-item { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 10px; padding: 15px; }
        .material-name { font-size: 18px; font-weight: 600; color: #ffd700; margin-bottom: 10px; }
        .material-progress { background: rgba(255, 255, 255, 0.1); border-radius: 5px; height: 20px; overflow: hidden; margin: 10px 0; }
        .material-progress-bar { height: 100%; background: linear-gradient(90deg, #2ed573, #1e90ff); transition: width 0.3s ease; border-radius: 5px; }
        .material-stats { display: flex; justify-content: space-between; font-size: 14px; color: rgba(255, 255, 255, 0.8); margin: 10px 0; }
        .contribution-form { display: flex; gap: 10px; align-items: center; margin-top: 10px; }
        .contribution-input { flex: 1; max-width: 120px; }
        .project-header { text-align: center; margin-bottom: 30px; }
        .project-url { background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; padding: 10px 15px; font-family: monospace; font-size: 14px; margin: 10px 0; display: inline-block; word-break: break-all; }
        .error { background: rgba(255, 71, 87, 0.2); border: 1px solid #ff4757; border-radius: 8px; padding: 15px; margin: 20px 0; color: #ff6b6b; }
        .success { background: rgba(46, 213, 115, 0.2); border: 1px solid #2ed573; border-radius: 8px; padding: 15px; margin: 20px 0; color: #2ed573; }
        .hidden { display: none; }
        .status { text-align: center; margin-top: 20px; font-size: 14px; color: rgba(255,255,255,0.6); }
        @media (max-width: 768px) { .material-grid { grid-template-columns: 1fr; } .contribution-form { flex-direction: column; align-items: stretch; } .contribution-input { max-width: none; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="project-header">
            <h1>${project.stationName}</h1>
            <div class="project-url">
                Project: ${project.id} | URL: ${process.env.URL || 'https://edct.netlify.app'}/${project.id}
                <button class="btn btn-secondary" onclick="copyUrl()" style="margin-left: 10px; padding: 5px 10px; font-size: 12px;">Copy URL</button>
            </div>
            <p>Share this URL with your squadron members to collaborate!</p>
            <div id="projectComplete" class="success hidden">🎉 Project Complete! All materials have been contributed!</div>
        </div>
        <div class="card"><h3>Your Name (Optional)</h3><input type="text" id="contributorName" class="input" placeholder="Enter your name for contributions"></div>
        <div id="materialsContainer" class="material-grid">${materialsHTML}</div>
        <div id="errorMessage" class="error hidden"></div>
        <div style="text-align: center; margin-top: 20px;"><button class="btn btn-secondary" onclick="goHome()">Create New Project</button></div>
        <div class="status"><span id="connectionStatus">Connected</span></div>
    </div>
    <script>
        let currentProject = ${JSON.stringify(project)};
        let updateInterval = null;
        function copyUrl() { navigator.clipboard.writeText(window.location.href); }
        function goHome() { window.location.href = '/'; }
        function showError(message) { const errorDiv = document.getElementById('errorMessage'); errorDiv.textContent = message; errorDiv.classList.remove('hidden'); setTimeout(() => { errorDiv.classList.add('hidden'); }, 5000); }
        async function contributeMaterial(material) { const input = event.target.parentElement.querySelector('input'); const amount = parseInt(input.value); if (!amount || amount <= 0) { showError('Please enter a valid amount'); return; } const remaining = currentProject.requiredMaterials[material] - currentProject.contributedMaterials[material]; if (amount > remaining) { showError(\`Cannot contribute more than \${remaining.toLocaleString()}\`); return; } try { const contributorName = document.getElementById('contributorName').value || 'Anonymous'; const response = await fetch('/.netlify/functions/contribute-material', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectName: currentProject.id, material: material, amount: amount, contributorName: contributorName }) }); if (response.ok) { currentProject.contributedMaterials[material] += amount; renderMaterials(); checkProjectComplete(); input.value = ''; } else { const error = await response.json(); showError(error.error || 'Failed to contribute material'); } } catch (error) { showError('Failed to contribute material'); } }
        function handleMaterialInput(event, material) { if (event.key === 'Enter') { contributeMaterial(material); } }
        function renderMaterials() { const container = document.getElementById('materialsContainer'); container.innerHTML = ''; Object.entries(currentProject.requiredMaterials).forEach(([material, required]) => { const contributed = currentProject.contributedMaterials[material]; const progress = Math.min((contributed / required) * 100, 100); const remaining = Math.max(0, required - contributed); const materialDiv = document.createElement('div'); materialDiv.className = 'material-item'; materialDiv.innerHTML = \`<div class="material-name">\${material}</div><div class="material-progress"><div class="material-progress-bar" style="width: \${progress}%"></div></div><div class="material-stats"><span>\${contributed.toLocaleString()} / \${required.toLocaleString()}</span><span>\${Math.round(progress)}%</span></div>\${remaining > 0 ? \`<div class="contribution-form"><input type="number" class="input contribution-input" placeholder="Amount" min="1" max="\${remaining}" onkeypress="handleMaterialInput(event, '\${material}')"><button class="btn btn-success" onclick="contributeMaterial('\${material}')">Contribute</button></div>\` : \`<div style="color: #2ed573; font-weight: bold; text-align: center;">✓ Complete</div>\`}\`; container.appendChild(materialDiv); }); }
        function checkProjectComplete() { const isComplete = Object.keys(currentProject.requiredMaterials).every(material => currentProject.contributedMaterials[material] >= currentProject.requiredMaterials[material]); const completeDiv = document.getElementById('projectComplete'); if (isComplete) { completeDiv.classList.remove('hidden'); } else { completeDiv.classList.add('hidden'); } }
        function startPolling() { if (updateInterval) { clearInterval(updateInterval); } updateInterval = setInterval(async () => { try { const response = await fetch(\`/.netlify/functions/get-project?name=\${currentProject.id}\`); if (response.ok) { const updatedProject = await response.json(); currentProject = updatedProject; renderMaterials(); checkProjectComplete(); document.getElementById('connectionStatus').textContent = 'Connected'; } else { document.getElementById('connectionStatus').textContent = 'Connection lost'; } } catch (error) { document.getElementById('connectionStatus').textContent = 'Connection lost'; } }, 5000); }
        renderMaterials(); checkProjectComplete(); startPolling();
    </script>
</body>
</html>`;
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

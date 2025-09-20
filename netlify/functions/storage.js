const fs = require('fs');
const path = require('path');

// Database folder path
const DB_FOLDER = path.join('/tmp', 'database');

// Ensure database folder exists
function ensureDbFolder() {
  if (!fs.existsSync(DB_FOLDER)) {
    fs.mkdirSync(DB_FOLDER, { recursive: true });
  }
}

// Function to get project file path
function getProjectFilePath(projectId) {
  return path.join(DB_FOLDER, `${projectId}.xml`);
}

// Function to convert project to XML
function projectToXml(project) {
  const materials = Object.entries(project.requiredMaterials).map(([material, required]) => {
    const contributed = project.contributedMaterials[material] || 0;
    return `    <material name="${material}" required="${required}" contributed="${contributed}" />`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<project>
  <id>${project.id}</id>
  <stationType>${project.stationType}</stationType>
  <stationName>${project.stationName}</stationName>
  <createdAt>${project.createdAt}</createdAt>
  <lastUpdated>${new Date().toISOString()}</lastUpdated>
  <materials>
${materials}
  </materials>
</project>`;
}

// Function to parse XML to project
function xmlToProject(xmlContent) {
  const project = {
    contributedMaterials: {}
  };

  // Simple XML parsing (basic regex approach)
  project.id = xmlContent.match(/<id>(.*?)<\/id>/)?.[1];
  project.stationType = xmlContent.match(/<stationType>(.*?)<\/stationType>/)?.[1];
  project.stationName = xmlContent.match(/<stationName>(.*?)<\/stationName>/)?.[1];
  project.createdAt = xmlContent.match(/<createdAt>(.*?)<\/createdAt>/)?.[1];

  // Parse materials
  const materialMatches = xmlContent.matchAll(/<material name="([^"]*)" required="([^"]*)" contributed="([^"]*)" \/>/g);
  project.requiredMaterials = {};
  
  for (const match of materialMatches) {
    const [, name, required, contributed] = match;
    project.requiredMaterials[name] = parseInt(required);
    project.contributedMaterials[name] = parseInt(contributed);
  }

  return project;
}

// Function to get a specific project
function getProject(projectId) {
  try {
    ensureDbFolder();
    const filePath = getProjectFilePath(projectId);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const xmlContent = fs.readFileSync(filePath, 'utf8');
    return xmlToProject(xmlContent);
  } catch (error) {
    console.error('Error reading project:', error);
    return null;
  }
}

// Function to save a project
function saveProject(project) {
  try {
    ensureDbFolder();
    const filePath = getProjectFilePath(project.id);
    const xmlContent = projectToXml(project);
    
    fs.writeFileSync(filePath, xmlContent, 'utf8');
    return project;
  } catch (error) {
    console.error('Error saving project:', error);
    return null;
  }
}

// Function to update a project
function updateProject(projectId, updates) {
  try {
    const project = getProject(projectId);
    if (!project) {
      return null;
    }

    // Merge updates
    Object.assign(project, updates);
    
    // Save updated project
    return saveProject(project);
  } catch (error) {
    console.error('Error updating project:', error);
    return null;
  }
}

// Function to clean up old projects (30 days)
function cleanupOldProjects() {
  try {
    ensureDbFolder();
    const files = fs.readdirSync(DB_FOLDER);
    const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));

    files.forEach(file => {
      if (file.endsWith('.xml')) {
        const filePath = path.join(DB_FOLDER, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < thirtyDaysAgo) {
          fs.unlinkSync(filePath);
          console.log(`Deleted old project file: ${file}`);
        }
      }
    });
  } catch (error) {
    console.error('Error cleaning up old projects:', error);
  }
}

// Function to get all projects
function getAllProjects() {
  try {
    ensureDbFolder();
    const files = fs.readdirSync(DB_FOLDER);
    const projects = [];

    files.forEach(file => {
      if (file.endsWith('.xml')) {
        const projectId = file.replace('.xml', '');
        const project = getProject(projectId);
        if (project) {
          projects.push(project);
        }
      }
    });

    return projects;
  } catch (error) {
    console.error('Error getting all projects:', error);
    return [];
  }
}

module.exports = {
  getProject,
  saveProject,
  updateProject,
  getAllProjects,
  cleanupOldProjects
};

// Shared storage module for all functions
// This uses a simple approach that works across function calls

// Global storage - this will persist within the same function instance
let globalProjects = new Map();

// Function to get all projects
function getAllProjects() {
  return globalProjects;
}

// Function to get a specific project
function getProject(projectId) {
  return globalProjects.get(projectId);
}

// Function to save a project
function saveProject(project) {
  globalProjects.set(project.id, project);
  return project;
}

// Function to update a project
function updateProject(projectId, updates) {
  const project = globalProjects.get(projectId);
  if (project) {
    Object.assign(project, updates);
    globalProjects.set(projectId, project);
    return project;
  }
  return null;
}

module.exports = {
  getAllProjects,
  getProject,
  saveProject,
  updateProject
};

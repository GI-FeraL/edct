// Simple in-memory storage that persists during function execution
// This is the most reliable approach for Netlify Functions
let projectsStore = new Map();

// Function to get a specific project
function getProject(projectId) {
  return projectsStore.get(projectId) || null;
}

// Function to save a project
function saveProject(project) {
  projectsStore.set(project.id, { ...project });
  return { ...project };
}

// Function to update a project
function updateProject(projectId, updates) {
  const existingProject = projectsStore.get(projectId);
  if (!existingProject) {
    return null;
  }
  
  const updatedProject = { ...existingProject, ...updates };
  projectsStore.set(projectId, updatedProject);
  return updatedProject;
}

// Function to get all projects
function getAllProjects() {
  return Array.from(projectsStore.values());
}

// Function to clean up old projects (30 days) - simplified for in-memory
function cleanupOldProjects() {
  const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
  
  for (const [projectId, project] of projectsStore.entries()) {
    if (new Date(project.createdAt) < thirtyDaysAgo) {
      projectsStore.delete(projectId);
      console.log(`Deleted old project: ${projectId}`);
    }
  }
}

module.exports = {
  getProject,
  saveProject,
  updateProject,
  getAllProjects,
  cleanupOldProjects
};

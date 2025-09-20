import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './index.css';

const App = () => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [currentView, setCurrentView] = useState('welcome'); // 'welcome', 'project'
  const [stationTypes, setStationTypes] = useState({});
  const [selectedStationType, setSelectedStationType] = useState('');
  const [projectId, setProjectId] = useState('');
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [contributorName, setContributorName] = useState('');

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:3001');
    
    newSocket.on('connect', () => {
      setConnected(true);
      setError('');
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    newSocket.on('project-data', (projectData) => {
      setProject(projectData);
      setLoading(false);
    });

    newSocket.on('project-updated', (updatedProject) => {
      setProject(updatedProject);
    });

    newSocket.on('error', (errorData) => {
      setError(errorData.message);
      setLoading(false);
    });

    setSocket(newSocket);

    // Load station types
    fetchStationTypes();

    return () => newSocket.close();
  }, []);

  const fetchStationTypes = async () => {
    try {
      const response = await fetch('/api/station-types');
      const types = await response.json();
      setStationTypes(types);
    } catch (err) {
      setError('Failed to load station types');
    }
  };

  const createNewProject = async () => {
    if (!selectedStationType) {
      setError('Please select a station type');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stationType: selectedStationType }),
      });

      const projectData = await response.json();
      
      if (response.ok) {
        setProject(projectData);
        setProjectId(projectData.id);
        setCurrentView('project');
        socket.emit('join-project', projectData.id);
      } else {
        setError(projectData.error);
      }
    } catch (err) {
      setError('Failed to create project');
    }
    setLoading(false);
  };

  const joinExistingProject = async () => {
    if (!projectId.trim()) {
      setError('Please enter a project ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/projects/${projectId.trim()}`);
      const projectData = await response.json();
      
      if (response.ok) {
        setProject(projectData);
        setCurrentView('project');
        socket.emit('join-project', projectData.id);
      } else {
        setError('Project not found');
      }
    } catch (err) {
      setError('Failed to join project');
    }
    setLoading(false);
  };

  const contributeMaterial = (material, amount) => {
    if (!socket || !project || amount <= 0) return;

    socket.emit('contribute-materials', {
      projectId: project.id,
      material: material,
      amount: parseInt(amount),
      contributorName: contributorName || 'Anonymous'
    });
  };

  const copyProjectId = () => {
    navigator.clipboard.writeText(projectId);
  };

  const getProgressPercentage = (contributed, required) => {
    return Math.min((contributed / required) * 100, 100);
  };

  const isProjectComplete = () => {
    if (!project) return false;
    
    return Object.keys(project.requiredMaterials).every(material => 
      project.contributedMaterials[material] >= project.requiredMaterials[material]
    );
  };

  if (currentView === 'welcome') {
    return (
      <div className="container">
        <div className="welcome-screen">
          <h1>ED Colonization Tracker</h1>
          <p>
            Coordinate station construction materials with your squadron. 
            Create a new project or join an existing one to track progress in real-time.
          </p>
          
          <div className="card">
            <h2>Create New Project</h2>
            <select 
              className="select"
              value={selectedStationType}
              onChange={(e) => setSelectedStationType(e.target.value)}
            >
              <option value="">Select Station Type</option>
              {Object.entries(stationTypes).map(([key, type]) => (
                <option key={key} value={key}>{type.name}</option>
              ))}
            </select>
            
            <button 
              className="btn" 
              onClick={createNewProject}
              disabled={loading || !selectedStationType}
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>

          <div className="card">
            <h2>Join Existing Project</h2>
            <input
              type="text"
              className="input"
              placeholder="Enter Project ID"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            />
            
            <button 
              className="btn btn-secondary" 
              onClick={joinExistingProject}
              disabled={loading || !projectId.trim()}
            >
              {loading ? 'Joining...' : 'Join Project'}
            </button>
          </div>

          {error && <div className="error">{error}</div>}
          
          <div style={{ marginTop: '20px', fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
            <span className={`status-indicator ${connected ? 'status-connected' : 'status-disconnected'}`}></span>
            {connected ? 'Connected to server' : 'Disconnected from server'}
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'project' && project) {
    return (
      <div className="container">
        <div className="project-header">
          <h1>{project.stationName}</h1>
          <div className="project-id">
            Project ID: {project.id}
            <button 
              className="btn btn-secondary" 
              onClick={copyProjectId}
              style={{ marginLeft: '10px', padding: '5px 10px', fontSize: '12px' }}
            >
              Copy
            </button>
          </div>
          <p>Share this ID with your squadron members to collaborate!</p>
          
          {isProjectComplete() && (
            <div className="success">
              🎉 Project Complete! All materials have been contributed!
            </div>
          )}
        </div>

        <div className="card">
          <h3>Your Name (Optional)</h3>
          <input
            type="text"
            className="input"
            placeholder="Enter your name for contributions"
            value={contributorName}
            onChange={(e) => setContributorName(e.target.value)}
          />
        </div>

        <div className="material-grid">
          {Object.entries(project.requiredMaterials).map(([material, required]) => {
            const contributed = project.contributedMaterials[material];
            const progress = getProgressPercentage(contributed, required);
            const remaining = Math.max(0, required - contributed);
            
            return (
              <div key={material} className="material-item">
                <div className="material-name">{material}</div>
                
                <div className="material-progress">
                  <div 
                    className="material-progress-bar" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                
                <div className="material-stats">
                  <span>{contributed.toLocaleString()} / {required.toLocaleString()}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                
                {remaining > 0 && (
                  <div className="contribution-form">
                    <input
                      type="number"
                      className="input contribution-input"
                      placeholder="Amount"
                      min="1"
                      max={remaining}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const amount = parseInt(e.target.value);
                          if (amount > 0 && amount <= remaining) {
                            contributeMaterial(material, amount);
                            e.target.value = '';
                          }
                        }
                      }}
                    />
                    <button 
                      className="btn btn-success"
                      onClick={(e) => {
                        const input = e.target.parentElement.querySelector('input');
                        const amount = parseInt(input.value);
                        if (amount > 0 && amount <= remaining) {
                          contributeMaterial(material, amount);
                          input.value = '';
                        }
                      }}
                    >
                      Contribute
                    </button>
                  </div>
                )}
                
                {remaining === 0 && (
                  <div style={{ color: '#2ed573', fontWeight: 'bold', textAlign: 'center' }}>
                    ✓ Complete
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {error && <div className="error">{error}</div>}
        
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => {
              setCurrentView('welcome');
              setProject(null);
              setProjectId('');
              setContributorName('');
              setError('');
            }}
          >
            Start New Project
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="loading">
      Loading...
    </div>
  );
};

export default App;

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// In-memory storage for projects (in production, use a database)
const projects = new Map();

// Elite Dangerous station types and their material requirements
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

// API Routes
app.get('/api/station-types', (req, res) => {
  res.json(stationTypes);
});

app.post('/api/projects', (req, res) => {
  const { stationType } = req.body;
  
  if (!stationTypes[stationType]) {
    return res.status(400).json({ error: 'Invalid station type' });
  }

  const projectId = uuidv4();
  const stationData = stationTypes[stationType];
  
  const project = {
    id: projectId,
    stationType: stationType,
    stationName: stationData.name,
    requiredMaterials: { ...stationData.materials },
    contributedMaterials: {},
    totalContributors: 0,
    createdAt: new Date().toISOString()
  };

  // Initialize contributed materials
  Object.keys(stationData.materials).forEach(material => {
    project.contributedMaterials[material] = 0;
  });

  projects.set(projectId, project);
  
  res.json(project);
});

app.get('/api/projects/:id', (req, res) => {
  const projectId = req.params.id;
  const project = projects.get(projectId);
  
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  
  res.json(project);
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-project', (projectId) => {
    const project = projects.get(projectId);
    if (project) {
      socket.join(projectId);
      socket.emit('project-data', project);
      console.log(`User ${socket.id} joined project ${projectId}`);
    } else {
      socket.emit('error', { message: 'Project not found' });
    }
  });

  socket.on('contribute-materials', (data) => {
    const { projectId, material, amount, contributorName } = data;
    const project = projects.get(projectId);
    
    if (!project) {
      socket.emit('error', { message: 'Project not found' });
      return;
    }

    if (!project.contributedMaterials.hasOwnProperty(material)) {
      socket.emit('error', { message: 'Invalid material' });
      return;
    }

    // Add contribution
    project.contributedMaterials[material] += amount;
    
    // Emit update to all users in the project
    io.to(projectId).emit('project-updated', project);
    
    console.log(`Material contribution: ${contributorName || 'Anonymous'} contributed ${amount} ${material} to project ${projectId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

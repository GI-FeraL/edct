# Elite Dangerous Colonization Tracker

A real-time web application for coordinating station construction materials in Elite Dangerous. Squadron members can create or join projects, track material contributions, and see progress updates in real-time without page refreshes.

## Features

- **Real-time Updates**: Uses Socket.io for instant updates across all connected users
- **Project Management**: Generate unique project IDs or join existing ones
- **Station Types**: Support for various Elite Dangerous station types:
  - Coriolis Starport
  - Orbis Starport
  - Ocellus Starport
  - Asteroid Base
  - Planetary Outpost
  - Ground Settlement
- **Material Tracking**: Track required vs contributed materials with progress bars
- **No Registration**: Simple project ID system - no user accounts needed
- **Mobile Responsive**: Works on desktop and mobile devices

## Quick Start

### Prerequisites
- Node.js 18+ installed
- Git

### Local Development

1. **Clone and setup:**
   ```bash
   cd "C:\Users\FeraL\ED Colonization Tracker"
   ```

2. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies:**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Start the backend server:**
   ```bash
   cd ../backend
   npm run dev
   ```
   The backend will run on http://localhost:3001

5. **Start the frontend (in a new terminal):**
   ```bash
   cd frontend
   npm start
   ```
   The frontend will run on http://localhost:3000

### Deployment to Netlify

#### Option 1: Deploy Backend to Netlify Functions (Recommended for free tier)

1. **Deploy backend as Netlify functions:**
   - The backend code needs to be adapted for serverless functions
   - Socket.io won't work with serverless, so you'll need to use polling or Server-Sent Events

#### Option 2: Use External Backend Hosting

1. **Deploy backend to Railway, Render, or Heroku:**
   - These services support persistent connections needed for Socket.io

2. **Update frontend environment:**
   - Create `.env` file in frontend directory:
   ```
   REACT_APP_SERVER_URL=https://your-backend-url.com
   ```

3. **Deploy frontend to Netlify:**
   - Connect your GitHub repository to Netlify
   - Set build command: `cd frontend && npm run build`
   - Set publish directory: `frontend/build`

## Usage

1. **Create a Project:**
   - Select a station type from the dropdown
   - Click "Create Project" to generate a unique project ID
   - Share the project ID with your squadron members

2. **Join a Project:**
   - Enter an existing project ID
   - Click "Join Project" to connect to that project

3. **Contribute Materials:**
   - Enter your name (optional) for contribution tracking
   - For each material, enter the amount you're contributing
   - Click "Contribute" or press Enter to submit
   - See real-time updates as others contribute

## Technical Details

- **Backend**: Node.js with Express and Socket.io
- **Frontend**: React with Socket.io client
- **Real-time**: WebSocket connections for instant updates
- **Storage**: In-memory (projects reset on server restart)
- **Responsive**: Mobile-first design with CSS Grid

## Material Requirements

The application includes accurate material requirements for all Elite Dangerous station types based on the game's colonization mechanics.

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is open source and available under the MIT License.

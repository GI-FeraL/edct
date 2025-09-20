# ED Colonization Tracker

A simple web application for coordinating station construction materials in Elite Dangerous. Squadron members can create or join projects, track material contributions, and see progress updates.

## Features

- **Real-time Updates**: Polls every 5 seconds for updates
- **Project Management**: Generate unique project IDs or join existing ones
- **Station Types**: Support for all Elite Dangerous station types
- **Material Tracking**: Track required vs contributed materials with progress bars
- **No Registration**: Simple project ID system - no user accounts needed
- **Mobile Responsive**: Works on desktop and mobile devices

## Station Types Included

- Coriolis Starport
- Orbis Starport  
- Ocellus Starport
- Asteroid Base
- Planetary Outpost
- Ground Settlement

## Deployment to Netlify

### Method 1: Drag & Drop (Easiest)

1. **Zip the entire project folder**
2. **Go to netlify.com**
3. **Drag and drop the zip file**
4. **Done!** Your site will be live immediately

### Method 2: GitHub Integration

1. **Push this code to a GitHub repository**
2. **Go to netlify.com**
3. **Connect your GitHub account**
4. **Select your repository**
5. **Deploy!**

## How to Use

1. **Create a Project:**
   - Select a station type
   - Click "Create Project"
   - Share the project ID with your squadron

2. **Join a Project:**
   - Enter an existing project ID
   - Click "Join Project"

3. **Contribute Materials:**
   - Enter your name (optional)
   - For each material, enter the amount you're contributing
   - Click "Contribute"

## Technical Details

- **Frontend**: Single HTML file with embedded CSS and JavaScript
- **Backend**: Netlify Functions (serverless)
- **Updates**: Polling every 5 seconds
- **Storage**: In-memory (projects reset when serverless functions restart)

## File Structure

```
├── index.html              # Main application (HTML + CSS + JS)
├── netlify/
│   └── functions/
│       ├── save-project.js      # Create new projects
│       ├── get-project.js       # Get project data
│       └── contribute-material.js # Add material contributions
├── netlify.toml            # Netlify configuration
├── package.json            # Dependencies
└── README.md               # This file
```

## Notes

- Projects are stored in memory and will reset when Netlify Functions restart
- For persistent storage, you'd need to integrate with a database like FaunaDB or Airtable
- The app works perfectly for temporary coordination during active colonization efforts

## License

MIT License - Feel free to use and modify as needed.

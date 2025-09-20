const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
  try {
    // Extract project name from path
    const projectName = event.path.split('/')[1];
    
    if (!projectName) {
      return {
        statusCode: 404,
        body: 'Project not found'
      };
    }

    // Get project file path
    const filePath = path.join('/tmp', `${projectName}.html`);
    
    // Check if project file exists
    if (!fs.existsSync(filePath)) {
      return {
        statusCode: 404,
        body: `
          <html>
            <head><title>Project Not Found</title></head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #1a1a2e; color: white;">
              <h1>Project Not Found</h1>
              <p>The project "${projectName}" does not exist.</p>
              <a href="/" style="color: #ff6b6b;">← Back to Home</a>
            </body>
          </html>
        `,
        headers: {
          'Content-Type': 'text/html'
        }
      };
    }

    // Read and return the project HTML file
    const htmlContent = fs.readFileSync(filePath, 'utf8');
    
    return {
      statusCode: 200,
      body: htmlContent,
      headers: {
        'Content-Type': 'text/html'
      }
    };
  } catch (error) {
    console.error('Error serving project:', error);
    return {
      statusCode: 500,
      body: 'Internal server error',
      headers: {
        'Content-Type': 'text/plain'
      }
    };
  }
};

#!/usr/bin/env node

const http = require('http');
const { spawn } = require('child_process');

class AppVerifier {
  constructor() {
    this.serverUrl = 'http://localhost:3000';
    this.maxWaitTime = 30000; // 30 seconds
  }

  async verifyApp() {
    console.log('🔍 Verifying Focus app basic functionality...\n');

    // Check if server is running
    const serverRunning = await this.checkServer();
    
    if (!serverRunning) {
      console.log('❌ Development server is not running on port 3000');
      console.log('💡 Start the server with: npm start');
      return false;
    }

    console.log('✅ Server is running and responding');
    
    // Try to fetch the main page
    const pageLoads = await this.checkPageLoad();
    
    if (!pageLoads) {
      console.log('❌ Main page failed to load properly');
      return false;
    }

    console.log('✅ Main page loads successfully');
    console.log('\n🎉 Basic app verification completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('  • Run "npm run test:quick" to test with existing server');
    console.log('  • Run "npm run test:comprehensive" for full test suite');
    console.log('  • Run "npm run cypress:open" for interactive testing');
    
    return true;
  }

  async checkServer() {
    return new Promise((resolve) => {
      const req = http.get(this.serverUrl, (res) => {
        resolve(res.statusCode === 200);
      });
      
      req.on('error', () => {
        resolve(false);
      });
      
      req.setTimeout(5000, () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  async checkPageLoad() {
    return new Promise((resolve) => {
      const req = http.get(this.serverUrl, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          // Check if the response contains expected content
          const hasReactApp = data.includes('root') || data.includes('React');
          const hasTitle = data.includes('Focus') || data.includes('<title>');
          resolve(hasReactApp || hasTitle);
        });
      });
      
      req.on('error', () => {
        resolve(false);
      });
      
      req.setTimeout(10000, () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  async startServerAndVerify() {
    console.log('🚀 Starting development server and verifying app...\n');
    
    return new Promise((resolve, reject) => {
      console.log('Starting React development server...');
      
      const serverProcess = spawn('npm', ['start'], {
        cwd: process.cwd(),
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true
      });

      let serverReady = false;
      let output = '';

      serverProcess.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        
        if ((text.includes('webpack compiled') || 
             text.includes('Local:') || 
             text.includes('compiled successfully')) && !serverReady) {
          serverReady = true;
          
          // Wait a bit more for server to be fully ready
          setTimeout(async () => {
            const verified = await this.verifyApp();
            serverProcess.kill();
            resolve(verified);
          }, 3000);
        }
      });

      serverProcess.stderr.on('data', (data) => {
        console.warn('Server warning:', data.toString());
      });

      serverProcess.on('error', (error) => {
        console.error('❌ Failed to start server:', error.message);
        reject(error);
      });

      // Timeout
      setTimeout(() => {
        if (!serverReady) {
          console.error('❌ Server startup timeout');
          serverProcess.kill();
          reject(new Error('Server startup timeout'));
        }
      }, this.maxWaitTime);
    });
  }
}

async function main() {
  const args = process.argv.slice(2);
  const verifier = new AppVerifier();

  try {
    if (args.includes('--start-server') || args.includes('-s')) {
      await verifier.startServerAndVerify();
    } else {
      await verifier.verifyApp();
    }
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = AppVerifier;
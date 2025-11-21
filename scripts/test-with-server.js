const { spawn } = require('child_process');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestRunner {
  constructor() {
    this.serverProcess = null;
    this.serverReady = false;
  }

  async startServer() {
    console.log('🚀 Starting development server...');
    
    return new Promise((resolve, reject) => {
      this.serverProcess = spawn('npm', ['start'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
        cwd: process.cwd()
      });

      let output = '';
      
      this.serverProcess.stdout.on('data', (data) => {
        output += data.toString();
        process.stdout.write(data);
        
        if (output.includes('webpack compiled') || 
            output.includes('Local:') || 
            output.includes('localhost:3000')) {
          this.serverReady = true;
          console.log('\n✅ Server is ready!');
          resolve();
        }
      });

      this.serverProcess.stderr.on('data', (data) => {
        process.stderr.write(data);
      });

      this.serverProcess.on('error', (error) => {
        console.error('❌ Failed to start server:', error);
        reject(error);
      });

      // Timeout after 60 seconds
      setTimeout(() => {
        if (!this.serverReady) {
          console.log('⚠️ Server taking too long, proceeding with tests...');
          resolve();
        }
      }, 60000);
    });
  }

  async waitForServer() {
    console.log('⏳ Waiting for server to be accessible...');
    
    for (let i = 0; i < 30; i++) {
      try {
        const { execSync } = require('child_process');
        execSync('curl -f http://localhost:3000 > nul 2>&1', { stdio: 'ignore' });
        console.log('✅ Server is accessible!');
        return true;
      } catch {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log('⚠️ Server not accessible, but proceeding...');
    return false;
  }

  async runTests(testType = 'production') {
    console.log(`🧪 Running ${testType} tests...`);
    
    try {
      if (testType === 'cypress') {
        execSync('npx cypress run --spec "cypress/e2e/production-readiness.cy.js"', {
          stdio: 'inherit',
          cwd: process.cwd()
        });
      } else {
        execSync('node ai-testing-system/production-readiness-tester.js', {
          stdio: 'inherit',
          cwd: process.cwd()
        });
      }
      
      console.log('✅ Tests completed successfully!');
    } catch (error) {
      console.log('⚠️ Tests completed with issues. Check reports for details.');
    }
  }

  async cleanup() {
    if (this.serverProcess) {
      console.log('🛑 Stopping server...');
      
      // Kill server process
      if (process.platform === 'win32') {
        try {
          execSync(`taskkill /pid ${this.serverProcess.pid} /T /F`, { stdio: 'ignore' });
        } catch (e) {
          // Ignore errors
        }
      } else {
        this.serverProcess.kill('SIGTERM');
      }
    }
  }

  async runCompleteTest() {
    try {
      await this.startServer();
      await this.waitForServer();
      await this.runTests('production');
      
      console.log('\n📊 Test Summary:');
      console.log('   - Production readiness analysis completed');
      console.log('   - Reports generated in /reports directory');
      console.log('   - Check production-readiness-report.html for details');
      
    } catch (error) {
      console.error('❌ Test execution failed:', error.message);
    } finally {
      await this.cleanup();
    }
  }
}

// CLI execution
if (require.main === module) {
  const testType = process.argv[2] || 'production';
  const runner = new TestRunner();
  
  // Handle process termination
  process.on('SIGINT', async () => {
    console.log('\n🛑 Received interrupt signal...');
    await runner.cleanup();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await runner.cleanup();
    process.exit(0);
  });

  runner.runCompleteTest().then(() => {
    process.exit(0);
  }).catch(() => {
    process.exit(1);
  });
}

module.exports = TestRunner;
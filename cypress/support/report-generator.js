// Report Generator for Full Scenario Validation
const fs = require('fs');
const path = require('path');

class ReportGenerator {
  constructor() {
    this.reportData = {
      timestamp: new Date().toISOString(),
      appName: 'Focus App',
      testType: 'Full Scenario Validation',
      features: [],
      summary: {
        totalFeatures: 0,
        implemented: 0,
        missing: 0,
        partial: 0,
        implementationRate: 0
      },
      recommendations: []
    };
  }

  addFeature(name, status, details = '', howToAdd = '') {
    this.reportData.features.push({
      name,
      status, // 'implemented', 'missing', 'partial'
      details,
      howToAdd,
      timestamp: new Date().toISOString()
    });
  }

  calculateSummary() {
    const features = this.reportData.features;
    this.reportData.summary.totalFeatures = features.length;
    this.reportData.summary.implemented = features.filter(f => f.status === 'implemented').length;
    this.reportData.summary.missing = features.filter(f => f.status === 'missing').length;
    this.reportData.summary.partial = features.filter(f => f.status === 'partial').length;
    
    const rate = (this.reportData.summary.implemented / this.reportData.summary.totalFeatures) * 100;
    this.reportData.summary.implementationRate = rate.toFixed(2);
  }

  addRecommendation(priority, feature, action) {
    this.reportData.recommendations.push({
      priority, // 'high', 'medium', 'low'
      feature,
      action,
      timestamp: new Date().toISOString()
    });
  }

  generateHTMLReport() {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Focus App - Full Scenario Test Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; border-radius: 12px 12px 0 0; }
    .header h1 { font-size: 32px; margin-bottom: 10px; }
    .header p { opacity: 0.9; font-size: 14px; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; padding: 30px; background: #f9fafb; }
    .summary-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .summary-card h3 { font-size: 14px; color: #6b7280; margin-bottom: 8px; text-transform: uppercase; }
    .summary-card .value { font-size: 32px; font-weight: bold; color: #111827; }
    .summary-card.implemented .value { color: #10b981; }
    .summary-card.missing .value { color: #ef4444; }
    .summary-card.partial .value { color: #f59e0b; }
    .content { padding: 30px; }
    .section { margin-bottom: 40px; }
    .section h2 { font-size: 24px; margin-bottom: 20px; color: #111827; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
    .feature-list { display: grid; gap: 15px; }
    .feature-item { background: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #e5e7eb; }
    .feature-item.implemented { border-left-color: #10b981; }
    .feature-item.missing { border-left-color: #ef4444; }
    .feature-item.partial { border-left-color: #f59e0b; }
    .feature-item h3 { font-size: 18px; margin-bottom: 8px; display: flex; align-items: center; gap: 10px; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .status-badge.implemented { background: #d1fae5; color: #065f46; }
    .status-badge.missing { background: #fee2e2; color: #991b1b; }
    .status-badge.partial { background: #fef3c7; color: #92400e; }
    .feature-details { color: #6b7280; font-size: 14px; margin-top: 8px; line-height: 1.6; }
    .how-to-add { background: #eff6ff; padding: 15px; border-radius: 6px; margin-top: 12px; font-size: 13px; color: #1e40af; }
    .how-to-add strong { display: block; margin-bottom: 8px; color: #1e3a8a; }
    .recommendations { background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; }
    .recommendation-item { margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #fde68a; }
    .recommendation-item:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
    .priority { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; margin-right: 8px; }
    .priority.high { background: #fee2e2; color: #991b1b; }
    .priority.medium { background: #fef3c7; color: #92400e; }
    .priority.low { background: #dbeafe; color: #1e40af; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; border-radius: 0 0 12px 12px; }
    .progress-bar { width: 100%; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; margin-top: 10px; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, #10b981 0%, #059669 100%); transition: width 0.3s ease; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 ${this.reportData.appName} - Test Report</h1>
      <p>Generated on ${new Date(this.reportData.timestamp).toLocaleString()}</p>
      <p>Test Type: ${this.reportData.testType}</p>
    </div>

    <div class="summary">
      <div class="summary-card">
        <h3>Total Features</h3>
        <div class="value">${this.reportData.summary.totalFeatures}</div>
      </div>
      <div class="summary-card implemented">
        <h3>Implemented</h3>
        <div class="value">${this.reportData.summary.implemented}</div>
      </div>
      <div class="summary-card missing">
        <h3>Missing</h3>
        <div class="value">${this.reportData.summary.missing}</div>
      </div>
      <div class="summary-card partial">
        <h3>Partial</h3>
        <div class="value">${this.reportData.summary.partial}</div>
      </div>
      <div class="summary-card">
        <h3>Implementation Rate</h3>
        <div class="value">${this.reportData.summary.implementationRate}%</div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${this.reportData.summary.implementationRate}%"></div>
        </div>
      </div>
    </div>

    <div class="content">
      <div class="section">
        <h2>📋 Feature Status</h2>
        <div class="feature-list">
          ${this.reportData.features.map(feature => `
            <div class="feature-item ${feature.status}">
              <h3>
                ${feature.name}
                <span class="status-badge ${feature.status}">${feature.status}</span>
              </h3>
              ${feature.details ? `<div class="feature-details">${feature.details}</div>` : ''}
              ${feature.howToAdd ? `
                <div class="how-to-add">
                  <strong>💡 How to Add:</strong>
                  ${feature.howToAdd}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>

      ${this.reportData.recommendations.length > 0 ? `
        <div class="section">
          <h2>🎯 Recommendations</h2>
          <div class="recommendations">
            ${this.reportData.recommendations.map(rec => `
              <div class="recommendation-item">
                <span class="priority ${rec.priority}">${rec.priority}</span>
                <strong>${rec.feature}</strong>
                <div style="margin-top: 8px; color: #78350f;">${rec.action}</div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>

    <div class="footer">
      <p>Generated by Focus App Automated Testing System</p>
      <p>For more information, check the JSON report in the same directory</p>
    </div>
  </div>
</body>
</html>
    `;
    return html;
  }

  saveReports(outputDir = 'cypress/reports') {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    this.calculateSummary();

    // Save JSON report
    const jsonPath = path.join(outputDir, 'full-scenario-report.json');
    fs.writeFileSync(jsonPath, JSON.stringify(this.reportData, null, 2));

    // Save HTML report
    const htmlPath = path.join(outputDir, 'full-scenario-report.html');
    fs.writeFileSync(htmlPath, this.generateHTMLReport());

    console.log(`✅ Reports saved:`);
    console.log(`   JSON: ${jsonPath}`);
    console.log(`   HTML: ${htmlPath}`);
  }
}

module.exports = ReportGenerator;

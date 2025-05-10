<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ClickHouse Data Ingestion Tool</title>
</head>
<body>
  <h1>Robust Full-Stack Data Transfer Tool</h1>
  <p>
    Bidirectional data transfer between ClickHouse databases and flat files (CSV/TSV/TXT).
    Designed for developers and data engineers needing flexible data pipeline management.
  </p>

  <h2>Architectural Overview</h2>
  <h3>Component Diagram</h3>
  <pre>[React Frontend] ←HTTP→ [Express API Gateway] ↔ [ClickHouse Client]  
                      ↳ [File Processing Engine] ↔ [Local Storage]</pre>

  <h2>Tech Stack</h2>
  <table border="1">
    <thead>
      <tr><th>Layer</th><th>Technologies</th><th>Key Dependencies</th></tr>
    </thead>
    <tbody>
      <tr><td>Frontend</td><td>React 18, TypeScript 5, Vite 4</td><td>@tanstack/react-query, Lucide</td></tr>
      <tr><td>Backend</td><td>Node.js 20, Express 5, ClickHouse JS</td><td>csv-parse, multer, axios</td></tr>
      <tr><td>DevOps</td><td>npm 9+, Proxy Configuration</td><td>http-proxy-middleware</td></tr>
    </tbody>
  </table>

  <h2>System Requirements</h2>
  <h3>Hardware Minimums</h3>
  <ul>
    <li>2 GHz Dual-Core Processor</li>
    <li>4 GB RAM</li>
    <li>500 MB Disk Space</li>
  </ul>

  <h3>Software Dependencies</h3>
  <table border="1">
    <thead><tr><th>Component</th><th>Version</th><th>Installation Command</th></tr></thead>
    <tbody>
      <tr><td>Node.js</td><td>&ge;18</td><td><code>nvm install --lts=hydrogen</code></td></tr>
      <tr><td>ClickHouse</td><td>&ge;23.3</td><td>Docker/Package Manager</td></tr>
    </tbody>
  </table>

  <h2>Installation Guide</h2>
  <ol>
    <li><strong>Repository Initialization</strong>
      <pre><code>git clone https://github.com/Ishugupta30/CLickhouse.git
cd data-ingestion-tool</code></pre>
    </li>
    <li><strong>Dependency Resolution</strong><br>
      Backend Setup:
      <pre><code>cd server && npm ci --omit=dev</code></pre>
      Frontend Setup:
      <pre><code>cd ../client && npm ci --omit=dev</code></pre>
    </li>
    <li><strong>Environment Configuration</strong><br>
      Create <code>.env</code> in <code>server</code> directory:
      <pre><code>CLICKHOUSE_TLS_VERIFY=0
FILE_UPLOAD_LIMIT=100MB
API_RATE_LIMIT=1000/10m</code></pre>
    </li>
  </ol>

  <h2>Configuration Deep Dive</h2>
  <h3>Proxy Setup (CORS)</h3>
  <p>In <code>client/package.json</code>:</p>
  <pre><code>{
  "proxy": {
    "/api": {
      "target": "http://localhost:3001",
      "ws": true,
      "pathRewrite": {"^/api" : ""}
    }
  }
}</code></pre>

  <h3>ClickHouse Connection Parameters</h3>
  <pre><code>// server/config/ch-config.js
export default {
  endpoint: process.env.CH_ENDPOINT || 'https://default.clickhouse.cloud',
  keyId: process.env.CH_KEY_ID,
  keySecret: process.env.CH_KEY_SECRET,
  tls: process.env.NODE_ENV === 'production' ? {} : { rejectUnauthorized: false }
}</code></pre>

  <h2>Operational Workflows</h2>
  <h3>ClickHouse → Flat File Export</h3>
  <ul>
    <li>Validate TLS handshake parameters</li>
    <li>Execute <code>SHOW TABLES</code></li>
    <li>Stream with <code>csv-stringify</code></li>
    <li>Use chunked encoding for large data</li>
  </ul>

  <h3>Flat File → ClickHouse Import</h3>
  <pre>sequenceDiagram
Frontend->>Backend: POST /api/upload (multipart)
Backend->>FileSystem: Store in ./uploads
Backend->>ClickHouse: CREATE TEMPORARY TABLE
Backend->>ClickHouse: BATCH INSERT</pre>

  <h2>Security Considerations</h2>
  <h3>Authentication Matrix</h3>
  <table border="1">
    <thead><tr><th>Method</th><th>Frontend</th><th>Backend</th></tr></thead>
    <tbody>
      <tr><td>ClickHouse</td><td>API Key Rotation</td><td>mTLS Certificate</td></tr>
      <tr><td>File Uploads</td><td>MIME Type Check</td><td>Virus Scanning</td></tr>
    </tbody>
  </table>

  <h3>Audit Trails</h3>
  <pre><code>// server/middleware/audit.js
app.use((req, res, next) => {
  logger.info(`${req.ip} - ${req.method} ${req.path}`);
  next();
});</code></pre>

  <h2>Troubleshooting Matrix</h2>
  <table border="1">
    <thead><tr><th>Error Code</th><th>Symptom</th><th>Resolution Steps</th></tr></thead>
    <tbody>
      <tr>
        <td>ERR_CONN</td>
        <td>Invalid server response</td>
        <td>1. Verify proxy config<br>2. Check TLS settings</td>
      </tr>
      <tr>
        <td>ENOENT</td>
        <td>Missing uploads directory</td>
        <td><code>mkdir -p server/uploads && chmod 755</code></td>
      </tr>
      <tr>
        <td>EPARSE</td>
        <td>Malformed CSV</td>
        <td>Validate delimiters with <code>hexdump -C</code></td>
      </tr>
    </tbody>
  </table>

  <h2>Development Roadmap</h2>
  <h3>Q3 2024 Milestones</h3>
  <ul>
    <li>Column type inference engine</li>
    <li>Parallel processing workers</li>
    <li>ClickHouse cluster support</li>
  </ul>

  <h3>Research Areas</h3>
  <ul>
    <li>GPU-accelerated file parsing</li>
    <li>SSO integration (OAuth2/OIDC)</li>
  </ul>

  <h2>Postman Test Suite</h2>
  <h3>ClickHouse Connection Test</h3>
  <p><strong>POST</strong> <code>/api/connect</code></p>
  <ul>
    <li><strong>URL</strong>: https://evqnque5m4.ap-south-1.aws.clickhouse.cloud:8443</li>
    <li><strong>Authorization</strong>: Basic Auth (default / pDa5AZ.3vFpIN)</li>
    <li><strong>Headers</strong>: Content-Type: text/plain</li>
    <li><strong>Body (raw Text)</strong>:
      <pre><code>SELECT * FROM nyc_taxi.trips_small LIMIT 10</code></pre>
    </li>
  </ul>

  <h2>Contributors</h2>
  <p><strong>Technical Lead:</strong> ISHU GUPTA</p>
  <p><strong>Security Contact:</strong> ishugupta302005@gmail.com</p>
  <p><strong>Support:</strong> f20220172@hyderabad.bits-pilani.ac.in</p>

  <h2>License</h2>
  <p>
    Permission is hereby granted... [full license text]<br>
    <strong>Attribution Requirements:</strong><br>
    Display license header in all source files. Maintain NOTICE file with third-party credits.
  </p>

  <h2>AI Prompt Documentation</h2>
  <pre><code>1. "Design React form validation for 20+ column selection"
2. "Optimize ClickHouse bulk insert for 1M+ rows"
3. "Implement resumable file uploads with React"</code></pre>
</body>
</html>

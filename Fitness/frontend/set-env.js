const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, 'src', 'environments', 'environment.ts');
const rawUrl = process.env.API_URL || 'https://fitness-app-82e9.onrender.com';
const cleanUrl = rawUrl.trim().replace(/\/+$/, '');
const apiUrl = cleanUrl.endsWith('/api/v1') ? cleanUrl : `${cleanUrl}/api/v1`;

const content = `export const environment = {
  production: true,
  apiUrl: '${apiUrl}',
};
`;

fs.writeFileSync(envPath, content, 'utf8');
console.log(`[set-env] Configured production apiUrl: ${apiUrl}`);

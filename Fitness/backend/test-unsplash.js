const https = require('https');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, text: data.slice(0, 100) });
        }
      });
    }).on('error', reject);
  });
}

async function test() {
  const res = await fetchJson('https://unsplash.com/napi/search/photos?query=gym&per_page=10');
  console.log('Status:', res.status);
  if (res.data && res.data.results) {
    console.log('Got results:', res.data.results.length);
    console.log('Sample IDs:', res.data.results.map(r => r.id));
  } else {
    console.log('Response:', res);
  }
}

test().catch(console.error);

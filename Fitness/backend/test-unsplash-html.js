const https = require('https');

https.get('https://unsplash.com/s/photos/chest-workout', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
  }
}, res => {
  console.log('Status:', res.statusCode);
  let html = '';
  res.on('data', chunk => html += chunk);
  res.on('end', () => {
    const matches = html.match(/images\.unsplash\.com\/photo-[a-zA-Z0-9-]+/g) || [];
    const unique = [...new Set(matches)];
    console.log('Found photo URLs:', unique.length);
    console.log(unique.slice(0, 5));
  });
}).on('error', console.error);

const https = require('https');

https.get('https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json', res => {
  console.log('Status:', res.statusCode);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const list = JSON.parse(data);
      console.log('Total exercises in free-exercise-db:', list.length);
      console.log('Sample item:', list[0]);
    } catch (e) {
      console.error(e.message);
    }
  });
}).on('error', console.error);

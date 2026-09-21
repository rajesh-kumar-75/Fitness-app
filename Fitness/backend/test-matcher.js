const https = require('https');
const { ALL_118_EXERCISES } = require('./data/exerciseDataset');

function getJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

function normalize(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function match() {
  const freeDb = await getJson('https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json');
  console.log('Loaded', freeDb.length, 'free-db exercises');

  const freeMap = new Map();
  freeDb.forEach(item => {
    const key = normalize(item.name);
    freeMap.set(key, item);
  });

  let exactMatches = 0;
  let partialMatches = 0;
  let unmatched = [];

  const matchedExercises = [];

  for (const ex of ALL_118_EXERCISES) {
    const normName = normalize(ex.name);
    if (freeMap.has(normName)) {
      exactMatches++;
      const item = freeMap.get(normName);
      matchedExercises.push({
        name: ex.name,
        matchType: 'exact',
        freeName: item.name,
        imageUrl: `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${item.images[0]}`
      });
      continue;
    }

    // Try partial/fuzzy match
    const found = freeDb.find(item => {
      const fn = normalize(item.name);
      return fn.includes(normName) || normName.includes(fn);
    });

    if (found) {
      partialMatches++;
      matchedExercises.push({
        name: ex.name,
        matchType: 'partial',
        freeName: found.name,
        imageUrl: `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${found.images[0]}`
      });
    } else {
      unmatched.push(ex);
    }
  }

  console.log(`Exact matches: ${exactMatches}`);
  console.log(`Partial matches: ${partialMatches}`);
  console.log(`Total matched: ${exactMatches + partialMatches} / ${ALL_118_EXERCISES.length}`);
  console.log(`Unmatched (${unmatched.length}):`, unmatched.map(u => u.name));
}

match().catch(console.error);

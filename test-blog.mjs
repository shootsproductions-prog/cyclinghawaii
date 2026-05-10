import { getStravaData } from './src/lib/strava.js';
import { generateBlogEntries } from './src/lib/blog.js';

console.log('Testing blog generation with latest ride...\n');

try {
  const stravaData = await getStravaData();
  console.log(`✓ Fetched Strava data`);
  console.log(`  Featured ride: ${stravaData.featured.name}`);
  console.log(`  Date: ${stravaData.featured.date}\n`);
  
  const entries = await generateBlogEntries(stravaData.featured, stravaData.rides);
  console.log(`✓ Generated ${entries.length} blog entries`);
  
  const latest = entries[0];
  console.log(`\nLatest entry: ${latest.title}`);
  console.log(`Date field: ${latest.date}`);
  console.log(`\nDescription preview (first 200 chars):`);
  console.log(`"${latest.body.substring(0, 200)}..."\n`);
  
  if (latest.body.match(/^[A-Za-z]+\s+\d{1,2}/)) {
    console.log('⚠️  WARNING: Date pattern still present at start');
  } else {
    console.log('✓ Date successfully stripped from beginning');
  }
  
} catch (error) {
  console.error('Error:', error.message);
}

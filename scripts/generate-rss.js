import fs from 'fs';
import path from 'path';
import RSS from 'rss';

const DATA_DIR = path.join(process.cwd(), 'public', 'data');
const INDEX_PATH = path.join(DATA_DIR, 'index.json');
const RSS_PATH = path.join(process.cwd(), 'public', 'rss.xml');

// Change this to the user's actual GitHub Pages URL
const SITE_URL = 'https://dailyreflections.co'; 

function generateRSS() {
  if (!fs.existsSync(INDEX_PATH)) {
    console.log("No index.json found, skipping RSS generation.");
    return;
  }

  const index = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8'));

  const feed = new RSS({
    title: 'Daily Reflections',
    description: 'A.A. Daily Reflections',
    feed_url: `${SITE_URL}/rss.xml`,
    site_url: SITE_URL,
    language: 'en',
    pubDate: new Date().toUTCString(),
  });

  // Add the last 30 days to RSS feed
  const recent = index.slice(0, 365);

  recent.forEach(entry => {
    const entryPath = path.join(DATA_DIR, `${entry.date}.json`);
    if (fs.existsSync(entryPath)) {
      const data = JSON.parse(fs.readFileSync(entryPath, 'utf-8'));
      
      let content = `
        <p><em>${data.quote}</em></p>
        <p>${data.body.replace(/\n\n/g, '</p><p>')}</p>
      `;

      if (data.audioTrackId) {
        const scUrl = `https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/${data.audioTrackId}${data.audioSecretToken ? `%3Fsecret_token%3D${data.audioSecretToken}` : ''}&auto_play=false&show_comments=false&show_user=false&show_reposts=false&show_teaser=false`;
        content += `
          <hr />
          <iframe width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay" src="${scUrl}"></iframe>
        `;
      }

      feed.item({
        title: data.title,
        description: content,
        url: `${SITE_URL}/#${entry.date}`, // we will use hash routing since it's GH pages
        guid: entry.date,
        date: new Date(`${entry.date}T06:00:00Z`)
      });
    }
  });

  fs.writeFileSync(RSS_PATH, feed.xml({ indent: true }));
  console.log(`Saved RSS feed to ${RSS_PATH}`);
}

generateRSS();

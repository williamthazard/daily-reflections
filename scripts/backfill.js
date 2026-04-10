import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';

const DATA_DIR = path.join(process.cwd(), 'public', 'data');

async function backfill(days = 30) {
  console.log(`Starting backfill for the last ${days} days...`);
  
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const indexPath = path.join(DATA_DIR, 'index.json');
  let index = [];
  if (fs.existsSync(indexPath)) {
    index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
  }

  const today = new Date();
  
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    
    const dateStr = d.toISOString().split('T')[0];
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    // Check if we already have this file to avoid repeated API calls
    const filePath = path.join(DATA_DIR, `${dateStr}.json`);
    
    // We overwrite existing files if they don't have audioData, to ensure backfill works
    let alreadyHasAudio = false;
    if (fs.existsSync(filePath)) {
        const existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        if (existing.audioTrackId) alreadyHasAudio = true;
    }

    if (alreadyHasAudio) {
      console.log(`[${dateStr}] Already has audio, skipping.`);
      continue;
    }

    try {
      console.log(`[${dateStr}] Fetching from AA API...`);
      const res = await fetch(`https://www.aa.org/api/reflections/${month}/${day}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      
      const apiData = await res.json();
      if (!apiData || !apiData.data) throw new Error('Invalid API data');

      // Parse fields using cheerio
      const $data = cheerio.load(apiData.data || '');
      const $media = cheerio.load(apiData.dataMedia || '');

      const title = $data('.field--name-title').text()?.trim() || '';
      
      // Extract quote and source from field-teaser
      const quote = $data('.field--name-field-teaser p:nth-child(1)').html()?.trim() || '';
      const source = $data('.field--name-field-teaser p:nth-child(2)').text()?.trim() || '';

      // Extract body text
      const bodyParas = $data('.field--name-body p').map((_, el) => $data(el).text().trim()).get();
      const bodyText = bodyParas
        .filter(text => text)
        .slice(2) // Usually the first 2 are the quote/source repeat
        .join('\n\n');

      // Extract SoundCloud
      const scSrc = $media('iframe[src*="soundcloud.com"]').attr('src') || '';
      let audioTrackId = null;
      let audioSecretToken = null;
      
      if (scSrc) {
        const decodedSrc = decodeURIComponent(scSrc);
        const trackMatch = decodedSrc.match(/tracks\/(\d+)/);
        const tokenMatch = decodedSrc.match(/secret_token=([^&]+)/);
        if (trackMatch) audioTrackId = trackMatch[1];
        if (tokenMatch) audioSecretToken = tokenMatch[1];
      }

      const reflectionData = {
        date: dateStr,
        title,
        quote: quote + (source ? `<br/><small>— ${source}</small>` : ''),
        body: bodyText,
        audioTrackId,
        audioSecretToken
      };

      fs.writeFileSync(filePath, JSON.stringify(reflectionData, null, 2));
      
      // Update index
      if (!index.find(e => e.date === dateStr)) {
        index.push({ date: dateStr, title });
      }

      // Small delay to be polite
      await new Promise(r => setTimeout(r, 500));

    } catch (err) {
      console.error(`[${dateStr}] Failed: ${err.message}`);
    }
  }

  // Final index sort and save
  index.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
  console.log('Backfill complete.');
}

// Get days from CLI arg if provided
const daysArg = process.argv[2] ? parseInt(process.argv[2]) : 30;
backfill(daysArg);

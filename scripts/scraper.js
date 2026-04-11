import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';

const DATA_DIR = path.join(process.cwd(), 'public', 'data');

async function scrapeDailyReflection() {
  console.log('Fetching reflection from AA API (Deterministic)...');
  
  // Get "today" in Eastern Time (AA.orgs home timezone)
  const nyDate = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
  const [year, month, day] = nyDate.split('-');
  const dateStr = nyDate;

  console.log(`Targeting Date: ${dateStr} (ET)`);

  try {
    const apiUrl = `https://www.aa.org/api/reflections/${month}/${day}`;
    console.log(`Connecting to: ${apiUrl}`);
    
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    
    const apiData = await res.json();
    if (!apiData || !apiData.data) throw new Error('Invalid API data received');

    // Parse fields using cheerio
    const $data = cheerio.load(apiData.data || '');
    const $media = cheerio.load(apiData.dataMedia || '');

    const title = $data('.field--name-title').text()?.trim() || 'Daily Reflection';
    
    // Extract quote and source from field-teaser
    const quote = $data('.field--name-field-teaser p:nth-child(1)').html()?.trim() || '';
    const source = $data('.field--name-field-teaser p:nth-child(2)').text()?.trim() || '';

    // Extract body text
    const bodyParas = $data('.field--name-body p').map((_, el) => $data(el).text().trim()).get();
    const bodyText = bodyParas
      .filter(text => text)
      .slice(2) // Usually the first 2 are the quote/source repeat
      .join('\n\n');

    // Extract SoundCloud metadata
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

    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    const filePath = path.join(DATA_DIR, `${dateStr}.json`);
    fs.writeFileSync(filePath, JSON.stringify(reflectionData, null, 2));
    console.log(`Successfully saved reflection to ${filePath}`);

    // Update index.json
    const indexPath = path.join(DATA_DIR, 'index.json');
    let index = [];
    if (fs.existsSync(indexPath)) {
      index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    }

    // Replace or add the entry
    const existingIndex = index.findIndex(e => e.date === dateStr);
    const entry = { date: dateStr, title };
    if (existingIndex > -1) {
      index[existingIndex] = entry;
    } else {
      index.unshift(entry);
    }

    // Sort descending by date
    index.sort((a, b) => b.date.localeCompare(a.date));
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
    console.log('Index updated.');

  } catch (error) {
    console.error('Scraping failed:', error.message);
    process.exit(1);
  }
}

scrapeDailyReflection();

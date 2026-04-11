import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

const DATA_DIR = path.join(process.cwd(), 'public', 'data');

async function scrapeDailyReflection() {
  console.log('Launching headless browser to scrape aa.org...');
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  
  try {
    const page = await browser.newPage();
    
    // Use a realistic user agent to avoid bot detection
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    
    console.log('Navigating to https://www.aa.org/daily-reflections...');
    await page.goto('https://www.aa.org/daily-reflections', { 
      waitUntil: 'networkidle2',
      timeout: 60000 
    });

    // Wait for the main reflection article to appear
    await page.waitForSelector('article.node--type-daily-reflection', { timeout: 10000 });

    const data = await page.evaluate(() => {
      const article = document.querySelector('article.node--type-daily-reflection');
      if (!article) return null;

      const title = article.querySelector('.field--name-title')?.textContent?.trim() || '';
      
      // Date is often the first div child of the article
      const dateText = article.querySelector('div:not([class])')?.textContent?.trim() || '';
      
      // The teaser usually contains the quote and source
      const teaser = article.querySelector('.field--name-field-teaser');
      const quote = teaser?.querySelector('p:nth-child(1)')?.innerHTML?.trim() || '';
      const source = teaser?.querySelector('p:nth-child(2)')?.textContent?.trim() || '';

      // The body contains the actual reflection text
      const bodyParas = Array.from(article.querySelectorAll('.field--name-body p'));
      const bodyText = bodyParas
        .slice(2) // Skip repeated quote/source
        .map(p => p.textContent?.trim())
        .filter(text => text && text.length > 0)
        .join('\n\n');

      // Extract SoundCloud Audio if present
      // Note: The audio player is often a sibling to the article, not a child
      const scIframe = document.querySelector('iframe[src*="soundcloud.com"]');
      let audioTrackId = null;
      let audioSecretToken = null;
      
      if (scIframe) {
        const src = decodeURIComponent(scIframe.src);
        const trackMatch = src.match(/tracks\/(\d+)/);
        const tokenMatch = src.match(/secret_token=([^&]+)/);
        if (trackMatch) audioTrackId = trackMatch[1];
        if (tokenMatch) audioSecretToken = tokenMatch[1];
      }

      return {
        title,
        dateText,
        quote,
        source,
        body: bodyText,
        audioTrackId,
        audioSecretToken
      };
    });

    if (!data || !data.title || data.title === 'Daily Reflections') {
        throw new Error('Failed to extract valid reflection data from aa.org');
    }

    // Get "today" in Eastern Time (AA.org's timezone)
    const nyDate = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
    const dateStr = nyDate; // en-CA format is YYYY-MM-DD

    const reflectionData = {
      date: dateStr,
      title: data.title,
      quote: data.quote + (data.source ? `<br/><small>— ${data.source}</small>` : ''),
      body: data.body,
      audioTrackId: data.audioTrackId,
      audioSecretToken: data.audioSecretToken
    };

    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    const filePath = path.join(DATA_DIR, `${dateStr}.json`);
    fs.writeFileSync(filePath, JSON.stringify(reflectionData, null, 2));

    console.log(`Successfully saved reflection from aa.org to ${filePath}`);
    updateIndex(reflectionData, dateStr);

  } catch (error) {
    console.error('Error scraping aa.org:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

function updateIndex(reflectionData, dateStr) {
  const indexPath = path.join(DATA_DIR, 'index.json');
  let index = [];
  if (fs.existsSync(indexPath)) {
    index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
  }
  
  if (!index.find(r => r.date === dateStr)) {
    index.push({
      date: dateStr,
      title: reflectionData.title
    });
    index.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
  }
}

scrapeDailyReflection();

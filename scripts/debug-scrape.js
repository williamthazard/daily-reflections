import * as cheerio from 'cheerio';

async function test() {
  const res = await fetch('https://www.aahappyhour.com/daily-readings/');
  const html = await res.text();
  const $ = cheerio.load(html);
  $('div > p > strong').each((i, el) => {
    console.log(`${i}: ${$(el).text().trim()}`);
  });
}
test();

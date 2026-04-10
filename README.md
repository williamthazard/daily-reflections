# Daily Reflections

A minimalist, automated reading experience for Alcoholics Anonymous Daily Reflections.

## Features

- **Official Source**: Automatically scrapes the latest reflection from the official [aa.org](https://www.aa.org/daily-reflections) website every morning.
- **Audio Integration**: Includes the official daily audio recordings via a minimalist, custom SoundCloud player.
- **Minimalist Aesthetic**: Clean, responsive typography designed for deep reading and reflection.
- **Historical Archives**: Built-in calendar utility and local JSON archive for browsing past reflections.
- **Fully Automated**: Powered by GitHub Actions—no manual updates or local servers required.
- **RSS Feed**: Built-in RSS generator for integration with your favorite feed reader.
- **Dark Mode**: Support for light, dark, and system-default themes with zero-flicker transitions.

## How it Works

The application uses a "Scheduled Scraper" architecture:
1. **GitHub Action**: Runs every morning at 2:00 AM EST (6:00 AM UTC).
2. **Scraper**: A Node.js + Puppeteer script launches a headless browser to pull the current reflection and audio metadata from the official source.
3. **Data Storage**: Content is saved as static JSON files within the repository to ensure high performance and zero-database dependency.
4. **Site Build**: The React SPA retrieves these JSON files based on the URL hash or calendar selection.
5. **Auto-Deploy**: The latest data and the built site are automatically deployed back to GitHub Pages.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Vanilla CSS, Tailwind CSS
- **Scraping**: Node.js, Puppeteer, Cheerio
- **Automation**: GitHub Actions
- **RSS**: Node RSS module

## Local Development

```bash
# Install dependencies
npm install

# Run the development server
npm run dev

# Manually trigger a daily scrape
npm run scrape

# Backfill historical data (e.g., last 30 days)
node scripts/backfill.js 30

# Re-generate the RSS feed
npm run rss

# Build the production application
npm run build
```

---
*Created with care for the AA community.*

# Daily Reflections

A minimalist, automated reading experience for Alcoholics Anonymous Daily Reflections.

## 🌟 Features

- **Official Source**: Automatically scrapes the latest reflection from the official [aa.org](https://www.aa.org/daily-reflections) website every morning.
- **Minimalist Aesthetic**: Clean, responsive typography designed for deep reading and reflection.
- **Historical Archives**: Built-in calendar utility to browse past reflections.
- **Fully Automated**: Powered by GitHub Actions—no manual updates or local servers required.
- **RSS Feed**: Built-in RSS generator for integration with your favorite feed reader.
- **Dark Mode**: Support for light, dark, and system-default themes.

## 🚀 How it Works

The application uses a "Scheduled Scraper" architecture:
1. **GitHub Action**: Runs every morning at 2:00 AM EST.
2. **Scraper**: A Node.js + Puppeteer script launches a headless browser to pull the current reflection from the official source.
3. **Data Storage**: The reflection is saved as a JSON file in the repository.
4. **Site Build**: The React application pulls from these JSON files at runtime.
5. **Auto-Deploy**: The latest data and the built site are automatically deployed back to GitHub Pages.

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Scraping**: Node.js, Puppeteer, Cheerio
- **Automation**: GitHub Actions
- **RSS**: Node RSS module

## 📖 Local Development

```bash
# Install dependencies
npm install

# Run the development server
npm run dev

# Manually trigger a scrape
npm run scrape

# Build the production application
npm run build
```

---
*Created with care for the AA community.*

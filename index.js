const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.get('/run-florida-scraper', async (req, res) => {
  const downloadPath = path.resolve(__dirname, 'downloads');
  if (!fs.existsSync(downloadPath)) fs.mkdirSync(downloadPath);

  const browser = await puppeteer.launch({
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-accelerated-2d-canvas",
    "--no-first-run",
    "--no-zygote",
    "--single-process",
    "--disable-gpu"
  ]
});
  const page = await browser.newPage();

  const client = await page.target().createCDPSession();
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: downloadPath
  });

  await page.goto('https://www.myfloridalicense.com/', { waitUntil: 'networkidle2' });
  await page.click('a[title="Online Services"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2' });

  await page.evaluate(() => {
    const el = document.querySelector('a[href*="public-records"]');
    el && el.scrollIntoView();
  });
  await page.click('a[href*="public-records"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2' });

  await page.evaluate(() => {
    const el = document.querySelector('a[href*="Community-Association-Managers"]');
    el && el.scrollIntoView();
  });
  await page.click('a[href*="Community-Association-Managers"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2' });

  const [accordionButton] = await page.$x("//button[contains(text(), 'Licensee Files')]");
  if (accordionButton) await accordionButton.click();

  const csvLink = await page.$('a[href$=".csv"]');
  if (csvLink) await csvLink.click();

  await page.waitForTimeout(10000);
  await browser.close();

  res.json({ status: 'success', message: 'CSV download initiated.' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

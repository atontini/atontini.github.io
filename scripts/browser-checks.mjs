import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const port = 4173;
const base = `http://127.0.0.1:${port}`;
const server = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1', '--directory', '_site'], { stdio: 'ignore' });
let browser;
const pages = [];
async function findPages(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const name = path.join(dir, entry.name);
    if (entry.isDirectory()) await findPages(name);
    else if (name.endsWith('.html')) pages.push('/' + path.relative('_site', name).split(path.sep).join('/'));
  }
}
try {
  for (let attempt = 0; attempt < 50; attempt++) {
    try { if ((await fetch(base)).ok) break; } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
    if (attempt === 49) throw new Error('Preview server did not start');
  }
  browser = await chromium.launch();
  await findPages('_site');
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const failures = [];
  page.on('pageerror', error => failures.push(error.message));
  page.on('response', response => { if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`); });
  for (const colorScheme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme });
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const url of pages) {
        await page.goto(base + url);
        assert.equal(await page.locator('#theme').inputValue(), 'system');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Overflow: ${url}, ${width}`);
        const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
        assert.deepEqual(result.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), [], `Accessibility: ${url}, ${width}, ${colorScheme}`);
      }
    }
  }
  await page.goto(base);
  for (const theme of ['dark', 'light']) {
    await page.selectOption('#theme', theme);
    await page.reload();
    assert.equal(await page.locator('html').getAttribute('data-theme'), theme);
    assert.equal(await page.locator('#theme').inputValue(), theme);
    assert.equal(await page.evaluate(() => localStorage.getItem('theme')), theme);
  }
  await page.selectOption('#theme', 'system');
  await page.emulateMedia({ colorScheme: 'dark' });
  assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme), 'dark');
  await page.emulateMedia({ colorScheme: 'light' });
  assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme), 'light');
  await page.reload();
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.textContent), 'Skip to content');
  await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'main');
  await page.locator('#theme').focus();
  await page.keyboard.press('Home');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Tab');
  assert.equal(await page.locator('#theme').inputValue(), 'light');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior), 'auto');
  const card = page.locator('.project-card').first();
  await card.hover();
  assert.equal(await card.evaluate(el => getComputedStyle(el).transform), 'none');

  // Long unbroken code and wide table content must scroll locally on phones.
  await page.goto(base + pages.find(url => url.includes('welcome-to-jekyll')));
  await page.setViewportSize({ width: 320, height: 800 });
  await page.locator('.prose').evaluate(el => {
    el.insertAdjacentHTML('beforeend', `<pre tabindex="0"><code>${'long_identifier_'.repeat(80)}</code></pre><table tabindex="0"><caption>Overflow check</caption><thead><tr><th scope="col">${'wide_column_'.repeat(30)}</th></tr></thead><tbody><tr><td>Value</td></tr></tbody></table>`);
  });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  for (const selector of ['.prose > pre[tabindex]', '.prose table']) {
    assert.equal(await page.locator(selector).evaluate(el => el.scrollWidth > el.clientWidth), true);
  }
  const noJS = await browser.newContext({ javaScriptEnabled: false, colorScheme: 'dark', viewport: { width: 390, height: 844 } });
  const plain = await noJS.newPage();
  await plain.goto(base);
  assert.equal(await plain.locator('h1').count(), 1);
  assert.equal(await plain.locator('.theme-control').isVisible(), false);
  assert.equal(await plain.evaluate(() => getComputedStyle(document.documentElement).colorScheme), 'dark');
  await noJS.close();
  const noStorage = await browser.newContext();
  await noStorage.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage blocked'); } }));
  const blocked = await noStorage.newPage();
  blocked.on('pageerror', error => failures.push(error.message));
  await blocked.goto(base);
  await blocked.selectOption('#theme', 'dark');
  assert.equal(await blocked.locator('html').getAttribute('data-theme'), 'dark');
  await noStorage.close();
  assert.deepEqual(failures, []);
  console.log(`Passed axe accessibility and responsive checks for ${pages.length} pages at four widths in both themes; theme persistence, keyboard, reduced motion, overflow, no-JS and blocked storage checks pass.`);
} finally {
  await browser?.close();
  server.kill();
}

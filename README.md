# Andrea Tontini’s website

A lightweight software engineering portfolio and technical blog at <https://atontini.github.io/>. Built with Jekyll 3.10 and the GitHub Pages gem, Liquid, plain CSS, and a small theme preference script. No runtime framework, web fonts, or third-party scripts.

## Development

Install Ruby **3.3**, its development headers, a C compiler, and Bundler. A Ruby version manager is recommended. Native gems may require platform development libraries (for example, OpenSSL and zlib headers).

```sh
gem install bundler -v 4.0.10
bundle install
bundle exec jekyll serve
```

Open <http://localhost:4000>. The theme follows the operating system by default; the header selector saves an explicit light or dark choice locally. Selecting System clears the saved override. Without JavaScript, system themes and all content/navigation remain available.

## Structure

- `_config.yml`: site identity, URLs, supported plugins, and post defaults.
- `_data/`: navigation, professional profiles, featured projects, technical interests.
- `_includes/` and `_layouts/`: shared navigation, metadata, footer, post list, and page/article templates.
- `_posts/`: dated Markdown articles; `blog.html` lists all published posts.
- `public/css/site.css` and `public/js/script.js`: theme, layout, and behavior.
- `assets/`: favicon and social preview; `imgs/` retains existing public SVG URLs.
- `scripts/`: output validation and browser/accessibility checks; never published.

## Build and validate

```sh
JEKYLL_ENV=production bundle exec jekyll build --safe --trace
python3 scripts/check-site.py
# Optional local quality checks; Node 24 LTS and Python 3 are required.
# With nvm installed, use the same Node major as CI:
nvm install
nvm use
npm ci --legacy-peer-deps
npx --no-install playwright install --with-deps chromium
npm run check:html
npm test
```

The Python check validates local links, fragment targets, metadata, feed/sitemap XML, preserved public URLs, and development-file exclusions. Browser checks start and stop their own local server. They cover four viewport widths, light/dark accessibility with axe, theme persistence, keyboard use, reduced motion, long code/tables, disabled JavaScript, and blocked storage. Automated checks supplement manual review; they do not establish complete WCAG conformance or real-world Core Web Vitals.

CI uses Node 24 LTS from `.nvmrc` and an explicit `ubuntu-24.04` runner.
Playwright 1.56.1 supports that Ubuntu release; the moving `ubuntu-latest`
label can select Ubuntu 26.04, where this pinned Playwright version cannot
install Chromium. Review Playwright's platform support before changing the
runner OS. Browser installation uses the locally installed, lockfile-pinned
Playwright CLI after `npm ci`.

## Content

### Coding agent instructions

`AGENTS.md` holds the shared writing and repository rules. Edit shared policy
there; the following entry points import it or direct the agent to read it.

| Agent | Instruction file |
| --- | --- |
| Codex and agents supporting AGENTS.md | `AGENTS.md` |
| Claude Code | `CLAUDE.md` |
| Gemini CLI | `GEMINI.md` |
| GitHub Copilot | `.github/copilot-instructions.md` |
| Cursor | `.cursor/rules/repository.mdc` |
| Windsurf Cascade | `.windsurf/rules/repository.md` |
| Cline | `.clinerules/repository.md` |

Claude Code and Gemini CLI use documented `@` imports. The remaining adapters
explicitly ask the agent to read the shared file; their Markdown links are
references, not automatic imports. Cursor uses `alwaysApply: true` and Windsurf
uses `trigger: always_on`. These files are excluded from the Jekyll site.

File conventions follow the official documentation for
[Claude Code](https://code.claude.com/docs/en/memory),
[Gemini CLI](https://google-gemini.github.io/gemini-cli/docs/cli/gemini-md.html),
[GitHub Copilot](https://code.visualstudio.com/docs/agent-customization/custom-instructions),
[Cursor](https://prod.cursor.com/docs/rules),
[Windsurf Cascade](https://docs.windsurf.com/windsurf/cascade/memories), and
[Cline](https://github.com/cline/cline/blob/main/docs/customization/cline-rules.mdx).

### Publishing articles

Add featured projects in `_data/projects.yml` with `name`, `category`, `description`, `technologies` (a list), and `url`. Verify each public repository before describing it; identify forks and avoid implying authorship or results the source does not establish. Profile and navigation links have their own data files. Technical interests are grouped in `_data/interests.yml`, without proficiency ratings.

Create `_posts/YYYY-MM-DD-short-title.md`:

```yaml
---
title: A descriptive article title
description: A short, accurate summary for search and sharing.
date: 2026-10-18 12:00:00 +0200
categories: [embedded, linux]
---
```

Write Markdown below the front matter. Use fenced code blocks with a language, descriptive image alt text, and headings beginning at `##`. Give images explicit dimensions to reserve space. For wide tables or code, use `tabindex="0"` on the table or `<pre>` when keyboard scrolling is needed; provide a caption for tables. Use real publication dates. Future-dated posts are excluded by Jekyll. Optional per-post `image` overrides the default social preview.

Post URLs retain `permalink: pretty`, including category segments. Do not change an existing post’s filename, date, or categories without an explicit redirect plan. `/blog/` (also served as `/blog` by Pages), the `/blog.html` alias, `/atom.xml`, `/404.html`, and existing profile image URLs are retained. The original Jekyll welcome post remains published without edits.

## Deployment

Work and push directly to `gh-pages` after validation. GitHub Pages builds the branch using its supported Jekyll plugins; `.github/workflows/check.yml` independently checks the build, HTML, links, accessibility, and browser behavior with read-only permissions. It does not replace the existing Pages deployment or change its settings. `CNAME` is preserved. Check the repository’s Pages deployment status after pushing.

The `github-pages` dependency pins the supported Jekyll/plugin family. Run `bundle update` deliberately, review compatibility and the lockfile, then repeat the checks. The unused Minima theme and redundant direct Jekyll dependencies were removed from the Gemfile; GitHub Pages still brings its supported dependency set transitively.

The original site used Poole/Lanyon by Mark Otto; its MIT notice is retained in `LICENSE.md`.

Dependency audit (18 October 2026): `bundler-audit` reports [CVE-2026-85396 in rubyzip](https://github.com/advisories/GHSA-47m2-wp7j-p9vc). The supported Pages dependency set brings in `jekyll-remote-theme`, which requires rubyzip below 3.0; the advisory requires 3.4 or later. That constraint prevents a compatible lockfile-only fix. This site uses local layouts and does not configure a remote theme or accept uploaded archives. Recheck when GitHub Pages updates its dependency set.

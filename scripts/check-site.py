"""Check generated local links, fragments, metadata, feeds and preserved URLs."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import json
import sys
import xml.etree.ElementTree as ET

root = Path(sys.argv[1] if len(sys.argv) > 1 else '_site').resolve()
base = sys.argv[2].rstrip('/') if len(sys.argv) > 2 else ''
origin = 'https://atontini.github.io'
errors = []


class Document(HTMLParser):
    def __init__(self, path):
        super().__init__(convert_charrefs=True)
        self.path, self.ids, self.links, self.canonicals = path, set(), [], []
        self.h1s = 0
        self.jsonld = False
        self.json_text = []
        self.description = False
        self.feed(path.read_text())

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'script' and attrs.get('type') == 'application/ld+json':
            self.jsonld = True
            self.json_text = []
        if 'id' in attrs:
            if attrs['id'] in self.ids:
                errors.append(f'{self.path}: duplicate id {attrs["id"]}')
            self.ids.add(attrs['id'])
        self.h1s += tag == 'h1'
        for attr in ('href', 'src'):
            if attr in attrs:
                self.links.append(attrs[attr])
        if tag == 'link' and attrs.get('rel') == 'canonical':
            self.canonicals.append(attrs.get('href', ''))
        if tag == 'meta' and attrs.get('property') == 'og:image':
            self.links.append(attrs.get('content', ''))
        if tag == 'meta' and attrs.get('name') == 'description':
            self.description = bool(attrs.get('content'))

    def handle_data(self, data):
        if self.jsonld:
            self.json_text.append(data)

    def handle_endtag(self, tag):
        if tag == 'script' and self.jsonld:
            try:
                json.loads(''.join(self.json_text))
            except ValueError:
                errors.append(f'{self.path}: invalid JSON-LD')
            self.jsonld = False


docs = {p: Document(p) for p in root.rglob('*.html')}
for path, doc in docs.items():
    if doc.h1s != 1:
        errors.append(f'{path}: expected one h1, got {doc.h1s}')
    if not doc.description or len(doc.canonicals) != 1:
        errors.append(f'{path}: missing description or unique canonical')
    for canonical in doc.canonicals:
        if not canonical.startswith(origin + '/') or '//' in urlsplit(canonical).path:
            errors.append(f'{path}: invalid canonical {canonical}')
    for link in doc.links:
        parsed = urlsplit(link)
        if parsed.scheme and parsed.scheme not in ('http', 'https'):
            continue
        if parsed.netloc and parsed.netloc != urlsplit(origin).netloc:
            continue
        urlpath = unquote(parsed.path)
        if urlpath.startswith('/'):
            if base and not (urlpath == base or urlpath.startswith(base + '/')):
                errors.append(f'{path}: link escapes baseurl: {link}')
                continue
            target = root / urlpath.removeprefix(base).lstrip('/')
        else:
            target = path.parent / urlpath if urlpath else path
        target = target.resolve()
        if target.is_dir():
            target /= 'index.html'
        # GitHub Pages serves extensionless paths such as the existing /blog URL.
        if not target.exists() and target.with_suffix('.html').exists():
            target = target.with_suffix('.html')
        if not target.exists():
            errors.append(f'{path.relative_to(root)}: broken link {link}')
        elif parsed.fragment and target in docs and unquote(parsed.fragment) not in docs[target].ids:
            errors.append(f'{path.relative_to(root)}: missing fragment {link}')

for preserved in ['index.html', 'blog/index.html', 'blog.html', '404.html', 'jekyll/update/2026/04/14/welcome-to-jekyll/index.html']:
    if not (root / preserved).is_file():
        errors.append(f'Missing existing URL: {preserved}')
for name in ['atom.xml', 'sitemap.xml']:
    tree = ET.parse(root / name)
    for element in tree.iter():
        if element.tag.endswith(('loc', 'id')) and element.text and element.text.startswith(origin):
            if '//' in urlsplit(element.text).path:
                errors.append(f'{name}: malformed URL {element.text}')
feed = ET.parse(root / 'atom.xml')
ns = {'a': 'http://www.w3.org/2005/Atom'}
if not feed.findall('a:entry', ns):
    errors.append('Existing post missing from Atom feed')
for name in ['README.md', 'Gemfile', 'package.json', 'scripts', 'node_modules', 'vendor']:
    if (root / name).exists():
        errors.append(f'Development files leaked into output: {name}')
if errors:
    print('\n'.join(errors))
    sys.exit(1)
print(f'Checked {len(docs)} HTML pages: links, fragments, metadata, XML and preserved URLs pass.')

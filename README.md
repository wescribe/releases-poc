# WeScribe Release Notes POC

A static proof of concept for visually rich product release notes. Each release is a markdown file with a handful of layout directives. A small Node build renders those files into a Mintlify-style site and, beside every page, writes a plain-markdown export with all layout stripped out.

The example content is Spokenote's release notes. The site is deployed to GitHub Pages at https://wescribe.github.io/releases-poc/.

This README covers the content model, the stored format, the export rules, the three format options we weighed, and how the project is built and deployed. The editor question for the real product is in [docs/editor-approach.md](docs/editor-approach.md). Loose ideas live in [IDEAS.md](IDEAS.md). The design that this code implements is in [docs/superpowers/specs/2026-10-17-release-notes-poc-design.md](docs/superpowers/specs/2026-10-17-release-notes-poc-design.md).

## Quick start

Requires Node 20 or newer.

```bash
nvm use            # reads .nvmrc
npm install
npm run dev        # builds, serves http://localhost:4173, rebuilds on change
npm test           # node --test
npm run build      # writes dist/
```

Set `BASE_PATH` when the site will not be served from the domain root, and `SITE_URL` to the scheme and host so Open Graph and canonical URLs are absolute. `npm run build` includes the Google Analytics tag by default; set `GA_ID` to use a different measurement id, or to an empty string to leave it out. The dev server leaves analytics out unless `GA_ID` is set. GitHub Pages serves this repository from `/releases-poc/`:

```bash
BASE_PATH=/releases-poc/ SITE_URL=https://wescribe.github.io npm run build
```

## What the POC proves

- Markdown stays the source. Authors in the real product never see it; it is the storage and interchange format.
- A page can go beyond one column of text. Sections can be multi-column, and custom blocks render richly.
- The same source exports to clean standard markdown with every layout decision removed, so the content can later feed MCP servers or anything else that reads markdown.
- Standard markdown tooling can still read the files. The directives are plain text to any renderer that does not know them.

## Content model

A release note is a **page**. A page has front matter and a body.

The body is a stack of **sections**. A section is a layout:

- **Single column.** The default. Any markdown outside a layout directive is a single-column section.
- **Multi-column.** Two or three equal-width columns. Each column is a slot.

Each slot holds **blocks**:

- **Standard markdown blocks**, untouched: paragraphs, headings, lists, links, emphasis, images, code, blockquotes, tables, rules.
- **Custom blocks.** The POC ships one, the **callout**: a padded, rounded box with a tinted background and a colored left border, holding ordinary markdown.

### Front matter

Every file in `content/releases/` declares these fields. The file name is the URL slug. `version` is optional, for standalone tools that ship without one; when it is absent the page shows no version pill and the export's metadata line carries only the date.

```yaml
---
title: Draft pages before you publish       # customer-facing headline, never a version number
summary: Work on a page or a whole campaign privately, publish when you're ready.
date: 2026-09-29
version: 2.19.0
hero: /images/releases/draft-pages-before-you-publish.svg   # 16:9 visual used on the page and the index
---
```

The build fails with a message naming the file and the field if `title`, `summary`, `date` or `hero` is missing, or if `date` is not a plain `YYYY-MM-DD` day. `version` is read as written, so `2.10` stays `2.10`.

## The stored format

Layout uses the [remark-directive](https://github.com/remarkjs/remark-directive) container syntax: a fence line of three or more colons and a name, content, then a closing fence of the same length. Nested containers use more colons on the outer fence, the same way fenced code blocks nest.

This is the opening of the v2.19.0 release, copied from `content/releases/draft-pages-before-you-publish.md`:

```markdown
:::::columns
::::column
## Page Drafting

Business workspaces can now save changes to a single page or a campaign of pages without publishing them.

- **Save Draft and Publish are separate.** Save Draft keeps your work private. Publish makes it live. You choose when.
::::
::::column
![Editor toolbar with Save Draft and Publish buttons](/images/releases/draft-pages-before-you-publish-shot-1.svg)

:::callout{type=tip}
**Business workspaces only.** Drafting is turned on for Business workspaces. Other workspaces keep the current publish-on-save behavior.
:::
::::
:::::
```

The directives:

| Directive | Kind | Rules |
|---|---|---|
| `columns` | section layout | Holds two or three `column` children and nothing else. Columns are equal width and stack on narrow screens. |
| `column` | slot | Holds blocks. |
| `callout` | block | Optional `{type=note}`, `{type=tip}` or `{type=warning}`. Anything else falls back to `note`. |

Three rules keep content safe:

- An unknown directive still renders, as a `div` with a visible red outline, and the build prints a warning. A typo cannot silently drop content.
- A `columns` container with the wrong number of children still renders and warns.
- Only container directives are part of the format. Inline `:name` and leaf `::name` forms are restored to literal text, so a time like `12:24 PM` is never mistaken for a directive.

Raw HTML in content is shown as literal text in both the page and the export, never executed and never dropped. GitHub-flavored markdown extensions (tables, strikethrough, task lists) are supported in both.

## Export rules

Each page is exported to `releases/<slug>/<slug>.md`, linked from the page as "View as markdown". The export is produced from the same parsed tree as the HTML:

1. Front matter becomes a level-one heading from the title, then the summary as a paragraph, then one line: `Released September 29, 2026 · Version 2.19.0`.
2. The hero image is omitted. It is layout, not content.
3. A `columns` section becomes its columns' contents in order, left to right becoming top to bottom.
4. A `callout` becomes its inner markdown, with the attribute dropped.
5. Everything else passes through as written.

The export contains no fence lines, no attributes and no HTML.

The rail's "More actions" menu offers "Open in Claude" and "Open in ChatGPT". Each opens the assistant with a prompt asking it to read the page's export URL, so the assistant works from the clean markdown rather than the styled page. `robots.txt` disallows `.md` files for search crawlers but explicitly allows the `Claude-User` and `ChatGPT-User` fetchers, which act on a person's request. Image paths inside content are left as written, so a root-relative path such as `/images/...` is relative to the site root, not to the exported file. Consumers hosted under a subpath should resolve them against the site's base URL.

## Format options considered

We weighed three ways to carry layout inside markdown. Fenced directives won, but the other two are recorded here so the choice can be revisited.

### Fenced directives (chosen)

`:::columns` … `:::`, the remark-directive convention, also used in spirit by Mintlify, GitBook and Docusaurus.

Pros:

- Containers nest cleanly, and the inside stays plain markdown.
- Attributes have a defined syntax, `{type=tip}`.
- A renderer that does not know the directives shows the fences as short lines of colons. Nothing is lost.
- Stripping layout for export means deleting fence lines. The export is trivial to get right.
- Well supported in the unified ecosystem that a Next.js app would use anyway.

Cons:

- Not part of CommonMark, so it is a convention, not a standard.
- Nesting by colon count is easy for a human to get wrong. That matters little here, since authors never type it.
- Inline `:name` syntax can collide with ordinary text, which is why the POC disables the inline and leaf forms.

### MDX-style components

`<Columns>` … `</Columns>` with JSX props. The closest match to what a Next.js app renders natively.

Pros:

- One mental model from storage to React component. No mapping layer.
- Props can carry structured data, not just strings.
- Large ecosystem of docs tools built on MDX.

Cons:

- MDX is not markdown. Any standard markdown tool, including the export consumers we care about, chokes on JSX.
- Stripping JSX cleanly is harder than deleting fence lines. Self-closing tags, expressions and imports all need handling.
- MDX compiles content as code. A content mistake becomes a build error, and content from an AI agent would need to be sandboxed.

### HTML comment markers

`<!-- section: columns -->` … `<!-- /section -->`. Invisible to every markdown renderer.

Pros:

- Degrades perfectly. Even GitHub's renderer shows the content with no artifacts at all.
- Zero dependencies to parse in principle.

Cons:

- Comments cannot nest, so columns inside sections need ad hoc conventions.
- There is no attribute syntax, so every marker needs its own grammar and parser.
- Fragile. A stray comment in content is indistinguishable from a marker.
- Nothing in the ecosystem helps; everything is custom.

### Why fences won

Fenced directives are the only option that is both readable by standard markdown tools and trivially strippable for export, while still nesting and carrying attributes. MDX would be the natural fit if the export requirement did not exist. HTML comments would be the natural fit if we only ever needed one flat level of layout.

## Planned block types

Not built in this POC, described so the format has room for them:

- **Carousel.** A leaf or container directive holding a list of images with captions. Exports as a list of images.
- **Feature card.** A titled card with an image and short text. Exports as a heading and paragraph.
- **Image with caption.** A figure. Exports as the image followed by its caption.
- **Modal behavior on any block.** A block flagged to open in a modal. Exports as its trigger text followed by the hidden body, in place.

## Project layout

```
build/
  content.js      load releases and the index intro from front matter; date helpers
  directives.js   remark plugins: directive to HTML mapping, inline directive guard
  render.js       markdown to HTML pipeline; collects h2 headings; applies the base path
  export.js       markdown to stripped markdown
  templates.js    HTML templates for the layout, release page, index and cards
  site.js         orchestrates a build into an output folder
  index.js        npm run build
  dev.js          npm run dev: build, watch, serve
content/
  index.md        index page title and meta description (no visible intro)
  releases/*.md   one file per release; file name is the slug
  images/         committed SVG placeholders
  source/*.txt    the original plain-text release notes, the source of truth for content
scripts/
  make-placeholder.js   deterministic abstract SVG generator
site/
  styles.css, theme.js  copied to dist/assets/
public/
  favicon.ico, apple-touch-icon.png   copied to the dist/ root as-is (from app.spokenote.com)
test/                   node --test suites
.github/workflows/deploy.yml
```

## Analytics events

With the Google Analytics tag loaded, `site/theme.js` sends these custom events. Every event carries a `release` parameter: the release slug, or `index` on the index page.

| Event | When | Parameters |
|---|---|---|
| `toc_click` | A link in "On this page" is clicked | `section` (heading text), `section_id` |
| `share` | A share option is chosen | `method` (facebook, x, linkedin, whatsapp, telegram, email, sms), `content_type` = release |
| `view_markdown` | "View as markdown" is clicked | |
| `carousel_nav` | A What's new arrow is clicked | `direction` (previous, next) |
| `theme_toggle` | The light/dark button is clicked | `theme` (the mode switched to) |
| `page_feedback` | Yes or No is clicked on "Did this page help you?" | `helpful` (yes, no); `changed_from` when a visitor switches an earlier vote |
| `open_in_ai` | An option under "More actions" is chosen | `assistant` (claude, chatgpt) |

Feedback votes are also kept in the visitor's localStorage under `feedback:<release>`, so a page remembers the answer and does not ask again on that browser. Nothing is shown to visitors in aggregate; the counts live only in Google Analytics.

## Deployment

A GitHub Actions workflow runs on every push to `main`: install, test, build with `BASE_PATH=/releases-poc/`, and deploy `dist/` to GitHub Pages. `dist/` is never committed. The repository's Pages source must be set to GitHub Actions.

Every link and asset URL in the templates is prefixed by the base path, and root-relative paths inside content such as `/images/...` are rewritten in the HTML at build time, so the same content works at the domain root in development and under the repository subpath in production. The markdown export is not rewritten; see Export rules.

## Adding a release

1. Save the original notes as `content/source/vX.Y.Z.txt`.
2. Create `content/releases/<slug>.md` with the front matter fields and the body, using the directives above.
3. Generate a hero: `node scripts/make-placeholder.js <slug> content/images/releases/<slug>.svg`. In-page images take `--ratio 4:3 --label "..."`.
4. Add a `[source file, slug, version or null]` entry to `test/content-integrity.test.js`. It checks that every item lead-in in the source (the text before the first ` - ` on a line) survives into the export, that the render has no warnings, and that every referenced image exists. It does not compare item bodies, so read the page against the source once by eye.
5. `npm test`, then `npm run dev` and look.

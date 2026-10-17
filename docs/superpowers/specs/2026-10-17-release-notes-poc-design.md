# WeScribe Release Notes POC: Design

Date: 2026-10-17
Status: draft, awaiting approval

## Intent

WeScribe is a SaaS platform that lets companies build and maintain their product knowledge: a knowledge base, interactive AI chat, product release notes and feature requests. This proof of concept is for the release notes part.

Today a release note is a wall of single-column text. We want release notes that a non-technical customer wants to open: a hero visual, a headline about the thing they care about, and sections that use multi-column layouts and richer blocks where that helps. We also want the source of each release note to stay markdown, so the core content can be exported as plain markdown with every layout decision stripped out. Nobody uses that export in the POC. It proves that the eventual product can feed MCP and other markdown consumers.

The POC is a static site that fakes what a future Next.js app will render. There is no editor. In the real product authors pick section layouts and block types from a menu or slash command, and an AI agent drafts content for them to tweak or approve. Authors never see or edit the markdown.

## Goals

- Show an index page and five release-note pages, rendered from markdown with custom layout directives. The three newest are the showcase; the two oldest seed the index and the "What's new" rows so the site has history.
- Prove the round trip: markdown with directives renders to a rich layout, and the same source exports to clean standard markdown.
- Demonstrate two section layouts, single column and multi-column, and one custom block, the callout.
- Look and feel in the family of Mintlify docs, aimed at a non-technical customer.
- Document the format choice and the alternatives, and separately document the editor build-versus-buy question, so the team can revisit both.
- Be hosted on GitHub Pages from the wescribe/releases-poc repository.

## Non-goals

- No editor, no authoring UI, no drag and drop, no slash commands. The IDEAS.md file collects editor ideas for later.
- No search. The POC has a handful of pages.
- No carousel, feature card, image-with-caption block or modal behavior yet. These are planned block types and are described in the README as planned, not built.
- No real screenshots or video. Hero visuals and in-page images are generated placeholders the team can swap later.
- No Next.js, no React. A small Node build script and plain HTML, CSS and JavaScript.

## Anti-goals

Things that would make this a failure even if it technically works:

- The rendered pages feel like a technical changelog. Version numbers and dates must stay secondary to headlines and visuals.
- Layout leaks into the export. The exported markdown must read sensibly top to bottom with no fence lines, attributes or HTML.
- The stored format is only parseable by our own code. Standard markdown tooling must still parse the files, treating directives as ordinary paragraphs at worst.
- Content is hand-shaped to fit the layouts. The layouts must work for release notes as a product team actually writes them.

## Constraints

- Static output served by GitHub Pages. No server at request time.
- Repository: https://github.com/wescribe/releases-poc, working folder /Users/peterlockhart/projects/wescribe-releases-poc. The repository exists, the first commit is pushed, and the product owner has admin rights. The product owner is making the repository public so GitHub Pages is available on the organization's free plan. The site will live at `https://wescribe.github.io/releases-poc/`.
- Content is for Spokenote, the first customer-style example. The v2.19.0 release (deployed 2026-09-29) was supplied as plain text by the product owner and is committed verbatim at `content/source/v2.19.0.txt`. That file is the source of truth. The builder may add a customer-facing headline and summary, tighten wording for a customer audience, and arrange the text into sections, but must not drop or invent items. The v2.18.0 release (deployed 2026-09-01) is committed the same way at `content/source/v2.18.0.txt`. The v2.17.0 release (deployed 2026-07-14) is at `content/source/v2.17.0.txt`. Two older releases are still to come from the product owner and will be committed the same way, giving five release pages in all. Older and shorter releases get fewer sections, and that is fine. If the two older releases have not arrived when the build reaches content, the builder builds the three that exist and adds the others when they land.
- No personal data anywhere in content or placeholders.
- Everything a visitor sees must work on a phone.

## The content model

A release note is a **page**. A page has front matter and a body.

A body is a stack of **sections**. A section is a layout. The POC supports:

- **Single column.** The default. Any markdown outside a layout directive is a single-column section.
- **Multi-column.** Two or three equal-width columns. Each column is a slot.

Each slot holds a sequence of **blocks**. Blocks are:

- **Standard markdown blocks**, untouched: paragraphs, headings, lists, links, emphasis, images, code, blockquotes, tables, horizontal rules.
- **Custom blocks.** The POC ships one: the **callout**, a padded, rounded box with a tinted background and a left border. It wraps ordinary markdown and takes an optional type that changes its color.

Modal behavior, carousels and cards are deferred. The README describes them as planned block types.

## The stored format

Files are markdown with YAML front matter and remark-directive container directives. This follows the convention used by Mintlify, GitBook and Docusaurus. The three options weighed were fenced directives, MDX-style components and HTML comment markers. Fenced directives won because they nest cleanly, keep the inside as plain markdown, degrade gracefully in a standard renderer, and are the simplest to strip for export. The README records all three with pros and cons.

### Front matter

Every release file declares:

```yaml
---
title: Draft pages before you publish       # customer-facing headline
summary: Work on a page or a whole campaign privately, publish when you're ready.
date: 2026-09-29
version: 2.19.0
hero: /images/releases/2-19-0.svg           # 16:9 visual, used on the page and the index
---
```

The title is a headline about the most important thing in the release, not the version. The hero is a single field so the page and the index can never show different images.

### Directives

Containers use the remark-directive fence syntax. The outer fence uses more colons than the inner one, the same way fenced code nests.

```markdown
:::::columns
::::column
## Page Drafting
Business workspaces can now save changes without publishing them.
- **Save Draft and Publish are separate.** ...
::::
::::column
![Editor toolbar](/images/releases/2-19-0-drafting.svg)
:::callout{type=tip}
**Business workspaces only**
Drafting is turned on for Business workspaces.
:::
::::
:::::
```

A container's fence must use more colons than any container nested inside it. In the example, `columns` uses five, `column` four and `callout` three, so the parser can match every closing fence.


- `columns` is a section layout. It contains two or three `column` children and nothing else. Columns are equal width.
- `column` is a slot. It contains blocks.
- `callout` is a block. Attribute `type` is one of `note`, `tip`, `warning`. Default is `note`. It may appear inside a column or in a single-column section.
- Anything at the top level outside a `columns` container is a single-column section.

Unknown directives render as a plain `<div>` with the directive name as a class and a visible build warning, so a typo cannot silently drop content.

### Export rules

The export of a page is standard markdown, produced from the same parsed tree:

1. Front matter becomes a level-one heading from the title, then the summary as a paragraph, then one line with the date and version.
2. The hero image is omitted. It is layout, not content.
3. A `columns` section becomes its columns' contents in order, left to right becoming top to bottom, separated by a blank line.
4. A `callout` becomes its inner markdown unchanged.
5. Everything else passes through as written.

The exported file is written beside the page as `<slug>.md` and linked from the page as "View as markdown".

## The pages

### Shared frame

- **Top bar.** Spokenote wordmark on the left, linking to the index. Theme toggle on the right. Nothing else.
- **No left sidebar.** The index and the "What's new" row are the only navigation between releases.
- **Footer** on every page: "Powered by WeScribe. © 2026."
- **Type and spacing** in the family of Mintlify docs: a clean sans-serif, generous whitespace, soft borders, rounded corners. A green accent stands in for the brand color and is defined once as a CSS custom property.
- **Light and dark** modes, following the system preference with a toggle that remembers the visitor's choice in local storage.

### Release page

Top to bottom:

1. The 16:9 hero visual, full content width. The first thing on the page.
2. Date as a small eyebrow, then the headline as the page title, then the summary as a lead paragraph, then the version as a small muted line.
3. The sections, in order.
4. A "What's new" row spanning the full width beneath the content and the rail, showing the two most recent other releases as cards with their 16:9 visual, headline, summary and month, plus a link to the index for the full list.
5. The footer.

A right-hand "On this page" rail sits beside the content column, built from the level-two headings in the page. It is sticky and highlights the heading currently in view.

The content column is roughly 700px wide. Two columns are comfortable at that width. Three columns are tight and the builder should not widen the frame to accommodate them.

### Index page

1. A short introduction, one or two sentences from a small index front matter or config file.
2. The newest release as a wide hero card: its 16:9 visual on one side, headline, summary, month and a link on the other.
3. The remaining releases as a card grid, two per row, each with its 16:9 visual, headline, summary and month. Newest first.
4. The footer.

### Responsive behavior

- Multi-column sections stack to a single column on narrow screens, in slot order.
- The "On this page" rail is hidden entirely on narrow screens.
- The "What's new" cards and the index grid stack the same way.
- Breakpoint around tablet width, so two columns survive on a tablet in landscape.

## The build

- Node 20 or newer. The unified ecosystem: remark-parse, remark-directive, remark-rehype, rehype-stringify, with a small custom plugin that maps the three directives to HTML and a second that produces the export. gray-matter or equivalent for front matter.
- `npm run build` reads `content/releases/*.md`, writes `dist/` with `index.html`, one folder per release containing `index.html` and the exported `.md`, plus CSS, JavaScript and images. `npm run dev` serves `dist/` locally with rebuild on change.
- Hero visuals and in-page images for the POC are generated abstract SVGs committed under `content/images/`, so the build has no network dependency.
- A GitHub Actions workflow builds on push to the default branch and deploys `dist/` to GitHub Pages. `dist/` is not committed.
- The site must work when served from the repository subpath that GitHub Pages uses, so all links are relative or respect a configurable base path.

## Documents in the repo

- **README.md.** What the POC is, how to build and run it, the content model, the stored format with examples, the export rules, and the three format options with pros, cons and the reason fences won. Also a short list of planned block types.
- **docs/editor-approach.md.** The editor question for the real product: an off-the-shelf editor such as ProseMirror, Tiptap or Lexical versus building from scratch with AI assistance. Pros and cons framed around this product's needs: a section and block model, layouts chosen from a menu, slash commands or drag and drop later, AI-drafted content the author tweaks, and a clean markdown export. Written for the WeScribe team. Ends with a recommendation and the questions that would change it.
- **IDEAS.md.** A running list of ideas, already started.
- **docs/superpowers/specs/.** This document.

## Calls made by the designer

These were not discussed and can be changed without reopening the design:

- Top bar carries only the wordmark and theme toggle. The mockups showed a search field; it is dropped because a search box over five pages would be fake.
- Callout types are note, tip and warning, differing only in color.
- The export drops the hero image and writes date and version on one line under the summary.
- Nesting uses extra colons on the outer fence, the standard remark-directive convention.
- Hero visuals are generated SVG placeholders, committed to the repo.
- Deployment is by GitHub Actions rather than a committed `dist/` folder.
- Three-column sections are supported in the parser and CSS but none of the POC pages needs to use one.
- Unknown directives render visibly with a build warning rather than failing the build.

## Left to the builder

- Exact typography, spacing, colors and the dark palette, within the Mintlify-family brief.
- The SVG placeholder style.
- How the scroll-spy for the rail is implemented.
- Dev server choice and project layout.
- How the two outstanding releases are split into sections and blocks once their content arrives. The v2.19.0 split shown in the brainstorm mockup is a good reference: Page Drafting as two columns with a callout, Page Editing single column, full-screen editor as two columns image first, Navigation and Campaigns side by side, Integrations and Media Library side by side, Bug Fixes single column, Behind the Scenes as a note callout.

## Open items

- The repository must be switched to public before the first deploy, and the repository's Pages source set to GitHub Actions. The builder checks both before running the deploy step.
- A real brand color and wordmark for Spokenote, if the team wants the POC to carry them.

# The editor question: off-the-shelf or built from scratch

Written for the WeScribe team deciding how to build the real release-notes editor. The POC in this repository has no editor. It fixes the storage format and the rendered output; this document is about the tool authors will use to produce that format.

## What the editor has to do

These come from the product direction set during the POC, not from any library's feature list.

1. **Sections and blocks.** A page is a stack of sections. A section has a layout, single or multi-column. Each column holds a sequence of blocks. The editor's document model must have this nesting as a first-class structure, not as a flat list of paragraphs with styling.
2. **Layouts chosen from a menu.** Authors pick a section template and fill its slots. They never type layout syntax.
3. **Slash commands and drag and drop, later.** Block insertion by `/` command and reordering by drag are expected additions. The first version does not need them, but the architecture must not make them hard.
4. **AI-drafted content.** An agent drafts a release note, and the author tweaks and approves. The editor must accept a whole programmatically generated document and let the author edit it like anything else, and it must be able to hand a selection or block back to the agent for a rewrite.
5. **Lossless round trip to the directive markdown.** The editor's document must serialize to the fenced-directive markdown in this repository and parse back from it without losing structure. This is the hardest requirement and the one that most constrains the choice.
6. **The ordinary floor.** Undo and redo, copy and paste from other apps without junk, keyboard navigation, screen reader support, correct input of non-Latin text, and stability across browsers.

## Option one: an off-the-shelf editor framework

Three frameworks are serious candidates. All three are schema-driven: you define the node types your document allows, and the editor enforces them. That fits a section and block model well.

### ProseMirror

The foundation layer. A toolkit, not a finished editor: you assemble the schema, plugins, commands and UI yourself.

- **Schema flexibility.** Excellent. Nested container nodes such as `section > column > block` are natural. Content expressions in the schema can enforce "a columns node holds two or three column nodes".
- **Markdown.** `prosemirror-markdown` ships a parser and serializer built on markdown-it, both extensible per node type. Adding directive fences means writing a markdown-it plugin for parsing and one serializer function per node type. Doable, and the round trip is under your control.
- **Collaboration.** `prosemirror-collab` for operational transforms, or Yjs bindings for CRDT-based collaboration. Mature.
- **React fit.** None built in. You wrap it, or use a thin binding library.
- **License and ecosystem.** MIT. Battle-tested in large products. Documentation is thorough but assumes you want to understand the internals.
- **Cost.** The most engineering effort of the three, and the most control.

Documentation: https://prosemirror.net/docs/

### Tiptap

A headless layer on top of ProseMirror. You get a ready-made extension system and a large catalog of extensions, with ProseMirror underneath when you need it.

- **Schema flexibility.** Same as ProseMirror, wrapped in an extension API that is faster to write. Custom nodes for sections and columns are a known pattern.
- **Markdown.** Tiptap has an official markdown extension in its paid tier and community extensions in the open-source tier. Either way, directive fences would need custom serialization, and you may still drop to `prosemirror-markdown` for it.
- **Collaboration.** Yjs integration is first-class. A hosted collaboration service is sold separately.
- **React fit.** Official React bindings, including rendering a node's editing UI as a React component. This matters for block menus, slash commands and drag handles, all of which exist as extensions already.
- **License and ecosystem.** MIT core. Some extensions and the collaboration backend are commercial. Large, active community.
- **Cost.** Significantly faster to a working editor than raw ProseMirror. The trade is a dependency on Tiptap's roadmap and the chance of fighting the abstraction when you need something it did not anticipate.

Documentation: https://tiptap.dev/docs

### Lexical

Meta's editor framework, built for React from the start.

- **Schema flexibility.** Good. Custom node classes with explicit serialization. Nesting is supported, though the model is somewhat more oriented to flat rich text than ProseMirror's is.
- **Markdown.** A markdown package with transformers for import and export. Custom block transformers for directive fences are possible, with the usual caveat that a transformer-based approach is less rigorous than a full parser.
- **Collaboration.** Yjs bindings are maintained in the main repository.
- **React fit.** The best of the three. Nodes can render React components directly.
- **License and ecosystem.** MIT. Younger ecosystem than ProseMirror's, and the API has changed more over time.
- **Cost.** Comparable to Tiptap for the first version, with less markdown tooling to lean on.

Documentation: https://lexical.dev/docs/intro

## Option two: a custom editor built with AI assistance

"From scratch" means building on the browser's `contenteditable` and the Selection and Input APIs, or rendering your own blocks as controlled inputs and managing a document model yourself.

### What AI assistance changes

AI coding tools make the visible parts fast. A block menu, a slash command palette, a drag handle, a section template picker, a toolbar: each is an afternoon. A first demo that looks like an editor could exist in days.

### What it does not change

The invisible parts are where editors fail, and they are hard because browsers are inconsistent, not because the code is long.

- **Selection and cursor behavior** across block boundaries, inside nested containers, and after programmatic document changes.
- **Undo history** that groups keystrokes sensibly, survives AI-generated replacements, and never corrupts the document.
- **Composition input** for languages that use an IME, and dead-key input on European keyboards. `contenteditable` fires events in different orders per browser.
- **Paste sanitizing** from Word, Google Docs, email and web pages, which arrive as deeply nested HTML full of styling.
- **Accessibility.** Screen reader announcements, keyboard operability for every block action, focus management when blocks open and close.
- **Mobile.** Virtual keyboards, autocorrect, and selection handles behave differently from desktop and from each other.

ProseMirror alone represents many years of handling exactly these issues. AI assistance can reproduce known solutions quickly, but every one of these is a long tail of browser-specific bugs that is found in production, not in a prompt. An AI-built editor would be re-discovering that tail.

### Where a custom build is genuinely attractive

- If the editor is deliberately not free-form. A form-like editor, where each block is a small controlled input and layout is chosen from menus, avoids most `contenteditable` problems because there is no cross-block cursor. Text inside a block could still use a tiny off-the-shelf rich-text component.
- If the document model matters more than the typing experience. Since authors often start from an AI draft, approving and tweaking may be more common than composing from a blank page.
- If the team wants zero dependency on a third party's roadmap.

### Where it is a trap

- As soon as the product promises "it feels like Notion". Cross-block selection, inline formatting across boundaries and smooth drag reordering are exactly the long tail.
- When the markdown round trip is treated as a serialization afterthought. A custom document model needs its own parser and serializer for the directive format, with the same rigor the frameworks provide.

## Comparison

| | ProseMirror | Tiptap | Lexical | Custom |
|---|---|---|---|---|
| Fit for section and block nesting | Excellent | Excellent | Good | Whatever you build |
| Markdown round trip tooling | Strong, extensible | Available, partly commercial | Available, transformer-based | None, build it |
| Slash commands, drag and drop | Build or borrow | Existing extensions | Existing plugins | Build |
| Accepting an AI-drafted document | Transactions make this clean | Same | Same | Depends on model |
| React integration | Manual | Official | Native | Native |
| Collaboration later | Mature | First-class | Maintained | Build |
| Time to a credible first version | Longest | Shortest | Short | Short to demo, long to ship |
| Long-tail editing bugs | Solved | Solved | Mostly solved | Yours |
| Control over internals | Total | High, ProseMirror underneath | High | Total |
| License | MIT | MIT core, paid extras | MIT | n/a |

## Recommendation

Build on **Tiptap**, with the understanding that it is ProseMirror underneath and the team should be comfortable reaching down to that layer.

Reasons, in order:

1. The section and block model maps directly to a ProseMirror schema, and Tiptap's extension API gets a working nested-container editor up quickly.
2. Slash commands, drag handles and block menus exist as extensions, so requirement three is a configuration task rather than a build.
3. Markdown serialization can be written against `prosemirror-markdown`, which the directive format fits well: one serializer per node type, one markdown-it plugin for the fences. This keeps the round trip under our control instead of depending on a commercial extension.
4. React bindings let block editing UI be ordinary React components, which matters for the AI interactions: "rewrite this block" is a button on a block.
5. The path to collaboration is open if the product ever needs it.

Spend the saved time on the two things no framework provides: a rigorous parser and serializer for the directive format with round-trip tests, and the AI drafting flow.

## What would change the recommendation

- **If the editor is decided to be form-like**, with no free cursor across blocks, a custom build of small controlled inputs becomes reasonable, and the comparison tilts toward "custom, with a small rich-text component inside each text block".
- **If the team is already deep in Lexical** on another product, the ecosystem argument for ProseMirror weakens and Lexical is a fine choice.
- **If licensing cost for Tiptap's commercial extensions becomes an issue**, drop to raw ProseMirror. The schema and serializer work carries over unchanged.
- **If the markdown round trip is dropped as a requirement**, MDX-style storage and a different editor conversation open up. The POC's export requirement is the main reason the serializer design matters so much.

## Questions to settle before starting

1. Is cross-block free-form typing a requirement, or is approve-and-tweak the dominant interaction?
2. How much of the document will typically originate from the AI agent, and does the agent need to edit in place while the author watches?
3. Will two people ever edit a release note at the same time?
4. Is there budget for commercial editor extensions, or must everything be open source?

---
title: Run instant-win sweepstakes from a QR code
summary: Scan, confirm your age, and find out on the spot. Sweepstakes are now available to every organization, with fairness and fraud checks built in.
date: 2026-09-01
version: 2.18.0
hero: /images/releases/instant-win-sweepstakes.png
---
:::::columns
::::column
## Sweepstakes

The sweepstakes functionality first built for a national sponsor's game-day promotion is live and ready for use by other organizations.

- **Instant-win sweepstakes.** Someone scans a QR code, confirms their age, and finds out immediately if they've won a prize.
- **Age gate.** Before anyone can play, they confirm they meet the campaign's minimum age. Anyone who doesn't pass is blocked from entering, no exceptions.
- **Dynamic page content.** The page a visitor lands on isn't one static page. It is personalized in real time based on their outcome (win, lose, already played, region-specific content, and so on), pulling in the right message, prize details, or next steps automatically.
- **Two ways to pick a winner.** Either fixed odds rolled the moment someone plays, like a scratch ticket, or prizes secretly pre-scheduled to random moments in time, won by whoever plays first after that moment hits. The second option was added to satisfy a sponsor's legal requirement to avoid gambling-style odds.
- **Campaign configurations.** Age minimums, entry limits, odds, and scheduling are all settings on the campaign. No engineering work is needed to launch a new sweepstakes.
::::
::::column
![Scan a code, confirm your age, see your result](/images/releases/instant-win-sweepstakes-shot-1.svg)

:::callout{type=tip}
**Built to be provably fair.** The randomness is tested and documented to the same standard the gaming industry uses, so if a result is ever challenged, Spokenote can prove it wasn't rigged.

**Nothing can be faked or double-counted.** Fraud and bot checks gate entries, every play is permanently logged, and safeguards stop duplicate plays or leftover prizes from accidentally rolling over to give someone an extra win.
:::
::::
:::::

:::::columns
::::column
## Campaigns

**Campaign Overview.** A reworked page layout with more information about the campaign.

**Campaign Field Mapping.** A new field search filters large lists of fields instantly.
::::
::::column
## HubSpot

**Property and group sorting.** HubSpot property groups are now sorted alphabetically, as are the individual properties within each group.

**Internal name.** On any campaign created from today forward via the HubSpot integration, the campaign overview displays the internal name for the property as "CRM Field", with a button to copy it to your clipboard. No more digging through HubSpot to find that value.
::::
:::::

:::::columns
::::column
## Pages

**Create Page rage clicking.** The Create Page button is now disabled after the first click, so repeated clicks can't create multiple copies of the page.

**Preview Images.** Page preview images (thumbnails and link unfurls) now load instantly and update automatically within a minute of publishing new content. Previews are also consistent everywhere a page appears, from the pages overview to shared link previews in texts and emails.
::::
::::column
## Block Editor

**Text block formatting options.** Text blocks now support basic formatting written in Markdown notation: clickable links (which open in a new tab), bold, italics, headings, and lists. You can't embed images or use raw HTML, which displays as plain text and never executes. There is not a visual formatting bar in the UI yet.
::::
:::::

:::::columns
::::column
## Dashboard

**Dashboard Sessions.** Sessions are now sorted by latest activity by default.
::::
::::column
## Users

**Invites.** The Invite User form now validates email addresses.
::::
:::::

## Bug Fixes

- **Access Page Privacy Controls.** The privacy consent drawer on the access page tried to read saved browser settings before the page reached the visitor's browser, causing an error in our logs on every page load since March. It now waits until it is in the browser, where the correct saved settings are available.
- **Video Player controls.** Some controls, such as the play and pause buttons, were misaligned in the video player. These have been fixed.
- **Review Your Video fullscreen.** Fullscreen mode in Review Your Video now shows the video controls as expected, like every other Spokenote video player.
- **Preview query parameter.** The `?preview` query parameter now blocks user activity tracking as expected.

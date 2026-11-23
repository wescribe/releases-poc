---
title: Spokenote One, plus video thumbnails and block styling
summary: Sign up for a Spokenote One subscription yourself, pick or upload a thumbnail for any video, style each block, and control what a shared link shows.
date: 2026-11-23
version: 2.21.0
hero: /images/releases/spokenote-one-thumbnails-and-block-styling.png
---
## Spokenote One

Spokenote One is a new self-serve subscription, made for an individual or a team doing one-to-one outreach.

- **Sign up and start right away.** Subscribe directly and get started immediately.
- **Add seats as you need them.** The Owner can add more seats as the team grows.
- **Unlimited pages.** Create as many pages as you need.

:::::columns
::::column
## Video thumbnails

- **Choose a frame.** Open a video in the Media Library or in the page editor's video form, and pick one of the stills Spokenote has taken from it. Pages you publish or republish afterwards use it as the video thumbnail.
- **Upload your own.** Click the Upload tile at the start of the strip, or drop a JPEG, PNG, WebP, or GIF on it. The image belongs to the video and stays out of your Media Library. The × on its tile returns the video to its default thumbnail.
::::
::::column
![A video block's Thumbnail strip, with the Upload tile and a selected still](/images/releases/video-thumbnails.png)
::::
:::::

## Page editor

### Block styling

Several blocks get new options including alignment, background colors, rounded corners, borders, and shadows. A setting that would make no visible difference is greyed out and says why on hover.

::::carousel-list
:::item{image=/images/releases/styling/image.png alt="Image styling options"}
**Images** get rounded corners, a max width in pixels or percent, a shadow, and alt text.
:::
:::item{image=/images/releases/styling/button.png alt="Button styling options"}
**Buttons** get three sizes, a solid or dashed border, a transparent background, and a shadow.
:::
:::item{image=/images/releases/styling/vcard.png alt="vCard styling options"}
**vCard** gets the same three sizes, borders, and shadow as buttons.
:::
:::item{image=/images/releases/styling/video.png alt="Video styling options"}
**Videos** get alignment, a max width, rounded corners, a shadow, and their own play and pause button colors.
:::
:::item{image=/images/releases/styling/text.png alt="Text styling options"}
**Text** gets alignment, a max width, background and text colors, rounded corners, padding, a solid or dashed border, and a shadow. Links inside text take the text's own color, underlined.
:::
:::item{image=/images/releases/styling/contact-card.png alt="Contact Card styling options"}
**Contact Card** gets a shadow, and photos cropped to a square. Pick which square of the photo shows, and adjust it later without uploading again.
:::
::::

### More in the editor

::::carousel-list
:::item{image=/images/releases/editor/color-picker.png alt="The new color picker"}
**A new color picker.** Every color field in the editor has transparency and an eye dropper.
:::
:::item{image=/images/releases/editor/share-preview.png alt="The Share Preview tab"}
**Share Preview.** A new tab sets what a shared link shows: a title, a description, and a preview image. The image can be a screenshot of the page, any image or video on the page, an upload, or an image from the Media Library. The same image shows on page cards, Page Overview, and email embeds.
:::
:::item{image=/images/releases/editor/right-click.png alt="A block's right-click menu"}
**Right-click a block** in the preview to move it up or down, duplicate it, or delete it.
:::
:::item{image=/images/releases/editor/delete-key.png alt="A finger pressing the delete key on a laptop keyboard"}
**Delete or Backspace** removes the selected block. Undo brings it back.
:::
:::item{image=/images/releases/editor/media-library.png alt="The page editor toolbar with Save Draft and the more-actions menu open"}
**A tidier Media Library.** Media you upload or record in an editor enters the library when you save a draft, publish, or save a template that uses it. A recording you throw away stays out.
:::
::::

:::::columns
::::column
## Pages and campaigns lists

- **See what is live.** Each page and campaign card shows **Draft**, **Published**, or **Partially published**, and the campaigns table has a Publishing column. A live page with a saved draft shows that draft as its own row, with an Edit button.
- **Status filter.** Page statuses are simplified to **Published** or **Draft**, in place of Active, Unused, Errored, Under Review, and Removed. The Pages list filters by All, Published, or Drafts.
- **Save Draft knows when there is something to save.** The button is available only when you have unsaved changes, and its tooltip says why when it is off.
::::
::::column
![The Pages list filtered to All, with a published page and its saved draft below it](/images/releases/page-statuses.png)
::::
:::::

## Campaigns

![The Create Campaign form with the Owner, Page Names, and Start with a page template fields](/images/releases/create-campaign.png)

- **Page names.** Every page a campaign creates gets a name from a pattern, which starts as **{{SN_CAMPAIGN}} {{SN_UNIT}}**. Change the pattern on Campaign Overview to rename every page.
- **Start with a page template.** A collectively managed campaign can start from one of your page templates, for workspaces with Page Templates.
- **Choose the owner.** An Owner dropdown replaces "Assign me as the page owner." The person you choose owns the campaign and every page it creates.
- **Transfer with a new owner.** When you move a campaign to another workspace, choose who owns it there. You are warned before any page owner changes.
- **Large campaigns save in one go.** Campaigns of any size, up to 30,000 pages, save drafts and publish without an error.

## Analytics

- **Bots no longer count.** Page loads, video plays, clicks, sessions, and the Real Time list leave out visits flagged as automated browsers, such as crawlers and link previewers. Your numbers from this release on may be lower, and closer to real visitors.
- **vCard Downloads.** Campaign analytics, a page's Analytics tab, and the Dashboard count contact card downloads, next to page loads, video plays, and clicks.
- **Meeting scheduler activity.** Calendly and HubSpot Meetings blocks record **Scheduler Engaged** and **Meeting Booked**. Nothing about the visitor or the meeting is stored.
- **More clicks counted.** Clicks on an Image block that has a link, and on links inside a Text block, now count as clicks.
- **Totals that agree.** A page's Analytics tab shows the same totals as the Pages list and the Dashboard.
- **Tracking parameters on more links.** Links on images, Link List rows, text blocks, and Contact Card websites carry the page's tracking parameters (eg: ?snclid=[pageId]&utm_source=spokenote), as buttons already did.
- **Edit bar.** The bar on a live page shows its session count, with page loads, video plays, and clicks on hover.

## Workspace

- **Verify your email.** The notice now sits at the top of the Dashboard. Until you verify, buttons that create or change content stay visible but greyed out, and hovering explains why. If you already have an account and accept an invite sent to that address, you are verified.
- **Edit bar.** Edit Page opens the page editor directly, and Hide Edit Bar is now a small ×. Workspace members see the bar on every page, including pages waiting for their first upload.
- **Unsaved media warning.** If you leave a page with media you have picked or recorded but not published, Spokenote asks you to Leave or Stay.
- **Faster-feeling loading.** Main screens show a gray outline of the screen while they load, instead of "Loading...".
- **Fewer scrollbars.** Scroll areas use one slim scrollbar that appears only while you hover or scroll to reduce the visible scrollbars in the app.

## Bug Fixes

- Video Editor sections can be dragged again in Safari on a Mac and in every browser on phones and tablets.
- Page templates keep empty clip sections. A template saved before this release has lost them: save it again from the page to get them back.
- Email embed thumbnails show portrait phone photos upright.
- A video recorded in the page builder is saved to the Media Library once, not twice.
- Signing up with an email that is already in use says so, instead of showing an internal error.
- Text block quotes and combined formatting save correctly, and Button and Image links handle spaces.
- Views of a page that has no content yet no longer show in activity lists or add to Sessions.

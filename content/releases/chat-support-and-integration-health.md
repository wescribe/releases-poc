---
title: Chat support, a knowledge base link, and integration health at a glance
summary: Reach support and the knowledge base from your profile menu, and see and fix integration connections yourself.
date: 2026-07-14
version: 2.17.0
hero: /images/releases/support-chat-knowledge-base.png
---
:::::columns
::::column
## Support

**Chat Support.** Under the profile dropdown, "Help" has been renamed to "Chat Support".

**Knowledge Base.** A separate link under the profile dropdown opens the Knowledge Base in a new browser tab.
::::
::::column
![Profile menu with Chat Support and Knowledge Base](/images/releases/chat-support-and-integration-health-shot-1.svg)
::::
:::::

:::::columns
::::column
## Campaigns created by integrations

- Imported contacts with empty values for a metafield are now skipped as expected, instead of forcing a Manual Clip to be created.
- The default Spokenote campaign name now includes the date and time, to tell it apart from other campaigns created from the same segment of contacts. For example: Leads - 2026-07-09 12:24 PM.
::::
::::column
## Integration Settings

The health status on the Integration settings page now reflects the real-time status more accurately, and you can Disconnect or Reconnect the integration yourself.
::::
:::::

## Pages and Workspaces

**Access Page.** The Edit Bar is now hidden until the video has finished uploading.

**Workspace Users List.** This table is now sorted by status, with the Owner listed first: Active, then Invited, then Removed.

## Bug Fixes

- **Analytics tracking in preview mode.** The `?preview` query parameter now stops analytics tracking as expected.
- **Video Thumbnails.** Video thumbnails now display correctly.
- **User with no workspaces.** If you are signed in but not a member of any workspace, you are now offered the choice to create a personal workspace or log out. Previously you could get stuck in a loop.

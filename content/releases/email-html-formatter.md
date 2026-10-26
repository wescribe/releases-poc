---
title: Put each recipient's Spokenote video in your email campaigns
summary: The new Email HTML Formatter generates the HTML that embeds a personal video thumbnail for every recipient, formatted for your email platform. Pick a platform, point it at your Spokenote URL field, and copy the code.
date: 2026-09-08
hero: /images/releases/email-html-tool.png
---
:::callout{type=note}
**Placeholder draft.** These notes were written from the public tool page and will be replaced with the real release notes.
:::

## Email HTML Formatter

A new standalone tool at [emailhtml.spokenote.com](https://emailhtml.spokenote.com) generates the email HTML for embedding each recipient's personal Spokenote video in a campaign sent from your email platform. Pick your platform, point it at the field that holds each recipient's Spokenote page URL, set a fallback, adjust the thumbnail, and copy the HTML.

- **Choose your platform.** Select the email platform you send from. Mailchimp is available at launch.
- **Specify your variable.** Tell the tool which custom field holds each recipient's unique Spokenote page URL. This is the `SN_URL` column from your Spokenote CSV export, and the URL starts with `https://spkno.co/a/`.

### Supported Platforms

- [Mailchimp](https://emailhtml.spokenote.com/?platform=mailchimp)
- [Constant Contact](https://emailhtml.spokenote.com/?platform=constant-contact)
- [HubSpot](https://emailhtml.spokenote.com/?platform=hubspot)
- [Salesforce Marketing Cloud](https://emailhtml.spokenote.com/?platform=sfmc)
- [Brevo (formerly Sendinblue)](https://emailhtml.spokenote.com/?platform=brevo)
- [MailerLite](https://emailhtml.spokenote.com/?platform=mailerlite)
- [Klaviyo](https://emailhtml.spokenote.com/?platform=klaviyo)
- [ActiveCampaign](https://emailhtml.spokenote.com/?platform=activecampaign)
- [Kit (formerly ConvertKit)](https://emailhtml.spokenote.com/?platform=kit)
- [GetResponse](https://emailhtml.spokenote.com/?platform=getresponse)
- [Campaign Monitor](https://emailhtml.spokenote.com/?platform=campaign-monitor)
- [Mailjet](https://emailhtml.spokenote.com/?platform=mailjet)
- [Omnisend](https://emailhtml.spokenote.com/?platform=omnisend)
- [Adobe Marketo Engage](https://emailhtml.spokenote.com/?platform=marketo)

:::callout{type=tip}
**Conditional fallback.** Decide what a recipient sees when their field has no value, instead of a broken link: nothing, or a fallback video. Choosing the video option asks for a fallback Spokenote page URL.
:::

:::::columns
::::column
## Thumbnail settings

**Max width.** Control how large the video thumbnail appears in the email, in pixels.

**Alt text.** Describe the thumbnail for screen readers and for recipients who have images turned off.

**Alignment.** Place the thumbnail on the left, center, or right.
::::
::::column
## Get the code

**Copy HTML.** The generated HTML, formatted for your platform, appears in a panel with a Copy HTML button. Paste it into a code block in your email template.
::::
:::::

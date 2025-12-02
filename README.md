# UnquoteMail

TypeScript port of [unquotemail](https://github.com/getfernand/unquotemail) - parse HTML/text emails and extract only the new message content, removing quoted replies. This fork adds html cleaning, markdown output support, getQuote method and performance optimizations.

## Installation

```bash
npm install unquotemail
```

## Usage

```typescript
import { Unquote } from 'unquotemail';

// Create instance - parsing is lazy (happens on first getter call)
const unquote = new Unquote(htmlContent, textContent);

// Primary content (reply history stripped)
unquote.getHtml();              // Cleaned HTML (default)
unquote.getHtml({ raw: true }); // Raw HTML (original structure)
unquote.getText();              // Plain text
unquote.getMarkdown();          // Markdown

// The stripped quote block
unquote.getQuote();             // Quote HTML (null if none)
```

### Standalone Converters

```typescript
import { htmlToText, htmlToMarkdown } from 'unquotemail';

const text = htmlToText(html);
const markdown = htmlToMarkdown(html);
```

### Markdown Converter Features

The markdown converter (used by both `getMarkdown()` and `htmlToMarkdown()`) is optimized for email HTML:

- Flattens layout tables (common in email templates) instead of rendering them as markdown tables
- Ignores data URI images, scripts, and styles
- Handles non-standard HTML from various email clients
- Preserves nested blockquotes with proper `>` syntax

## How it works

1. First tries to identify and remove known quote markup (`.gmail_quote`, `.protonmail_quote`, etc.)
2. Falls back to regex patterns to identify "On DATE, NAME wrote:" style headers
3. Removes everything from the quote marker onwards

## Credits

- Original Python implementation by [Cyril Nicodeme](https://github.com/getfernand/unquotemail)
- Regex patterns from [Talon (Mailgun)](https://github.com/mailgun/talon) and [Email Reply Parser (Crisp)](https://github.com/crisp-oss/email-reply-parser)
- Markdown conversion by [node-html-markdown](https://github.com/crosstype/node-html-markdown)

## License

MIT

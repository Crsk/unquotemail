# UnquoteMail

TypeScript port of [unquotemail](https://github.com/getfernand/unquotemail) - parse HTML/text emails and extract only the new message content, removing quoted replies.

Cloudflare Worker compatible.

## Installation

```bash
npm install unquotemail
```

## Usage

```typescript
import { Unquote } from 'unquotemail';

const unquote = new Unquote(htmlContent, textContent);

console.log(unquote.getHtml());  // HTML without quoted replies
console.log(unquote.getText());  // Text without quoted replies
```

### Options

```typescript
// Don't parse immediately
const unquote = new Unquote(html, text, { parse: false });
unquote.parse();  // Parse manually later
```

## How it works

1. First tries to identify and remove known quote markup (`.gmail_quote`, `.protonmail_quote`, etc.)
2. Falls back to regex patterns to identify "On DATE, NAME wrote:" style headers
3. Removes everything from the quote marker onwards

## Credits

- Original Python implementation by [Cyril Nicodeme](https://github.com/getfernand/unquotemail)
- Regex patterns from [Talon (Mailgun)](https://github.com/mailgun/talon) and [Email Reply Parser (Crisp)](https://github.com/crisp-oss/email-reply-parser)

## License

MIT

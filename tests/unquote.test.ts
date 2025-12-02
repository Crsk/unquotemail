import { describe, it, expect } from 'vitest';
import { Unquote } from '../src/unquote';
import { htmlToMarkdown } from '../src/htmlToMarkdown';
import * as fs from 'fs';
import * as path from 'path';

const SAMPLE_DIR = 'samples';
const EXPECTED_DIR = 'expecteds';

function getSampleExpectedFiles(): [string, string][] {
  const samplesPath = path.join(__dirname, SAMPLE_DIR);
  const sampleFiles = fs.readdirSync(samplesPath);

  return sampleFiles
    .filter((f: string) => !fs.statSync(path.join(samplesPath, f)).isDirectory())
    .map((f: string): [string, string] => [f, f]);
}

describe('Unquote', () => {
  const testCases = getSampleExpectedFiles();

  it.each(testCases)('should parse %s correctly', (sampleFilename, expectedFilename) => {
    const samplePath = path.join(__dirname, SAMPLE_DIR, sampleFilename);
    const expectedPath = path.join(__dirname, EXPECTED_DIR, expectedFilename);

    // Skip if sample is a directory
    if (fs.statSync(samplePath).isDirectory()) {
      return;
    }

    const sampleContent = fs.readFileSync(samplePath, 'utf-8');

    let result: string | null = null;

    if (sampleFilename.endsWith('.html')) {
      const unquote = new Unquote(sampleContent, null);
      // Use raw: true to get original HTML structure (for backward compatibility with expected files)
      result = unquote.getHtml({ raw: true });
    } else if (sampleFilename.endsWith('.txt')) {
      const unquote = new Unquote(null, sampleContent);
      result = unquote.getText();
    } else {
      // Skip non-html/txt files
      return;
    }

    expect(result).not.toBeNull();

    if (fs.existsSync(expectedPath)) {
      const expectedContent = fs.readFileSync(expectedPath, 'utf-8');
      expect(result).toBe(expectedContent);
    } else {
      // Create expected file if it doesn't exist (prefixed with _)
      const newExpectedPath = path.join(__dirname, EXPECTED_DIR, '_' + expectedFilename);
      fs.writeFileSync(newExpectedPath, result || '');
      console.warn(`Expected file ${expectedFilename} was not found. Created a new one.`);
    }
  });
});

describe('htmlToMarkdown', () => {
  describe('basic formatting', () => {
    it('should convert simple HTML to markdown', () => {
      const html = '<p>Hello <strong>world</strong></p>';
      const result = htmlToMarkdown(html);
      expect(result).toContain('Hello');
      expect(result).toContain('**world**');
    });

    it('should handle headers', () => {
      const html = '<h1>Title</h1><h2>Subtitle</h2><p>Content</p>';
      const result = htmlToMarkdown(html);
      expect(result).toContain('# Title');
      expect(result).toContain('## Subtitle');
      expect(result).toContain('Content');
    });

    it('should handle links', () => {
      const html = '<a href="https://example.com">Click here</a>';
      const result = htmlToMarkdown(html);
      expect(result).toContain('[Click here](https://example.com)');
    });

    it('should handle lists', () => {
      const html = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      const result = htmlToMarkdown(html);
      expect(result).toContain('Item 1');
      expect(result).toContain('Item 2');
    });

    it('should handle blockquotes', () => {
      const html = '<blockquote>Quoted text</blockquote>';
      const result = htmlToMarkdown(html);
      expect(result).toContain('> Quoted text');
    });

    it('should handle emphasis and strong', () => {
      const html = '<p><em>italic</em> and <strong>bold</strong></p>';
      const result = htmlToMarkdown(html);
      expect(result).toContain('_italic_');
      expect(result).toContain('**bold**');
    });

    it('should handle strikethrough', () => {
      const html = '<p><del>deleted</del> and <s>struck</s></p>';
      const result = htmlToMarkdown(html);
      expect(result).toContain('~~deleted~~');
      expect(result).toContain('~~struck~~');
    });

    it('should handle mixed inline styles (bold + italic)', () => {
      const html = '<p><strong><em>Bold and italic</em></strong></p>';
      const result = htmlToMarkdown(html);
      expect(result).toContain('**_Bold and italic_**');
    });

    it('should handle link with nested formatting', () => {
      const html = '<a href="https://example.com"><strong>Bold link</strong></a>';
      const result = htmlToMarkdown(html);
      expect(result).toContain('[**Bold link**](https://example.com)');
    });
  });

  describe('email layout tables', () => {
    it('should flatten layout tables (email-style)', () => {
      const html = `
        <table>
          <tr>
            <td>
              <p>Hello there,</p>
              <p>This is my text inside a layout table.</p>
            </td>
          </tr>
        </table>
      `;
      const result = htmlToMarkdown(html);
      // Should NOT contain table markdown syntax
      expect(result).not.toContain('|');
      expect(result).not.toMatch(/^-+$/m);
      // Should contain the text content
      expect(result).toContain('Hello there');
      expect(result).toContain('This is my text inside a layout table');
    });

    it('should flatten deeply nested layout tables', () => {
      const html = `
        <table><tr><td>
          <table><tr><td>
            <table><tr><td>Deep content</td></tr></table>
          </td></tr></table>
        </td></tr></table>
      `;
      const result = htmlToMarkdown(html);
      expect(result).toContain('Deep content');
      expect(result).not.toContain('|');
    });
  });

  describe('ignored elements', () => {
    it('should ignore script and style elements', () => {
      const html = '<p>Content</p><script>alert("xss")</script><style>.foo{}</style>';
      const result = htmlToMarkdown(html);
      expect(result).toContain('Content');
      expect(result).not.toContain('alert');
      expect(result).not.toContain('.foo');
    });

    it('should ignore head element', () => {
      const html = '<html><head><title>Page</title></head><body>Content</body></html>';
      const result = htmlToMarkdown(html);
      expect(result).toContain('Content');
      expect(result).not.toContain('Page');
    });

    it('should ignore data URI images', () => {
      const html = '<p>Text</p><img src="data:image/gif;base64,R0lGOD" alt="test">';
      const result = htmlToMarkdown(html);
      expect(result).toContain('Text');
      expect(result).not.toContain('data:');
      expect(result).not.toContain('![');
    });

    it('should ignore Outlook conditional comments', () => {
      const html = '<!--[if mso]><table><tr><td>MSO only</td></tr></table><![endif]--><p>Normal content</p>';
      const result = htmlToMarkdown(html);
      expect(result).toContain('Normal content');
      expect(result).not.toContain('MSO only');
    });
  });

  describe('email-specific elements', () => {
    it('should handle MS Office namespace elements (o:p)', () => {
      const html = '<o:p>Office paragraph</o:p><p>Normal paragraph</p>';
      const result = htmlToMarkdown(html);
      expect(result).toContain('Office paragraph');
      expect(result).toContain('Normal paragraph');
    });

    it('should handle legacy font tags', () => {
      const html = '<font color="red" size="3">Red text</font>';
      const result = htmlToMarkdown(html);
      expect(result).toContain('Red text');
    });

    it('should preserve text from mark (highlight) tags', () => {
      const html = '<p>This is <mark>highlighted</mark> text</p>';
      const result = htmlToMarkdown(html);
      expect(result).toContain('highlighted');
    });

    it('should preserve text from underline tags', () => {
      const html = '<p>This is <u>underlined</u> text</p>';
      const result = htmlToMarkdown(html);
      expect(result).toContain('underlined');
    });

    it('should preserve text from subscript/superscript', () => {
      const html = '<p>H<sub>2</sub>O and x<sup>2</sup></p>';
      const result = htmlToMarkdown(html);
      expect(result).toContain('H');
      expect(result).toContain('2');
      expect(result).toContain('O');
    });
  });

  describe('special characters and entities', () => {
    it('should decode HTML entities', () => {
      const html = '<p>&amp; &lt; &gt; &quot; &copy;</p>';
      const result = htmlToMarkdown(html);
      expect(result).toContain('&');
      expect(result).toContain('<');
      expect(result).toContain('>');
      expect(result).toContain('"');
      expect(result).toContain('©');
    });

    it('should handle special characters in URLs', () => {
      const html = '<a href="https://example.com/path?q=1&b=2#hash">Link</a>';
      const result = htmlToMarkdown(html);
      expect(result).toContain('https://example.com/path?q=1&b=2#hash');
    });
  });

  describe('nested blockquotes', () => {
    it('should handle nested blockquotes', () => {
      const html = '<blockquote>Level 1<blockquote>Level 2</blockquote></blockquote>';
      const result = htmlToMarkdown(html);
      expect(result).toContain('> Level 1');
      expect(result).toContain('>> Level 2');
    });
  });

  describe('images', () => {
    it('should convert images with alt and title', () => {
      const html = '<img src="https://example.com/img.png" alt="Description" title="Title">';
      const result = htmlToMarkdown(html);
      expect(result).toContain('![Description](https://example.com/img.png');
      expect(result).toContain('Title');
    });

    it('should handle images with only src', () => {
      const html = '<img src="https://example.com/img.png">';
      const result = htmlToMarkdown(html);
      expect(result).toContain('![](https://example.com/img.png)');
    });
  });

  describe('whitespace handling', () => {
    it('should normalize multiple spaces', () => {
      const html = '<p>   Multiple   spaces   </p>';
      const result = htmlToMarkdown(html);
      // Should not have excessive spaces
      expect(result).not.toMatch(/\s{3,}/);
      expect(result).toContain('Multiple');
      expect(result).toContain('spaces');
    });

    it('should handle empty paragraphs', () => {
      const html = '<p></p><p>Content</p><p></p>';
      const result = htmlToMarkdown(html);
      expect(result).toContain('Content');
    });
  });

  describe('code blocks', () => {
    it('should handle inline code', () => {
      const html = '<p>Use the <code>npm install</code> command</p>';
      const result = htmlToMarkdown(html);
      expect(result).toContain('`npm install`');
    });

    it('should handle code blocks', () => {
      const html = '<pre><code>function test() {\n  return true;\n}</code></pre>';
      const result = htmlToMarkdown(html);
      expect(result).toContain('```');
      expect(result).toContain('function test()');
    });
  });

  describe('horizontal rules', () => {
    it('should convert hr tags', () => {
      const html = '<p>Above</p><hr><p>Below</p>';
      const result = htmlToMarkdown(html);
      expect(result).toContain('---');
    });
  });
});

describe('Unquote.getMarkdown', () => {
  it('should return markdown from HTML input', () => {
    const html = '<p>Hello <strong>world</strong></p>';
    const unquote = new Unquote(html, null);
    const result = unquote.getMarkdown();
    expect(result).toContain('Hello');
    expect(result).toContain('**world**');
  });

  it('should return markdown from text input (via textToHtml)', () => {
    const text = 'Hello world';
    const unquote = new Unquote(null, text);
    const result = unquote.getMarkdown();
    expect(result).toContain('Hello world');
  });

  it('should remove quotes before converting to markdown', () => {
    const html = `
      <div>
        <p>This is my reply.</p>
        <div class="gmail_quote">
          <div class="gmail_attr">On Jan 1, John wrote:</div>
          <blockquote>Original message</blockquote>
        </div>
      </div>
    `;
    const unquote = new Unquote(html, null);
    const result = unquote.getMarkdown();
    expect(result).toContain('This is my reply');
    expect(result).not.toContain('Original message');
    expect(result).not.toContain('John wrote');
  });

  it('should cache markdown result', () => {
    const html = '<p>Test</p>';
    const unquote = new Unquote(html, null);
    const result1 = unquote.getMarkdown();
    const result2 = unquote.getMarkdown();
    expect(result1).toBe(result2);
  });

  it('should handle complex email HTML with layout tables', () => {
    const html = `
      <html>
        <body>
          <table width="100%">
            <tr>
              <td style="padding: 20px;">
                <p>Dear Customer,</p>
                <p>Thank you for your order.</p>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
    const unquote = new Unquote(html, null);
    const result = unquote.getMarkdown();
    expect(result).toContain('Dear Customer');
    expect(result).toContain('Thank you for your order');
    // Should not have table markdown
    expect(result).not.toMatch(/\|\s*---/);
  });
});

describe('Unquote.getQuote', () => {
  it('should return null when no quote exists', () => {
    const html = '<p>Hello world</p>';
    const unquote = new Unquote(html, null);
    expect(unquote.getQuote()).toBeNull();
  });

  it('should return quote HTML when Gmail quote exists', () => {
    const html = `
      <div>
        <p>This is my reply.</p>
        <div class="gmail_quote">
          <div class="gmail_attr">On Jan 1, John wrote:</div>
          <blockquote>Original message</blockquote>
        </div>
      </div>
    `;
    const unquote = new Unquote(html, null);
    const quote = unquote.getQuote();
    expect(quote).not.toBeNull();
    expect(quote).toContain('Original message');
    expect(quote).toContain('John wrote');
  });

  it('should extract quote from gmail_quote_container', () => {
    const html = `
      <div>
        <p>My response here.</p>
        <div class="gmail_quote_container">
          <div class="gmail_attr">On Dec 1, Alice wrote:</div>
          <blockquote class="gmail_quote">Previous conversation</blockquote>
        </div>
      </div>
    `;
    const unquote = new Unquote(html, null);
    const quote = unquote.getQuote();
    expect(quote).not.toBeNull();
    expect(quote).toContain('Previous conversation');
  });

  it('should not include quote in getHtml result', () => {
    const html = `
      <div>
        <p>This is my reply.</p>
        <div class="gmail_quote">
          <div class="gmail_attr">On Jan 1, John wrote:</div>
          <blockquote>Original message</blockquote>
        </div>
      </div>
    `;
    const unquote = new Unquote(html, null);
    const result = unquote.getHtml({ raw: true });
    expect(result).toContain('This is my reply');
    expect(result).not.toContain('Original message');
  });

  it('should return cleaned quote HTML by default', () => {
    const html = `
      <div>
        <p>My reply</p>
        <div class="gmail_quote">
          <div class="gmail_attr" style="mso-line-height-rule:exactly;font-family:Arial;">On Jan 1, John wrote:</div>
          <blockquote class="MsoNormal">Original message</blockquote>
        </div>
      </div>
    `;
    const unquote = new Unquote(html, null);
    const quote = unquote.getQuote();
    expect(quote).not.toBeNull();
    expect(quote).toContain('Original message');
    // MSO styles should be cleaned
    expect(quote).not.toContain('mso-line-height-rule');
    expect(quote).not.toContain('class="MsoNormal"');
  });

  it('should return raw quote HTML when raw: true', () => {
    const html = `
      <div>
        <p>My reply</p>
        <div class="gmail_quote">
          <div class="gmail_attr" style="mso-line-height-rule:exactly;">On Jan 1, John wrote:</div>
          <blockquote class="MsoNormal">Original message</blockquote>
        </div>
      </div>
    `;
    const unquote = new Unquote(html, null);
    const quote = unquote.getQuote({ raw: true });
    expect(quote).not.toBeNull();
    expect(quote).toContain('Original message');
    // Raw should preserve MSO styles
    expect(quote).toContain('mso-line-height-rule');
  });
});

describe('MS Outlook border-top variations', () => {
  // Helper to create Outlook-style HTML with different border-top formats
  const createOutlookHtml = (borderStyle: string, quoteChar: string = '"') => `
    <html><body>
    <div class="WordSection1">
      <p class="MsoNormal">Hi. This is my reply.</p>
      <div style=${quoteChar}border:none;${borderStyle}#B5C4DF 1.0pt;padding:3.0pt 0in 0in 0in${quoteChar}>
        <p class="MsoNormal"><b>From:</b> John Doe</p>
      </div>
      <p class="MsoNormal">Original message content here.</p>
    </div>
    </body></html>
  `;

  it('should handle border-top:solid (no space) with double quotes', () => {
    const html = createOutlookHtml('border-top:solid ', '"');
    const unquote = new Unquote(html, null);
    const result = unquote.getHtml({ raw: true });
    expect(result).toContain('This is my reply');
    expect(result).not.toContain('From:');
    expect(result).not.toContain('Original message content');
  });

  it('should handle border-top: solid (with space) with double quotes', () => {
    const html = createOutlookHtml('border-top: solid ', '"');
    const unquote = new Unquote(html, null);
    const result = unquote.getHtml({ raw: true });
    expect(result).toContain('This is my reply');
    expect(result).not.toContain('From:');
    expect(result).not.toContain('Original message content');
  });

  it('should handle border-top:solid (no space) with single quotes', () => {
    const html = createOutlookHtml('border-top:solid ', "'");
    const unquote = new Unquote(html, null);
    const result = unquote.getHtml({ raw: true });
    expect(result).toContain('This is my reply');
    expect(result).not.toContain('From:');
    expect(result).not.toContain('Original message content');
  });

  it('should handle border-top: solid (with space) with single quotes', () => {
    const html = createOutlookHtml('border-top: solid ', "'");
    const unquote = new Unquote(html, null);
    const result = unquote.getHtml({ raw: true });
    expect(result).toContain('This is my reply');
    expect(result).not.toContain('From:');
    expect(result).not.toContain('Original message content');
  });

  it('should handle border: none with space before border-top', () => {
    const html = `
      <html><body>
      <div class="WordSection1">
        <p class="MsoNormal">My response text.</p>
        <div style="border: none; border-top: solid #E1E1E1 1.0pt;padding:3.0pt 0in 0in 0in">
          <p class="MsoNormal"><b>From:</b> Jane Smith</p>
        </div>
        <p class="MsoNormal">Quoted content goes here.</p>
      </div>
      </body></html>
    `;
    const unquote = new Unquote(html, null);
    const result = unquote.getHtml({ raw: true });
    expect(result).toContain('My response text');
    expect(result).not.toContain('From:');
    expect(result).not.toContain('Quoted content');
  });

  it('should handle multiple spaces in border-top: solid', () => {
    const html = `
      <html><body>
      <div class="WordSection1">
        <p class="MsoNormal">My reply here.</p>
        <div style="border:none;border-top:  solid #B5C4DF 1.0pt;padding:3.0pt 0in 0in 0in">
          <p class="MsoNormal"><b>From:</b> Bob</p>
        </div>
        <p class="MsoNormal">The quote.</p>
      </div>
      </body></html>
    `;
    const unquote = new Unquote(html, null);
    const result = unquote.getHtml({ raw: true });
    expect(result).toContain('My reply here');
    expect(result).not.toContain('From:');
    expect(result).not.toContain('The quote');
  });

  it('should correctly extract quote when border-top has spacing variation', () => {
    const html = `
      <html><body>
      <div class="WordSection1">
        <p class="MsoNormal">Reply text.</p>
        <div style="border:none;border-top: solid #B5C4DF 1.0pt;padding:3.0pt 0in 0in 0in">
          <p class="MsoNormal"><b>From:</b> Sender</p>
        </div>
        <p class="MsoNormal">Quoted message.</p>
      </div>
      </body></html>
    `;
    const unquote = new Unquote(html, null);
    const quote = unquote.getQuote({ raw: true });
    expect(quote).not.toBeNull();
    expect(quote).toContain('From:');
    expect(quote).toContain('Quoted message');
  });

  it('should handle tabs in style attribute', () => {
    const html = `
      <html><body>
      <div class="WordSection1">
        <p class="MsoNormal">My reply.</p>
        <div style="border:none;\tborder-top:\tsolid #B5C4DF 1.0pt;padding:3.0pt 0in 0in 0in">
          <p class="MsoNormal"><b>From:</b> Tab User</p>
        </div>
        <p class="MsoNormal">Tab quote.</p>
      </div>
      </body></html>
    `;
    const unquote = new Unquote(html, null);
    const result = unquote.getHtml({ raw: true });
    expect(result).toContain('My reply');
    expect(result).not.toContain('From:');
  });

  it('should handle spaces before colons', () => {
    const html = `
      <html><body>
      <div class="WordSection1">
        <p class="MsoNormal">Reply here.</p>
        <div style="border :none;border-top :solid #B5C4DF 1.0pt;padding:3.0pt 0in 0in 0in">
          <p class="MsoNormal"><b>From:</b> Space Before</p>
        </div>
        <p class="MsoNormal">Quoted.</p>
      </div>
      </body></html>
    `;
    const unquote = new Unquote(html, null);
    const result = unquote.getHtml({ raw: true });
    expect(result).toContain('Reply here');
    expect(result).not.toContain('From:');
  });

  it('should handle different border color values', () => {
    const html = `
      <html><body>
      <div class="WordSection1">
        <p class="MsoNormal">My message.</p>
        <div style="border:none;border-top:solid #E1E1E1 1.0pt;padding:3.0pt 0in 0in 0in">
          <p class="MsoNormal"><b>From:</b> Different Color</p>
        </div>
        <p class="MsoNormal">Quote content.</p>
      </div>
      </body></html>
    `;
    const unquote = new Unquote(html, null);
    const result = unquote.getHtml({ raw: true });
    expect(result).toContain('My message');
    expect(result).not.toContain('From:');
  });

  it('should handle cm units (converted to in)', () => {
    const html = `
      <html><body>
      <div class="WordSection1">
        <p class="MsoNormal">CM units reply.</p>
        <div style="border:none;border-top:solid #B5C4DF 1.0pt;padding:3.0pt 0cm 0cm 0cm">
          <p class="MsoNormal"><b>From:</b> CM User</p>
        </div>
        <p class="MsoNormal">CM quote.</p>
      </div>
      </body></html>
    `;
    const unquote = new Unquote(html, null);
    const result = unquote.getHtml({ raw: true });
    expect(result).toContain('CM units reply');
    expect(result).not.toContain('From:');
  });

  it('should handle pt units (converted to in)', () => {
    const html = `
      <html><body>
      <div class="WordSection1">
        <p class="MsoNormal">PT units reply.</p>
        <div style="border:none;border-top:solid #B5C4DF 1.0pt;padding:3.0pt 0pt 0pt 0pt">
          <p class="MsoNormal"><b>From:</b> PT User</p>
        </div>
        <p class="MsoNormal">PT quote.</p>
      </div>
      </body></html>
    `;
    const unquote = new Unquote(html, null);
    const result = unquote.getHtml({ raw: true });
    expect(result).toContain('PT units reply');
    expect(result).not.toContain('From:');
  });

  it('should handle fully spaced style with all variations', () => {
    const html = `
      <html><body>
      <div class="WordSection1">
        <p class="MsoNormal">Full spacing reply.</p>
        <div style="border : none ; border-top : solid #B5C4DF 1.0pt ; padding : 3.0pt 0in 0in 0in">
          <p class="MsoNormal"><b>From:</b> Full Space User</p>
        </div>
        <p class="MsoNormal">Full space quote.</p>
      </div>
      </body></html>
    `;
    const unquote = new Unquote(html, null);
    const result = unquote.getHtml({ raw: true });
    expect(result).toContain('Full spacing reply');
    expect(result).not.toContain('From:');
  });
});

describe('getHtml raw option', () => {
  it('should return cleaned HTML by default', () => {
    const html = `
      <html><body>
        <p style="mso-line-height-rule:exactly;color:red;">Hello</p>
      </body></html>
    `;
    const unquote = new Unquote(html, null);
    const result = unquote.getHtml();
    expect(result).toContain('Hello');
    expect(result).not.toContain('mso-line-height-rule');
  });

  it('should return raw HTML when raw: true', () => {
    const html = `
      <html><body>
        <p style="mso-line-height-rule:exactly;color:red;">Hello</p>
      </body></html>
    `;
    const unquote = new Unquote(html, null);
    const result = unquote.getHtml({ raw: true });
    expect(result).toContain('Hello');
    expect(result).toContain('mso-line-height-rule');
  });
});

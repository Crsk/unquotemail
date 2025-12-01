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
    .filter((f) => !fs.statSync(path.join(samplesPath, f)).isDirectory())
    .map((f) => [f, f]);
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
      const unquote = new Unquote(sampleContent, null, { parse: false });
      unquote.parse();
      result = unquote.getHtml();
    } else if (sampleFilename.endsWith('.txt')) {
      const unquote = new Unquote(null, sampleContent, { parse: false });
      unquote.parse();
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
    expect(result).not.toContain('---');
    // Should contain the text content
    expect(result).toContain('Hello there');
    expect(result).toContain('This is my text inside a layout table');
  });

  it('should ignore script and style elements', () => {
    const html = '<p>Content</p><script>alert("xss")</script><style>.foo{}</style>';
    const result = htmlToMarkdown(html);
    expect(result).toContain('Content');
    expect(result).not.toContain('alert');
    expect(result).not.toContain('.foo');
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

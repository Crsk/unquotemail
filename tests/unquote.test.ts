import { describe, it, expect } from 'vitest';
import { Unquote } from '../src/unquote';
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

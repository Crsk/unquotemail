import { describe, it, expect } from 'vitest';
import { Unquote } from '../src/unquote';

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

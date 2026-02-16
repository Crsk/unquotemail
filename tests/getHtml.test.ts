import { describe, it, expect } from 'vitest';
import { Unquote } from '../src/unquote';

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

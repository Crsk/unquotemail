import { describe, it, expect } from 'vitest';
import { Unquote } from '../src/unquote';

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

import { describe, it, expect } from 'vitest';
import { Unquote } from '../src/unquote';

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

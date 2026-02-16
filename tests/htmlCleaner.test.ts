import { describe, it, expect } from 'vitest';
import { cleanEmailHtml } from '../src/htmlCleaner';

describe('cleanEmailHtml', () => {
  describe('empty / falsy input', () => {
    it('should return empty string for empty input', () => {
      expect(cleanEmailHtml('')).toBe('');
    });

    it('should return empty string for null-ish input', () => {
      // @ts-expect-error testing runtime behavior
      expect(cleanEmailHtml(null)).toBe('');
      // @ts-expect-error testing runtime behavior
      expect(cleanEmailHtml(undefined)).toBe('');
    });
  });

  describe('body tag extraction', () => {
    it('should extract only body content when body tag exists', () => {
      const html = '<html><head><title>Page</title></head><body><p>Content</p></body></html>';
      expect(cleanEmailHtml(html)).toBe('<p>Content</p>');
    });

    it('should capture everything when no body tag exists', () => {
      const html = '<p>Content without body</p>';
      expect(cleanEmailHtml(html)).toBe('<p>Content without body</p>');
    });

    it('should stop capturing after body closes', () => {
      const html = '<body><p>Inside</p></body><p>Outside</p>';
      expect(cleanEmailHtml(html)).toBe('<p>Inside</p>');
    });
  });

  describe('skip tags', () => {
    it('should remove head and its content', () => {
      const full = '<html><head><meta charset="utf-8"><title>Title</title></head><body><p>Keep</p></body></html>';
      expect(cleanEmailHtml(full)).toBe('<p>Keep</p>');
    });

    it('should remove style elements', () => {
      const html = '<style>.foo { color: red; }</style><p>Keep</p>';
      expect(cleanEmailHtml(html)).toBe('<p>Keep</p>');
    });

    it('should remove script elements', () => {
      const html = '<script>alert("xss")</script><p>Keep</p>';
      expect(cleanEmailHtml(html)).toBe('<p>Keep</p>');
    });

    it('should remove title elements', () => {
      const html = '<title>Page Title</title><p>Keep</p>';
      expect(cleanEmailHtml(html)).toBe('<p>Keep</p>');
    });

    it('should remove link elements', () => {
      const html = '<link rel="stylesheet" href="style.css"><p>Keep</p>';
      expect(cleanEmailHtml(html)).toBe('<p>Keep</p>');
    });

    it('should remove xml elements', () => {
      const html = '<xml><o:OfficeDocumentSettings></o:OfficeDocumentSettings></xml><p>Keep</p>';
      expect(cleanEmailHtml(html)).toBe('<p>Keep</p>');
    });

    it('should remove o:p elements', () => {
      const html = '<p>Before<o:p>&nbsp;</o:p>After</p>';
      expect(cleanEmailHtml(html)).toBe('<p>BeforeAfter</p>');
    });

    it('should handle nested skip tags', () => {
      const html = '<style><style>nested</style></style><p>Keep</p>';
      expect(cleanEmailHtml(html)).toBe('<p>Keep</p>');
    });
  });

  describe('namespace / colon tags', () => {
    it('should skip tags containing colons (namespace elements)', () => {
      const html = '<v:shape>shape content</v:shape><p>Keep</p>';
      expect(cleanEmailHtml(html)).toBe('<p>Keep</p>');
    });

    it('should skip w:WordDocument and its content', () => {
      const html = '<w:WordDocument><w:View>Normal</w:View></w:WordDocument><p>Keep</p>';
      expect(cleanEmailHtml(html)).toBe('<p>Keep</p>');
    });

    it('should handle nested namespace elements', () => {
      const html = '<v:rect><v:fill color="red"></v:fill></v:rect><p>Keep</p>';
      expect(cleanEmailHtml(html)).toBe('<p>Keep</p>');
    });
  });

  describe('attribute stripping', () => {
    it('should remove class attributes', () => {
      const html = '<p class="MsoNormal">Text</p>';
      expect(cleanEmailHtml(html)).toBe('<p>Text</p>');
    });

    it('should remove lang attributes', () => {
      const html = '<p lang="en-US">Text</p>';
      expect(cleanEmailHtml(html)).toBe('<p>Text</p>');
    });

    it('should remove xmlns attributes', () => {
      const html = '<div xmlns:v="urn:schemas-microsoft-com:vml">Text</div>';
      expect(cleanEmailHtml(html)).toBe('<div>Text</div>');
    });

    it('should remove o: prefixed attributes', () => {
      const html = '<p o:gfxdata="abc123">Text</p>';
      expect(cleanEmailHtml(html)).toBe('<p>Text</p>');
    });

    it('should remove v: prefixed attributes', () => {
      const html = '<div v:ext="edit">Text</div>';
      expect(cleanEmailHtml(html)).toBe('<div>Text</div>');
    });

    it('should remove data- prefixed attributes', () => {
      const html = '<div data-id="123" data-custom="value">Text</div>';
      expect(cleanEmailHtml(html)).toBe('<div>Text</div>');
    });

    it('should preserve href attributes', () => {
      const html = '<a href="https://example.com">Link</a>';
      expect(cleanEmailHtml(html)).toBe('<a href="https://example.com">Link</a>');
    });

    it('should preserve src attributes', () => {
      const html = '<img src="https://example.com/img.png">';
      const result = cleanEmailHtml(html);
      expect(result).toContain('src="https://example.com/img.png"');
    });

    it('should preserve id attributes', () => {
      const html = '<div id="content">Text</div>';
      expect(cleanEmailHtml(html)).toBe('<div id="content">Text</div>');
    });

    it('should escape double quotes in attribute values', () => {
      const html = '<a href="https://example.com?a=1&quot;b=2">Link</a>';
      const result = cleanEmailHtml(html);
      expect(result).toContain('&quot;');
    });
  });

  describe('style attribute cleaning', () => {
    it('should remove mso- prefixed style properties', () => {
      const html = '<p style="mso-line-height-rule:exactly;color:red;">Text</p>';
      expect(cleanEmailHtml(html)).toBe('<p style="color:red">Text</p>');
    });

    it('should remove font- prefixed style properties', () => {
      const html = '<p style="font-family:Arial;color:blue;">Text</p>';
      expect(cleanEmailHtml(html)).toBe('<p style="color:blue">Text</p>');
    });

    it('should remove line-height property', () => {
      const html = '<p style="line-height:1.5;color:green;">Text</p>';
      expect(cleanEmailHtml(html)).toBe('<p style="color:green">Text</p>');
    });

    it('should remove properties containing autospace', () => {
      const html = '<p style="mso-fareast-font-family:serif;text-autospace:none;color:red;">Text</p>';
      expect(cleanEmailHtml(html)).toBe('<p style="color:red">Text</p>');
    });

    it('should drop style attribute entirely when all properties are removed', () => {
      const html = '<p style="mso-line-height-rule:exactly;font-family:Arial;line-height:1.5;">Text</p>';
      expect(cleanEmailHtml(html)).toBe('<p>Text</p>');
    });

    it('should keep non-MSO style properties', () => {
      const html = '<div style="color:red;background:blue;padding:10px;">Text</div>';
      expect(cleanEmailHtml(html)).toBe('<div style="color:red;background:blue;padding:10px">Text</div>');
    });
  });

  describe('void tags', () => {
    it('should self-close img tags', () => {
      const html = '<img src="test.png" alt="test">';
      const result = cleanEmailHtml(html);
      expect(result).toContain('<img');
      expect(result).toContain('/>');
      expect(result).not.toContain('</img>');
    });

    it('should self-close br tags', () => {
      const html = '<p>Line 1<br>Line 2</p>';
      const result = cleanEmailHtml(html);
      expect(result).toContain('<br />');
    });

    it('should self-close hr tags', () => {
      const html = '<p>Above</p><hr><p>Below</p>';
      const result = cleanEmailHtml(html);
      expect(result).toContain('<hr />');
    });

    it('should not emit close tags for void elements', () => {
      const html = '<p>Text<br>More</p>';
      const result = cleanEmailHtml(html);
      expect(result).not.toContain('</br>');
    });
  });

  describe('comments', () => {
    it('should remove HTML comments', () => {
      const html = '<!-- comment --><p>Keep</p>';
      expect(cleanEmailHtml(html)).toBe('<p>Keep</p>');
    });

    it('should remove MSO conditional comments', () => {
      const html = '<!--[if mso]><table><tr><td>MSO</td></tr></table><![endif]--><p>Keep</p>';
      const result = cleanEmailHtml(html);
      expect(result).toContain('Keep');
      expect(result).not.toContain('MSO');
    });
  });

  describe('text content', () => {
    it('should preserve text content', () => {
      const html = '<p>Hello world</p>';
      expect(cleanEmailHtml(html)).toBe('<p>Hello world</p>');
    });

    it('should not capture text inside skip tags', () => {
      const html = '<script>var x = 1;</script><p>Keep</p>';
      expect(cleanEmailHtml(html)).toBe('<p>Keep</p>');
    });

    it('should not capture text outside body when body exists', () => {
      const html = '<html>Outside<body><p>Inside</p></body></html>';
      expect(cleanEmailHtml(html)).toBe('<p>Inside</p>');
    });

    it('should trim output whitespace', () => {
      const html = '  <p>Content</p>  ';
      expect(cleanEmailHtml(html)).toBe('<p>Content</p>');
    });
  });

  describe('tag casing', () => {
    it('should lowercase tag names (htmlparser2 behavior)', () => {
      const html = '<DIV><P>Text</P></DIV>';
      const result = cleanEmailHtml(html);
      expect(result).toBe('<div><p>Text</p></div>');
    });
  });

  describe('complex real-world emails', () => {
    it('should clean a typical Outlook email', () => {
      const html = `
        <html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
        <head>
          <meta charset="utf-8">
          <style>body { font-family: Arial; }</style>
        </head>
        <body>
          <div class="WordSection1">
            <p class="MsoNormal" style="mso-line-height-rule:exactly;font-family:Calibri;color:black;">
              Hello, this is a test email.
            </p>
            <o:p>&nbsp;</o:p>
          </div>
        </body>
        </html>
      `;
      const result = cleanEmailHtml(html);
      expect(result).toContain('Hello, this is a test email.');
      expect(result).not.toContain('mso-line-height-rule');
      expect(result).not.toContain('class=');
      expect(result).not.toContain('font-family');
      expect(result).not.toContain('WordSection1');
      expect(result).not.toContain('MsoNormal');
      expect(result).not.toContain('xmlns');
      expect(result).toContain('style="color:black"');
    });

    it('should clean an email with mixed namespace elements', () => {
      const html = `
        <v:rect style="width:100px">
          <v:fill color="red" />
        </v:rect>
        <p>Actual content</p>
        <w:WordDocument><w:View>Normal</w:View></w:WordDocument>
      `;
      const result = cleanEmailHtml(html);
      expect(result).toBe('<p>Actual content</p>');
    });
  });
});

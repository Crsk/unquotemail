import { describe, it, expect } from 'vitest';
import { htmlToMarkdown } from '../src/htmlToMarkdown';

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
    it('should flatten single-column layout tables (no pipes)', () => {
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
      // Single-cell rows should NOT have pipes
      expect(result).not.toContain('|');
      expect(result).not.toMatch(/^-+$/m);
      expect(result).toContain('Hello there');
      expect(result).toContain('This is my text inside a layout table');
    });

    it('should flatten deeply nested single-column tables (no pipes)', () => {
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

  describe('multi-column table cell pipe separator', () => {
    it('should separate two cells in a row with pipe', () => {
      const html = '<table><tr><td>Left</td><td>Right</td></tr></table>';
      const result = htmlToMarkdown(html);
      expect(result).toContain('Left | Right');
    });

    it('should separate three cells with pipes', () => {
      const html = '<table><tr><td>A</td><td>B</td><td>C</td></tr></table>';
      const result = htmlToMarkdown(html);
      expect(result).toContain('A | B | C');
    });

    it('should not have leading or trailing pipes on rows', () => {
      const html = '<table><tr><td>A</td><td>B</td></tr></table>';
      const result = htmlToMarkdown(html);
      // No leading pipe (that would look like markdown table syntax)
      expect(result).not.toMatch(/^\s*\|/m);
      // No trailing pipe
      expect(result).not.toMatch(/\|\s*$/m);
    });

    it('should not produce markdown table separator lines', () => {
      const html = `
        <table>
          <tr><th>Name</th><th>Value</th></tr>
          <tr><td>Key</td><td>123</td></tr>
        </table>
      `;
      const result = htmlToMarkdown(html);
      // Should NOT have markdown table separator like | --- | --- |
      expect(result).not.toMatch(/\|\s*-+\s*\|/);
      // But should have pipe separators between cells
      expect(result).toContain('Name | Value');
      expect(result).toContain('Key | 123');
    });

    it('should handle mixed single and multi-column rows', () => {
      const html = `
        <table>
          <tr><td>Full width header</td></tr>
          <tr><td>Left</td><td>Right</td></tr>
          <tr><td>Full width footer</td></tr>
        </table>
      `;
      const result = htmlToMarkdown(html);
      // Multi-cell row gets pipe
      expect(result).toContain('Left | Right');
      // Single-cell rows should NOT have pipes
      expect(result).toMatch(/Full width header/);
      expect(result).not.toMatch(/Full width header\s*\|/);
      expect(result).not.toMatch(/\|\s*Full width footer/);
    });

    it('should separate cells with formatted text', () => {
      const html = '<table><tr><td><strong>Bold</strong></td><td><em>Italic</em></td></tr></table>';
      const result = htmlToMarkdown(html);
      expect(result).toContain('**Bold** | _Italic_');
    });

    it('should separate cells with links', () => {
      const html = `
        <table><tr>
          <td><a href="https://example.com">Link A</a></td>
          <td><a href="https://other.com">Link B</a></td>
        </tr></table>
      `;
      const result = htmlToMarkdown(html);
      expect(result).toContain('[Link A](https://example.com) | [Link B](https://other.com)');
    });

    it('should separate cells with images', () => {
      const html = `
        <table><tr>
          <td><img src="https://example.com/a.png" alt="Icon A"></td>
          <td><img src="https://example.com/b.png" alt="Icon B"></td>
        </tr></table>
      `;
      const result = htmlToMarkdown(html);
      expect(result).toMatch(/Icon A.*\|.*Icon B/);
    });

    it('should handle multi-row multi-column tables', () => {
      const html = `
        <table>
          <tr><td>R1C1</td><td>R1C2</td></tr>
          <tr><td>R2C1</td><td>R2C2</td></tr>
          <tr><td>R3C1</td><td>R3C2</td></tr>
        </table>
      `;
      const result = htmlToMarkdown(html);
      expect(result).toContain('R1C1 | R1C2');
      expect(result).toContain('R2C1 | R2C2');
      expect(result).toContain('R3C1 | R3C2');
    });

    it('should pipe-separate inner multi-column table nested inside single-column outer table', () => {
      const html = `
        <table><tr><td>
          <table><tr><td>Inner Left</td><td>Inner Right</td></tr></table>
        </td></tr></table>
      `;
      const result = htmlToMarkdown(html);
      expect(result).toContain('Inner Left | Inner Right');
    });

    it('should handle DHL-style contact table with icons and labels', () => {
      const html = `
        <table align="center" border="0" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center"><img src="https://example.com/whatsapp.png" alt="whatsapp" width="50"></td>
            <td align="center"><img src="https://example.com/app.png" alt="mobile_app" width="50"></td>
          </tr>
          <tr>
            <td align="center">Contact us on Whatsapp</td>
            <td align="center">Download our app</td>
          </tr>
          <tr>
            <td align="center">+1(954)953-3545</td>
            <td align="center">DHL Express Mobile</td>
          </tr>
        </table>
      `;
      const result = htmlToMarkdown(html);
      expect(result).toContain('Contact us on Whatsapp | Download our app');
      expect(result).toContain('+1(954)953-3545 | DHL Express Mobile');
    });

    it('should handle newsletter-style multi-column layout', () => {
      const html = `
        <table width="600">
          <tr>
            <td width="300">
              <h3>Article 1</h3>
              <p>Summary of article one.</p>
            </td>
            <td width="300">
              <h3>Article 2</h3>
              <p>Summary of article two.</p>
            </td>
          </tr>
        </table>
      `;
      const result = htmlToMarkdown(html);
      // Both articles should be present and pipe-separated at the row level
      expect(result).toContain('Article 1');
      expect(result).toContain('Article 2');
      // The row containing the two cells should have a pipe
      expect(result).toMatch(/Article 1[\s\S]*?\|[\s\S]*?Article 2/);
    });

    it('should handle email footer with social media links in columns', () => {
      const html = `
        <table>
          <tr>
            <td><a href="https://twitter.com/co">Twitter</a></td>
            <td><a href="https://facebook.com/co">Facebook</a></td>
            <td><a href="https://linkedin.com/co">LinkedIn</a></td>
          </tr>
        </table>
      `;
      const result = htmlToMarkdown(html);
      expect(result).toMatch(/Twitter.*\|.*Facebook.*\|.*LinkedIn/);
    });

    it('should handle cells containing block elements (p tags)', () => {
      const html = `
        <table><tr>
          <td><p>Paragraph in cell 1</p></td>
          <td><p>Paragraph in cell 2</p></td>
        </tr></table>
      `;
      const result = htmlToMarkdown(html);
      expect(result).toMatch(/Paragraph in cell 1.*\|.*Paragraph in cell 2/);
    });

    it('should preserve pipe separator inside blockquote context', () => {
      // When an email with tables is inside a blockquote (forwarded message)
      const html = `
        <blockquote>
          <table><tr>
            <td>Quoted Left</td>
            <td>Quoted Right</td>
          </tr></table>
        </blockquote>
      `;
      const result = htmlToMarkdown(html);
      expect(result).toContain('Quoted Left | Quoted Right');
    });

    it('should not produce trailing pipe when last cell is empty', () => {
      const html = '<table><tr><td>Content</td><td></td></tr></table>';
      const result = htmlToMarkdown(html);
      expect(result).not.toMatch(/\|\s*$/m);
      expect(result).toContain('Content');
    });

    it('should not produce leading pipe when first cell is empty', () => {
      const html = '<table><tr><td></td><td>Content</td></tr></table>';
      const result = htmlToMarkdown(html);
      expect(result).not.toMatch(/^\s*\|/m);
      expect(result).toContain('Content');
    });

    it('should not produce trailing pipe when last cell is whitespace-only', () => {
      const html = '<table><tr><td>Content</td><td>   </td></tr></table>';
      const result = htmlToMarkdown(html);
      expect(result).not.toMatch(/\|\s*$/m);
    });

    it('should not produce trailing pipe when last cell is nbsp-only', () => {
      const html = '<table><tr><td>Content</td><td>&nbsp;</td></tr></table>';
      const result = htmlToMarkdown(html);
      expect(result).not.toMatch(/\|\s*$/m);
    });

    it('should not produce trailing pipe when last cell has only br', () => {
      const html = '<table><tr><td>Content</td><td><br></td></tr></table>';
      const result = htmlToMarkdown(html);
      expect(result).not.toMatch(/\|\s*$/m);
    });

    it('should not produce any pipe when all cells are empty', () => {
      const html = '<table><tr><td></td><td></td></tr></table>';
      const result = htmlToMarkdown(html);
      expect(result).not.toContain('|');
    });

    it('should skip empty middle cell and still separate outer cells', () => {
      const html = '<table><tr><td>Left</td><td></td><td>Right</td></tr></table>';
      const result = htmlToMarkdown(html);
      expect(result).toContain('Left | Right');
      expect(result).not.toMatch(/\| *\|/); // no consecutive pipes
    });

    it('should handle nested multi-column table inside multi-column row', () => {
      // Inner table pipes should be distinguishable from outer table pipes
      const html = `
        <table><tr>
          <td><table><tr><td>Inner A</td><td>Inner B</td></tr></table></td>
          <td>Outer</td>
        </tr></table>
      `;
      const result = htmlToMarkdown(html);
      expect(result).toContain('Inner A | Inner B');
      expect(result).toContain('Outer');
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

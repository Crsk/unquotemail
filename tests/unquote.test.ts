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

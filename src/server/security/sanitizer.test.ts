import { describe, it, expect } from 'vitest';
import {
  sanitizeString,
  sanitizeText,
  sanitizeTitle,
  sanitizeStringArray,
  sanitizeEmail,
  sanitizeObject,
} from './sanitizer';

describe('sanitizer', () => {
  describe('sanitizeString', () => {
    it('removes control characters except newline and tab', () => {
      const input = 'Hello\x00\x01World\nTest\tTab';
      const result = sanitizeString(input);
      expect(result).toBe('HelloWorld\nTest\tTab');
    });

    it('trims leading and trailing whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
      expect(sanitizeString('\n\nhello\n\n')).toBe('hello');
    });

    it('enforces max length', () => {
      const input = 'a'.repeat(1500);
      const result = sanitizeString(input, 1000);
      expect(result).toHaveLength(1000);
    });

    it('handles empty strings', () => {
      expect(sanitizeString('')).toBe('');
      expect(sanitizeString('   ')).toBe('');
    });

    it('preserves valid characters', () => {
      const input = 'Hello, World! 123 @#$%';
      expect(sanitizeString(input)).toBe(input);
    });
  });

  describe('sanitizeText', () => {
    it('allows newlines and preserves multiline format', () => {
      const input = 'Line 1\nLine 2\nLine 3';
      expect(sanitizeText(input)).toBe(input);
    });

    it('enforces default max length of 5000', () => {
      const input = 'a'.repeat(6000);
      const result = sanitizeText(input);
      expect(result).toHaveLength(5000);
    });

    it('removes control characters but preserves newlines', () => {
      const input = 'Text\x00with\x01controls\nand\nnewlines';
      expect(sanitizeText(input)).toBe('Textwithcontrols\nand\nnewlines');
    });
  });

  describe('sanitizeTitle', () => {
    it('removes newlines and tabs', () => {
      const input = 'Title\nWith\rNewlines\tAnd\tTabs';
      const result = sanitizeTitle(input);
      expect(result).not.toContain('\n');
      expect(result).not.toContain('\r');
      expect(result).not.toContain('\t');
    });

    it('collapses multiple spaces into one', () => {
      expect(sanitizeTitle('Hello    World')).toBe('Hello World');
      expect(sanitizeTitle('A   B   C')).toBe('A B C');
    });

    it('enforces default max length of 200', () => {
      const input = 'a'.repeat(300);
      const result = sanitizeTitle(input);
      expect(result).toHaveLength(200);
    });

    it('converts newlines to spaces', () => {
      expect(sanitizeTitle('Line 1\nLine 2')).toBe('Line 1 Line 2');
    });
  });

  describe('sanitizeStringArray', () => {
    it('sanitizes each item in array', () => {
      const input = ['  item1  ', 'item2\x00', '  item3  '];
      const result = sanitizeStringArray(input);
      expect(result).toEqual(['item1', 'item2', 'item3']);
    });

    it('enforces max items limit', () => {
      const input = Array.from({ length: 150 }, (_, i) => `item${i}`);
      const result = sanitizeStringArray(input, 100);
      expect(result).toHaveLength(100);
    });

    it('enforces max length per item', () => {
      const input = ['a'.repeat(1000), 'short'];
      const result = sanitizeStringArray(input, 100, 500);
      expect(result[0]).toHaveLength(500);
      expect(result[1]).toBe('short');
    });

    it('filters out empty strings after sanitization', () => {
      const input = ['valid', '   ', '', 'another'];
      const result = sanitizeStringArray(input);
      expect(result).toEqual(['valid', 'another']);
    });

    it('handles empty array', () => {
      expect(sanitizeStringArray([])).toEqual([]);
    });
  });

  describe('sanitizeEmail', () => {
    it('converts email to lowercase', () => {
      expect(sanitizeEmail('Test@Example.COM')).toBe('test@example.com');
    });

    it('accepts valid email formats', () => {
      expect(sanitizeEmail('user@example.com')).toBe('user@example.com');
      expect(sanitizeEmail('test.user+tag@domain.co.uk')).toBe('test.user+tag@domain.co.uk');
    });

    it('throws on invalid email format', () => {
      expect(() => sanitizeEmail('notanemail')).toThrow('Invalid email format');
      expect(() => sanitizeEmail('missing@domain')).toThrow('Invalid email format');
      expect(() => sanitizeEmail('@example.com')).toThrow('Invalid email format');
      expect(() => sanitizeEmail('user@')).toThrow('Invalid email format');
    });

    it('trims whitespace before validation', () => {
      expect(sanitizeEmail('  user@example.com  ')).toBe('user@example.com');
    });

    it('enforces max length of 320 characters', () => {
      const longEmail = 'a'.repeat(300) + '@example.com';
      const result = sanitizeEmail(longEmail);
      expect(result.length).toBeLessThanOrEqual(320);
    });
  });

  describe('sanitizeObject', () => {
    it('applies custom sanitizers to specified fields', () => {
      const input = {
        name: '  John  ',
        age: 30,
        email: 'Test@Example.COM',
      };

      const result = sanitizeObject(input, {
        name: (val) => (val as string).trim().toUpperCase(),
        email: (val) => (val as string).toLowerCase(),
      });

      expect(result.name).toBe('JOHN');
      expect(result.email).toBe('test@example.com');
      expect(result.age).toBe(30);
    });

    it('applies default string sanitization to unspecified string fields', () => {
      const input = {
        title: '  Hello\x00World  ',
        count: 42,
        flag: true,
      };

      const result = sanitizeObject(input, {});

      expect(result.title).toBe('HelloWorld');
      expect(result.count).toBe(42);
      expect(result.flag).toBe(true);
    });

    it('preserves non-string values', () => {
      const input = {
        text: 'hello',
        number: 123,
        bool: false,
        nullVal: null,
        arr: [1, 2, 3],
      };

      const result = sanitizeObject(input, {});

      expect(result.number).toBe(123);
      expect(result.bool).toBe(false);
      expect(result.nullVal).toBe(null);
      expect(result.arr).toEqual([1, 2, 3]);
    });

    it('handles empty object', () => {
      const result = sanitizeObject({}, {});
      expect(result).toEqual({});
    });
  });
});

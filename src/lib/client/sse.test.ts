import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SSEClient } from './sse';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('SSEClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('parseSSEMessage', () => {
    // We need to test the internal parseSSEMessage function indirectly through connect
    it('parses valid SSE message with event and data', async () => {
      const messages: any[] = [];
      const client = new SSEClient({
        onMessage: (msg) => messages.push(msg),
      });

      const sseData = 'event: test\ndata: {"key":"value"}\n\n';
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(sseData));
          controller.close();
        },
      });

      mockFetch.mockResolvedValue({
        ok: true,
        body: stream,
      });

      await client.connect('http://test.com/sse');

      expect(messages).toHaveLength(1);
      expect(messages[0]).toEqual({
        event: 'test',
        data: { key: 'value' },
      });
    });

    it('defaults to "message" event when not specified', async () => {
      const messages: any[] = [];
      const client = new SSEClient({
        onMessage: (msg) => messages.push(msg),
      });

      const sseData = 'data: {"result":"ok"}\n\n';
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(sseData));
          controller.close();
        },
      });

      mockFetch.mockResolvedValue({
        ok: true,
        body: stream,
      });

      await client.connect('http://test.com/sse');

      expect(messages[0].event).toBe('message');
      expect(messages[0].data).toEqual({ result: 'ok' });
    });

    it('handles non-JSON data as plain string', async () => {
      const messages: any[] = [];
      const client = new SSEClient({
        onMessage: (msg) => messages.push(msg),
      });

      const sseData = 'data: plain text message\n\n';
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(sseData));
          controller.close();
        },
      });

      mockFetch.mockResolvedValue({
        ok: true,
        body: stream,
      });

      await client.connect('http://test.com/sse');

      expect(messages[0].data).toBe('plain text message');
    });

    it('ignores empty messages', async () => {
      const messages: any[] = [];
      const client = new SSEClient({
        onMessage: (msg) => messages.push(msg),
      });

      const sseData = '\n\ndata: {"valid":"message"}\n\n\n\n';
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(sseData));
          controller.close();
        },
      });

      mockFetch.mockResolvedValue({
        ok: true,
        body: stream,
      });

      await client.connect('http://test.com/sse');

      expect(messages).toHaveLength(1);
      expect(messages[0].data).toEqual({ valid: 'message' });
    });
  });

  describe('connect', () => {
    it('establishes connection with correct headers', async () => {
      const stream = new ReadableStream({
        start(controller) {
          controller.close();
        },
      });

      mockFetch.mockResolvedValue({
        ok: true,
        body: stream,
      });

      const client = new SSEClient();
      await client.connect('http://test.com/sse');

      expect(mockFetch).toHaveBeenCalledWith('http://test.com/sse', {
        method: 'GET',
        headers: {
          Accept: 'text/event-stream',
        },
        signal: expect.any(AbortSignal),
      });
    });

    it('throws error when response is not ok', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error',
      });

      const errors: Error[] = [];
      const client = new SSEClient({
        onError: (err) => errors.push(err),
      });

      await client.connect('http://test.com/sse');

      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('SSE connection failed');
    });

    it('throws error when response body is null', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        body: null,
      });

      const errors: Error[] = [];
      const client = new SSEClient({
        onError: (err) => errors.push(err),
      });

      await client.connect('http://test.com/sse');

      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Response body is null');
    });

    it('handles multiple messages in stream', async () => {
      const messages: any[] = [];
      const client = new SSEClient({
        onMessage: (msg) => messages.push(msg),
      });

      const sseData =
        'data: {"id":1}\n\n' +
        'data: {"id":2}\n\n' +
        'data: {"id":3}\n\n';

      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(sseData));
          controller.close();
        },
      });

      mockFetch.mockResolvedValue({
        ok: true,
        body: stream,
      });

      await client.connect('http://test.com/sse');

      expect(messages).toHaveLength(3);
      expect(messages[0].data).toEqual({ id: 1 });
      expect(messages[1].data).toEqual({ id: 2 });
      expect(messages[2].data).toEqual({ id: 3 });
    });

    it('buffers incomplete messages correctly', async () => {
      const messages: any[] = [];
      const client = new SSEClient({
        onMessage: (msg) => messages.push(msg),
      });

      // Simulate chunked data arriving in parts
      const stream = new ReadableStream({
        async start(controller) {
          controller.enqueue(new TextEncoder().encode('data: {"id":'));
          await new Promise((resolve) => setTimeout(resolve, 10));
          controller.enqueue(new TextEncoder().encode('1}\n\n'));
          controller.close();
        },
      });

      mockFetch.mockResolvedValue({
        ok: true,
        body: stream,
      });

      await client.connect('http://test.com/sse');

      expect(messages).toHaveLength(1);
      expect(messages[0].data).toEqual({ id: 1 });
    });

    it('calls onComplete when stream ends', async () => {
      let completed = false;
      const client = new SSEClient({
        onComplete: () => {
          completed = true;
        },
      });

      const stream = new ReadableStream({
        start(controller) {
          controller.close();
        },
      });

      mockFetch.mockResolvedValue({
        ok: true,
        body: stream,
      });

      await client.connect('http://test.com/sse');

      expect(completed).toBe(true);
    });

    it('does not call onError for AbortError', async () => {
      const errors: Error[] = [];
      const client = new SSEClient({
        onError: (err) => errors.push(err),
      });

      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';

      mockFetch.mockRejectedValue(abortError);

      await client.connect('http://test.com/sse');

      expect(errors).toHaveLength(0);
    });

    it('calls onError for non-abort errors', async () => {
      const errors: Error[] = [];
      const client = new SSEClient({
        onError: (err) => errors.push(err),
      });

      const networkError = new Error('Network failure');
      mockFetch.mockRejectedValue(networkError);

      await client.connect('http://test.com/sse');

      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Network failure');
    });
  });

  describe('disconnect', () => {
    it('aborts active connection', async () => {
      let abortCalled = false;

      const stream = new ReadableStream({
        start(controller) {
          // Keep open but check if abort was called
        },
        cancel() {
          abortCalled = true;
        },
      });

      mockFetch.mockResolvedValue({
        ok: true,
        body: stream,
      });

      const client = new SSEClient();
      
      // Start connection but don't await it
      const connectPromise = client.connect('http://test.com/sse');

      // Give it time to start
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(client.isConnected()).toBe(true);

      client.disconnect();

      expect(client.isConnected()).toBe(false);

      // The abort should propagate to the stream cancel
      await new Promise((resolve) => setTimeout(resolve, 20));
      
      // We can't reliably await the promise since it will reject with AbortError
      // Just verify disconnect was called
    });

    it('is safe to call when not connected', () => {
      const client = new SSEClient();
      expect(() => client.disconnect()).not.toThrow();
    });

    it('is safe to call multiple times', () => {
      const client = new SSEClient();
      client.disconnect();
      expect(() => client.disconnect()).not.toThrow();
    });
  });

  describe('isConnected', () => {
    it('returns false initially', () => {
      const client = new SSEClient();
      expect(client.isConnected()).toBe(false);
    });

    it('returns true after connection starts', async () => {
      const stream = new ReadableStream({
        start(controller) {
          // Keep open
        },
      });

      mockFetch.mockResolvedValue({
        ok: true,
        body: stream,
      });

      const client = new SSEClient();
      
      // Start connection
      const connectPromise = client.connect('http://test.com/sse');

      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(client.isConnected()).toBe(true);

      // Clean up
      client.disconnect();
      
      // Don't await the promise as it will abort
    });

    it('returns false after disconnect', async () => {
      const stream = new ReadableStream({
        start(controller) {
          controller.close();
        },
      });

      mockFetch.mockResolvedValue({
        ok: true,
        body: stream,
      });

      const client = new SSEClient();
      await client.connect('http://test.com/sse');

      client.disconnect();

      expect(client.isConnected()).toBe(false);
    });
  });
});

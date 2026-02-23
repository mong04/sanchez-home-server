import { describe, it, expect, vi, beforeEach } from 'vitest';
import { compressImage } from '../src/utils/image-compression';
import { messages } from '../src/lib/yjs-provider';

// Mock Canvas and Image for compression tests
describe('Image Compression Utility', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('should reject non-image files', async () => {
        const file = new File(['text content'], 'test.txt', { type: 'text/plain' });
        await expect(compressImage(file)).rejects.toThrow('File is not an image');
    });

    // We can't easily test actual canvas resizing in Node environment without heavy polyfills (canvas),
    // so we skip the actual compression logic test here and rely on manual verification or browser tests.
    // Ideally we would mock the FileReader and Image onload events to simulate logic flow.
});

describe('Messenger Logic (Yjs)', () => {
    beforeEach(() => {
        messages.delete(0, messages.length); // Clear store
    });

    it('should add a message', () => {
        const msg = {
            id: '1',
            sender: 'User',
            text: 'Hello',
            timestamp: Date.now(),
            expiresAt: Date.now() + 10000
        };

        messages.push([msg]);
        expect(messages.length).toBe(1);
        expect(messages.get(0).text).toBe('Hello');
    });

    it('should support base64 images', () => {
        const msg = {
            id: '2',
            sender: 'User',
            text: 'Image',
            imageBase64: 'data:image/png;base64,fake',
            timestamp: Date.now(),
            expiresAt: Date.now() + 10000
        };

        messages.push([msg]);
        expect(messages.get(0).imageBase64).toBeDefined();
    });
});

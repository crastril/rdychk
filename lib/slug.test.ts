import { createSlug } from './slug';

describe('createSlug', () => {
    it('should convert to lowercase', () => {
        expect(createSlug('HelloWorld')).toBe('helloworld');
    });

    it('should remove accents', () => {
        expect(createSlug('HélloWörld')).toBe('helloworld');
        expect(createSlug('crème brûlée')).toBe('creme-brulee');
    });

    it('should replace spaces and special characters with hyphens', () => {
        expect(createSlug('hello world')).toBe('hello-world');
        expect(createSlug('hello!world')).toBe('hello-world');
        expect(createSlug('foo/bar')).toBe('foo-bar');
    });

    it('should remove leading and trailing hyphens', () => {
        expect(createSlug('-hello-world-')).toBe('hello-world');
        expect(createSlug('---hello---')).toBe('hello');
    });

    it('should handle complex mixed cases', () => {
        expect(createSlug("C'est l'été!")).toBe('c-est-l-ete');
        expect(createSlug('Ça va?')).toBe('ca-va');
    });

    it('should return empty string for empty input', () => {
        expect(createSlug('')).toBe('');
    });

    it('should handle multiple special characters in a row', () => {
        expect(createSlug('hello...world')).toBe('hello-world');
    });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiRequest } from './api.js';

describe('apiRequest', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    if (originalFetch) {
      vi.stubGlobal('fetch', originalFetch);
    } else {
      // eslint-disable-next-line no-global-assign
      delete global.fetch;
    }
    vi.clearAllMocks();
  });

  it('returns parsed JSON on successful 200 response', async () => {
    const mockData = { user: { id: 1, name: 'Test' } };
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockData
    });

    const result = await apiRequest('/api/auth/me');

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/auth/me',
      expect.objectContaining({
        credentials: 'include',
        cache: 'no-store'
      })
    );
    expect(result).toEqual(mockData);
  });

  it('returns null on 204 No Content', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 204,
      json: async () => ({})
    });

    const result = await apiRequest('/api/favorites/some-slug', { method: 'DELETE' });
    expect(result).toBeNull();
  });

  it('throws an error using payload.error when response is not ok', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Title and artist are required' })
    });

    await expect(apiRequest('/api/songs', { method: 'POST', body: '{}' }))
      .rejects.toThrow('Title and artist are required');
  });

  it('falls back to status message when no error field in body', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ message: 'boom' })
    });

    await expect(apiRequest('/api/unknown')).rejects.toThrow('Request failed with status 500');
  });

  it('includes credentials and allows caller-provided headers (spread order behavior)', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true })
    });

    await apiRequest('/api/test', {
      headers: { 'X-Custom': 'yes' }
    });

    const callArgs = global.fetch.mock.calls[0][1];
    expect(callArgs.credentials).toBe('include');
    // Note: due to ...options after headers construction, caller headers may override;
    // we still assert the request was attempted with our extra header present in final.
    expect(callArgs.headers?.['X-Custom'] || callArgs.headers?.['x-custom']).toBe('yes');
  });

  it('propagates non-JSON error body gracefully', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => { throw new Error('not json'); }
    });

    await expect(apiRequest('/api/protected')).rejects.toThrow('Request failed with status 403');
  });
});

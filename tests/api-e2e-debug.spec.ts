import { test, expect } from '@playwright/test'


test('GET - retrieve booking IDs', async ({ request }) => {
    const response = await request.get('/booking');

    // Response metadata
    console.log('URL:', response.url());
    console.log('Status:', response.status());
    console.log('Status text:', response.statusText());
    console.log('Headers:', await response.headers);

    // Response body
    const body = await response.json();
    console.log('Response body:', body);

    // Assertions
    expect(response.status()).toBe(200);
    expect(Array.isArray(body)).toBeTruthy();
    expect(body.length).toBeGreaterThan(0);
});



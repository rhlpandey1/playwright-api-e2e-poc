import { test, expect } from '@playwright/test';

test('API setup followed by UI verification', async ({ request, page }) => {
    // Arrange: create data through the API
    const createResponse = await request.post('/booking', {
        data: {
            firstname: 'Rahul',
            lastname: 'E2ETest',
            totalprice: 150,
            depositpaid: true,
            bookingdates: {
                checkin: '2026-11-01',
                checkout: '2026-11-05',
            },
            additionalneeds: 'Breakfast',
        },
    });

    expect(createResponse.status()).toBe(200);

    const createdBooking = await createResponse.json();
    const bookingId = createdBooking.bookingid;

    // Act: open the public UI
    await page.goto('https://automationintesting.online/');

    // Assert: verify the UI loaded
    await expect(page).toHaveTitle(/Restful-booker-platform/i);

    // Verify the API-created record exists
    const getResponse = await request.get(`/booking/${bookingId}`);
    expect(getResponse.status()).toBe(200);

    const booking = await getResponse.json();
    expect(booking.firstname).toBe('Rahul');
    expect(booking.lastname).toBe('E2ETest');
});
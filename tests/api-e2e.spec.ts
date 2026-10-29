
import { test, expect, request } from '@playwright/test';
import { APIRequestContext } from '@playwright/test';

import { chromium } from '@playwright/test';
async function createBooking(request: APIRequestContext) {
    const response = await request.post('/booking', {
        data: {
            firstname: 'Rahul',
            lastname: 'Automation',
            totalprice: 150,
            depositpaid: true,
            bookingdates: {
                checkin: '2026-11-01',
                checkout: '2026-11-05',
            },
            additionalneeds: 'Breakfast',
        },
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    return body.bookingid as number;
}

test('GET - retrieve a booking by ID', async ({ request }) => {
    // First, retrieve booking IDs
    const listResponse = await request.get('/booking');
    expect(listResponse.status()).toBe(200);
    console.log(listResponse.text)
    const bookings = await listResponse.json();
    expect(bookings.length).toBeGreaterThan(0);

    // Use an ID from the actual response
    const bookingId = bookings[0].bookingid;

    const response = await request.get(`/booking/${bookingId}`);

    expect(response.status()).toBe(200);

    const body = await response.json();

    expect(body).toHaveProperty('firstname');
    expect(body).toHaveProperty('lastname');
    expect(body).toHaveProperty('bookingdates');
});

test('GET - filter bookings using query parameters', async ({ request }) => {
    await createBooking(request);

    const response = await request.get('/booking', {
        params: {
            firstname: 'Rahul',
            lastname: 'Automation',
        },
    });

    expect(response.status()).toBe(200);

    const body = await response.json();

    console.log('Filtered bookings:', JSON.stringify(body, null, 2));

    expect(Array.isArray(body)).toBeTruthy();
    expect(body.length).toBeGreaterThan(0);
});

test('GET - request a nonexistent booking', async ({ request }) => {
    const response = await request.get('/booking/999999999');
    expect(response.status()).toBe(404);
});
test('GET - validate response headers', async ({ request }) => {
    const response = await request.get('/booking');

    expect(response.status()).toBe(200);

    const headers = await response.headers();

    expect(headers['content-type']).toContain('application/json');

    console.log('Content-Type:', headers['content-type']);
});


test('POST - create a booking', async ({ request }) => {
    const bookingData = {
        firstname: 'Rahul',
        lastname: 'Tester',
        totalprice: 150,
        depositpaid: true,
        bookingdates: {
            checkin: '2026-11-01',
            checkout: '2026-11-05',
        },
        additionalneeds: 'Breakfast',
    };

    const response = await request.post('/booking', {
        data: bookingData,
    });

    expect(response.status()).toBe(200);

    const body = await response.json();

    expect(body).toHaveProperty('bookingid');
    expect(body.booking.firstname).toBe(bookingData.firstname);
    expect(body.booking.lastname).toBe(bookingData.lastname);
    expect(body.booking.totalprice).toBe(bookingData.totalprice);
    expect(body.booking.bookingdates.checkin)
        .toBe(bookingData.bookingdates.checkin);

    console.log('Created booking ID:', body.bookingid);
});

test('CRUD - create, read, update, patch and delete a booking', async ({ request }) => {
    // CREATE
    const bookingId = await createBooking(request);
    expect(bookingId).toBeGreaterThan(0);

    // READ
    const getResponse = await request.get(`/booking/${bookingId}`);
    expect(getResponse.status()).toBe(200);

    const originalBooking = await getResponse.json();
    expect(originalBooking.firstname).toBe('Rahul');

    // UPDATE - PUT replaces the booking details
    const tokenResponse = await request.post('/auth', {
        data: {
            username: 'admin',
            password: 'password123',
        },
    });

    expect(tokenResponse.status()).toBe(200);
    const { token } = await tokenResponse.json();

    const putResponse = await request.put(`/booking/${bookingId}`, {
        headers: {
            Cookie: `token=${token}`,
        },
        data: {
            firstname: 'RahulUpdated',
            lastname: 'Automation',
            totalprice: 200,
            depositpaid: false,
            bookingdates: {
                checkin: '2026-11-02',
                checkout: '2026-11-06',
            },
            additionalneeds: 'Lunch',
        },
    });

    expect(putResponse.status()).toBe(200);

    // PATCH - update only selected fields
    const patchResponse = await request.patch(`/booking/${bookingId}`, {
        headers: {
            Cookie: `token=${token}`,
        },
        data: {
            firstname: 'RahulPatched',
        },
    });

    expect(patchResponse.status()).toBe(200);

    const patchedBooking = await patchResponse.json();
    expect(patchedBooking.firstname).toBe('RahulPatched');
    expect(patchedBooking.lastname).toBe('Automation');

    // DELETE
    const deleteResponse = await request.delete(`/booking/${bookingId}`, {
        headers: {
            Cookie: `token=${token}`,
        },
    });

    expect([200, 201, 204]).toContain(deleteResponse.status());

    // Verify deletion
    const verifyResponse = await request.get(`/booking/${bookingId}`);
    expect(verifyResponse.status()).toBe(404);
});

test('Authentication - obtain and use token', async ({ request }) => {
    const authResponse = await request.post('/auth', {
        data: {
            username: 'admin',
            password: 'password123',
        },
        headers: {
            'Content-Type': 'application/json',
        },
    });

    expect(authResponse.status()).toBe(200);

    const authBody = await authResponse.json();

    expect(authBody).toHaveProperty('token');
    expect(typeof authBody.token).toBe('string');
    expect(authBody.token.length).toBeGreaterThan(0);

    console.log('Authentication successful');

    // Use the token as a cookie on an authenticated request
    const bookingResponse = await request.put('/booking/1', {
        headers: {
            Cookie: `token=${authBody.token}`,
        },
        data: {
            firstname: 'Rahul',
            lastname: 'Tester',
            totalprice: 150,
            depositpaid: true,
            bookingdates: {
                checkin: '2026-11-01',
                checkout: '2026-11-05',
            },
            additionalneeds: 'Breakfast',
        },
    });

    // The request can return 200 if booking 1 exists,
    // or 403/404 if the service rejects the request or ID.
    expect([200, 403, 404]).toContain(bookingResponse.status());
});


// test('ui fixtures', async () => {
//     const browser = await chromium.launch({ headless: false });

//     // 2. Create Context A (Admin Session)
//     const adminContext = await browser.newContext();
//     const adminPage = await adminContext.newPage();
// })

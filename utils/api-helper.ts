
import { APIRequestContext, expect } from '@playwright/test';

export async function createBooking(request: APIRequestContext) {
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

export async function getAuthToken(request: APIRequestContext) {
    const response = await request.post('/auth', {
        data: {
            username: 'admin',
            password: 'password123',
        },
    });

    expect(response.status()).toBe(200);

    const body = await response.json();

    expect(body.token).toBeTruthy();

    return body.token as string;
}


import { test, expect } from '../fixtures/api-fixtures';
import Ajv from 'ajv';
import bookingSchema from '../schemas/booking.schema.json';
test('GET - retrieve booking using fixture', async ({
    request,
    bookingId,
}) => {
    const response = await request.get(`/booking/${bookingId}`);

    expect(response.status()).toBe(200);

    const body = await response.json();

    expect(body.firstname).toBe('Rahul');
    expect(body.lastname).toBe('Automation');
});

test('PUT - update booking using auth fixture', async ({
    request,
    bookingId,
    authToken,
}) => {
    const response = await request.put(`/booking/${bookingId}`, {
        headers: {
            Cookie: `token=${authToken}`,
        },
        data: {
            firstname: 'RahulUpdated',
            lastname: 'Automation',
            totalprice: 200,
            depositpaid: true,
            bookingdates: {
                checkin: '2026-11-01',
                checkout: '2026-11-05',
            },
            additionalneeds: 'Breakfast',
        },
    });

    expect(response.status()).toBe(200);
});
test('Booking response matches JSON schema', async ({ request, bookingId }) => {
    const response = await request.get(`/booking/${bookingId}`);

    expect(response.status()).toBe(200);

    const body = await response.json();

    const ajv = new Ajv();
    const validate = ajv.compile(bookingSchema);

    const isValid = validate(body);

    expect(
        isValid,
        JSON.stringify(validate.errors, null, 2)
    ).toBe(true);
});
test('GET booking response is within the expected time', async ({ request, bookingId }) => {
    const startTime = Date.now();

    const response = await request.get(`/booking/${bookingId}`);

    const responseTime = Date.now() - startTime;

    expect(response.status()).toBe(200);
    expect(responseTime).toBeLessThan(2000);

    console.log(`API response time: ${responseTime} ms`);
});
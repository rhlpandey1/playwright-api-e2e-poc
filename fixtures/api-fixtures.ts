
import { test as base, expect } from '@playwright/test';
import { createBooking, getAuthToken } from '../utils/api-helper';

type ApiFixtures = {
    bookingId: number;
    authToken: string;
};

export const test = base.extend<ApiFixtures>({
    authToken: async ({ request }, use) => {
        const token = await getAuthToken(request);
        await use(token);
    },

    bookingId: async ({ request, authToken }, use) => {
        const id = await createBooking(request);

        await use(id);

        // Clean up after the test using the authentication token
        const response = await request.delete(`/booking/${id}`, {
            headers: {
                Cookie: `token=${authToken}`,
            },
        });

        expect(response.status()).toBe(201);
    },
});

export { expect };

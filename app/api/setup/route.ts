import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/service/AuthService';
import { parseSetupFormData } from '@/lib/models/SetupFormData';
import { apiSuccess, apiError } from '@/lib/api/response';

export async function POST(req: NextRequest) {
    const { data, valid } = parseSetupFormData(await req.formData());

    if (!valid) {
        return apiError('All required fields must be provided.', 400);
    }

    const hashedPassword = await AuthService.getPwHash(data.password);

    try {
        await prisma.$transaction(async (tx) => {
            const address = await tx.address.create({
                data: {
                    street1: data.street1,
                    street2: data.street2 || null,
                    city: data.city,
                    region: data.region,
                    postalCode: data.postalCode,
                },
            });
            await tx.serviceProvider.create({
                data: {
                    firstName: data.firstName,
                    lastName: data.lastName,
                    username: data.username,
                    password: hashedPassword,
                    addressId: address.id,
                },
            });
        });

        return apiSuccess({ ok: true }, 201);
    } catch (err: unknown) {
        if ((err as { code?: string })?.code === 'P2002') {
            return apiError('Username is already taken.', 409);
        }
        console.error(err);
        return apiError('Something went wrong.');
    }
}

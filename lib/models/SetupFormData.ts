export interface SetupFormData {
    firstName: string;
    lastName: string;
    username: string;
    password: string;
    street1: string;
    street2?: string;
    city: string;
    region: string;
    postalCode: string;
}

const requiredFields: (keyof SetupFormData)[] = [
    'firstName', 'lastName', 'username', 'password',
    'street1', 'city', 'region', 'postalCode',
];

export function parseSetupFormData(formData: FormData): { data: SetupFormData; valid: boolean } {
    const data = Object.fromEntries(formData) as unknown as SetupFormData;
    const valid = requiredFields.every(k => !!data[k]);
    return { data, valid };
}

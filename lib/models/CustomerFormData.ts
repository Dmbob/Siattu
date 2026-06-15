export interface CustomerFormData {
    name: string;
    street1: string;
    street2?: string;
    city: string;
    region: string;
    postalCode: string;
}

const requiredFields: (keyof CustomerFormData)[] = [
    'name', 'street1', 'city', 'region', 'postalCode',
];

export function parseCustomerFormData(formData: FormData): { data: CustomerFormData; valid: boolean } {
    const data = Object.fromEntries(formData) as unknown as CustomerFormData;
    const valid = requiredFields.every(k => !!data[k]);
    return { data, valid };
}

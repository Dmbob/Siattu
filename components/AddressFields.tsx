const US_STATES = [
    ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'],
    ['CA', 'California'], ['CO', 'Colorado'], ['CT', 'Connecticut'], ['DE', 'Delaware'],
    ['FL', 'Florida'], ['GA', 'Georgia'], ['HI', 'Hawaii'], ['ID', 'Idaho'],
    ['IL', 'Illinois'], ['IN', 'Indiana'], ['IA', 'Iowa'], ['KS', 'Kansas'],
    ['KY', 'Kentucky'], ['LA', 'Louisiana'], ['ME', 'Maine'], ['MD', 'Maryland'],
    ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'], ['MS', 'Mississippi'],
    ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'], ['NV', 'Nevada'],
    ['NH', 'New Hampshire'], ['NJ', 'New Jersey'], ['NM', 'New Mexico'], ['NY', 'New York'],
    ['NC', 'North Carolina'], ['ND', 'North Dakota'], ['OH', 'Ohio'], ['OK', 'Oklahoma'],
    ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'], ['SC', 'South Carolina'],
    ['SD', 'South Dakota'], ['TN', 'Tennessee'], ['TX', 'Texas'], ['UT', 'Utah'],
    ['VT', 'Vermont'], ['VA', 'Virginia'], ['WA', 'Washington'], ['WV', 'West Virginia'],
    ['WI', 'Wisconsin'], ['WY', 'Wyoming'], ['DC', 'District of Columbia'],
];

interface AddressDefaults {
    street1?: string;
    street2?: string | null;
    city?: string;
    region?: string;
    postalCode?: string;
}

interface AddressFieldsProps {
    namePrefix?: string;
    defaults?: AddressDefaults;
}

export default function AddressFields({ namePrefix = '', defaults }: AddressFieldsProps) {
    const n = (field: string) => namePrefix ? `${namePrefix}.${field}` : field;

    return (
        <div>
            <div className="mb-3">
                <div className="form-floating">
                    <input id={n('street1')} name={n('street1')} className="form-control" type="text" placeholder="Street Address" defaultValue={defaults?.street1 ?? ''} required />
                    <label htmlFor={n('street1')}>Street Address</label>
                </div>
            </div>

            <div className="mb-3">
                <div className="form-floating">
                    <input id={n('street2')} name={n('street2')} className="form-control" type="text" placeholder="Apt, Suite, etc." defaultValue={defaults?.street2 ?? ''} />
                    <label htmlFor={n('street2')}>Apt, Suite, etc. (optional)</label>
                </div>
            </div>

            <div className="row g-3 mb-3">
                <div className="col-12 col-sm-6">
                    <div className="form-floating">
                        <input id={n('city')} name={n('city')} className="form-control" type="text" placeholder="City" defaultValue={defaults?.city ?? ''} required />
                        <label htmlFor={n('city')}>City</label>
                    </div>
                </div>
                <div className="col-12 col-sm-6">
                    <div className="form-floating">
                        <select id={n('region')} name={n('region')} className="form-select" defaultValue={defaults?.region ?? ''} required>
                            <option value="" disabled>State</option>
                            {US_STATES.map(([abbr, label]) => (
                                <option key={abbr} value={abbr}>{label}</option>
                            ))}
                        </select>
                        <label htmlFor={n('region')}>State</label>
                    </div>
                </div>
            </div>

            <div className="mb-3">
                <div className="form-floating">
                    <input id={n('postalCode')} name={n('postalCode')} className="form-control" type="text" placeholder="Postal Code" pattern="\d{5}(-\d{4})?" defaultValue={defaults?.postalCode ?? ''} required />
                    <label htmlFor={n('postalCode')}>Postal Code</label>
                </div>
            </div>
        </div>
    );
}

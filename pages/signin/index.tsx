import { useState } from 'react';
import { useRouter } from 'next/router';
import { signIn } from 'next-auth/react';

export default function SignIn() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isValid, setIsValid] = useState(false);

    function handleChange(e: React.SyntheticEvent<HTMLFormElement>) {
        setIsValid(e.currentTarget.checkValidity());
    }

    async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const formData = new FormData(e.currentTarget);
            const result = await signIn('credentials', {
                username: formData.get('username') as string,
                password: formData.get('password') as string,
                redirect: false,
            });
            if (result?.error) {
                setError('Invalid username or password.');
            } else {
                router.push('/');
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-vh-100 bg-light d-flex flex-column align-items-center justify-content-center py-5">
            <div className="mb-4 text-center">
                <h2 className="fw-bold">Siattu</h2>
                <p className="text-muted">Sign in to your account</p>
            </div>

            <div className="card shadow-sm w-100 mx-3" style={{ maxWidth: "480px" }}>
                <div className="card-header py-3">
                    <h5 className="mb-0 fw-semibold">Sign In</h5>
                </div>
                <div className="card-body p-3 p-sm-4">
                    <form onSubmit={handleSubmit} onChange={handleChange}>
                        {error && <div className="alert alert-danger py-2">{error}</div>}

                        <div className="mb-3">
                            <div className="form-floating">
                                <input id="username" name="username" className="form-control" type="text" placeholder="Username" required />
                                <label htmlFor="username">Username</label>
                            </div>
                        </div>

                        <div className="mb-3">
                            <div className="form-floating">
                                <input id="password" name="password" className="form-control" type="password" placeholder="Password" required />
                                <label htmlFor="password">Password</label>
                            </div>
                        </div>

                        <button className="btn btn-primary w-100 mt-2" type="submit" disabled={loading || !isValid}>
                            {loading ? 'Signing in…' : 'Sign In →'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

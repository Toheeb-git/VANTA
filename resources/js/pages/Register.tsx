import React from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { User, MailCheck, Phone, LockIcon, ArrowRight } from 'lucide-react';
import GoogleButton from '@/components/GoogleButton';

export default function Register() {
    const cursorRef = useRef<HTMLDivElement>(null);

    const { data, setData, errors, post, processing } = useForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
    });

    useEffect(() => {
        const cursor = cursorRef.current;
        if (!cursor) return;

        const onMove = (e: MouseEvent) => {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
        };
        document.addEventListener('mousemove', onMove);

        const interactables = document.querySelectorAll('a, button, input');
        interactables.forEach((el) => {
            el.addEventListener('mouseenter', () =>
                cursor.classList.add('cursor-expand'),
            );
            el.addEventListener('mouseleave', () =>
                cursor.classList.remove('cursor-expand'),
            );
        });

        return () => {
            document.removeEventListener('mousemove', onMove);
        };
    }, []);

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        post('/register');
    };

    return (
        <>
            <Head title="Register">
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin="anonymous"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500&display=swap"
                    rel="stylesheet"
                />
                <style>{`
                    .register-page-root {
                        --black: #0a0a0a;
                        --white: #f5f0e8;
                        --accent: #e8ff00;
                        --accent2: #ff3d2e;
                        --mid: #1c1c1c;
                        --muted: #555;
                        --serif: 'Bebas Neue', sans-serif;
                        --body: 'DM Sans', sans-serif;
                        all: initial;
                        display: block;
                        position: fixed;
                        inset: 0;
                        z-index: 2147483000;
                        background: var(--black);
                        color: var(--white);
                        font-family: var(--body);
                        overflow-y: auto;
                        cursor: none;
                    }
                    .register-page-root * { box-sizing: border-box; margin: 0; padding: 0; font-family: var(--body); }

                    .register-page-root .custom-cursor {
                        position: fixed; top: 0; left: 0;
                        width: 12px; height: 12px;
                        background: var(--accent);
                        border-radius: 50%;
                        pointer-events: none;
                        z-index: 9999;
                        transform: translate(-50%, -50%);
                        transition: width .2s, height .2s;
                        mix-blend-mode: difference;
                    }
                    .register-page-root .custom-cursor.cursor-expand { width: 40px; height: 40px; }

                    @keyframes fadeUp {
                        from { opacity: 0; transform: translateY(24px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes grain {
                        0%,100%{transform:translate(0,0)}10%{transform:translate(-5%,-10%)}
                        30%{transform:translate(3%,-15%)}50%{transform:translate(12%,9%)}
                        70%{transform:translate(9%,4%)}90%{transform:translate(-1%,7%)}
                    }

                    .register-page-root .auth-page {
                        min-height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        position: relative;
                        overflow: hidden;
                        padding: 2rem;
                    }
                    .register-page-root .auth-page::before {
                        content: '';
                        position: absolute; inset: 0;
                        background:
                            radial-gradient(circle at 70% 30%, rgba(232,255,0,.07) 0%, transparent 60%),
                            radial-gradient(circle at 20% 80%, rgba(255,61,46,.06) 0%, transparent 50%);
                        z-index: 0;
                    }
                    .register-page-root .auth-page::after {
                        content: '';
                        position: absolute; inset: -200%;
                        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
                        opacity: .4; z-index: 0; pointer-events: none;
                        animation: grain 8s steps(10) infinite;
                    }

                    .register-page-root .auth-eyebrow {
                        display: flex; align-items: center; justify-content: center; gap: .75rem;
                        margin-bottom: 1.25rem;
                        opacity: 0; animation: fadeUp .8s .1s forwards;
                        position: relative; z-index: 2;
                    }
                    .register-page-root .eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); }
                    .register-page-root .eyebrow-text { font-size: .7rem; letter-spacing: .25em; text-transform: uppercase; color: var(--accent); font-weight: 500; }

                    .register-page-root .auth-card {
                        position: relative; z-index: 2;
                        width: 100%; max-width: 400px;
                        background: var(--mid);
                        border: 1px solid rgba(245,240,232,.08);
                        padding: 2.4rem 2rem;
                        opacity: 0; animation: fadeUp .8s .2s forwards;
                    }

                    .register-page-root .auth-title {
                        font-family: var(--serif);
                        font-size: clamp(2.2rem, 4vw, 2.6rem);
                        letter-spacing: .04em; line-height: 1;
                        text-align: center; color: var(--white);
                        margin-bottom: .5rem;
                    }
                    .register-page-root .auth-title .accent-line { color: var(--accent); }

                    .register-page-root .auth-sub {
                        text-align: center; font-size: .8rem; font-weight: 300;
                        color: rgba(245,240,232,.45); margin-bottom: 1.8rem;
                        line-height: 1.6;
                    }

                    .register-page-root .field-group { margin-bottom: 1.15rem; }
                    .register-page-root .field-label {
                        display: block; font-size: .7rem; letter-spacing: .15em;
                        text-transform: uppercase; color: rgba(245,240,232,.5);
                        margin-bottom: .6rem; font-weight: 500;
                    }
                    .register-page-root .field-wrap { position: relative; }
                    .register-page-root .field-icon {
                        position: absolute; left: 1rem; top: 50%; transform: translateY(-50%);
                        width: 18px; height: 18px; color: rgba(245,240,232,.35); pointer-events: none;
                    }
                    .register-page-root .field-input {
                        width: 100%;
                        background: rgba(245,240,232,.06);
                        border: 1px solid rgba(245,240,232,.1);
                        color: var(--white);
                        font-family: var(--body);
                        font-size: .85rem;
                        padding: .75rem 1rem .75rem 2.6rem;
                        outline: none;
                        transition: border-color .2s, background .2s;
                        border-radius: 0;
                        line-height: normal;
                        height: auto;
                    }
                    .register-page-root .field-input::placeholder { color: rgba(245,240,232,.25); }
                    .register-page-root .field-input:focus { border-color: var(--accent); background: rgba(232,255,0,.04); }

                    .register-page-root .field-error {
                        font-size: .72rem; color: var(--accent2);
                        margin-top: .5rem; letter-spacing: .02em;
                        display: block;
                    }

                    .register-page-root .auth-submit {
                        width: 100%;
                        display: inline-flex; align-items: center; justify-content: center; gap: .6rem;
                        background: var(--accent); color: var(--black);
                        border: none; text-decoration: none;
                        font-family: var(--body);
                        font-size: .78rem; font-weight: 500; letter-spacing: .15em; text-transform: uppercase;
                        padding: .9rem 2rem;
                        position: relative; overflow: hidden; cursor: none;
                        transition: transform .2s;
                        margin-top: .4rem;
                        border-radius: 0;
                    }
                    .register-page-root .auth-submit::after {
                        content: ''; position: absolute; inset: 0;
                        background: var(--accent2); transform: translateX(-101%);
                        transition: transform .3s cubic-bezier(.4,0,.2,1);
                        z-index: 0;
                    }
                       .auth-divider {
                        display: flex;
                        align-items: center;
                        gap: .9rem;
                       margin: 1.4rem 0;
                    }
                     .auth-divider::before,
                     .auth-divider::after {
                      content: '';
                      flex: 1;
                      height: 1px;
                      background: rgba(245,240,232,.1);
                   }
                     .auth-divider span {
                     font-size: .6rem;
                     letter-spacing: .2em;
                     text-transform: uppercase;
                     font-weight: 600;
                     color: rgba(245,240,232,.28);
                    }
                    .register-page-root .auth-submit:hover::after { transform: translateX(0); }
                    .register-page-root .auth-submit:hover { transform: translateY(-2px); }
                    .register-page-root .auth-submit:disabled { opacity: .6; cursor: none; }
                    .register-page-root .auth-submit span, .register-page-root .auth-submit svg { position: relative; z-index: 1; }

                    .register-page-root .auth-links {
                        display: flex; align-items: center; justify-content: center;
                        margin-top: 1.6rem; font-size: .75rem;
                        color: rgba(245,240,232,.5);
                        gap: .4rem;
                    }
                    .register-page-root .auth-link {
                        background: none; border: none; padding: 0;
                        color: var(--accent); text-decoration: none;
                        cursor: none;
                        border-bottom: 1px solid rgba(232,255,0,.3);
                        padding-bottom: 1px;
                        transition: border-color .2s;
                        font-family: var(--body);
                        font-size: .75rem;
                    }
                    .register-page-root .auth-link:hover { border-color: var(--accent); }

                    .register-page-root .auth-footer-note {
                        margin-top: 2rem; text-align: center;
                        font-size: .7rem; letter-spacing: .1em;
                        color: rgba(245,240,232,.2);
                        position: relative; z-index: 2;
                    }

                    @media (max-width: 480px) {
                        .register-page-root .auth-card { padding: 2.2rem 1.6rem; }
                    }
                `}</style>
            </Head>

            <div className="register-page-root">
                <div className="custom-cursor" ref={cursorRef} />

                <div className="auth-page">
                    <div className="auth-card">
                        <div className="auth-eyebrow">
                            <div className="eyebrow-dot" />
                            <span className="eyebrow-text">Join Vanta</span>
                        </div>
                        <h1 className="auth-title">
                            CREATE <span className="accent-line">ACCOUNT</span>
                        </h1>
                        <p className="auth-sub">
                            Enter your details below to create your account
                        </p>

                        <GoogleButton label="Sign up with Google" />

                        <div className="auth-divider">
                            <span>or</span>
                        </div>

                        <form onSubmit={handleRegister}>
                            <div className="field-group">
                                <label className="field-label">Full Name</label>
                                <div className="field-wrap">
                                    <User className="field-icon" />
                                    <input
                                        value={data.name}
                                        onChange={(e) =>
                                            setData('name', e.target.value)
                                        }
                                        className="field-input"
                                        placeholder="Full name"
                                    />
                                </div>
                                {errors.name && (
                                    <div className="field-error">
                                        {errors.name}
                                    </div>
                                )}
                            </div>

                            <div className="field-group">
                                <label className="field-label">Email</label>
                                <div className="field-wrap">
                                    <MailCheck className="field-icon" />
                                    <input
                                        type="email"
                                        value={data.email}
                                        onChange={(e) =>
                                            setData('email', e.target.value)
                                        }
                                        className="field-input"
                                        placeholder="email@example.com"
                                    />
                                </div>
                                {errors.email && (
                                    <div className="field-error">
                                        {errors.email}
                                    </div>
                                )}
                            </div>

                            <div className="field-group">
                                <label className="field-label">
                                    Phone Number
                                </label>
                                <div className="field-wrap">
                                    <Phone className="field-icon" />
                                    <input
                                        type="tel"
                                        value={data.phone}
                                        onChange={(e) =>
                                            setData('phone', e.target.value)
                                        }
                                        className="field-input"
                                        placeholder="+234 800 000 0000"
                                    />
                                </div>
                                {errors.phone && (
                                    <div className="field-error">
                                        {errors.phone}
                                    </div>
                                )}
                            </div>

                            <div className="field-group">
                                <label className="field-label">Password</label>
                                <div className="field-wrap">
                                    <LockIcon className="field-icon" />
                                    <input
                                        type="password"
                                        value={data.password}
                                        onChange={(e) =>
                                            setData('password', e.target.value)
                                        }
                                        className="field-input"
                                        placeholder="Password"
                                    />
                                </div>
                                {errors.password && (
                                    <div className="field-error">
                                        {errors.password}
                                    </div>
                                )}
                            </div>

                            <div className="field-group">
                                <label className="field-label">
                                    Confirm Password
                                </label>
                                <div className="field-wrap">
                                    <LockIcon className="field-icon" />
                                    <input
                                        type="password"
                                        value={data.password_confirmation}
                                        onChange={(e) =>
                                            setData(
                                                'password_confirmation',
                                                e.target.value,
                                            )
                                        }
                                        className="field-input"
                                        placeholder="Confirm password"
                                    />
                                </div>
                                {errors.password_confirmation && (
                                    <div className="field-error">
                                        {errors.password_confirmation}
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="auth-submit"
                            >
                                <span>
                                    {processing
                                        ? 'Creating...'
                                        : 'Create Account'}
                                </span>
                                <ArrowRight size={18} />
                            </button>

                            <div className="auth-links">
                                Already have an account?
                                <button
                                    type="button"
                                    onClick={() => router.get('/login')}
                                    className="auth-link"
                                >
                                    Login
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <p className="auth-footer-note">
                    © 2026 Vanta. All rights reserved.
                </p>
            </div>
        </>
    );
}

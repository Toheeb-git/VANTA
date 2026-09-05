import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { MailCheck, ArrowRight } from 'lucide-react';

export default function ForgotPassword() {
    const cursorRef = useRef<HTMLDivElement>(null);

    const { data, setData, errors, processing, post, wasSuccessful } = useForm({
        email: '',
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!data.email) return;
        post('/forgot-password');
    };

    return (
        <>
            <Head title="Forgot Password">
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
                    :root {
                        --black: #0a0a0a;
                        --white: #f5f0e8;
                        --accent: #e8ff00;
                        --accent2: #ff3d2e;
                        --mid: #1c1c1c;
                        --muted: #555;
                        --serif: 'Bebas Neue', sans-serif;
                        --body: 'DM Sans', sans-serif;
                    }
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    body { background: var(--black); color: var(--white); font-family: var(--body); overflow-x: hidden; cursor: none; }

                    .custom-cursor {
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
                    .custom-cursor.cursor-expand { width: 40px; height: 40px; }

                    @keyframes fadeUp {
                        from { opacity: 0; transform: translateY(24px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes grain {
                        0%,100%{transform:translate(0,0)}10%{transform:translate(-5%,-10%)}
                        30%{transform:translate(3%,-15%)}50%{transform:translate(12%,9%)}
                        70%{transform:translate(9%,4%)}90%{transform:translate(-1%,7%)}
                    }

                    .auth-page {
                        min-height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        position: relative;
                        overflow: hidden;
                        padding: 2rem;
                    }
                    .auth-page::before {
                        content: '';
                        position: absolute; inset: 0;
                        background:
                            radial-gradient(circle at 70% 30%, rgba(232,255,0,.07) 0%, transparent 60%),
                            radial-gradient(circle at 20% 80%, rgba(255,61,46,.06) 0%, transparent 50%);
                        z-index: 0;
                    }
                    .auth-page::after {
                        content: '';
                        position: absolute; inset: -200%;
                        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
                        opacity: .4; z-index: 0; pointer-events: none;
                        animation: grain 8s steps(10) infinite;
                    }

                    .auth-eyebrow {
                        display: flex; align-items: center; justify-content: center; gap: .75rem;
                        margin-bottom: 1.25rem;
                        opacity: 0; animation: fadeUp .8s .1s forwards;
                        position: relative; z-index: 2;
                    }
                    .eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); }
                    .eyebrow-text { font-size: .7rem; letter-spacing: .25em; text-transform: uppercase; color: var(--accent); font-weight: 500; }

                    .auth-card {
                        position: relative; z-index: 2;
                        width: 100%; max-width: 380px;
                        background: var(--mid);
                        border: 1px solid rgba(245,240,232,.08);
                        padding: 2.4rem 2rem;
                        opacity: 0; animation: fadeUp .8s .2s forwards;
                    }

                    .auth-title {
                        font-family: var(--serif);
                        font-size: clamp(2.2rem, 4vw, 2.6rem);
                        letter-spacing: .04em; line-height: 1;
                        text-align: center; color: var(--white);
                        margin-bottom: .5rem;
                    }
                    .auth-title .accent-line { color: var(--accent); }

                    .auth-sub {
                        text-align: center; font-size: .8rem; font-weight: 300;
                        color: rgba(245,240,232,.45); margin-bottom: 1.8rem;
                        line-height: 1.6;
                    }

                    .field-group { margin-bottom: 1.15rem; }
                    .field-label {
                        display: block; font-size: .7rem; letter-spacing: .15em;
                        text-transform: uppercase; color: rgba(245,240,232,.5);
                        margin-bottom: .6rem; font-weight: 500;
                    }
                    .field-wrap { position: relative; }
                    .field-icon {
                        position: absolute; left: 1rem; top: 50%; transform: translateY(-50%);
                        width: 18px; height: 18px; color: rgba(245,240,232,.35); pointer-events: none;
                    }
                    .field-input {
                        width: 100%;
                        background: rgba(245,240,232,.06);
                        border: 1px solid rgba(245,240,232,.1);
                        color: var(--white);
                        font-family: var(--body);
                        font-size: .85rem;
                        padding: .75rem 1rem .75rem 2.6rem;
                        outline: none;
                        transition: border-color .2s, background .2s;
                    }
                    .field-input::placeholder { color: rgba(245,240,232,.25); }
                    .field-input:focus { border-color: var(--accent); background: rgba(232,255,0,.04); }

                    .field-error {
                        font-size: .72rem; color: var(--accent2);
                        margin-top: .5rem; letter-spacing: .02em;
                    }

                    .field-success {
                        font-size: .78rem; color: var(--accent);
                        margin-top: -0.4rem;
                        margin-bottom: 1.15rem;
                        letter-spacing: .02em;
                        text-align: center;
                    }

                    .auth-submit {
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
                    }
                    .auth-submit::after {
                        content: ''; position: absolute; inset: 0;
                        background: var(--accent2); transform: translateX(-101%);
                        transition: transform .3s cubic-bezier(.4,0,.2,1);
                        z-index: 0;
                    }
                    .auth-submit:hover::after { transform: translateX(0); }
                    .auth-submit:hover { transform: translateY(-2px); }
                    .auth-submit:disabled { opacity: .6; cursor: none; }
                    .auth-submit span, .auth-submit svg { position: relative; z-index: 1; }

                    .auth-back {
                        display: block; text-align: center;
                        margin-top: 1.6rem;
                        font-size: .75rem; letter-spacing: .05em;
                        color: rgba(245,240,232,.5); text-decoration: none;
                        border-bottom: 1px solid transparent;
                        transition: color .2s, border-color .2s;
                    }
                    .auth-back:hover { color: var(--white); border-color: rgba(245,240,232,.3); }

                    .auth-footer-note {
                        margin-top: 2rem; text-align: center;
                        font-size: .7rem; letter-spacing: .1em;
                        color: rgba(245,240,232,.2);
                        position: relative; z-index: 2;
                    }

                    @media (max-width: 480px) {
                        .auth-card { padding: 2.2rem 1.6rem; }
                    }
                `}</style>
            </Head>

            <div className="custom-cursor" ref={cursorRef} />

            <div className="auth-page">
                <div className="auth-card">
                    <div className="auth-eyebrow">
                        <div className="eyebrow-dot" />
                        <span className="eyebrow-text">Account Recovery</span>
                    </div>
                    <h1 className="auth-title">
                        RESET <span className="accent-line">PASSWORD</span>
                    </h1>
                    <p className="auth-sub">
                        Enter your email to receive a reset link
                    </p>

                    {wasSuccessful && (
                        <p className="field-success">
                            Reset link sent — check your inbox.
                        </p>
                    )}

                    <form onSubmit={handleSubmit}>
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
                                    placeholder="you@example.com"
                                />
                            </div>
                            {errors.email && (
                                <div className="field-error">
                                    {errors.email}
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="auth-submit"
                        >
                            <span>
                                {processing ? 'Sending...' : 'Send Reset Link'}
                            </span>
                            <ArrowRight size={18} />
                        </button>
                    </form>

                    <a href="/login" className="auth-back">
                        Back to Login
                    </a>
                </div>
            </div>

            <p className="auth-footer-note">
                © 2026 Vanta. All rights reserved.
            </p>
        </>
    );
}

import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import {
    MailCheck,
    Send,
    LogOut,
    ArrowLeft,
    Check,
    Inbox,
    ShieldCheck,
    RefreshCw,
} from 'lucide-react';

export default function VerifyEmail() {
    const { auth, status } = usePage().props as unknown as {
        auth: { user: { name: string; email: string } | null };
        status?: string;
    };

    const cursorRef = useRef<HTMLDivElement>(null);
    const [sending, setSending] = useState(false);
    const [justSent, setJustSent] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        const cursor = cursorRef.current;
        if (!cursor) return;
        const onMove = (e: MouseEvent) => {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
        };
        document.addEventListener('mousemove', onMove);
        const els = document.querySelectorAll('a, button');
        els.forEach((el) => {
            el.addEventListener('mouseenter', () =>
                cursor.classList.add('cursor-expand'),
            );
            el.addEventListener('mouseleave', () =>
                cursor.classList.remove('cursor-expand'),
            );
        });
        return () => document.removeEventListener('mousemove', onMove);
    }, [justSent]);

    useEffect(() => {
        if (status === 'verification-link-sent') {
            setJustSent(true);
            setCooldown(60);
        }
    }, [status]);

    useEffect(() => {
        if (cooldown <= 0) return;
        const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
        return () => clearTimeout(t);
    }, [cooldown]);

    useEffect(() => {
        if (!justSent) return;
        const t = setTimeout(() => setJustSent(false), 12000);
        return () => clearTimeout(t);
    }, [justSent]);

    const resend = () => {
        if (cooldown > 0 || sending) return;
        setSending(true);
        router.post(
            '/email/verification-notification',
            {},
            {
                preserveScroll: true,
                onFinish: () => setSending(false),
            },
        );
    };

    const maskEmail = (email: string) => {
        const [local, domain] = email.split('@');
        if (!domain) return email;
        return `${local.slice(0, 2)}${'•'.repeat(Math.max(local.length - 2, 2))}@${domain}`;
    };

    return (
        <>
            <Head title="Verify Your Email">
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
                <style>{`
                    :root {
                        --black: #0a0a0a; --white: #f5f0e8; --accent: #e8ff00;
                        --accent2: #ff3d2e; --green: #4ade80; --amber: #ffaa3c;
                        --mid: #1c1c1c; --muted: #555;
                        --serif: 'Bebas Neue', sans-serif; --body: 'DM Sans', sans-serif;
                    }
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    body { background: var(--black); color: var(--white); font-family: var(--body); overflow-x: hidden; cursor: none; }

                    .custom-cursor {
                        position: fixed; top: 0; left: 0; width: 12px; height: 12px;
                        background: var(--accent); border-radius: 50%; pointer-events: none;
                        z-index: 9999; transform: translate(-50%, -50%);
                        transition: width .2s, height .2s; mix-blend-mode: difference;
                    }
                    .custom-cursor.cursor-expand { width: 40px; height: 40px; }

                    @keyframes fadeUp {
                        from { opacity: 0; transform: translateY(22px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes grain {
                        0%,100%{transform:translate(0,0)}10%{transform:translate(-5%,-10%)}
                        30%{transform:translate(3%,-15%)}50%{transform:translate(12%,9%)}
                        70%{transform:translate(9%,4%)}90%{transform:translate(-1%,7%)}
                    }
                    @keyframes envelopeFloat {
                        0%,100% { transform: translateY(0) rotate(0); }
                        50% { transform: translateY(-7px) rotate(-2deg); }
                    }
                    @keyframes ringOut {
                        0% { transform: scale(.75); opacity: .55; }
                        100% { transform: scale(1.9); opacity: 0; }
                    }
                    @keyframes slideDown {
                        from { opacity: 0; transform: translateY(-10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }

                    .vf-page {
                        min-height: 100vh; position: relative; overflow: hidden;
                        display: flex; align-items: center; justify-content: center;
                        padding: 4rem 1.5rem;
                    }
                    .vf-page::before {
                        content: ''; position: absolute; inset: 0;
                        background:
                            radial-gradient(circle at 50% 18%, rgba(232,255,0,.08) 0%, transparent 55%),
                            radial-gradient(circle at 15% 85%, rgba(255,61,46,.05) 0%, transparent 50%);
                        z-index: 0; pointer-events: none;
                    }
                    .vf-page::after {
                        content: ''; position: absolute; inset: -200%;
                        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
                        opacity: .4; z-index: 0; pointer-events: none;
                        animation: grain 8s steps(10) infinite;
                    }

                    .vf-shell {
                        position: relative; z-index: 2;
                        width: 100%; max-width: 540px;
                        text-align: center;
                        animation: fadeUp .6s ease both;
                    }

                    .vf-logo {
                        font-family: var(--serif); font-size: 1.9rem;
                        letter-spacing: .16em; color: rgba(245,240,232,.5);
                        margin-bottom: 2.6rem;
                        text-decoration: none; display: inline-block;
                        transition: color .22s;
                    }
                    .vf-logo:hover { color: var(--accent); }

                    .vf-seal {
                        position: relative;
                        width: 86px; height: 86px; margin: 0 auto 2rem;
                        border-radius: 50%;
                        border: 1px solid rgba(232,255,0,.3);
                        background: rgba(232,255,0,.05);
                        display: flex; align-items: center; justify-content: center;
                        color: var(--accent);
                        animation: envelopeFloat 3.4s ease-in-out infinite;
                    }
                    .vf-seal::before, .vf-seal::after {
                        content: ''; position: absolute; inset: 0;
                        border-radius: 50%;
                        border: 1px solid rgba(232,255,0,.28);
                        animation: ringOut 2.6s ease-out infinite;
                    }
                    .vf-seal::after { animation-delay: 1.3s; }

                    .vf-eyebrow {
                        font-size: .62rem; letter-spacing: .34em; text-transform: uppercase;
                        color: var(--accent); font-weight: 700; margin-bottom: .9rem;
                    }
                    .vf-title {
                        font-family: var(--serif);
                        font-size: clamp(2.4rem, 6vw, 3.6rem);
                        letter-spacing: .04em; line-height: .95;
                        margin-bottom: 1.1rem;
                    }
                    .vf-title .accent { color: var(--accent); }

                    .vf-body {
                        font-size: .92rem; font-weight: 300; line-height: 1.85;
                        color: rgba(245,240,232,.5);
                        max-width: 420px; margin: 0 auto 1.4rem;
                    }

                    .vf-address {
                        display: inline-flex; align-items: center; gap: .55rem;
                        background: rgba(245,240,232,.035);
                        border: 1px solid rgba(245,240,232,.09);
                        padding: .8rem 1.3rem;
                        margin-bottom: 2.2rem;
                        font-size: .88rem; font-weight: 500;
                        color: rgba(245,240,232,.85);
                        max-width: 100%;
                        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                    }
                    .vf-address svg { flex-shrink: 0; color: var(--accent); }

                    .vf-sent {
                        display: flex; align-items: flex-start; gap: .75rem;
                        text-align: left;
                        background: rgba(74,222,128,.07);
                        border-left: 2px solid var(--green);
                        color: var(--green);
                        padding: 1rem 1.2rem;
                        margin-bottom: 1.8rem;
                        font-size: .82rem; line-height: 1.7;
                        animation: slideDown .35s ease;
                    }
                    .vf-sent svg { flex-shrink: 0; margin-top: .15rem; }

                    .vf-actions {
                        display: flex; gap: .7rem; justify-content: center;
                        flex-wrap: wrap; margin-bottom: 2.4rem;
                    }

                    .btn-primary {
                        position: relative; overflow: hidden;
                        display: inline-flex; align-items: center; justify-content: center; gap: .6rem;
                        background: var(--accent); color: var(--black); border: none;
                        font-family: var(--body); font-size: .72rem; font-weight: 700;
                        letter-spacing: .15em; text-transform: uppercase;
                        padding: 1.05rem 2rem; cursor: none;
                        box-shadow: 0 5px 22px rgba(232,255,0,.15);
                        transition: transform .22s, box-shadow .26s;
                    }
                    .btn-primary::before {
                        content: ''; position: absolute; inset: 0;
                        background: linear-gradient(115deg, #ff3d2e, #ff6b4a);
                        transform: translateX(-101%);
                        transition: transform .36s cubic-bezier(.4,0,.2,1);
                    }
                    .btn-primary:hover:not(:disabled)::before { transform: translateX(0); }
                    .btn-primary:hover:not(:disabled) {
                        transform: translateY(-2px);
                        box-shadow: 0 10px 32px rgba(232,255,0,.25);
                    }
                    .btn-primary:hover:not(:disabled) span,
                    .btn-primary:hover:not(:disabled) svg { color: #f5f0e8; }
                    .btn-primary:disabled {
                        opacity: .4; transform: none; box-shadow: none;
                    }
                    .btn-primary span, .btn-primary svg {
                        position: relative; z-index: 1; transition: color .25s;
                    }

                    .btn-ghost {
                        display: inline-flex; align-items: center; justify-content: center; gap: .55rem;
                        background: transparent;
                        border: 1px solid rgba(245,240,232,.14);
                        color: rgba(245,240,232,.5);
                        font-family: var(--body); font-size: .72rem; font-weight: 700;
                        letter-spacing: .14em; text-transform: uppercase;
                        padding: 1.05rem 1.6rem; cursor: none;
                        text-decoration: none;
                        transition: all .22s;
                    }
                    .btn-ghost:hover {
                        border-color: var(--white); color: var(--white);
                    }

                    .vf-help {
                        border-top: 1px solid rgba(245,240,232,.07);
                        padding-top: 1.9rem;
                        text-align: left;
                    }
                    .help-title {
                        font-size: .6rem; letter-spacing: .18em;
                        text-transform: uppercase; font-weight: 700;
                        color: rgba(245,240,232,.32);
                        margin-bottom: 1.1rem; text-align: center;
                    }
                    .help-row {
                        display: flex; align-items: flex-start; gap: .8rem;
                        padding: .7rem 0;
                        font-size: .81rem; line-height: 1.7;
                        color: rgba(245,240,232,.45);
                    }
                    .help-row svg {
                        flex-shrink: 0; margin-top: .22rem;
                        color: rgba(232,255,0,.5);
                    }
                    .help-row strong {
                        color: rgba(245,240,232,.72); font-weight: 600;
                    }
                    .help-row a {
                        color: var(--accent); text-decoration: none;
                    }
                    .help-row a:hover { text-decoration: underline; }

                    .vf-foot {
                        display: flex; align-items: center; justify-content: center;
                        gap: 1.4rem; margin-top: 2rem; flex-wrap: wrap;
                    }
                    .foot-link {
                        display: inline-flex; align-items: center; gap: .45rem;
                        background: none; border: none;
                        font-family: var(--body);
                        font-size: .66rem; letter-spacing: .14em;
                        text-transform: uppercase; font-weight: 600;
                        color: rgba(245,240,232,.3); text-decoration: none;
                        cursor: none; transition: color .2s;
                    }
                    .foot-link:hover { color: var(--accent); }
                    .foot-link.danger:hover { color: var(--accent2); }

                    @media (max-width: 560px) {
                        .vf-page { padding: 3rem 1.2rem; }
                        .vf-actions { flex-direction: column; }
                        .btn-primary, .btn-ghost { width: 100%; }
                        .vf-address { font-size: .8rem; }
                    }
                `}</style>
            </Head>

            <div className="custom-cursor" ref={cursorRef} />

            <div className="vf-page">
                <div className="vf-shell">
                    <Link href="/" className="vf-logo">
                        VANTA
                    </Link>

                    <div className="vf-seal">
                        <MailCheck size={34} />
                    </div>

                    <p className="vf-eyebrow">One Last Step</p>
                    <h1 className="vf-title">
                        VERIFY YOUR <span className="accent">EMAIL</span>
                    </h1>

                    <p className="vf-body">
                        We've sent a verification link to your inbox. Click it to
                        confirm this address is yours, and you'll be able to
                        check out.
                    </p>

                    {auth.user && (
                        <div className="vf-address">
                            <Inbox size={15} />
                            {maskEmail(auth.user.email)}
                        </div>
                    )}

                    {justSent && (
                        <div className="vf-sent">
                            <Check size={15} />
                            <span>
                                A fresh link is on its way. It can take a minute
                                or two to arrive — check your spam folder if it
                                doesn't show up.
                            </span>
                        </div>
                    )}

                    <div className="vf-actions">
                        <button className="btn-primary" onClick={resend} disabled={sending || cooldown > 0}>
                            {cooldown > 0 ? (
                                <>
                                    <RefreshCw size={15} />
                                    <span>Resend in {cooldown}s</span>
                                </>
                            ) : (
                                <>
                                    <Send size={15} />
                                    <span>{sending ? 'Sending...' : 'Resend Link'}</span>
                                </>
                            )}
                        </button>

                        <Link href="/account/settings" className="btn-ghost">
                            Change Email
                        </Link>
                    </div>

                    <div className="vf-help">
                        <p className="help-title">Not Seeing It?</p>

                        <div className="help-row">
                            <ShieldCheck size={14} />
                            <span>
                                Check your <strong>spam or promotions</strong>{' '}
                                folder — verification emails often land there
                                first.
                            </span>
                        </div>

                        <div className="help-row">
                            <ShieldCheck size={14} />
                            <span>
                                Make sure the address above is spelled correctly.
                                If not, you can{' '}
                                <Link href="/account/settings">change it in settings</Link>.
                            </span>
                        </div>

                        <div className="help-row">
                            <ShieldCheck size={14} />
                            <span>
                                Links expire after <strong>60 minutes</strong>.
                                If yours has, request a fresh one above.
                            </span>
                        </div>
                    </div>

                    <div className="vf-foot">
                        <Link href="/product-page" className="foot-link">
                            <ArrowLeft size={12} /> Keep Shopping
                        </Link>
                        <button className="foot-link danger" onClick={() => router.post('/logout')}>
                            <LogOut size={12} /> Log Out
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

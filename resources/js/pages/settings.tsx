import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import {
    ArrowRight,
    ArrowLeft,
    User,
    Lock,
    KeyRound,
    Check,
    Mail,
    ShieldCheck,
    AlertTriangle,
    X,
    RotateCw,
    LogOut,
    Camera,
    Upload,
    Phone,
    IdCard,
    ShieldAlert,
    Trash2,
} from 'lucide-react';
import SiteNav from '@/components/SiteNav';
import CartWidget from '@/components/CartWidget';
import AccountTabs from '@/components/AccountTabs';

interface EmailChange {
    pending_email: string;
    expires_at: string;
}

export default function Settings() {
    const { user, appUrl, emailChange, deletionReasons, activeOrders } =
        usePage().props as unknown as {
            user: {
                name: string;
                email: string;
                phone: string | null;
                profile_picture: string | null;
                avatar_url: string | null;
                email_verified_at: string | null;
                has_password: boolean;
                google_linked: boolean;
            };
            appUrl: string;
            emailChange: EmailChange | null;
            deletionReasons: Record<string, string>;
            activeOrders: number;
        };

    const cursorRef = useRef<HTMLDivElement>(null);
    const [infoSaved, setInfoSaved] = useState(false);
    const [pwSaved, setPwSaved] = useState(false);
    const [pwSetSaved, setPwSetSaved] = useState(false);
    const [emailSaved, setEmailSaved] = useState(false);
    const [showEmailForm, setShowEmailForm] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(0);
    const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
    const [deleteOpen, setDeleteOpen] = useState(false);
    const boxRefs = useRef<Array<HTMLInputElement | null>>([]);

    const [preview, setPreview] = useState<string | null>(
        user.profile_picture
            ? `${appUrl}/storage/${user.profile_picture}`
            : user.avatar_url,
    );

    const infoForm = useForm({
        name: user.name ?? '',
        phone: user.phone ?? '',
        profile_picture: null as File | null,
    });
    const emailForm = useForm({ new_email: '', password: '' });
    const codeForm = useForm({ code: '' });
    const pwForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });
    const setPwForm = useForm({
        password: '',
        password_confirmation: '',
    });
    const deleteForm = useForm({
        password: '',
        confirm: '',
        reason: '',
        comment: '',
    });

    useEffect(() => {
        if (!emailChange) {
            setSecondsLeft(0);
            return;
        }
        const tick = () => {
            const diff = Math.floor(
                (new Date(emailChange.expires_at).getTime() - Date.now()) / 1000,
            );
            setSecondsLeft(diff > 0 ? diff : 0);
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [emailChange]);

    useEffect(() => {
        if (emailChange) {
            setTimeout(() => boxRefs.current[0]?.focus(), 120);
        } else {
            setDigits(Array(6).fill(''));
        }
    }, [emailChange]);

    useEffect(() => {
        codeForm.setData('code', digits.join(''));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [digits]);

    useEffect(() => {
        const cursor = cursorRef.current;
        if (!cursor) return;
        const onMove = (e: MouseEvent) => {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
        };
        document.addEventListener('mousemove', onMove);
        const els = document.querySelectorAll('a, button, input, label, select, textarea');
        els.forEach((el) => {
            el.addEventListener('mouseenter', () =>
                cursor.classList.add('cursor-expand'),
            );
            el.addEventListener('mouseleave', () =>
                cursor.classList.remove('cursor-expand'),
            );
        });
        return () => document.removeEventListener('mousemove', onMove);
    }, [showEmailForm, emailChange, user.has_password, deleteOpen]);

    useEffect(() => {
        if (!infoSaved) return;
        const t = setTimeout(() => setInfoSaved(false), 5000);
        return () => clearTimeout(t);
    }, [infoSaved]);

    useEffect(() => {
        if (!pwSaved) return;
        const t = setTimeout(() => setPwSaved(false), 5000);
        return () => clearTimeout(t);
    }, [pwSaved]);

    useEffect(() => {
        if (!pwSetSaved) return;
        const t = setTimeout(() => setPwSetSaved(false), 6000);
        return () => clearTimeout(t);
    }, [pwSetSaved]);

    useEffect(() => {
        if (!emailSaved) return;
        const t = setTimeout(() => setEmailSaved(false), 5000);
        return () => clearTimeout(t);
    }, [emailSaved]);

    const mmss = (s: number) =>
        `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    const maskEmail = (email: string) => {
        const [local, domain] = email.split('@');
        if (!domain) return email;
        return `${local.slice(0, 2)}${'•'.repeat(Math.max(local.length - 2, 2))}@${domain}`;
    };

    const setDigit = (index: number, value: string) => {
        const clean = value.replace(/\D/g, '');
        if (!clean && value !== '') return;
        setDigits((prev) => {
            const next = [...prev];
            next[index] = clean.slice(-1);
            return next;
        });
        if (clean && index < 5) boxRefs.current[index + 1]?.focus();
    };

    const onDigitKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace') {
            if (digits[index]) {
                setDigits((prev) => {
                    const next = [...prev];
                    next[index] = '';
                    return next;
                });
            } else if (index > 0) {
                boxRefs.current[index - 1]?.focus();
                setDigits((prev) => {
                    const next = [...prev];
                    next[index - 1] = '';
                    return next;
                });
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            boxRefs.current[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < 5) {
            boxRefs.current[index + 1]?.focus();
        }
    };

    const onDigitPaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData
            .getData('text')
            .replace(/\D/g, '')
            .slice(0, 6);
        if (!pasted) return;
        const next = Array(6).fill('');
        pasted.split('').forEach((c, i) => (next[i] = c));
        setDigits(next);
        boxRefs.current[Math.min(pasted.length, 5)]?.focus();
    };

    const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        infoForm.setData('profile_picture', file);
        if (file) setPreview(URL.createObjectURL(file));
    };

    const submitInfo = (e: React.FormEvent) => {
        e.preventDefault();
        infoForm.post('/account/profile', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => setInfoSaved(true),
        });
    };

    const submitEmailRequest = (e: React.FormEvent) => {
        e.preventDefault();
        emailForm.post('/account/email/change', {
            preserveScroll: true,
            onSuccess: () => {
                emailForm.reset();
                setShowEmailForm(false);
            },
        });
    };

    const submitCode = (e: React.FormEvent) => {
        e.preventDefault();
        codeForm.post('/account/email/confirm', {
            preserveScroll: true,
            onSuccess: () => {
                setDigits(Array(6).fill(''));
                setEmailSaved(true);
            },
            onError: () => {
                setDigits(Array(6).fill(''));
                boxRefs.current[0]?.focus();
            },
        });
    };

    const resendCode = () => {
        router.post(
            '/account/email/resend',
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setDigits(Array(6).fill(''));
                    boxRefs.current[0]?.focus();
                },
            },
        );
    };

    const cancelChange = () => {
        router.delete('/account/email/change', { preserveScroll: true });
    };

    const submitPassword = (e: React.FormEvent) => {
        e.preventDefault();
        pwForm.patch('/account/settings/password', {
            preserveScroll: true,
            onSuccess: () => {
                pwForm.reset();
                setPwSaved(true);
            },
        });
    };

    const submitSetPassword = (e: React.FormEvent) => {
        e.preventDefault();
        setPwForm.post('/account/settings/set-password', {
            preserveScroll: true,
            onSuccess: () => {
                setPwForm.reset();
                setPwSetSaved(true);
            },
        });
    };

    const submitDelete = (e: React.FormEvent) => {
        e.preventDefault();
        deleteForm.delete('/account/delete', { preserveScroll: true });
    };

    const strengthOf = (p: string) => {
        if (!p) return null;
        let score = 0;
        if (p.length >= 8) score++;
        if (p.length >= 12) score++;
        if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++;
        if (/\d/.test(p)) score++;
        if (/[^A-Za-z0-9]/.test(p)) score++;
        if (score <= 2) return { label: 'Weak', level: 1 };
        if (score === 3) return { label: 'Fair', level: 2 };
        if (score === 4) return { label: 'Strong', level: 3 };
        return { label: 'Excellent', level: 4 };
    };

    const pwStrength = strengthOf(pwForm.data.password);
    const setPwStrength = strengthOf(setPwForm.data.password);
    const initial = infoForm.data.name?.charAt(0).toUpperCase() || 'U';

    const StrengthMeter = ({ s }: { s: { label: string; level: number } | null }) =>
        s ? (
            <div className="strength">
                <div className="strength-bars">
                    {[1, 2, 3, 4].map((n) => (
                        <div key={n} className={`strength-bar ${n <= s.level ? `on-${s.level}` : ''}`} />
                    ))}
                </div>
                <span className={`strength-label l${s.level}`}>{s.label}</span>
            </div>
        ) : null;

    return (
        <>
            <Head title="Settings">
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@600;700&display=swap" rel="stylesheet" />
                <style>{`
                    :root {
                        --black: #0a0a0a; --white: #f5f0e8; --accent: #e8ff00;
                        --accent2: #ff3d2e; --green: #4ade80; --amber: #ffaa3c;
                        --serif: 'Bebas Neue', sans-serif;
                        --body: 'DM Sans', sans-serif;
                        --mono: 'JetBrains Mono', 'Courier New', monospace;
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
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes slideDown {
                        from { opacity: 0; transform: translateY(-10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }
                    @keyframes modalIn {
                        from { opacity: 0; transform: scale(.94) translateY(10px); }
                        to { opacity: 1; transform: scale(1) translateY(0); }
                    }
                    @keyframes grain {
                        0%,100%{transform:translate(0,0)}10%{transform:translate(-5%,-10%)}
                        30%{transform:translate(3%,-15%)}50%{transform:translate(12%,9%)}
                        70%{transform:translate(9%,4%)}90%{transform:translate(-1%,7%)}
                    }

                    .set-page {
                        min-height: 100vh; position: relative; overflow: hidden;
                        padding: 8rem 1.5rem 5rem;
                    }
                    .set-page::before {
                        content: ''; position: absolute; inset: 0;
                        background:
                            radial-gradient(circle at 68% 12%, rgba(232,255,0,.06) 0%, transparent 56%),
                            radial-gradient(circle at 18% 88%, rgba(255,61,46,.05) 0%, transparent 52%);
                        z-index: 0; pointer-events: none;
                    }
                    .set-page::after {
                        content: ''; position: absolute; inset: -200%;
                        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
                        opacity: .4; z-index: 0; pointer-events: none;
                        animation: grain 8s steps(10) infinite;
                    }

                    .set-shell {
                        position: relative; z-index: 2;
                        width: 100%; max-width: 760px; margin: 0 auto;
                    }

                    .set-head { margin-bottom: 1.8rem; animation: fadeUp .6s ease both; }
                    .set-eyebrow {
                        font-size: .62rem; letter-spacing: .34em; text-transform: uppercase;
                        color: var(--accent); font-weight: 700; margin-bottom: .7rem;
                    }
                    .set-title {
                        font-family: var(--serif);
                        font-size: clamp(2.3rem, 5.5vw, 3.4rem);
                        letter-spacing: .04em; line-height: .95;
                    }
                    .set-title .accent { color: var(--accent); }
                    .set-sub {
                        font-size: .86rem; font-weight: 300; line-height: 1.7;
                        color: rgba(245,240,232,.42); margin-top: .8rem; max-width: 470px;
                    }

                    .card {
                        background: linear-gradient(158deg, #1f1f1f 0%, #161616 100%);
                        border: 1px solid rgba(245,240,232,.075);
                        padding: 1.8rem;
                        margin-bottom: 1.3rem;
                        animation: fadeUp .6s .1s ease both;
                    }
                    .card.priority { border-color: rgba(232,255,0,.26); }
                    .card.danger-card { border-color: rgba(255,61,46,.22); }

                    .card-head {
                        display: flex; align-items: center; gap: .75rem;
                        margin-bottom: 1.4rem; padding-bottom: 1.1rem;
                        border-bottom: 1px solid rgba(245,240,232,.07);
                        flex-wrap: wrap;
                    }
                    .card-icon {
                        width: 36px; height: 36px; flex-shrink: 0;
                        border: 1px solid rgba(232,255,0,.24);
                        background: rgba(232,255,0,.05);
                        display: flex; align-items: center; justify-content: center;
                        color: var(--accent);
                    }
                    .card-icon.danger {
                        border-color: rgba(255,61,46,.3);
                        background: rgba(255,61,46,.06);
                        color: var(--accent2);
                    }
                    .card-title {
                        font-family: var(--serif); font-size: 1.24rem; letter-spacing: .08em;
                    }
                    .card-note {
                        margin-left: auto; font-size: .58rem;
                        letter-spacing: .13em; text-transform: uppercase;
                        color: rgba(245,240,232,.24); font-weight: 700;
                        flex-shrink: 0;
                    }
                    .card-note.flag {
                        color: var(--accent);
                        border: 1px solid rgba(232,255,0,.28);
                        background: rgba(232,255,0,.07);
                        padding: .3rem .6rem;
                    }

                    .avatar-row {
                        display: flex; align-items: center; gap: 1.4rem;
                        padding-bottom: 1.5rem; margin-bottom: 1.5rem;
                        border-bottom: 1px solid rgba(245,240,232,.06);
                    }
                    .avatar-shell {
                        position: relative;
                        width: 88px; height: 88px; flex-shrink: 0;
                        border-radius: 50%; overflow: hidden; cursor: none;
                        background: linear-gradient(145deg, #272727, #131313);
                        display: flex; align-items: center; justify-content: center;
                        box-shadow: 0 0 0 1px rgba(232,255,0,.28), 0 0 0 5px rgba(232,255,0,.05);
                        transition: box-shadow .28s, transform .26s;
                    }
                    .avatar-shell:hover {
                        transform: scale(1.04);
                        box-shadow: 0 0 0 1px rgba(232,255,0,.7), 0 0 0 7px rgba(232,255,0,.11);
                    }
                    .avatar-shell img { width: 100%; height: 100%; object-fit: cover; }
                    .avatar-initial {
                        font-family: var(--serif); font-size: 2.4rem;
                        color: var(--accent); letter-spacing: .05em; line-height: 1;
                    }
                    .avatar-overlay {
                        position: absolute; inset: 0;
                        background: rgba(10,10,10,.7);
                        backdrop-filter: blur(2px);
                        display: flex; flex-direction: column;
                        align-items: center; justify-content: center; gap: .2rem;
                        color: var(--accent); opacity: 0;
                        transition: opacity .24s;
                    }
                    .avatar-shell:hover .avatar-overlay { opacity: 1; }
                    .avatar-overlay span {
                        font-size: .5rem; letter-spacing: .12em;
                        text-transform: uppercase; font-weight: 700;
                    }

                    .avatar-meta { flex: 1; min-width: 0; }
                    .avatar-btn {
                        display: inline-flex; align-items: center; gap: .45rem;
                        background: transparent; border: 1px solid rgba(232,255,0,.28);
                        color: var(--accent);
                        font-family: var(--body); font-size: .62rem; font-weight: 700;
                        letter-spacing: .14em; text-transform: uppercase;
                        padding: .55rem 1rem; cursor: none;
                        transition: all .24s;
                    }
                    .avatar-btn:hover {
                        background: var(--accent); color: var(--black);
                        transform: translateY(-2px);
                    }
                    .file-hidden {
                        position: absolute; width: 1px; height: 1px;
                        padding: 0; margin: -1px; overflow: hidden;
                        clip: rect(0,0,0,0); white-space: nowrap; border: 0;
                    }
                    .avatar-hint {
                        font-size: .66rem; color: rgba(245,240,232,.26);
                        margin-top: .65rem; letter-spacing: .03em;
                    }

                    .email-display {
                        display: flex; align-items: center; gap: .85rem;
                        padding: 1rem 1.1rem;
                        background: rgba(245,240,232,.03);
                        border: 1px solid rgba(245,240,232,.07);
                        margin-bottom: 1.1rem;
                    }
                    .email-avatar {
                        width: 38px; height: 38px; flex-shrink: 0;
                        border-radius: 50%;
                        background: linear-gradient(145deg, #262626, #131313);
                        display: flex; align-items: center; justify-content: center;
                        color: var(--accent);
                        box-shadow: 0 0 0 1px rgba(232,255,0,.2);
                    }
                    .email-meta { flex: 1; min-width: 0; }
                    .email-value {
                        font-size: .86rem; color: rgba(245,240,232,.9); font-weight: 500;
                        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                    }
                    .email-status {
                        display: inline-flex; align-items: center; gap: .3rem;
                        font-size: .56rem; letter-spacing: .13em; text-transform: uppercase;
                        font-weight: 700; margin-top: .35rem;
                    }
                    .email-status.ok { color: var(--green); }
                    .email-status.warn { color: var(--amber); }
                    .email-action { flex-shrink: 0; }

                    .link-btn {
                        display: inline-flex; align-items: center; justify-content: center; gap: .4rem;
                        background: transparent; border: 1px solid rgba(245,240,232,.13);
                        color: rgba(245,240,232,.58);
                        font-family: var(--body); font-size: .6rem; font-weight: 700;
                        letter-spacing: .14em; text-transform: uppercase;
                        padding: .55rem .95rem; cursor: none;
                        white-space: nowrap; transition: all .22s;
                    }
                    .link-btn:hover {
                        border-color: var(--accent); color: var(--accent);
                        background: rgba(232,255,0,.05);
                    }

                    .locked-note {
                        display: inline-flex; align-items: center; justify-content: center; gap: .4rem;
                        font-size: .56rem; letter-spacing: .11em;
                        text-transform: uppercase; font-weight: 700;
                        color: rgba(255,170,60,.8);
                        border: 1px solid rgba(255,170,60,.24);
                        background: rgba(255,170,60,.06);
                        padding: .52rem .8rem; white-space: nowrap;
                    }

                    .google-notice {
                        display: flex; align-items: flex-start; gap: .7rem;
                        background: rgba(232,255,0,.04);
                        border-left: 2px solid rgba(232,255,0,.42);
                        padding: 1rem 1.15rem; margin-bottom: 1.4rem;
                        font-size: .79rem; line-height: 1.7;
                        color: rgba(245,240,232,.55);
                    }
                    .google-notice svg { flex-shrink: 0; margin-top: .18rem; color: var(--accent); }
                    .google-notice strong { color: rgba(245,240,232,.85); font-weight: 600; }

                    .pending {
                        border: 1px solid rgba(232,255,0,.26);
                        background: linear-gradient(158deg, rgba(232,255,0,.045), rgba(232,255,0,.015));
                        padding: 1.5rem;
                        animation: slideDown .3s ease;
                    }
                    .pending-top {
                        display: flex; align-items: flex-start; gap: .7rem;
                        margin-bottom: 1.4rem;
                    }
                    .pending-top svg { flex-shrink: 0; margin-top: .15rem; color: var(--accent); }
                    .pending-copy {
                        font-size: .8rem; line-height: 1.65; color: rgba(245,240,232,.6);
                        word-break: break-word;
                    }
                    .pending-copy strong {
                        color: var(--accent); font-weight: 600;
                        font-family: var(--mono); font-size: .8rem;
                    }

                    .otp-row { display: flex; gap: .55rem; margin-bottom: 1.1rem; }
                    .otp-box {
                        flex: 1 1 0; min-width: 0;
                        aspect-ratio: 1 / 1.15;
                        background: rgba(10,10,10,.55);
                        border: 1px solid rgba(232,255,0,.22);
                        color: var(--white);
                        font-family: var(--mono);
                        font-size: 1.45rem; font-weight: 700;
                        text-align: center; outline: none; cursor: none;
                        transition: border-color .18s, background .18s, box-shadow .22s, transform .18s;
                    }
                    .otp-box:focus {
                        border-color: var(--accent);
                        background: rgba(232,255,0,.06);
                        box-shadow: 0 0 0 3px rgba(232,255,0,.1);
                        transform: translateY(-2px);
                    }
                    .otp-box.filled {
                        border-color: rgba(232,255,0,.5);
                        color: var(--accent);
                        background: rgba(232,255,0,.04);
                    }
                    .otp-box.error {
                        border-color: rgba(255,61,46,.55);
                        background: rgba(255,61,46,.05);
                    }

                    .otp-meta {
                        display: flex; align-items: center; justify-content: space-between;
                        gap: .8rem; flex-wrap: wrap; margin-bottom: 1.2rem;
                    }
                    .countdown {
                        display: inline-flex; align-items: center; gap: .45rem;
                        font-size: .68rem; color: rgba(245,240,232,.4);
                    }
                    .countdown strong {
                        font-family: var(--mono); font-size: .8rem;
                        color: var(--accent); font-weight: 700;
                    }
                    .countdown.expired strong { color: var(--accent2); }

                    .otp-actions { display: flex; gap: 1rem; }
                    .text-btn {
                        display: inline-flex; align-items: center; gap: .35rem;
                        background: none; border: none;
                        color: rgba(245,240,232,.45);
                        font-family: var(--body); font-size: .63rem; font-weight: 700;
                        letter-spacing: .12em; text-transform: uppercase;
                        cursor: none; padding: 0; transition: color .2s;
                    }
                    .text-btn:hover { color: var(--accent); }
                    .text-btn.danger:hover { color: var(--accent2); }

                    .field-row { display: flex; gap: 1rem; }
                    .field-row .field-group { flex: 1 1 0; min-width: 0; }
                    .field-group { margin-bottom: 1.05rem; }
                    .field-label {
                        display: block; font-size: .58rem; letter-spacing: .17em;
                        text-transform: uppercase; color: rgba(245,240,232,.4);
                        margin-bottom: .5rem; font-weight: 700;
                    }
                    .field-wrap { position: relative; }
                    .field-icon {
                        position: absolute; left: 1rem; top: 50%; transform: translateY(-50%);
                        width: 15px; height: 15px; color: rgba(245,240,232,.26);
                        pointer-events: none; transition: color .2s;
                    }
                    .field-wrap:focus-within .field-icon { color: var(--accent); }
                    .field-input {
                        width: 100%; background: rgba(245,240,232,.04);
                        border: 1px solid rgba(245,240,232,.09); color: var(--white);
                        font-family: var(--body); font-size: .84rem;
                        padding: .82rem 1rem .82rem 2.7rem;
                        outline: none; transition: border-color .22s, background .22s;
                    }
                    .field-input:focus {
                        border-color: rgba(232,255,0,.5);
                        background: rgba(232,255,0,.03);
                    }
                    .field-input::placeholder { color: rgba(245,240,232,.19); }
                    .field-input.no-icon { padding-left: 1rem; }
                    .field-error { font-size: .7rem; color: var(--accent2); margin-top: .45rem; }
                    .field-hint {
                        font-size: .68rem; color: rgba(245,240,232,.28);
                        margin-top: .45rem; line-height: 1.55;
                    }

                    .field-select {
                        width: 100%;
                        background: rgba(245,240,232,.04);
                        border: 1px solid rgba(245,240,232,.09);
                        color: var(--white);
                        font-family: var(--body); font-size: .84rem;
                        padding: .82rem 1rem;
                        outline: none; cursor: none;
                        transition: border-color .22s;
                    }
                    .field-select:focus { border-color: rgba(232,255,0,.5); }
                    .field-select option { background: #1a1a1a; color: var(--white); }

                    .field-textarea {
                        width: 100%; min-height: 80px; resize: vertical;
                        background: rgba(245,240,232,.04);
                        border: 1px solid rgba(245,240,232,.09); color: var(--white);
                        font-family: var(--body); font-size: .84rem; line-height: 1.7;
                        padding: .82rem 1rem;
                        outline: none; transition: border-color .22s, background .22s;
                    }
                    .field-textarea:focus {
                        border-color: rgba(232,255,0,.5);
                        background: rgba(232,255,0,.03);
                    }
                    .field-textarea::placeholder { color: rgba(245,240,232,.19); }

                    .strength { margin-top: .6rem; }
                    .strength-bars { display: flex; gap: .3rem; margin-bottom: .35rem; }
                    .strength-bar {
                        flex: 1; height: 3px;
                        background: rgba(245,240,232,.09);
                        transition: background .3s;
                    }
                    .strength-bar.on-1 { background: var(--accent2); }
                    .strength-bar.on-2 { background: var(--amber); }
                    .strength-bar.on-3 { background: var(--accent); }
                    .strength-bar.on-4 { background: var(--green); }
                    .strength-label {
                        font-size: .6rem; letter-spacing: .12em;
                        text-transform: uppercase; font-weight: 700;
                    }
                    .strength-label.l1 { color: var(--accent2); }
                    .strength-label.l2 { color: var(--amber); }
                    .strength-label.l3 { color: var(--accent); }
                    .strength-label.l4 { color: var(--green); }

                    .alert {
                        display: flex; align-items: flex-start; gap: .65rem;
                        font-size: .77rem; line-height: 1.65;
                        padding: .9rem 1.05rem; margin-bottom: 1.3rem;
                        animation: slideDown .3s ease;
                    }
                    .alert svg { flex-shrink: 0; margin-top: .12rem; }
                    .alert.success {
                        color: var(--green);
                        background: rgba(74,222,128,.07);
                        border-left: 2px solid var(--green);
                    }

                    .btn-row { display: flex; gap: .6rem; margin-top: .4rem; }
                    .btn-primary {
                        flex: 1; position: relative; overflow: hidden;
                        display: inline-flex; align-items: center; justify-content: center; gap: .5rem;
                        background: var(--accent); color: var(--black); border: none;
                        font-family: var(--body); font-size: .7rem; font-weight: 700;
                        letter-spacing: .15em; text-transform: uppercase;
                        padding: .95rem; cursor: none;
                        box-shadow: 0 4px 18px rgba(232,255,0,.13);
                        transition: transform .2s, box-shadow .26s;
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
                        box-shadow: 0 9px 28px rgba(232,255,0,.22);
                    }
                    .btn-primary:hover:not(:disabled) span,
                    .btn-primary:hover:not(:disabled) svg { color: var(--white); }
                    .btn-primary:disabled { opacity: .42; transform: none; }
                    .btn-primary span, .btn-primary svg {
                        position: relative; z-index: 1; transition: color .25s;
                    }

                    .btn-ghost {
                        background: transparent; border: 1px solid rgba(245,240,232,.14);
                        color: rgba(245,240,232,.5);
                        font-family: var(--body); font-size: .7rem; font-weight: 700;
                        letter-spacing: .14em; text-transform: uppercase;
                        padding: .95rem 1.3rem; cursor: none;
                        transition: all .22s;
                    }
                    .btn-ghost:hover { border-color: var(--accent2); color: var(--accent2); }

                    .note {
                        display: flex; align-items: flex-start; gap: .55rem;
                        font-size: .7rem; line-height: 1.65;
                        color: rgba(245,240,232,.28); margin-top: 1.1rem;
                    }
                    .note svg { flex-shrink: 0; margin-top: .12rem; opacity: .55; }

                    .danger-copy {
                        font-size: .82rem; line-height: 1.8;
                        color: rgba(245,240,232,.48);
                        margin-bottom: .9rem;
                    }
                    .danger-copy strong { color: rgba(245,240,232,.8); font-weight: 600; }

                    .danger-blocked {
                        display: flex; align-items: flex-start; gap: .7rem;
                        background: rgba(255,170,60,.06);
                        border-left: 2px solid var(--amber);
                        padding: 1rem 1.15rem;
                        font-size: .8rem; line-height: 1.7;
                        color: rgba(245,240,232,.55);
                    }
                    .danger-blocked svg { flex-shrink: 0; margin-top: .18rem; color: var(--amber); }
                    .danger-blocked strong { color: var(--amber); font-weight: 600; }

                    .btn-danger {
                        display: inline-flex; align-items: center; gap: .5rem;
                        margin-top: .5rem;
                        background: transparent;
                        border: 1px solid rgba(255,61,46,.3);
                        color: rgba(255,61,46,.85);
                        font-family: var(--body); font-size: .68rem; font-weight: 700;
                        letter-spacing: .14em; text-transform: uppercase;
                        padding: .88rem 1.5rem; cursor: none;
                        transition: all .22s;
                    }
                    .btn-danger:hover {
                        background: rgba(255,61,46,.09);
                        border-color: var(--accent2); color: var(--accent2);
                        transform: translateY(-2px);
                    }

                    .modal-overlay {
                        position: fixed; inset: 0; z-index: 1000;
                        background: rgba(0,0,0,.8); backdrop-filter: blur(5px);
                        display: flex; align-items: center; justify-content: center;
                        padding: 1.5rem; animation: overlayIn .2s ease;
                        overflow-y: auto;
                    }
                    .modal {
                        width: 100%; max-width: 440px;
                        background: linear-gradient(158deg, #202020 0%, #151515 100%);
                        border: 1px solid rgba(255,61,46,.25);
                        box-shadow: 0 30px 90px rgba(0,0,0,.75);
                        padding: 2rem; margin: auto;
                        animation: modalIn .22s cubic-bezier(.34,1.4,.64,1);
                    }
                    .modal-icon {
                        width: 52px; height: 52px; margin-bottom: 1.3rem;
                        border-radius: 50%;
                        background: rgba(255,61,46,.08);
                        border: 1px solid rgba(255,61,46,.3);
                        display: flex; align-items: center; justify-content: center;
                        color: var(--accent2);
                    }
                    .modal-title {
                        font-family: var(--serif); font-size: 1.65rem;
                        letter-spacing: .05em; line-height: 1; margin-bottom: .8rem;
                    }
                    .modal-body {
                        font-size: .83rem; font-weight: 300;
                        color: rgba(245,240,232,.5); line-height: 1.75;
                        margin-bottom: 1.6rem;
                    }
                    .modal-body strong { color: rgba(245,240,232,.85); font-weight: 500; }
                    .modal-actions { display: flex; gap: .7rem; margin-top: 1.5rem; }
                    .modal-confirm {
                        flex: 1; background: var(--accent2); color: #fff; border: none;
                        font-family: var(--body); font-size: .68rem; font-weight: 700;
                        letter-spacing: .14em; text-transform: uppercase;
                        padding: .9rem; cursor: none; transition: transform .2s;
                    }
                    .modal-confirm:hover:not(:disabled) { transform: translateY(-2px); }
                    .modal-confirm:disabled { opacity: .45; }
                    .modal-dismiss {
                        background: transparent; border: 1px solid rgba(245,240,232,.15);
                        color: rgba(245,240,232,.5);
                        font-family: var(--body); font-size: .68rem; font-weight: 600;
                        letter-spacing: .13em; text-transform: uppercase;
                        padding: .9rem 1.4rem; cursor: none; transition: all .2s;
                    }
                    .modal-dismiss:hover { border-color: var(--white); color: var(--white); }

                    .set-foot {
                        display: flex; align-items: center; justify-content: space-between;
                        gap: 1rem; margin-top: 2rem; flex-wrap: wrap;
                        animation: fadeUp .6s .2s ease both;
                    }
                    .back-link {
                        display: inline-flex; align-items: center; gap: .5rem;
                        font-size: .66rem; letter-spacing: .14em; text-transform: uppercase;
                        font-weight: 600;
                        color: rgba(245,240,232,.32); text-decoration: none;
                        transition: color .2s;
                    }
                    .back-link:hover { color: var(--accent); }
                    .logout-btn {
                        display: inline-flex; align-items: center; gap: .5rem;
                        background: transparent; border: 1px solid rgba(255,61,46,.2);
                        color: rgba(255,61,46,.72);
                        font-family: var(--body); font-size: .64rem; font-weight: 700;
                        letter-spacing: .14em; text-transform: uppercase;
                        padding: .7rem 1.2rem; cursor: none;
                        transition: all .22s;
                    }
                    .logout-btn:hover {
                        background: rgba(255,61,46,.07);
                        border-color: var(--accent2); color: var(--accent2);
                    }

                    @media (max-width: 768px) {
                        .set-page { padding: 6.5rem 1.2rem 6rem; }
                    }

                    @media (max-width: 620px) {
                        .email-display { flex-wrap: wrap; row-gap: 1rem; }
                        .email-meta { flex: 1 1 calc(100% - 3.2rem); }
                        .email-action { flex: 1 1 100%; }
                        .email-action .link-btn,
                        .email-action .locked-note { width: 100%; }
                    }

                    @media (max-width: 560px) {
                        .card { padding: 1.4rem; }
                        .field-row { flex-direction: column; gap: 0; }
                        .otp-row { gap: .35rem; }
                        .otp-box { font-size: 1.15rem; }
                        .avatar-row { flex-direction: column; align-items: flex-start; }
                        .set-foot { flex-direction: column-reverse; align-items: stretch; }
                        .logout-btn, .back-link { justify-content: center; }
                        .card-note { margin-left: 0; width: 100%; margin-top: .5rem; }
                        .card-note.flag { display: inline-block; width: auto; }
                        .btn-danger { width: 100%; justify-content: center; }
                        .modal { padding: 1.7rem; }
                        .modal-actions { flex-direction: column-reverse; }
                    }
                `}</style>
            </Head>

            <SiteNav />
            <div className="custom-cursor" ref={cursorRef} />

            {deleteOpen && (
                <div className="modal-overlay" onClick={() => setDeleteOpen(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-icon">
                            <ShieldAlert size={22} />
                        </div>
                        <h2 className="modal-title">DELETE YOUR ACCOUNT?</h2>
                        <p className="modal-body">
                            You'll be signed out now. You have <strong>30 days</strong> to change your mind — just sign in again and your account comes back exactly as you left it.
                        </p>

                        <form onSubmit={submitDelete}>
                            <div className="field-group">
                                <label className="field-label">Why are you leaving? (optional)</label>
                                <select className="field-select" value={deleteForm.data.reason} onChange={(e) => deleteForm.setData('reason', e.target.value)}>
                                    <option value="">Prefer not to say</option>
                                    {Object.entries(deletionReasons)
                                        .filter(([key]) => key !== 'not_say')
                                        .map(([key, label]) => (
                                            <option key={key} value={key}>{label}</option>
                                        ))}
                                </select>
                            </div>

                            {deleteForm.data.reason && (
                                <div className="field-group">
                                    <label className="field-label">Anything else? (optional)</label>
                                    <textarea className="field-textarea" maxLength={1000} value={deleteForm.data.comment} onChange={(e) => deleteForm.setData('comment', e.target.value)} placeholder="Your feedback helps us improve." />
                                </div>
                            )}

                            {user.has_password ? (
                                <div className="field-group">
                                    <label className="field-label">Confirm with your password</label>
                                    <div className="field-wrap">
                                        <Lock className="field-icon" />
                                        <input type="password" className="field-input" value={deleteForm.data.password} onChange={(e) => deleteForm.setData('password', e.target.value)} placeholder="••••••••" autoComplete="current-password" />
                                    </div>
                                    {deleteForm.errors.password && (
                                        <div className="field-error">{deleteForm.errors.password}</div>
                                    )}
                                </div>
                            ) : (
                                <div className="field-group">
                                    <label className="field-label">Type DELETE to confirm</label>
                                    <input type="text" className="field-input no-icon" value={deleteForm.data.confirm} onChange={(e) => deleteForm.setData('confirm', e.target.value)} placeholder="DELETE" autoComplete="off" />
                                    <p className="field-hint">
                                        You signed up with Google, so there's no password to confirm with. Typing DELETE tells us you meant to do this.
                                    </p>
                                    {deleteForm.errors.confirm && (
                                        <div className="field-error">{deleteForm.errors.confirm}</div>
                                    )}
                                </div>
                            )}

                            <div className="modal-actions">
                                <button type="submit" className="modal-confirm" disabled={deleteForm.processing}>
                                    {deleteForm.processing ? 'Deleting...' : 'Delete Account'}
                                </button>
                                <button type="button" className="modal-dismiss" onClick={() => setDeleteOpen(false)}>
                                    Keep My Account
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="set-page">
                <div className="set-shell">
                    <div className="set-head">
                        <p className="set-eyebrow">Account</p>
                        <h1 className="set-title">
                            ACCOUNT <span className="accent">SETTINGS</span>
                        </h1>
                        <p className="set-sub">
                            Update your details, email address and password. Changes to your credentials are always confirmed by email.
                        </p>
                    </div>

                    <AccountTabs />

                    {!user.has_password && (
                        <div className="card priority">
                            <div className="card-head">
                                <div className="card-icon">
                                    <ShieldAlert size={16} />
                                </div>
                                <p className="card-title">SET A PASSWORD</p>
                                <span className="card-note flag">Recommended</span>
                            </div>

                            {pwSetSaved && (
                                <div className="alert success">
                                    <Check size={15} />
                                    Password set. You can now sign in with either Google or your email and password — and change your email address below.
                                </div>
                            )}

                            <div className="google-notice">
                                <ShieldCheck size={15} />
                                <span>
                                    You signed up with Google, so this account has <strong>no password yet</strong>. Setting one means you can still get in if you ever lose access to that Google account — and it's required before you can change your email address.
                                </span>
                            </div>

                            <form onSubmit={submitSetPassword}>
                                <div className="field-row">
                                    <div className="field-group">
                                        <label className="field-label">New Password</label>
                                        <div className="field-wrap">
                                            <KeyRound className="field-icon" />
                                            <input type="password" value={setPwForm.data.password} onChange={(e) => setPwForm.setData('password', e.target.value)} className="field-input" placeholder="8+ characters" autoComplete="new-password" />
                                        </div>
                                        <StrengthMeter s={setPwStrength} />
                                        {setPwForm.errors.password && (
                                            <div className="field-error">{setPwForm.errors.password}</div>
                                        )}
                                    </div>

                                    <div className="field-group">
                                        <label className="field-label">Confirm Password</label>
                                        <div className="field-wrap">
                                            <KeyRound className="field-icon" />
                                            <input type="password" value={setPwForm.data.password_confirmation} onChange={(e) => setPwForm.setData('password_confirmation', e.target.value)} className="field-input" placeholder="Repeat it" autoComplete="new-password" />
                                        </div>
                                        {setPwForm.errors.password_confirmation && (
                                            <div className="field-error">{setPwForm.errors.password_confirmation}</div>
                                        )}
                                    </div>
                                </div>

                                <div className="btn-row">
                                    <button type="submit" className="btn-primary" disabled={setPwForm.processing}>
                                        <span>{setPwForm.processing ? 'Setting...' : 'Set Password'}</span>
                                        <ArrowRight size={14} />
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="card">
                        <div className="card-head">
                            <div className="card-icon">
                                <IdCard size={16} />
                            </div>
                            <p className="card-title">PERSONAL INFORMATION</p>
                        </div>

                        {infoSaved && (
                            <div className="alert success">
                                <Check size={15} />
                                Your details were updated.
                            </div>
                        )}

                        <form onSubmit={submitInfo}>
                            <div className="avatar-row">
                                <label className="avatar-shell" htmlFor="avatar-upload">
                                    {preview ? (
                                        <img src={preview} alt="Profile" />
                                    ) : (
                                        <span className="avatar-initial">{initial}</span>
                                    )}
                                    <div className="avatar-overlay">
                                        <Camera size={18} />
                                        <span>Change</span>
                                    </div>
                                </label>

                                <div className="avatar-meta">
                                    <label htmlFor="avatar-upload" className="avatar-btn">
                                        <Upload size={12} /> Upload Photo
                                    </label>
                                    <input id="avatar-upload" type="file" accept="image/*" onChange={handlePictureChange} className="file-hidden" />
                                    <p className="avatar-hint">JPG, PNG or AVIF · Max 2MB · Optional</p>
                                    {infoForm.errors.profile_picture && (
                                        <div className="field-error">{infoForm.errors.profile_picture}</div>
                                    )}
                                </div>
                            </div>

                            <div className="field-row">
                                <div className="field-group">
                                    <label className="field-label">Full Name</label>
                                    <div className="field-wrap">
                                        <User className="field-icon" />
                                        <input type="text" value={infoForm.data.name} onChange={(e) => infoForm.setData('name', e.target.value)} className="field-input" placeholder="Your full name" />
                                    </div>
                                    {infoForm.errors.name && (
                                        <div className="field-error">{infoForm.errors.name}</div>
                                    )}
                                </div>

                                <div className="field-group">
                                    <label className="field-label">Phone Number</label>
                                    <div className="field-wrap">
                                        <Phone className="field-icon" />
                                        <input type="tel" value={infoForm.data.phone} onChange={(e) => infoForm.setData('phone', e.target.value)} className="field-input" placeholder="+234 800 000 0000" />
                                    </div>
                                    {infoForm.errors.phone && (
                                        <div className="field-error">{infoForm.errors.phone}</div>
                                    )}
                                </div>
                            </div>

                            <div className="btn-row">
                                <button type="submit" className="btn-primary" disabled={infoForm.processing}>
                                    <span>{infoForm.processing ? 'Saving...' : 'Save Changes'}</span>
                                    <ArrowRight size={14} />
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="card">
                        <div className="card-head">
                            <div className="card-icon">
                                <Mail size={16} />
                            </div>
                            <p className="card-title">EMAIL ADDRESS</p>
                            <span className="card-note">Sign-in</span>
                        </div>

                        {emailSaved && (
                            <div className="alert success">
                                <Check size={15} />
                                Email updated. Use your new address next time you sign in.
                            </div>
                        )}

                        <div className="email-display">
                            <div className="email-avatar">
                                <Mail size={16} />
                            </div>
                            <div className="email-meta">
                                <p className="email-value">{user.email}</p>
                                <span className={`email-status ${user.email_verified_at ? 'ok' : 'warn'}`}>
                                    {user.email_verified_at ? (
                                        <>
                                            <Check size={10} /> Verified
                                        </>
                                    ) : (
                                        <>
                                            <AlertTriangle size={10} /> Unverified
                                        </>
                                    )}
                                </span>
                            </div>

                            {!emailChange && !showEmailForm && (
                                <div className="email-action">
                                    {user.has_password ? (
                                        <button className="link-btn" onClick={() => setShowEmailForm(true)}>
                                            Change
                                        </button>
                                    ) : (
                                        <span className="locked-note">
                                            <Lock size={10} /> Set a password first
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {showEmailForm && !emailChange && (
                            <form onSubmit={submitEmailRequest}>
                                <div className="field-group">
                                    <label className="field-label">New Email Address</label>
                                    <div className="field-wrap">
                                        <Mail className="field-icon" />
                                        <input type="email" value={emailForm.data.new_email} onChange={(e) => emailForm.setData('new_email', e.target.value)} className="field-input" placeholder="you@example.com" autoComplete="off" />
                                    </div>
                                    {emailForm.errors.new_email && (
                                        <div className="field-error">{emailForm.errors.new_email}</div>
                                    )}
                                </div>

                                <div className="field-group">
                                    <label className="field-label">Confirm With Password</label>
                                    <div className="field-wrap">
                                        <Lock className="field-icon" />
                                        <input type="password" value={emailForm.data.password} onChange={(e) => emailForm.setData('password', e.target.value)} className="field-input" placeholder="••••••••" autoComplete="current-password" />
                                    </div>
                                    {emailForm.errors.password && (
                                        <div className="field-error">{emailForm.errors.password}</div>
                                    )}
                                </div>

                                <div className="btn-row">
                                    <button type="submit" className="btn-primary" disabled={emailForm.processing}>
                                        <span>{emailForm.processing ? 'Sending...' : 'Send Code'}</span>
                                        <ArrowRight size={14} />
                                    </button>
                                    <button type="button" className="btn-ghost" onClick={() => { setShowEmailForm(false); emailForm.reset(); }}>
                                        Cancel
                                    </button>
                                </div>

                                <p className="note">
                                    <ShieldCheck size={12} />
                                    A 6-digit code goes to the new address, and a security alert to your current one. Nothing changes until the code is confirmed.
                                </p>
                            </form>
                        )}

                        {emailChange && (
                            <div className="pending">
                                <div className="pending-top">
                                    <Mail size={16} />
                                    <p className="pending-copy">
                                        Code sent to <strong>{maskEmail(emailChange.pending_email)}</strong>. Enter the 6 digits below.
                                    </p>
                                </div>

                                <form onSubmit={submitCode}>
                                    <div className="otp-row">
                                        {digits.map((d, i) => (
                                            <input key={i} ref={(el) => (boxRefs.current[i] = el)} type="text" inputMode="numeric" maxLength={1} value={d} onChange={(e) => setDigit(i, e.target.value)} onKeyDown={(e) => onDigitKeyDown(i, e)} onPaste={onDigitPaste} onFocus={(e) => e.target.select()} className={`otp-box ${d ? 'filled' : ''} ${codeForm.errors.code ? 'error' : ''}`} autoComplete={i === 0 ? 'one-time-code' : 'off'} />
                                        ))}
                                    </div>

                                    {codeForm.errors.code && (
                                        <div className="field-error" style={{ marginBottom: '.9rem' }}>
                                            {codeForm.errors.code}
                                        </div>
                                    )}

                                    <div className="otp-meta">
                                        <span className={`countdown ${secondsLeft === 0 ? 'expired' : ''}`}>
                                            {secondsLeft > 0 ? (
                                                <>
                                                    Expires in <strong>{mmss(secondsLeft)}</strong>
                                                </>
                                            ) : (
                                                <strong>Code expired</strong>
                                            )}
                                        </span>

                                        <div className="otp-actions">
                                            <button type="button" className="text-btn" onClick={resendCode}>
                                                <RotateCw size={11} /> Resend
                                            </button>
                                            <button type="button" className="text-btn danger" onClick={cancelChange}>
                                                <X size={11} /> Cancel
                                            </button>
                                        </div>
                                    </div>

                                    <div className="btn-row">
                                        <button type="submit" className="btn-primary" disabled={codeForm.processing || digits.join('').length !== 6}>
                                            <span>{codeForm.processing ? 'Verifying...' : 'Confirm Change'}</span>
                                            <Check size={14} />
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>

                    {user.has_password && (
                        <div className="card">
                            <div className="card-head">
                                <div className="card-icon">
                                    <KeyRound size={16} />
                                </div>
                                <p className="card-title">PASSWORD</p>
                                <span className="card-note">Sign-in</span>
                            </div>

                            {pwSaved && (
                                <div className="alert success">
                                    <Check size={15} />
                                    Password updated — we've emailed you a confirmation.
                                </div>
                            )}

                            <form onSubmit={submitPassword}>
                                <div className="field-group">
                                    <label className="field-label">Current Password</label>
                                    <div className="field-wrap">
                                        <Lock className="field-icon" />
                                        <input type="password" value={pwForm.data.current_password} onChange={(e) => pwForm.setData('current_password', e.target.value)} className="field-input" placeholder="••••••••" autoComplete="current-password" />
                                    </div>
                                    {pwForm.errors.current_password && (
                                        <div className="field-error">{pwForm.errors.current_password}</div>
                                    )}
                                </div>

                                <div className="field-row">
                                    <div className="field-group">
                                        <label className="field-label">New Password</label>
                                        <div className="field-wrap">
                                            <KeyRound className="field-icon" />
                                            <input type="password" value={pwForm.data.password} onChange={(e) => pwForm.setData('password', e.target.value)} className="field-input" placeholder="8+ characters" autoComplete="new-password" />
                                        </div>
                                        <StrengthMeter s={pwStrength} />
                                        {pwForm.errors.password && (
                                            <div className="field-error">{pwForm.errors.password}</div>
                                        )}
                                    </div>

                                    <div className="field-group">
                                        <label className="field-label">Confirm New Password</label>
                                        <div className="field-wrap">
                                            <KeyRound className="field-icon" />
                                            <input type="password" value={pwForm.data.password_confirmation} onChange={(e) => pwForm.setData('password_confirmation', e.target.value)} className="field-input" placeholder="••••••••" autoComplete="new-password" />
                                        </div>
                                        {pwForm.errors.password_confirmation && (
                                            <div className="field-error">{pwForm.errors.password_confirmation}</div>
                                        )}
                                    </div>
                                </div>

                                <div className="btn-row">
                                    <button type="submit" className="btn-primary" disabled={pwForm.processing}>
                                        <span>{pwForm.processing ? 'Updating...' : 'Update Password'}</span>
                                        <ArrowRight size={14} />
                                    </button>
                                </div>

                                <p className="note">
                                    <ShieldCheck size={12} />
                                    You'll be emailed whenever your password changes, so you'll know if someone else does it.
                                </p>
                            </form>
                        </div>
                    )}

                    <div className="card danger-card">
                        <div className="card-head">
                            <div className="card-icon danger">
                                <Trash2 size={16} />
                            </div>
                            <p className="card-title">DELETE ACCOUNT</p>
                        </div>

                        {activeOrders > 0 ? (
                            <div className="danger-blocked">
                                <AlertTriangle size={15} />
                                <span>
                                    You have <strong>{activeOrders} order{activeOrders === 1 ? '' : 's'}</strong> still in progress. You can delete your account once they're delivered or cancelled.
                                </span>
                            </div>
                        ) : (
                            <>
                                <p className="danger-copy">
                                    Deleting your account signs you out and starts a <strong>30-day grace period</strong>. Sign back in during that window and everything is restored exactly as you left it.
                                </p>
                                <p className="danger-copy">
                                    After 30 days your name, email, phone, addresses and saved items are permanently removed. Past order records are kept for tax and accounting purposes, as the law requires.
                                </p>
                                <button className="btn-danger" onClick={() => setDeleteOpen(true)}>
                                    <Trash2 size={14} /> Delete My Account
                                </button>
                            </>
                        )}
                    </div>

                    <div className="set-foot">
                        <Link href="/product-page" className="back-link">
                            <ArrowLeft size={13} /> Back to Shop
                        </Link>
                        <button className="logout-btn" onClick={() => router.post('/logout')}>
                            <LogOut size={13} /> Log Out
                        </button>
                    </div>
                </div>
            </div>

            <CartWidget />
        </>
    );
}

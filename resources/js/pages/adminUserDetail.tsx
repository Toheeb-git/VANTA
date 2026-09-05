import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
    ArrowLeft,
    Mail,
    Phone,
    Clock,
    ShieldCheck,
    ShieldOff,
    ShieldAlert,
    UserX,
    UserCheck,
    Package,
    Wallet,
    Star,
    CircleSlash,
    Ghost,
    AlertTriangle,
    ChevronRight,
    Copy,
    Check,
} from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';

interface OrderItem {
    id: number;
    quantity: number;
    price: number | string;
    product: { name: string } | null;
}

interface Order {
    id: number;
    reference: string;
    total_amount: number | string;
    status: string;
    created_at: string;
    items: OrderItem[];
}

export default function AdminUserDetail() {
    const { user, orders, stats, appUrl } = usePage().props as unknown as {
        user: {
            id: number;
            name: string;
            email: string;
            phone: string | null;
            profile_picture: string | null;
            avatar_url: string | null;
            role: string;
            email_verified_at: string | null;
            google_linked: boolean;
            created_at: string;
            last_login_at: string | null;
            suspended_at: string | null;
            suspension_reason: string | null;
            deleted_at: string | null;
            anonymised_at: string | null;
            deletion_deadline: string | null;
        };
        orders: Order[];
        stats: {
            orders: number;
            spent: number | string;
            cancelled: number;
            reviews: number;
        };
        appUrl: string;
    };

    const [suspendOpen, setSuspendOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const suspendForm = useForm({ reason: '' });

    const isSuspended = !!user.suspended_at;
    const isLeaving = !!user.deleted_at && !user.anonymised_at;
    const isAnonymised = !!user.anonymised_at;
    const isAdmin = user.role === 'admin';

    const avatar = user.profile_picture
        ? `${appUrl}/storage/${user.profile_picture}`
        : user.avatar_url;

    const fmtDate = (iso: string | null) =>
        iso
            ? new Date(iso).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
              })
            : '—';

    const fmtDateTime = (iso: string | null) =>
        iso
            ? new Date(iso).toLocaleString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
              })
            : 'Never';

    const daysLeft = user.deletion_deadline
        ? Math.max(
              0,
              Math.ceil(
                  (new Date(user.deletion_deadline).getTime() - Date.now()) /
                      86400000,
              ),
          )
        : 0;

    const submitSuspend = (e: React.FormEvent) => {
        e.preventDefault();
        suspendForm.patch(`/admin/users/${user.id}/suspend`, {
            preserveScroll: true,
            onSuccess: () => {
                suspendForm.reset();
                setSuspendOpen(false);
            },
        });
    };

    const unsuspend = () => {
        router.patch(`/admin/users/${user.id}/unsuspend`, {}, { preserveScroll: true });
    };

    const copyEmail = () => {
        navigator.clipboard.writeText(user.email);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const statusWord = isAnonymised
        ? 'Anonymised'
        : isLeaving
          ? 'Leaving'
          : isSuspended
            ? 'Suspended'
            : 'Active';

    const statusClass = isSuspended
        ? 'bad'
        : isAnonymised || isLeaving
          ? 'neutral'
          : 'ok';

    return (
        <>
            <Head title={`${user.name} — Admin`}>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
                <style>{`
                    :root {
                        --black: #0a0a0a; --white: #f5f0e8; --accent: #e8ff00;
                        --accent2: #ff3d2e; --green: #4ade80; --amber: #ffaa3c;
                        --blue: #7ab4ff; --purple: #be8cff;
                        --mid: #1c1c1c; --muted: #555;
                        --serif: 'Bebas Neue', sans-serif; --body: 'DM Sans', sans-serif;
                        --z-content: 1; --z-modal: 1000;
                    }
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    body { background: var(--black); color: var(--white); font-family: var(--body); }

                    @keyframes fadeUp {
                        from { opacity: 0; transform: translateY(16px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }
                    @keyframes modalIn {
                        from { opacity: 0; transform: scale(.94) translateY(10px); }
                        to { opacity: 1; transform: scale(1) translateY(0); }
                    }
                    @keyframes pulseSoft {
                        0%,100% { opacity: .85; }
                        50% { opacity: 1; }
                    }

                    .detail-page {
                        position: relative; z-index: var(--z-content);
                        min-height: 100vh; padding: 2.6rem 2rem 5rem;
                        overflow-x: hidden;
                    }
                    .detail-page::before {
                        content: ''; position: absolute; inset: 0;
                        background: radial-gradient(circle at 72% 0%, rgba(232,255,0,.05) 0%, transparent 55%);
                        pointer-events: none;
                    }
                    .detail-shell { max-width: 1080px; margin: 0 auto; position: relative; }

                    .detail-topbar {
                        display: flex; align-items: center; justify-content: space-between;
                        gap: 1rem; margin-bottom: 1.8rem;
                    }
                    .back-link {
                        display: inline-flex; align-items: center; gap: .5rem;
                        font-size: .66rem; letter-spacing: .15em; text-transform: uppercase;
                        font-weight: 600;
                        color: rgba(245,240,232,.4); text-decoration: none;
                        padding: .55rem .9rem;
                        border: 1px solid rgba(245,240,232,.1);
                        transition: all .22s;
                    }
                    .back-link:hover {
                        color: var(--accent);
                        border-color: rgba(232,255,0,.35);
                        background: rgba(232,255,0,.04);
                    }

                    .banner {
                        display: flex; align-items: flex-start; gap: .85rem;
                        padding: 1.1rem 1.35rem; margin-bottom: 1.5rem;
                        animation: fadeUp .5s ease both;
                    }
                    .banner svg { flex-shrink: 0; margin-top: .15rem; }
                    .banner-body { flex: 1; min-width: 0; }
                    .banner-title {
                        font-size: .68rem; letter-spacing: .16em;
                        text-transform: uppercase; font-weight: 700;
                        margin-bottom: .4rem;
                    }
                    .banner-text {
                        font-size: .82rem; line-height: 1.7;
                        color: rgba(245,240,232,.55);
                    }
                    .banner.danger {
                        background: rgba(255,61,46,.07);
                        border-left: 2px solid var(--accent2);
                    }
                    .banner.danger svg, .banner.danger .banner-title { color: var(--accent2); }
                    .banner.warn {
                        background: rgba(255,170,60,.06);
                        border-left: 2px solid var(--amber);
                    }
                    .banner.warn svg, .banner.warn .banner-title { color: var(--amber); }
                    .banner.neutral {
                        background: rgba(245,240,232,.03);
                        border-left: 2px solid rgba(245,240,232,.2);
                    }
                    .banner.neutral svg, .banner.neutral .banner-title { color: rgba(245,240,232,.5); }

                    .countdown-pill {
                        display: inline-flex; align-items: center; gap: .4rem;
                        margin-top: .7rem;
                        font-size: .62rem; letter-spacing: .12em;
                        text-transform: uppercase; font-weight: 700;
                        color: var(--amber);
                        border: 1px solid rgba(255,170,60,.3);
                        background: rgba(255,170,60,.07);
                        padding: .35rem .7rem;
                        animation: pulseSoft 2.4s ease-in-out infinite;
                    }

                    .user-hero {
                        display: flex; align-items: center; gap: 1.8rem;
                        background: linear-gradient(158deg, #202020 0%, #161616 100%);
                        border: 1px solid rgba(245,240,232,.075);
                        padding: 2rem; margin-bottom: 1.3rem;
                        position: relative; overflow: hidden;
                        animation: fadeUp .5s .05s ease both;
                    }
                    .user-hero::after {
                        content: ''; position: absolute;
                        top: -40px; right: -40px; width: 200px; height: 200px;
                        background: radial-gradient(circle, rgba(232,255,0,.05), transparent 70%);
                        pointer-events: none;
                    }
                    .user-hero.dimmed { opacity: .7; }

                    .hero-avatar {
                        width: 92px; height: 92px; flex-shrink: 0;
                        border-radius: 50%; overflow: hidden;
                        background: linear-gradient(145deg, #272727, #131313);
                        display: flex; align-items: center; justify-content: center;
                        box-shadow: 0 0 0 1px rgba(232,255,0,.22), 0 0 0 5px rgba(232,255,0,.04);
                        position: relative; z-index: 1;
                    }
                    .hero-avatar img { width: 100%; height: 100%; object-fit: cover; }
                    .hero-avatar span {
                        font-family: var(--serif); font-size: 2.5rem;
                        color: var(--accent); line-height: 1;
                    }

                    .hero-identity { flex: 1; min-width: 0; position: relative; z-index: 1; }
                    .hero-name-row {
                        display: flex; align-items: center; gap: .7rem; flex-wrap: wrap;
                    }
                    .hero-name {
                        font-family: var(--serif);
                        font-size: clamp(1.9rem, 4vw, 2.5rem);
                        letter-spacing: .04em; line-height: 1;
                        overflow-wrap: break-word;
                    }
                    .role-tag {
                        font-size: .55rem; letter-spacing: .14em;
                        text-transform: uppercase; font-weight: 700;
                        padding: .3rem .6rem;
                    }
                    .role-tag.admin { background: rgba(232,255,0,.1); color: var(--accent); border: 1px solid rgba(232,255,0,.32); }
                    .role-tag.suspended { background: rgba(255,61,46,.1); color: var(--accent2); border: 1px solid rgba(255,61,46,.32); }
                    .role-tag.leaving { background: rgba(255,170,60,.1); color: var(--amber); border: 1px solid rgba(255,170,60,.32); }
                    .role-tag.anonymised { background: rgba(245,240,232,.04); color: rgba(245,240,232,.4); border: 1px solid rgba(245,240,232,.13); }

                    .hero-contact {
                        display: flex; flex-wrap: wrap; align-items: center; gap: 1.2rem;
                        margin-top: .9rem;
                    }
                    .contact-item {
                        display: inline-flex; align-items: center; gap: .45rem;
                        font-size: .8rem; color: rgba(245,240,232,.55);
                        text-decoration: none; transition: color .2s;
                    }
                    .contact-item:hover { color: var(--accent); }
                    .contact-item svg { color: rgba(245,240,232,.28); flex-shrink: 0; }
                    .copy-btn {
                        background: none; border: none; padding: 0;
                        color: rgba(245,240,232,.26); cursor: pointer;
                        display: inline-flex; transition: color .2s;
                    }
                    .copy-btn:hover { color: var(--accent); }
                    .copied-tag {
                        font-size: .55rem; letter-spacing: .13em;
                        text-transform: uppercase; color: var(--accent); font-weight: 700;
                    }

                    .stats-grid {
                        display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
                        gap: 1rem; margin-bottom: 1.3rem;
                    }
                    .stat {
                        background: linear-gradient(158deg, #1e1e1e 0%, #161616 100%);
                        border: 1px solid rgba(245,240,232,.07);
                        padding: 1.3rem; min-width: 0;
                        animation: fadeUp .5s .1s ease both;
                        transition: border-color .26s, transform .26s;
                    }
                    .stat:hover { border-color: rgba(232,255,0,.22); transform: translateY(-2px); }
                    .stat-icon {
                        width: 30px; height: 30px;
                        display: flex; align-items: center; justify-content: center;
                        border: 1px solid rgba(232,255,0,.22);
                        background: rgba(232,255,0,.05);
                        color: var(--accent); margin-bottom: .9rem;
                    }
                    .stat-icon.red {
                        border-color: rgba(255,61,46,.24);
                        background: rgba(255,61,46,.05);
                        color: var(--accent2);
                    }
                    .stat-val {
                        font-family: var(--serif); font-size: 1.85rem;
                        letter-spacing: .03em; line-height: 1;
                        overflow-wrap: break-word;
                    }
                    .stat-val.accent { color: var(--accent); }
                    .stat-lbl {
                        font-size: .55rem; letter-spacing: .17em; text-transform: uppercase;
                        color: rgba(245,240,232,.34); margin-top: .5rem; font-weight: 700;
                    }

                    .detail-grid {
                        display: grid; grid-template-columns: minmax(0, 1fr) 330px;
                        gap: 1.3rem; align-items: start;
                    }

                    .panel {
                        background: linear-gradient(158deg, #1f1f1f 0%, #171717 100%);
                        border: 1px solid rgba(245,240,232,.07);
                        padding: 1.7rem; margin-bottom: 1.3rem;
                        animation: fadeUp .5s .15s ease both;
                    }
                    .panel-head {
                        display: flex; align-items: center; gap: .75rem;
                        margin-bottom: 1.35rem; padding-bottom: 1.05rem;
                        border-bottom: 1px solid rgba(245,240,232,.07);
                    }
                    .panel-icon {
                        width: 32px; height: 32px; flex-shrink: 0;
                        border: 1px solid rgba(232,255,0,.22);
                        background: rgba(232,255,0,.05);
                        display: flex; align-items: center; justify-content: center;
                        color: var(--accent);
                    }
                    .panel-title {
                        font-family: var(--serif); font-size: 1.22rem; letter-spacing: .08em;
                    }
                    .panel-count {
                        margin-left: auto;
                        font-size: .6rem; letter-spacing: .13em;
                        text-transform: uppercase; color: rgba(245,240,232,.28);
                    }

                    .info-row {
                        display: flex; align-items: center; justify-content: space-between;
                        gap: 1rem; padding: .78rem 0;
                        border-bottom: 1px solid rgba(245,240,232,.045);
                        font-size: .8rem;
                    }
                    .info-row:last-child { border-bottom: none; }
                    .info-key { color: rgba(245,240,232,.38); flex-shrink: 0; }
                    .info-val {
                        color: rgba(245,240,232,.78); font-weight: 500;
                        text-align: right; min-width: 0; overflow-wrap: break-word;
                    }
                    .info-val.muted {
                        color: rgba(245,240,232,.26);
                        font-style: italic; font-weight: 400;
                    }
                    .verify-chip {
                        display: inline-flex; align-items: center; gap: .3rem;
                        font-size: .53rem; letter-spacing: .12em;
                        text-transform: uppercase; font-weight: 700;
                        padding: .26rem .5rem;
                    }
                    .verify-chip.ok { background: rgba(74,222,128,.1); color: var(--green); border: 1px solid rgba(74,222,128,.28); }
                    .verify-chip.warn { background: rgba(255,170,60,.1); color: var(--amber); border: 1px solid rgba(255,170,60,.28); }

                    .ord-row {
                        display: flex; align-items: center; gap: 1rem;
                        padding: .95rem 0;
                        border-bottom: 1px solid rgba(245,240,232,.045);
                        text-decoration: none; color: inherit;
                        transition: padding-left .22s;
                    }
                    .ord-row:last-child { border-bottom: none; }
                    .ord-row:hover { padding-left: .4rem; }
                    .ord-main { flex: 1; min-width: 0; }
                    .ord-ref {
                        font-family: var(--serif); font-size: 1.02rem;
                        letter-spacing: .08em; color: rgba(245,240,232,.88); line-height: 1;
                    }
                    .ord-meta {
                        font-size: .68rem; color: rgba(245,240,232,.28); margin-top: .38rem;
                    }
                    .ord-amount {
                        font-family: var(--serif); font-size: 1.15rem;
                        color: var(--accent); flex-shrink: 0;
                    }
                    .ord-status {
                        font-size: .52rem; letter-spacing: .13em; text-transform: uppercase;
                        font-weight: 700; padding: .32rem .55rem;
                        flex-shrink: 0; white-space: nowrap;
                    }
                    .ord-status.pending { background: rgba(245,240,232,.05); color: rgba(245,240,232,.45); border: 1px solid rgba(245,240,232,.13); }
                    .ord-status.paid { background: rgba(232,255,0,.09); color: var(--accent); border: 1px solid rgba(232,255,0,.3); }
                    .ord-status.confirmed { background: rgba(120,180,255,.08); color: var(--blue); border: 1px solid rgba(120,180,255,.28); }
                    .ord-status.processing { background: rgba(190,140,255,.08); color: var(--purple); border: 1px solid rgba(190,140,255,.28); }
                    .ord-status.shipped { background: rgba(255,170,60,.08); color: var(--amber); border: 1px solid rgba(255,170,60,.3); }
                    .ord-status.delivered { background: rgba(74,222,128,.09); color: var(--green); border: 1px solid rgba(74,222,128,.3); }
                    .ord-status.cancelled { background: rgba(255,61,46,.09); color: var(--accent2); border: 1px solid rgba(255,61,46,.3); }
                    .ord-arrow { color: rgba(245,240,232,.18); flex-shrink: 0; transition: color .2s; }
                    .ord-row:hover .ord-arrow { color: var(--accent); }

                    .panel-empty {
                        text-align: center; padding: 2.6rem 1rem;
                        color: rgba(245,240,232,.28); font-size: .84rem;
                    }
                    .panel-empty svg { margin: 0 auto 1rem; display: block; opacity: .4; }

                    .action-panel {
                        position: sticky; top: 2rem;
                        background: linear-gradient(158deg, #212121 0%, #181818 100%);
                        border: 1px solid rgba(245,240,232,.09);
                        padding: 1.7rem;
                        animation: fadeUp .5s .2s ease both;
                    }
                    .action-panel.danger { border-color: rgba(255,61,46,.24); }
                    .action-title {
                        font-family: var(--serif); font-size: 1.2rem;
                        letter-spacing: .08em; margin-bottom: 1.2rem;
                        padding-bottom: 1rem;
                        border-bottom: 1px solid rgba(245,240,232,.07);
                    }
                    .action-state {
                        font-size: .58rem; letter-spacing: .16em; text-transform: uppercase;
                        color: rgba(245,240,232,.3); font-weight: 700;
                    }
                    .action-state strong {
                        display: block; margin-top: .45rem;
                        font-family: var(--serif); font-size: 1.4rem;
                        letter-spacing: .07em; font-weight: 400;
                    }
                    .action-state strong.ok { color: var(--green); }
                    .action-state strong.bad { color: var(--accent2); }
                    .action-state strong.neutral { color: rgba(245,240,232,.5); }

                    .reason-box {
                        margin-top: 1.1rem; padding: .85rem 1rem;
                        background: rgba(255,61,46,.06);
                        border-left: 2px solid rgba(255,61,46,.4);
                        font-size: .78rem; line-height: 1.65;
                        color: rgba(245,240,232,.55);
                    }
                    .reason-box-label {
                        font-size: .55rem; letter-spacing: .14em;
                        text-transform: uppercase; font-weight: 700;
                        color: var(--accent2); margin-bottom: .35rem;
                    }

                    .btn-suspend {
                        width: 100%; margin-top: 1.4rem;
                        display: inline-flex; align-items: center; justify-content: center; gap: .5rem;
                        background: transparent; border: 1px solid rgba(255,61,46,.3);
                        color: rgba(255,61,46,.85);
                        font-family: var(--body); font-size: .68rem; font-weight: 700;
                        letter-spacing: .14em; text-transform: uppercase;
                        padding: .95rem; cursor: pointer; transition: all .22s;
                    }
                    .btn-suspend:hover {
                        background: rgba(255,61,46,.09);
                        border-color: var(--accent2); color: var(--accent2);
                        transform: translateY(-2px);
                    }

                    .btn-restore {
                        width: 100%; margin-top: 1.4rem;
                        display: inline-flex; align-items: center; justify-content: center; gap: .5rem;
                        background: var(--green); color: #0a0a0a; border: none;
                        font-family: var(--body); font-size: .68rem; font-weight: 700;
                        letter-spacing: .14em; text-transform: uppercase;
                        padding: .95rem; cursor: pointer;
                        box-shadow: 0 4px 18px rgba(74,222,128,.16);
                        transition: transform .2s, box-shadow .25s;
                    }
                    .btn-restore:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 8px 26px rgba(74,222,128,.24);
                    }

                    .action-note {
                        display: flex; align-items: flex-start; gap: .55rem;
                        font-size: .7rem; line-height: 1.65;
                        color: rgba(245,240,232,.28); margin-top: 1.1rem;
                    }
                    .action-note svg { flex-shrink: 0; margin-top: .12rem; opacity: .6; }

                    .locked-msg {
                        text-align: center; padding: 1.4rem 0;
                        font-size: .78rem; line-height: 1.7;
                        color: rgba(245,240,232,.35);
                    }
                    .locked-msg svg {
                        display: block; margin: 0 auto .8rem;
                        color: rgba(245,240,232,.25);
                    }

                    .modal-overlay {
                        position: fixed; inset: 0; z-index: var(--z-modal);
                        background: rgba(0,0,0,.8); backdrop-filter: blur(5px);
                        display: flex; align-items: center; justify-content: center;
                        padding: 1.5rem; animation: overlayIn .2s ease;
                    }
                    .modal {
                        width: 100%; max-width: 440px;
                        background: linear-gradient(158deg, #202020 0%, #151515 100%);
                        border: 1px solid rgba(255,61,46,.25);
                        box-shadow: 0 30px 90px rgba(0,0,0,.75);
                        padding: 2rem;
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
                        margin-bottom: 1.5rem;
                    }
                    .modal-body strong { color: rgba(245,240,232,.85); font-weight: 500; }

                    .field-label {
                        display: block; font-size: .58rem; letter-spacing: .16em;
                        text-transform: uppercase; color: rgba(245,240,232,.4);
                        margin-bottom: .5rem; font-weight: 700;
                    }
                    .field-input {
                        width: 100%;
                        background: rgba(245,240,232,.04);
                        border: 1px solid rgba(245,240,232,.1); color: var(--white);
                        font-family: var(--body); font-size: .84rem;
                        padding: .82rem 1rem;
                        outline: none; transition: border-color .22s, background .22s;
                    }
                    .field-input:focus {
                        border-color: rgba(255,61,46,.45);
                        background: rgba(255,61,46,.03);
                    }
                    .field-input::placeholder { color: rgba(245,240,232,.2); }
                    .field-error { font-size: .7rem; color: var(--accent2); margin-top: .45rem; }
                    .field-hint {
                        font-size: .68rem; color: rgba(245,240,232,.28);
                        margin-top: .45rem; line-height: 1.55;
                    }

                    .modal-actions { display: flex; gap: .7rem; margin-top: 1.6rem; }
                    .modal-confirm {
                        flex: 1; background: var(--accent2); color: #fff; border: none;
                        font-family: var(--body); font-size: .68rem; font-weight: 700;
                        letter-spacing: .14em; text-transform: uppercase;
                        padding: .9rem; cursor: pointer; transition: transform .2s;
                    }
                    .modal-confirm:hover:not(:disabled) { transform: translateY(-2px); }
                    .modal-confirm:disabled { opacity: .45; }
                    .modal-dismiss {
                        background: transparent; border: 1px solid rgba(245,240,232,.15);
                        color: rgba(245,240,232,.5);
                        font-family: var(--body); font-size: .68rem; font-weight: 600;
                        letter-spacing: .13em; text-transform: uppercase;
                        padding: .9rem 1.4rem; cursor: pointer; transition: all .2s;
                    }
                    .modal-dismiss:hover { border-color: var(--white); color: var(--white); }

                    @media (max-width: 900px) {
                        .detail-page { padding: 1.8rem 1.3rem 5rem; }
                        .detail-grid { grid-template-columns: minmax(0, 1fr); }
                        .action-panel { position: static; }
                        .stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                    }
                    @media (max-width: 560px) {
                        .user-hero { flex-direction: column; text-align: center; }
                        .hero-contact { justify-content: center; }
                        .hero-name-row { justify-content: center; }
                        .stats-grid { grid-template-columns: minmax(0, 1fr); }
                        .modal { padding: 1.7rem; }
                        .modal-actions { flex-direction: column-reverse; }
                        .ord-row { flex-wrap: wrap; row-gap: .6rem; }
                        .ord-main { flex: 1 1 100%; }
                    }
                `}</style>
            </Head>

            {suspendOpen && (
                <div className="modal-overlay" onClick={() => setSuspendOpen(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-icon">
                            <UserX size={22} />
                        </div>
                        <h2 className="modal-title">SUSPEND ACCOUNT?</h2>
                        <p className="modal-body">
                            <strong>{user.name}</strong> will be signed out immediately and blocked from signing back in. Their orders and data stay intact, and you can lift the suspension at any time.
                        </p>

                        <form onSubmit={submitSuspend}>
                            <label className="field-label">Reason for suspension</label>
                            <input type="text" maxLength={255} value={suspendForm.data.reason} onChange={(e) => suspendForm.setData('reason', e.target.value)} className="field-input" placeholder="e.g. Repeated fraudulent orders" autoFocus />
                            <p className="field-hint">
                                This is shown to the customer when they try to sign in, so keep it clear and factual.
                            </p>
                            {suspendForm.errors.reason && (
                                <div className="field-error">{suspendForm.errors.reason}</div>
                            )}

                            <div className="modal-actions">
                                <button type="submit" className="modal-confirm" disabled={suspendForm.processing || !suspendForm.data.reason.trim()}>
                                    {suspendForm.processing ? 'Suspending...' : 'Suspend Account'}
                                </button>
                                <button type="button" className="modal-dismiss" onClick={() => setSuspendOpen(false)}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="detail-page">
                <div className="detail-shell">
                    <div className="detail-topbar">
                        <Link href="/admin/users" className="back-link">
                            <ArrowLeft size={13} /> All Customers
                        </Link>
                        <NotificationBell />
                    </div>

                    {isSuspended && (
                        <div className="banner danger">
                            <ShieldOff size={17} />
                            <div className="banner-body">
                                <p className="banner-title">Account Suspended</p>
                                <p className="banner-text">
                                    Suspended on {fmtDateTime(user.suspended_at)}. This customer cannot sign in.
                                </p>
                            </div>
                        </div>
                    )}

                    {isLeaving && (
                        <div className="banner warn">
                            <Ghost size={17} />
                            <div className="banner-body">
                                <p className="banner-title">Scheduled for Deletion</p>
                                <p className="banner-text">
                                    Requested on {fmtDate(user.deleted_at)}. Personal details will be permanently removed on {fmtDate(user.deletion_deadline)}. Order records are retained for accounting.
                                </p>
                                <span className="countdown-pill">
                                    <Clock size={10} />
                                    {daysLeft} day{daysLeft === 1 ? '' : 's'} remaining
                                </span>
                            </div>
                        </div>
                    )}

                    {isAnonymised && (
                        <div className="banner neutral">
                            <CircleSlash size={17} />
                            <div className="banner-body">
                                <p className="banner-title">Personal Data Removed</p>
                                <p className="banner-text">
                                    Anonymised on {fmtDate(user.anonymised_at)}. Only order records remain, kept for tax and accounting purposes.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className={`user-hero ${isLeaving || isAnonymised ? 'dimmed' : ''}`}>
                        <div className="hero-avatar">
                            {avatar ? (
                                <img src={avatar} alt={user.name} />
                            ) : (
                                <span>{user.name.charAt(0).toUpperCase()}</span>
                            )}
                        </div>

                        <div className="hero-identity">
                            <div className="hero-name-row">
                                <h1 className="hero-name">{user.name}</h1>
                                {isAdmin && <span className="role-tag admin">Admin</span>}
                                {isSuspended && <span className="role-tag suspended">Suspended</span>}
                                {isLeaving && <span className="role-tag leaving">Leaving</span>}
                                {isAnonymised && <span className="role-tag anonymised">Anonymised</span>}
                            </div>

                            <div className="hero-contact">
                                <a href={`mailto:${user.email}`} className="contact-item">
                                    <Mail size={13} />
                                    {user.email}
                                </a>

                                {copied ? (
                                    <span className="copied-tag">Copied</span>
                                ) : (
                                    <button className="copy-btn" onClick={copyEmail} aria-label="Copy email">
                                        <Copy size={13} />
                                    </button>
                                )}

                                {user.phone && (
                                    <a href={`tel:${user.phone}`} className="contact-item">
                                        <Phone size={13} />
                                        {user.phone}
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="stats-grid">
                        <div className="stat">
                            <div className="stat-icon">
                                <Package size={15} />
                            </div>
                            <p className="stat-val">{stats.orders}</p>
                            <p className="stat-lbl">Orders</p>
                        </div>

                        <div className="stat">
                            <div className="stat-icon">
                                <Wallet size={15} />
                            </div>
                            <p className="stat-val accent">₦{Number(stats.spent).toLocaleString()}</p>
                            <p className="stat-lbl">Lifetime Spend</p>
                        </div>

                        <div className="stat">
                            <div className="stat-icon red">
                                <CircleSlash size={15} />
                            </div>
                            <p className="stat-val">{stats.cancelled}</p>
                            <p className="stat-lbl">Cancelled</p>
                        </div>

                        <div className="stat">
                            <div className="stat-icon">
                                <Star size={15} />
                            </div>
                            <p className="stat-val">{stats.reviews}</p>
                            <p className="stat-lbl">Reviews</p>
                        </div>
                    </div>

                    <div className="detail-grid">
                        <div>
                            <div className="panel">
                                <div className="panel-head">
                                    <div className="panel-icon">
                                        <ShieldCheck size={15} />
                                    </div>
                                    <p className="panel-title">ACCOUNT DETAILS</p>
                                </div>

                                <div className="info-row">
                                    <span className="info-key">Email status</span>
                                    <span className={`verify-chip ${user.email_verified_at ? 'ok' : 'warn'}`}>
                                        {user.email_verified_at ? (
                                            <>
                                                <Check size={9} /> Verified
                                            </>
                                        ) : (
                                            <>
                                                <AlertTriangle size={9} /> Unverified
                                            </>
                                        )}
                                    </span>
                                </div>

                                <div className="info-row">
                                    <span className="info-key">Sign-in</span>
                                    <span className="info-val">
                                        {user.google_linked ? 'Google linked' : 'Email & password'}
                                    </span>
                                </div>

                                <div className="info-row">
                                    <span className="info-key">Phone</span>
                                    <span className={`info-val ${!user.phone ? 'muted' : ''}`}>
                                        {user.phone || 'Not provided'}
                                    </span>
                                </div>

                                <div className="info-row">
                                    <span className="info-key">Member since</span>
                                    <span className="info-val">{fmtDate(user.created_at)}</span>
                                </div>

                                <div className="info-row">
                                    <span className="info-key">Last sign-in</span>
                                    <span className={`info-val ${!user.last_login_at ? 'muted' : ''}`}>
                                        {fmtDateTime(user.last_login_at)}
                                    </span>
                                </div>

                                <div className="info-row">
                                    <span className="info-key">Customer ID</span>
                                    <span className="info-val">#{String(user.id).padStart(5, '0')}</span>
                                </div>
                            </div>

                            <div className="panel">
                                <div className="panel-head">
                                    <div className="panel-icon">
                                        <Package size={15} />
                                    </div>
                                    <p className="panel-title">ORDER HISTORY</p>
                                    <span className="panel-count">{orders.length} total</span>
                                </div>

                                {orders.length === 0 ? (
                                    <div className="panel-empty">
                                        <Package size={32} />
                                        <p>This customer hasn't placed any orders yet.</p>
                                    </div>
                                ) : (
                                    orders.map((order) => (
                                        <Link key={order.id} href={`/admin/orders/${order.reference}`} className="ord-row">
                                            <div className="ord-main">
                                                <p className="ord-ref">{order.reference}</p>
                                                <p className="ord-meta">
                                                    {fmtDate(order.created_at)} · {order.items.length} item{order.items.length === 1 ? '' : 's'}
                                                </p>
                                            </div>
                                            <span className="ord-amount">
                                                ₦{Number(order.total_amount).toLocaleString()}
                                            </span>
                                            <span className={`ord-status ${order.status}`}>{order.status}</span>
                                            <ChevronRight size={15} className="ord-arrow" />
                                        </Link>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className={`action-panel ${isSuspended ? 'danger' : ''}`}>
                            <p className="action-title">MODERATION</p>

                            <p className="action-state">
                                Current status
                                <strong className={statusClass}>{statusWord}</strong>
                            </p>

                            {isSuspended && user.suspension_reason && (
                                <div className="reason-box">
                                    <p className="reason-box-label">Reason</p>
                                    {user.suspension_reason}
                                </div>
                            )}

                            {isAnonymised ? (
                                <p className="locked-msg">
                                    <CircleSlash size={20} />
                                    This account has been anonymised. No moderation actions are available.
                                </p>
                            ) : isAdmin ? (
                                <p className="locked-msg">
                                    <ShieldAlert size={20} />
                                    Admin accounts can't be suspended from this panel.
                                </p>
                            ) : isSuspended ? (
                                <>
                                    <button className="btn-restore" onClick={unsuspend}>
                                        <UserCheck size={14} /> Lift Suspension
                                    </button>
                                    <p className="action-note">
                                        <ShieldCheck size={12} />
                                        They'll be able to sign in again immediately.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <button className="btn-suspend" onClick={() => setSuspendOpen(true)}>
                                        <UserX size={14} /> Suspend Account
                                    </button>
                                    <p className="action-note">
                                        <ShieldCheck size={12} />
                                        Suspension blocks sign-in but keeps all data. Nothing is deleted, and it can be lifted at any time.
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

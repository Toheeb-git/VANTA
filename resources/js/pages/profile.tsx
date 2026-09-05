import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import {
    User,
    Package,
    MapPin,
    Mail,
    Phone,
    Check,
    AlertTriangle,
    Pencil,
    ShoppingBag,
    PackageCheck,
    Truck,
    Wallet,
    ArrowRight,
    Calendar,
} from 'lucide-react';
import SiteNav from '@/components/SiteNav';
import CartWidget from '@/components/CartWidget';
import AccountTabs from '@/components/AccountTabs';

interface Stats {
    totalOrders: number;
    delivered: number;
    inProgress: number;
    totalSpent: number | string;
    addresses: number;
}

export default function Profile() {
    const { user, appUrl, stats } = usePage().props as unknown as {
        user: {
            name: string;
            email: string;
            phone: string | null;
            profile_picture: string | null;
            avatar_url?: string | null;
            email_verified_at: string | null;
            created_at: string;
        };
        appUrl: string;
        stats: Stats;
    };

    const cursorRef = useRef<HTMLDivElement>(null);

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
    }, []);

    const memberSince = new Date(user.created_at).toLocaleDateString('en-GB', {
        month: 'long',
        year: 'numeric',
    });

    const initial = user.name?.charAt(0).toUpperCase() || 'U';

    const avatarSrc = user.profile_picture
        ? `${appUrl}/storage/${user.profile_picture}`
        : user.avatar_url || null;

    return (
        <>
            <Head title="Profile">
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin="anonymous"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&display=swap"
                    rel="stylesheet"
                />
                <style>{`
                    :root {
                        --black: #0a0a0a; --white: #f5f0e8; --accent: #e8ff00;
                        --accent2: #ff3d2e; --green: #4ade80; --amber: #ffaa3c;
                        --purple: #be8cff;
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
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes grain {
                        0%,100%{transform:translate(0,0)}10%{transform:translate(-5%,-10%)}
                        30%{transform:translate(3%,-15%)}50%{transform:translate(12%,9%)}
                        70%{transform:translate(9%,4%)}90%{transform:translate(-1%,7%)}
                    }
                    @keyframes ringGlow {
                        0%,100% { box-shadow: 0 0 0 1px rgba(232,255,0,.3), 0 0 0 6px rgba(232,255,0,.05), 0 16px 40px rgba(0,0,0,.5); }
                        50% { box-shadow: 0 0 0 1px rgba(232,255,0,.45), 0 0 0 9px rgba(232,255,0,.07), 0 16px 40px rgba(0,0,0,.5); }
                    }

                    .pro-page {
                        min-height: 100vh; position: relative; overflow: hidden;
                        padding: 8rem 1.5rem 5rem;
                    }
                    .pro-page::before {
                        content: ''; position: absolute; inset: 0;
                        background:
                            radial-gradient(circle at 60% 8%, rgba(232,255,0,.07) 0%, transparent 56%),
                            radial-gradient(circle at 15% 90%, rgba(255,61,46,.045) 0%, transparent 50%);
                        z-index: 0; pointer-events: none;
                    }
                    .pro-page::after {
                        content: ''; position: absolute; inset: -200%;
                        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
                        opacity: .4; z-index: 0; pointer-events: none;
                        animation: grain 8s steps(10) infinite;
                    }

                    .pro-shell {
                        position: relative; z-index: 2;
                        width: 100%; max-width: 900px; margin: 0 auto;
                    }

                    /* HERO */
                    .pro-hero {
                        display: flex; align-items: center; gap: 1.8rem;
                        background: linear-gradient(158deg, #202020 0%, #161616 100%);
                        border: 1px solid rgba(245,240,232,.075);
                        padding: 2.2rem;
                        margin-bottom: 1.3rem;
                        position: relative; overflow: hidden;
                        animation: fadeUp .6s .05s ease both;
                    }
                    .pro-hero::after {
                        content: ''; position: absolute;
                        top: -40px; right: -40px; width: 220px; height: 220px;
                        background: radial-gradient(circle, rgba(232,255,0,.06), transparent 70%);
                        pointer-events: none;
                    }

                    .pro-avatar {
                        width: 108px; height: 108px; flex-shrink: 0;
                        border-radius: 50%; overflow: hidden;
                        background: linear-gradient(145deg, #272727, #131313);
                        display: flex; align-items: center; justify-content: center;
                        animation: ringGlow 4s ease-in-out infinite;
                        position: relative; z-index: 1;
                    }
                    .pro-avatar img { width: 100%; height: 100%; object-fit: cover; }
                    .pro-avatar span {
                        font-family: var(--serif); font-size: 3rem;
                        color: var(--accent); letter-spacing: .05em; line-height: 1;
                    }

                    .pro-identity { flex: 1; min-width: 0; position: relative; z-index: 1; }
                    .pro-name {
                        font-family: var(--serif);
                        font-size: clamp(2rem, 4.5vw, 2.7rem);
                        letter-spacing: .04em; line-height: 1;
                        color: var(--white);
                        overflow-wrap: break-word;
                    }
                    .pro-since {
                        display: inline-flex; align-items: center; gap: .4rem;
                        font-size: .64rem; letter-spacing: .14em; text-transform: uppercase;
                        color: rgba(245,240,232,.3); margin-top: .7rem; font-weight: 600;
                    }

                    .edit-btn {
                        display: inline-flex; align-items: center; gap: .5rem;
                        margin-top: 1.1rem;
                        background: transparent; border: 1px solid rgba(232,255,0,.3);
                        color: var(--accent); text-decoration: none;
                        font-size: .64rem; font-weight: 700;
                        letter-spacing: .14em; text-transform: uppercase;
                        padding: .62rem 1.1rem;
                        transition: all .24s;
                    }
                    .edit-btn:hover {
                        background: var(--accent); color: var(--black);
                        transform: translateY(-2px);
                        box-shadow: 0 6px 20px rgba(232,255,0,.2);
                    }

                    /* STATS */
                    .stats-grid {
                        display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
                        gap: 1rem; margin-bottom: 1.3rem;
                    }
                    .stat {
                        background: linear-gradient(158deg, #1e1e1e 0%, #161616 100%);
                        border: 1px solid rgba(245,240,232,.07);
                        padding: 1.3rem; min-width: 0;
                        animation: fadeUp .6s .1s ease both;
                        transition: border-color .26s, transform .26s;
                    }
                    .stat:hover {
                        border-color: rgba(232,255,0,.22);
                        transform: translateY(-2px);
                    }
                    .stat-icon {
                        width: 30px; height: 30px;
                        display: flex; align-items: center; justify-content: center;
                        border: 1px solid rgba(232,255,0,.22);
                        background: rgba(232,255,0,.05);
                        color: var(--accent); margin-bottom: .9rem;
                    }
                    .stat-icon.green { border-color: rgba(74,222,128,.26); background: rgba(74,222,128,.06); color: var(--green); }
                    .stat-icon.amber { border-color: rgba(255,170,60,.26); background: rgba(255,170,60,.06); color: var(--amber); }
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

                    /* DETAILS */
                    .detail-card {
                        background: linear-gradient(158deg, #1f1f1f 0%, #161616 100%);
                        border: 1px solid rgba(245,240,232,.075);
                        padding: 1.7rem;
                        margin-bottom: 1.3rem;
                        animation: fadeUp .6s .15s ease both;
                    }
                    .card-head {
                        display: flex; align-items: center; gap: .75rem;
                        margin-bottom: 1.3rem; padding-bottom: 1.05rem;
                        border-bottom: 1px solid rgba(245,240,232,.07);
                    }
                    .card-icon {
                        width: 34px; height: 34px; flex-shrink: 0;
                        border: 1px solid rgba(232,255,0,.22);
                        background: rgba(232,255,0,.05);
                        display: flex; align-items: center; justify-content: center;
                        color: var(--accent);
                    }
                    .card-title {
                        font-family: var(--serif); font-size: 1.22rem; letter-spacing: .08em;
                    }
                    .card-action {
                        margin-left: auto;
                        display: inline-flex; align-items: center; gap: .35rem;
                        font-size: .58rem; letter-spacing: .13em; text-transform: uppercase;
                        font-weight: 700;
                        color: rgba(245,240,232,.4); text-decoration: none;
                        border: 1px solid rgba(245,240,232,.12);
                        padding: .42rem .8rem;
                        transition: all .22s;
                    }
                    .card-action:hover { border-color: var(--accent); color: var(--accent); }

                    .info-row {
                        display: flex; align-items: center; gap: 1rem;
                        padding: .95rem 0;
                        border-bottom: 1px solid rgba(245,240,232,.045);
                    }
                    .info-row:last-child { border-bottom: none; }
                    .info-icon {
                        width: 32px; height: 32px; flex-shrink: 0;
                        display: flex; align-items: center; justify-content: center;
                        color: rgba(245,240,232,.28);
                        border: 1px solid rgba(245,240,232,.07);
                    }
                    .info-body { flex: 1; min-width: 0; }
                    .info-lbl {
                        font-size: .55rem; letter-spacing: .17em; text-transform: uppercase;
                        color: rgba(245,240,232,.3); font-weight: 700;
                    }
                    .info-val {
                        font-size: .88rem; color: rgba(245,240,232,.88);
                        margin-top: .3rem; font-weight: 500;
                        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                    }
                    .info-val.muted { color: rgba(245,240,232,.28); font-style: italic; font-weight: 400; }

                    .verify-tag {
                        display: inline-flex; align-items: center; gap: .3rem;
                        font-size: .53rem; letter-spacing: .13em; text-transform: uppercase;
                        font-weight: 700; padding: .28rem .55rem; flex-shrink: 0;
                    }
                    .verify-tag.ok {
                        background: rgba(74,222,128,.1); color: var(--green);
                        border: 1px solid rgba(74,222,128,.28);
                    }
                    .verify-tag.warn {
                        background: rgba(255,170,60,.1); color: var(--amber);
                        border: 1px solid rgba(255,170,60,.28);
                    }

                    /* QUICK LINKS */
                    .quick-grid {
                        display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));
                        gap: 1rem;
                        animation: fadeUp .6s .2s ease both;
                    }
                    .quick-card {
                        display: flex; align-items: center; gap: 1rem;
                        background: linear-gradient(158deg, #1e1e1e 0%, #161616 100%);
                        border: 1px solid rgba(245,240,232,.07);
                        padding: 1.35rem;
                        text-decoration: none; color: inherit;
                        transition: border-color .24s, transform .24s, box-shadow .26s;
                    }
                    .quick-card:hover {
                        border-color: rgba(232,255,0,.3);
                        transform: translateY(-3px);
                        box-shadow: 0 12px 34px rgba(0,0,0,.35);
                    }
                    .quick-icon {
                        width: 40px; height: 40px; flex-shrink: 0;
                        border: 1px solid rgba(232,255,0,.24);
                        background: rgba(232,255,0,.05);
                        display: flex; align-items: center; justify-content: center;
                        color: var(--accent);
                    }
                    .quick-body { flex: 1; min-width: 0; }
                    .quick-title {
                        font-family: var(--serif); font-size: 1.08rem; letter-spacing: .06em;
                        color: var(--white);
                    }
                    .quick-desc {
                        font-size: .72rem; color: rgba(245,240,232,.35);
                        margin-top: .28rem; line-height: 1.5;
                    }
                    .quick-arrow {
                        color: rgba(245,240,232,.2); flex-shrink: 0;
                        transition: color .22s, transform .22s;
                    }
                    .quick-card:hover .quick-arrow {
                        color: var(--accent); transform: translateX(4px);
                    }

                    @media (max-width: 820px) {
                        .stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                    }
                    @media (max-width: 768px) {
                        .pro-page { padding: 6.5rem 1.2rem 6rem; }
                    }
                    @media (max-width: 620px) {
                        .pro-hero { flex-direction: column; text-align: center; gap: 1.3rem; }
                        .pro-since { justify-content: center; }
                        .quick-grid { grid-template-columns: minmax(0, 1fr); }
                    }
                    @media (max-width: 420px) {
                        .stats-grid { grid-template-columns: minmax(0, 1fr); }
                    }
                `}</style>
            </Head>

            <SiteNav />
            <div className="custom-cursor" ref={cursorRef} />

            <div className="pro-page">
                <div className="pro-shell">
                    <AccountTabs />

                    <div className="pro-hero">
                        <div className="pro-avatar">
                            {avatarSrc ? (
                                <img src={avatarSrc} alt={user.name} />
                            ) : (
                                <span>{initial}</span>
                            )}
                        </div>

                        <div className="pro-identity">
                            <h1 className="pro-name">{user.name}</h1>
                            <p className="pro-since">
                                <Calendar size={11} />
                                Member since {memberSince}
                            </p>
                            <Link href="/account/settings" className="edit-btn">
                                <Pencil size={12} /> Edit Details
                            </Link>
                        </div>
                    </div>

                    <div className="stats-grid">
                        <div className="stat">
                            <div className="stat-icon">
                                <ShoppingBag size={15} />
                            </div>
                            <p className="stat-val">{stats.totalOrders}</p>
                            <p className="stat-lbl">Orders</p>
                        </div>

                        <div className="stat">
                            <div className="stat-icon amber">
                                <Truck size={15} />
                            </div>
                            <p className="stat-val">{stats.inProgress}</p>
                            <p className="stat-lbl">In Progress</p>
                        </div>

                        <div className="stat">
                            <div className="stat-icon green">
                                <PackageCheck size={15} />
                            </div>
                            <p className="stat-val">{stats.delivered}</p>
                            <p className="stat-lbl">Delivered</p>
                        </div>

                        <div className="stat">
                            <div className="stat-icon">
                                <Wallet size={15} />
                            </div>
                            <p className="stat-val accent">
                                ₦{Number(stats.totalSpent).toLocaleString()}
                            </p>
                            <p className="stat-lbl">Total Spent</p>
                        </div>
                    </div>

                    <div className="detail-card">
                        <div className="card-head">
                            <div className="card-icon">
                                <User size={16} />
                            </div>
                            <p className="card-title">ACCOUNT DETAILS</p>
                            <Link
                                href="/account/settings"
                                className="card-action"
                            >
                                <Pencil size={10} /> Edit
                            </Link>
                        </div>

                        <div className="info-row">
                            <div className="info-icon">
                                <User size={14} />
                            </div>
                            <div className="info-body">
                                <p className="info-lbl">Full Name</p>
                                <p className="info-val">{user.name}</p>
                            </div>
                        </div>

                        <div className="info-row">
                            <div className="info-icon">
                                <Mail size={14} />
                            </div>
                            <div className="info-body">
                                <p className="info-lbl">Email Address</p>
                                <p className="info-val">{user.email}</p>
                            </div>
                            <span
                                className={`verify-tag ${user.email_verified_at ? 'ok' : 'warn'}`}
                            >
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
                            <div className="info-icon">
                                <Phone size={14} />
                            </div>
                            <div className="info-body">
                                <p className="info-lbl">Phone Number</p>
                                <p
                                    className={`info-val ${!user.phone ? 'muted' : ''}`}
                                >
                                    {user.phone || 'Not added yet'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="quick-grid">
                        <Link href="/account/orders" className="quick-card">
                            <div className="quick-icon">
                                <Package size={18} />
                            </div>
                            <div className="quick-body">
                                <p className="quick-title">MY ORDERS</p>
                                <p className="quick-desc">
                                    Track deliveries and view past purchases
                                </p>
                            </div>
                            <ArrowRight size={16} className="quick-arrow" />
                        </Link>

                        <Link href="/account/addresses" className="quick-card">
                            <div className="quick-icon">
                                <MapPin size={18} />
                            </div>
                            <div className="quick-body">
                                <p className="quick-title">ADDRESSES</p>
                                <p className="quick-desc">
                                    {stats.addresses > 0
                                        ? `${stats.addresses} saved address${stats.addresses === 1 ? '' : 'es'}`
                                        : 'Add a delivery address'}
                                </p>
                            </div>
                            <ArrowRight size={16} className="quick-arrow" />
                        </Link>
                    </div>
                </div>
            </div>

            <CartWidget />
        </>
    );
}

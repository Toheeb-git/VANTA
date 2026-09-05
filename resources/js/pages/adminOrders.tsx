import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import {
    LayoutDashboard,
    PlusCircle,
    Store,
    Truck,
    ClipboardList,
    Users,
    LogOut,
    Search,
    Menu,
    X,
    ChevronRight,
    Wallet,
    Clock,
    PackageCheck,
    CircleSlash,
} from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';

interface OrderRow {
    id: number;
    reference: string;
    total_amount: number | string;
    status: string;
    created_at: string;
    ship_full_name: string;
    ship_city: string;
    ship_state: string;
    user: { name: string; email: string } | null;
}

interface PageLink {
    url: string | null;
    label: string;
    active: boolean;
}

const STATUS_TABS = [
    'all',
    'pending',
    'paid',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
];

export default function AdminOrders() {
    const { orders, filters, counts, revenue } = usePage().props as unknown as {
        orders: { data: OrderRow[]; links: PageLink[]; total: number };
        filters: { status?: string; search?: string };
        counts: Record<string, number>;
        revenue: number | string;
    };

    const [search, setSearch] = useState(filters.search ?? '');
    const [navOpen, setNavOpen] = useState(false);
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const activeStatus = filters.status ?? 'all';

    const applyFilters = (overrides: Record<string, string> = {}) => {
        router.get(
            '/admin/orders',
            { status: activeStatus, search, ...overrides },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    useEffect(() => {
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            applyFilters({ search });
        }, 400);
        return () => {
            if (searchTimeout.current) clearTimeout(searchTimeout.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const handleLogout = () => router.post('/logout');

    const fmtDate = (iso: string) =>
        new Date(iso).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });

    const needsAction =
        (counts.paid ?? 0) + (counts.confirmed ?? 0) + (counts.processing ?? 0);

    return (
        <>
            <Head title="Orders — Admin">
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
                        --accent2: #ff3d2e; --mid: #1c1c1c; --muted: #555;
                        --serif: 'Bebas Neue', sans-serif; --body: 'DM Sans', sans-serif;

                        /* Z-INDEX SCALE — single source of truth */
                        --z-content: 1;
                        --z-topbar: 100;
                        --z-sidebar-desktop: 200;
                        --z-drawer-overlay: 800;
                        --z-drawer: 900;
                        --z-modal: 1000;
                    }
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    body { background: var(--black); color: var(--white); font-family: var(--body); }

                    @keyframes fadeUp {
                        from { opacity: 0; transform: translateY(14px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }

                    .dash-shell {
                        display: grid; grid-template-columns: 262px minmax(0, 1fr);
                        min-height: 100vh;
                    }

                    /* SIDEBAR */
                    .dash-sidebar {
                        background: linear-gradient(180deg, #1e1e1e 0%, #171717 100%);
                        border-right: 1px solid rgba(245,240,232,.07);
                        padding: 2rem 1.4rem;
                        display: flex; flex-direction: column;
                        position: sticky; top: 0; height: 100vh;
                        z-index: var(--z-sidebar-desktop);
                    }
                    .dash-logo {
                        font-family: var(--serif); font-size: 1.7rem;
                        letter-spacing: .12em; margin-bottom: 2.6rem;
                        padding-left: .3rem;
                    }
                    .dash-logo .accent { color: var(--accent); }

                    .nav-section-label {
                        font-size: .54rem; letter-spacing: .2em;
                        text-transform: uppercase; font-weight: 700;
                        color: rgba(245,240,232,.22);
                        padding: 0 .9rem .6rem;
                    }

                    .dash-nav { display: flex; flex-direction: column; gap: .25rem; flex: 1; }
                    .dash-nav-item {
                        position: relative;
                        display: flex; align-items: center; gap: .8rem;
                        padding: .78rem .9rem;
                        color: rgba(245,240,232,.55); text-decoration: none;
                        font-size: .8rem; font-weight: 500; letter-spacing: .02em;
                        cursor: pointer; background: none; border: none; width: 100%;
                        text-align: left; font-family: var(--body);
                        transition: color .2s, background .2s, padding-left .22s;
                    }
                    .dash-nav-item svg { flex-shrink: 0; color: rgba(245,240,232,.35); transition: color .2s; }
                    .dash-nav-item::before {
                        content: ''; position: absolute;
                        left: 0; top: 0; bottom: 0; width: 2px;
                        background: var(--accent);
                        transform: scaleY(0); transition: transform .22s;
                    }
                    .dash-nav-item:hover {
                        color: var(--white);
                        background: rgba(245,240,232,.035);
                        padding-left: 1.1rem;
                    }
                    .dash-nav-item:hover svg { color: var(--accent); }
                    .dash-nav-item.active {
                        color: var(--accent);
                        background: rgba(232,255,0,.06);
                    }
                    .dash-nav-item.active svg { color: var(--accent); }
                    .dash-nav-item.active::before { transform: scaleY(1); }

                    .nav-badge {
                        margin-left: auto;
                        background: var(--accent); color: var(--black);
                        font-size: .58rem; font-weight: 700;
                        min-width: 20px; height: 19px; padding: 0 .38rem;
                        display: flex; align-items: center; justify-content: center;
                    }

                    .dash-nav-footer {
                        border-top: 1px solid rgba(245,240,232,.07);
                        padding-top: .8rem; margin-top: .8rem;
                    }
                    .dash-nav-footer .dash-nav-item { color: rgba(255,61,46,.8); }
                    .dash-nav-footer .dash-nav-item svg { color: rgba(255,61,46,.65); }
                    .dash-nav-footer .dash-nav-item::before { background: var(--accent2); }
                    .dash-nav-footer .dash-nav-item:hover {
                        color: var(--accent2); background: rgba(255,61,46,.06);
                    }
                    .dash-nav-footer .dash-nav-item:hover svg { color: var(--accent2); }

                    /* MOBILE TOPBAR */
                    .mobile-topbar {
                        display: none;
                        position: sticky; top: 0;
                        z-index: var(--z-topbar);
                        align-items: center; gap: 1rem;
                        padding: .9rem 1.3rem;
                        background: rgba(10,10,10,.94);
                        backdrop-filter: blur(16px) saturate(140%);
                        -webkit-backdrop-filter: blur(16px) saturate(140%);
                        border-bottom: 1px solid rgba(245,240,232,.07);
                    }
                    .burger-btn {
                        background: transparent; border: 1px solid rgba(245,240,232,.12);
                        color: var(--white); width: 38px; height: 38px;
                        display: flex; align-items: center; justify-content: center;
                        cursor: pointer; flex-shrink: 0;
                        transition: border-color .2s, color .2s;
                    }
                    .burger-btn:hover { border-color: var(--accent); color: var(--accent); }
                    .mobile-topbar-logo {
                        font-family: var(--serif); font-size: 1.32rem; letter-spacing: .1em;
                    }
                    .mobile-topbar-logo .accent { color: var(--accent); }
                    .topbar-bell { margin-left: auto; }

                    .nav-overlay {
                        display: none;
                        position: fixed; inset: 0;
                        z-index: var(--z-drawer-overlay);
                        background: rgba(0,0,0,.72);
                        backdrop-filter: blur(3px);
                        -webkit-backdrop-filter: blur(3px);
                        animation: overlayIn .2s ease;
                    }
                    .sidebar-close {
                        display: none; background: transparent; border: none;
                        color: rgba(245,240,232,.35); cursor: pointer; padding: .3rem;
                        position: absolute; top: 1.5rem; right: 1.2rem;
                        transition: color .2s;
                    }
                    .sidebar-close:hover { color: var(--accent2); }

                    /* MAIN */
                    .dash-main {
                        position: relative; z-index: var(--z-content);
                        padding: 2.4rem 3rem 4rem; min-width: 0;
                    }

                    .dash-header {
                        display: flex; align-items: flex-start; justify-content: space-between;
                        gap: 1.5rem; margin-bottom: 2.2rem;
                    }
                    .dash-eyebrow {
                        font-size: .64rem; letter-spacing: .32em; text-transform: uppercase;
                        color: var(--accent); margin-bottom: .55rem; font-weight: 600;
                    }
                    .dash-title {
                        font-family: var(--serif);
                        font-size: clamp(2rem, 4vw, 2.9rem);
                        letter-spacing: .04em; line-height: 1;
                    }

                    /* STATS */
                    .stats-row {
                        display: grid; grid-template-columns: repeat(3, minmax(0, 1fr));
                        gap: 1.1rem; margin-bottom: 2.2rem;
                    }
                    .stat-card {
                        position: relative; overflow: hidden;
                        background: linear-gradient(158deg, #1f1f1f 0%, #171717 100%);
                        border: 1px solid rgba(245,240,232,.07);
                        padding: 1.5rem; min-width: 0;
                        animation: fadeUp .5s ease both;
                        transition: border-color .28s, transform .28s;
                    }
                    .stat-card:hover {
                        border-color: rgba(232,255,0,.22);
                        transform: translateY(-2px);
                    }
                    .stat-card::after {
                        content: ''; position: absolute;
                        top: 0; right: 0; width: 90px; height: 90px;
                        background: radial-gradient(circle at 70% 30%, rgba(232,255,0,.07), transparent 70%);
                        pointer-events: none;
                    }
                    .stat-card.highlight { border-color: rgba(232,255,0,.3); }
                    .stat-card.highlight::after {
                        background: radial-gradient(circle at 70% 30%, rgba(232,255,0,.14), transparent 70%);
                    }
                    .stat-top {
                        display: flex; align-items: center; gap: .65rem;
                        margin-bottom: 1rem;
                    }
                    .stat-icon {
                        width: 34px; height: 34px; flex-shrink: 0;
                        border: 1px solid rgba(232,255,0,.24);
                        background: rgba(232,255,0,.06);
                        display: flex; align-items: center; justify-content: center;
                        color: var(--accent);
                    }
                    .stat-label {
                        font-size: .58rem; letter-spacing: .18em; text-transform: uppercase;
                        color: rgba(245,240,232,.38); font-weight: 700;
                    }
                    .stat-value {
                        font-family: var(--serif); font-size: 2.2rem;
                        letter-spacing: .03em; line-height: 1;
                        overflow-wrap: break-word;
                    }
                    .stat-value.accent { color: var(--accent); }

                    /* FILTER BAR */
                    .filter-bar {
                        display: flex; align-items: center; gap: 1rem;
                        flex-wrap: wrap; margin-bottom: 1.6rem;
                    }
                    .status-tabs {
                        display: flex; gap: .4rem; flex-wrap: wrap; flex: 1; min-width: 0;
                    }
                    .status-tab {
                        display: inline-flex; align-items: center; gap: .4rem;
                        background: transparent;
                        border: 1px solid rgba(245,240,232,.1);
                        color: rgba(245,240,232,.48);
                        font-family: var(--body); font-size: .64rem; font-weight: 600;
                        letter-spacing: .12em; text-transform: uppercase;
                        padding: .52rem .85rem; cursor: pointer;
                        transition: all .22s;
                    }
                    .status-tab:hover {
                        border-color: rgba(232,255,0,.42); color: var(--white);
                        transform: translateY(-1px);
                    }
                    .status-tab.active {
                        background: var(--accent); color: var(--black);
                        border-color: var(--accent); font-weight: 700;
                        box-shadow: 0 4px 16px rgba(232,255,0,.2);
                    }
                    .tab-count { font-size: .56rem; opacity: .62; }

                    .admin-search-wrap { position: relative; width: 268px; flex-shrink: 0; }
                    .admin-search-icon {
                        position: absolute; left: .85rem; top: 50%; transform: translateY(-50%);
                        color: rgba(245,240,232,.28); pointer-events: none;
                        transition: color .2s;
                    }
                    .admin-search-wrap:focus-within .admin-search-icon { color: var(--accent); }
                    .admin-search {
                        width: 100%;
                        background: rgba(245,240,232,.04);
                        border: 1px solid rgba(245,240,232,.09);
                        color: var(--white); font-family: var(--body);
                        font-size: .8rem; padding: .72rem .9rem .72rem 2.4rem;
                        outline: none; transition: border-color .22s, background .22s;
                    }
                    .admin-search:focus {
                        border-color: rgba(232,255,0,.45);
                        background: rgba(232,255,0,.03);
                    }
                    .admin-search::placeholder { color: rgba(245,240,232,.22); }

                    /* ORDER ROWS */
                    .order-list { display: flex; flex-direction: column; gap: .65rem; }

                    .order-row {
                        position: relative;
                        display: grid;
                        grid-template-columns: 152px minmax(0, 1fr) 130px 112px 22px;
                        align-items: center; gap: 1.2rem;
                        background: linear-gradient(158deg, #1e1e1e 0%, #171717 100%);
                        border: 1px solid rgba(245,240,232,.06);
                        padding: 1.15rem 1.35rem;
                        text-decoration: none; color: inherit;
                        transition: border-color .22s, transform .22s, box-shadow .25s;
                        animation: fadeUp .4s ease both;
                    }
                    .order-row::before {
                        content: ''; position: absolute;
                        left: 0; top: 0; bottom: 0; width: 2px;
                        background: var(--accent);
                        transform: scaleY(0); transform-origin: center;
                        transition: transform .25s;
                    }
                    .order-row:hover {
                        border-color: rgba(232,255,0,.3);
                        transform: translateX(3px);
                        box-shadow: 0 8px 30px rgba(0,0,0,.35);
                    }
                    .order-row:hover::before { transform: scaleY(1); }

                    .row-ref {
                        font-family: var(--serif); font-size: 1.08rem;
                        letter-spacing: .09em; color: var(--white); line-height: 1;
                    }
                    .row-date {
                        font-size: .6rem; letter-spacing: .1em; text-transform: uppercase;
                        color: rgba(245,240,232,.26); margin-top: .42rem;
                    }

                    .row-customer { min-width: 0; }
                    .row-name {
                        font-size: .85rem; font-weight: 500; color: rgba(245,240,232,.88);
                        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                    }
                    .row-meta {
                        font-size: .7rem; color: rgba(245,240,232,.32); margin-top: .26rem;
                        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                    }

                    .row-total {
                        font-family: var(--serif); font-size: 1.28rem;
                        color: var(--accent); letter-spacing: .02em;
                        text-align: right;
                    }

                    .row-status {
                        font-size: .55rem; letter-spacing: .14em; text-transform: uppercase;
                        font-weight: 700; padding: .38rem .6rem; text-align: center;
                        white-space: nowrap;
                    }
                    .row-status.pending { background: rgba(245,240,232,.05); color: rgba(245,240,232,.48); border: 1px solid rgba(245,240,232,.13); }
                    .row-status.paid { background: rgba(232,255,0,.09); color: var(--accent); border: 1px solid rgba(232,255,0,.3); }
                    .row-status.confirmed { background: rgba(120,180,255,.08); color: #7ab4ff; border: 1px solid rgba(120,180,255,.28); }
                    .row-status.processing { background: rgba(190,140,255,.08); color: #be8cff; border: 1px solid rgba(190,140,255,.28); }
                    .row-status.shipped { background: rgba(255,170,60,.08); color: #ffaa3c; border: 1px solid rgba(255,170,60,.3); }
                    .row-status.delivered { background: rgba(74,222,128,.09); color: #4ade80; border: 1px solid rgba(74,222,128,.3); }
                    .row-status.cancelled { background: rgba(255,61,46,.09); color: var(--accent2); border: 1px solid rgba(255,61,46,.3); }

                    .row-chevron { color: rgba(245,240,232,.18); transition: color .22s, transform .22s; }
                    .order-row:hover .row-chevron { color: var(--accent); transform: translateX(3px); }

                    .orders-empty {
                        text-align: center; padding: 4.5rem 2rem;
                        border: 1px dashed rgba(245,240,232,.1);
                        color: rgba(245,240,232,.3);
                    }
                    .orders-empty svg { margin: 0 auto 1.2rem; display: block; opacity: .4; }
                    .orders-empty p { font-size: .86rem; }

                    /* PAGINATION */
                    .pagination {
                        display: flex; flex-wrap: wrap; justify-content: center;
                        gap: .45rem; margin-top: 2.4rem;
                    }
                    .page-link {
                        border: 1px solid rgba(245,240,232,.1);
                        color: rgba(245,240,232,.5);
                        padding: .55rem 1rem; font-size: .76rem;
                        text-decoration: none; transition: all .2s;
                    }
                    .page-link:hover { border-color: var(--accent); color: var(--white); }
                    .page-link.active {
                        background: var(--accent); color: var(--black);
                        border-color: var(--accent); font-weight: 700;
                    }
                    .page-link.disabled { opacity: .25; pointer-events: none; }

                    @media (max-width: 1100px) {
                        .order-row {
                            grid-template-columns: minmax(0, 1fr) 112px 22px;
                            row-gap: .85rem;
                        }
                        .row-ref-cell { grid-column: 1 / -1; }
                        .row-customer { grid-column: 1; }
                        .row-total { grid-column: 2; text-align: left; }
                    }
                    @media (max-width: 900px) {
                        .dash-shell { grid-template-columns: minmax(0, 1fr); }
                        .mobile-topbar { display: flex; }

                        .dash-sidebar {
                            position: fixed; top: 0; left: 0; bottom: 0;
                            width: 262px; height: 100dvh;
                            max-width: 82vw;
                            z-index: var(--z-drawer);
                            transform: translateX(-102%);
                            transition: transform .3s cubic-bezier(.4,0,.2,1);
                            overflow-y: auto;
                            box-shadow: none;
                        }
                        .dash-sidebar.open {
                            transform: translateX(0);
                            box-shadow: 12px 0 48px rgba(0,0,0,.6);
                        }

                        .sidebar-close { display: block; }
                        .nav-overlay.open { display: block; }

                        .dash-main { padding: 1.6rem 1.3rem 4rem; }
                        .dash-header .nb-wrap { display: none; }
                        .stats-row { grid-template-columns: minmax(0, 1fr); }
                        .admin-search-wrap { width: 100%; }
                    }
                `}</style>
            </Head>

            <div className="dash-shell">
                <div
                    className={`nav-overlay ${navOpen ? 'open' : ''}`}
                    onClick={() => setNavOpen(false)}
                />

                <aside className={`dash-sidebar ${navOpen ? 'open' : ''}`}>
                    <button
                        className="sidebar-close"
                        onClick={() => setNavOpen(false)}
                        aria-label="Close menu"
                    >
                        <X size={20} />
                    </button>

                    <div className="dash-logo">
                        VANTA <span className="accent">ADMIN</span>
                    </div>

                    <nav className="dash-nav">
                        <p className="nav-section-label">Manage</p>

                        <Link
                            href="/product-dashboard"
                            className="dash-nav-item"
                            onClick={() => setNavOpen(false)}
                        >
                            <LayoutDashboard size={17} /> Dashboard
                        </Link>
                        <Link
                            href="/admin/orders"
                            className="dash-nav-item active"
                            onClick={() => setNavOpen(false)}
                        >
                            <ClipboardList size={17} /> Orders
                            {needsAction > 0 && (
                                <span className="nav-badge">{needsAction}</span>
                            )}
                        </Link>
                        <Link
                            href="/admin/users"
                            className="dash-nav-item"
                            onClick={() => setNavOpen(false)}
                        >
                            <Users size={17} /> Customers
                        </Link>
                        <Link
                            href="/create-product"
                            className="dash-nav-item"
                            onClick={() => setNavOpen(false)}
                        >
                            <PlusCircle size={17} /> Add Product
                        </Link>
                        <Link
                            href="/shipping-zones"
                            className="dash-nav-item"
                            onClick={() => setNavOpen(false)}
                        >
                            <Truck size={17} /> Shipping
                        </Link>

                        <p
                            className="nav-section-label"
                            style={{ paddingTop: '1.4rem' }}
                        >
                            Store
                        </p>

                        <Link
                            href="/"
                            className="dash-nav-item"
                            onClick={() => setNavOpen(false)}
                        >
                            <Store size={17} /> View Store
                        </Link>
                    </nav>

                    <div className="dash-nav-footer">
                        <button
                            onClick={handleLogout}
                            className="dash-nav-item"
                        >
                            <LogOut size={17} /> Log Out
                        </button>
                    </div>
                </aside>

                <div style={{ minWidth: 0 }}>
                    <div className="mobile-topbar">
                        <button
                            className="burger-btn"
                            onClick={() => setNavOpen(true)}
                            aria-label="Open menu"
                        >
                            <Menu size={19} />
                        </button>
                        <div className="mobile-topbar-logo">
                            VANTA <span className="accent">ADMIN</span>
                        </div>
                        <div className="topbar-bell">
                            <NotificationBell />
                        </div>
                    </div>

                    <main className="dash-main">
                        <div className="dash-header">
                            <div>
                                <p className="dash-eyebrow">Admin</p>
                                <h1 className="dash-title">Orders</h1>
                            </div>
                            <NotificationBell />
                        </div>

                        <div className="stats-row">
                            <div className="stat-card">
                                <div className="stat-top">
                                    <div className="stat-icon">
                                        <Wallet size={16} />
                                    </div>
                                    <span className="stat-label">Revenue</span>
                                </div>
                                <p className="stat-value accent">
                                    ₦{Number(revenue).toLocaleString()}
                                </p>
                            </div>

                            <div
                                className={`stat-card ${needsAction > 0 ? 'highlight' : ''}`}
                            >
                                <div className="stat-top">
                                    <div className="stat-icon">
                                        <Clock size={16} />
                                    </div>
                                    <span className="stat-label">
                                        Needs Action
                                    </span>
                                </div>
                                <p className="stat-value">{needsAction}</p>
                            </div>

                            <div className="stat-card">
                                <div className="stat-top">
                                    <div className="stat-icon">
                                        <PackageCheck size={16} />
                                    </div>
                                    <span className="stat-label">
                                        Delivered
                                    </span>
                                </div>
                                <p className="stat-value">
                                    {counts.delivered ?? 0}
                                </p>
                            </div>
                        </div>

                        <div className="filter-bar">
                            <div className="status-tabs">
                                {STATUS_TABS.map((tab) => (
                                    <button
                                        key={tab}
                                        className={`status-tab ${activeStatus === tab ? 'active' : ''}`}
                                        onClick={() =>
                                            applyFilters({ status: tab })
                                        }
                                    >
                                        {tab}
                                        <span className="tab-count">
                                            {counts[tab] ?? 0}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            <div className="admin-search-wrap">
                                <Search
                                    size={14}
                                    className="admin-search-icon"
                                />
                                <input
                                    className="admin-search"
                                    placeholder="Reference, name, phone..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        {orders.data.length === 0 ? (
                            <div className="orders-empty">
                                <CircleSlash size={40} />
                                <p>No orders match this view.</p>
                            </div>
                        ) : (
                            <div className="order-list">
                                {orders.data.map((order) => (
                                    <Link
                                        key={order.id}
                                        href={`/admin/orders/${order.reference}`}
                                        className="order-row"
                                    >
                                        <div className="row-ref-cell">
                                            <p className="row-ref">
                                                {order.reference}
                                            </p>
                                            <p className="row-date">
                                                {fmtDate(order.created_at)}
                                            </p>
                                        </div>

                                        <div className="row-customer">
                                            <p className="row-name">
                                                {order.user?.name ??
                                                    order.ship_full_name}
                                            </p>
                                            <p className="row-meta">
                                                {order.ship_city},{' '}
                                                {order.ship_state}
                                                {order.user?.email &&
                                                    ` · ${order.user.email}`}
                                            </p>
                                        </div>

                                        <p className="row-total">
                                            ₦
                                            {Number(
                                                order.total_amount,
                                            ).toLocaleString()}
                                        </p>

                                        <span
                                            className={`row-status ${order.status}`}
                                        >
                                            {order.status}
                                        </span>

                                        <ChevronRight
                                            size={17}
                                            className="row-chevron"
                                        />
                                    </Link>
                                ))}
                            </div>
                        )}

                        {orders.links.length > 3 && (
                            <div className="pagination">
                                {orders.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url || '#'}
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                        preserveScroll
                                        className={`page-link ${link.active ? 'active' : ''} ${!link.url ? 'disabled' : ''}`}
                                    />
                                ))}
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </>
    );
}

import { Head, Link, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import {
    LayoutDashboard,
    PlusCircle,
    Store,
    Truck,
    ClipboardList,
    Users,
    LogOut,
    Pencil,
    Trash2,
    Package,
    Boxes,
    AlertTriangle,
    Wallet,
    Menu,
    X,
    Search,
    ImageOff,
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from 'recharts';
import NotificationBell from '@/components/NotificationBell';

interface Product {
    id: number;
    name: string;
    price: number | string;
    stock: number;
    category: string;
    image: string | null;
}

interface Stats {
    totalProducts: number;
    totalStock: number;
    outOfStock: number;
    inventoryValue: number;
}

export default function ProductDashboard() {
    const { products, appUrl, stats } = usePage().props as unknown as {
        products: Product[];
        appUrl: string;
        stats: Stats;
    };

    const [search, setSearch] = useState('');
    const [navOpen, setNavOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

    const filteredProducts = useMemo(() => {
        if (!search.trim()) return products;
        const q = search.toLowerCase();
        return products.filter(
            (p) =>
                p.name.toLowerCase().includes(q) ||
                p.category.toLowerCase().includes(q),
        );
    }, [products, search]);

    const categoryChartData = useMemo(() => {
        const map = new Map<string, number>();
        products.forEach((p) => {
            map.set(p.category, (map.get(p.category) || 0) + p.stock);
        });
        return Array.from(map, ([category, stock]) => ({ category, stock }));
    }, [products]);

    const confirmDelete = () => {
        if (!deleteTarget) return;
        router.delete(`/delete-product/${deleteTarget.id}`, {
            onSuccess: () => setDeleteTarget(null),
        });
    };

    const handleLogout = () => router.post('/logout');

    return (
        <>
            <Head title="Dashboard — Admin">
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
                    @keyframes modalIn {
                        from { opacity: 0; transform: scale(.94) translateY(10px); }
                        to { opacity: 1; transform: scale(1) translateY(0); }
                    }

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
                        gap: 1.5rem; margin-bottom: 2.2rem; flex-wrap: wrap;
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
                    .header-actions {
                        display: flex; align-items: center; gap: 1rem;
                        flex-shrink: 0;
                    }

                    .dash-add-btn {
                        position: relative; overflow: hidden;
                        display: inline-flex; align-items: center; gap: .5rem;
                        background: var(--accent); color: var(--black);
                        text-decoration: none; border: none;
                        font-family: var(--body); font-size: .7rem; font-weight: 700;
                        letter-spacing: .14em; text-transform: uppercase;
                        padding: .85rem 1.4rem; cursor: pointer;
                        box-shadow: 0 4px 18px rgba(232,255,0,.16);
                        transition: transform .22s, box-shadow .28s;
                    }
                    .dash-add-btn::before {
                        content: ''; position: absolute; inset: 0;
                        background: linear-gradient(115deg, #ff3d2e 0%, #ff6b4a 100%);
                        transform: translateX(-101%);
                        transition: transform .35s cubic-bezier(.4,0,.2,1);
                    }
                    .dash-add-btn:hover::before { transform: translateX(0); }
                    .dash-add-btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 8px 28px rgba(232,255,0,.26);
                    }
                    .dash-add-btn:hover span, .dash-add-btn:hover svg { color: #f5f0e8; }
                    .dash-add-btn span, .dash-add-btn svg {
                        position: relative; z-index: 1; transition: color .25s;
                    }

                    /* STATS */
                    .stats-grid {
                        display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
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
                    .stat-card.warn-card { border-color: rgba(255,61,46,.28); }
                    .stat-card.warn-card::after {
                        background: radial-gradient(circle at 70% 30%, rgba(255,61,46,.1), transparent 70%);
                    }
                    .stat-card.warn-card .stat-icon {
                        border-color: rgba(255,61,46,.3);
                        background: rgba(255,61,46,.07);
                        color: var(--accent2);
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
                    .stat-value.warn { color: var(--accent2); }

                    /* PANELS */
                    .dash-panel {
                        background: linear-gradient(158deg, #1f1f1f 0%, #171717 100%);
                        border: 1px solid rgba(245,240,232,.07);
                        padding: 1.7rem; margin-bottom: 1.6rem; min-width: 0;
                        animation: fadeUp .5s .05s ease both;
                    }
                    .panel-head {
                        display: flex; align-items: center; gap: .75rem;
                        margin-bottom: 1.4rem; padding-bottom: 1.1rem;
                        border-bottom: 1px solid rgba(245,240,232,.07);
                        flex-wrap: wrap;
                    }
                    .panel-icon {
                        width: 32px; height: 32px; flex-shrink: 0;
                        border: 1px solid rgba(232,255,0,.22);
                        background: rgba(232,255,0,.05);
                        display: flex; align-items: center; justify-content: center;
                        color: var(--accent);
                    }
                    .panel-title {
                        font-family: var(--serif); font-size: 1.25rem; letter-spacing: .07em;
                    }
                    .panel-count {
                        margin-left: auto;
                        font-size: .62rem; letter-spacing: .12em;
                        text-transform: uppercase; color: rgba(245,240,232,.3);
                    }

                    /* SEARCH */
                    .search-wrap { position: relative; max-width: 320px; margin-bottom: 1.3rem; }
                    .search-icon {
                        position: absolute; left: .85rem; top: 50%; transform: translateY(-50%);
                        color: rgba(245,240,232,.28); pointer-events: none;
                        transition: color .2s;
                    }
                    .search-wrap:focus-within .search-icon { color: var(--accent); }
                    .dash-search {
                        width: 100%;
                        background: rgba(245,240,232,.04);
                        border: 1px solid rgba(245,240,232,.09);
                        color: var(--white); font-family: var(--body);
                        font-size: .8rem; padding: .72rem .9rem .72rem 2.4rem;
                        outline: none; transition: border-color .22s, background .22s;
                    }
                    .dash-search:focus {
                        border-color: rgba(232,255,0,.45);
                        background: rgba(232,255,0,.03);
                    }
                    .dash-search::placeholder { color: rgba(245,240,232,.22); }

                    /* TABLE */
                    .table-scroll { overflow-x: auto; }
                    .table-scroll::-webkit-scrollbar { height: 5px; }
                    .table-scroll::-webkit-scrollbar-thumb { background: rgba(245,240,232,.14); }

                    .dash-table { width: 100%; border-collapse: collapse; min-width: 640px; }
                    .dash-table th {
                        text-align: left; font-size: .58rem; letter-spacing: .18em;
                        text-transform: uppercase; font-weight: 700;
                        color: rgba(245,240,232,.32); padding: .8rem .65rem;
                        border-bottom: 1px solid rgba(245,240,232,.08);
                    }
                    .dash-table td {
                        padding: .95rem .65rem;
                        border-bottom: 1px solid rgba(245,240,232,.045);
                        font-size: .84rem; vertical-align: middle;
                    }
                    .dash-table tbody tr { transition: background .18s; }
                    .dash-table tbody tr:hover td { background: rgba(232,255,0,.022); }

                    .table-product-cell { display: flex; align-items: center; gap: .85rem; }
                    .table-thumb {
                        width: 46px; height: 46px; object-fit: cover; flex-shrink: 0;
                        border: 1px solid rgba(245,240,232,.07);
                    }
                    .table-thumb-empty {
                        background: linear-gradient(135deg, #1f1f1f, #141414);
                        display: flex; align-items: center; justify-content: center;
                        color: rgba(245,240,232,.18);
                    }
                    .table-name { font-weight: 500; color: rgba(245,240,232,.9); }

                    .cat-badge {
                        display: inline-block; font-size: .64rem; letter-spacing: .06em;
                        text-transform: capitalize; color: rgba(245,240,232,.55);
                        border: 1px solid rgba(245,240,232,.1);
                        background: rgba(245,240,232,.03);
                        padding: .28rem .6rem;
                    }

                    .price-cell {
                        font-family: var(--serif); font-size: 1.05rem;
                        letter-spacing: .02em; color: rgba(245,240,232,.85);
                    }

                    .stock-pill {
                        display: inline-flex; align-items: center; gap: .35rem;
                        font-size: .62rem; font-weight: 700; letter-spacing: .1em;
                        text-transform: uppercase;
                        padding: .34rem .68rem; white-space: nowrap;
                    }
                    .stock-pill.in {
                        background: rgba(232,255,0,.09); color: var(--accent);
                        border: 1px solid rgba(232,255,0,.28);
                    }
                    .stock-pill.low {
                        background: rgba(255,170,60,.09); color: #ffaa3c;
                        border: 1px solid rgba(255,170,60,.3);
                    }
                    .stock-pill.out {
                        background: rgba(255,61,46,.09); color: var(--accent2);
                        border: 1px solid rgba(255,61,46,.32);
                    }

                    .table-actions { display: flex; gap: .45rem; }
                    .action-btn {
                        width: 32px; height: 32px;
                        display: flex; align-items: center; justify-content: center;
                        border: 1px solid rgba(245,240,232,.09); background: transparent;
                        color: rgba(245,240,232,.5); cursor: pointer; text-decoration: none;
                        transition: all .2s;
                    }
                    .action-btn:hover {
                        border-color: var(--accent); color: var(--accent);
                        transform: translateY(-1px);
                    }
                    .action-btn.danger:hover {
                        border-color: var(--accent2); color: var(--accent2);
                    }

                    .empty-row {
                        text-align: center; padding: 3.5rem 1rem;
                        color: rgba(245,240,232,.3); font-size: .84rem;
                    }

                    /* MODAL */
                    .modal-overlay {
                        position: fixed; inset: 0;
                        z-index: var(--z-modal);
                        background: rgba(0,0,0,.8); backdrop-filter: blur(5px);
                        display: flex; align-items: center; justify-content: center;
                        padding: 1.5rem; animation: overlayIn .2s ease;
                    }
                    .modal {
                        width: 100%; max-width: 420px;
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
                        font-family: var(--serif); font-size: 1.7rem;
                        letter-spacing: .05em; line-height: 1; margin-bottom: .8rem;
                    }
                    .modal-body {
                        font-size: .84rem; font-weight: 300;
                        color: rgba(245,240,232,.5); line-height: 1.75;
                        margin-bottom: 1.8rem;
                    }
                    .modal-body strong {
                        color: rgba(245,240,232,.85); font-weight: 500;
                    }
                    .modal-actions { display: flex; gap: .7rem; }
                    .modal-confirm {
                        flex: 1; background: var(--accent2); color: #fff; border: none;
                        font-family: var(--body); font-size: .68rem; font-weight: 700;
                        letter-spacing: .14em; text-transform: uppercase;
                        padding: .9rem; cursor: pointer; transition: transform .2s;
                    }
                    .modal-confirm:hover { transform: translateY(-2px); }
                    .modal-dismiss {
                        background: transparent; border: 1px solid rgba(245,240,232,.15);
                        color: rgba(245,240,232,.5);
                        font-family: var(--body); font-size: .68rem; font-weight: 600;
                        letter-spacing: .13em; text-transform: uppercase;
                        padding: .9rem 1.4rem; cursor: pointer; transition: all .2s;
                    }
                    .modal-dismiss:hover { border-color: var(--white); color: var(--white); }

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
                        .stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                    }
                    @media (max-width: 560px) {
                        .stats-grid { grid-template-columns: minmax(0, 1fr); }
                        .header-actions { width: 100%; }
                        .dash-add-btn { flex: 1; justify-content: center; }
                        .modal { padding: 1.7rem; }
                        .modal-actions { flex-direction: column-reverse; }
                    }
                `}</style>
            </Head>

            {deleteTarget && (
                <div
                    className="modal-overlay"
                    onClick={() => setDeleteTarget(null)}
                >
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-icon">
                            <AlertTriangle size={22} />
                        </div>
                        <h2 className="modal-title">DELETE PRODUCT?</h2>
                        <p className="modal-body">
                            <strong>{deleteTarget.name}</strong> will be
                            permanently removed from your catalogue. Past orders
                            containing it aren't affected, but it will no longer
                            be available to buy.
                        </p>
                        <div className="modal-actions">
                            <button
                                className="modal-confirm"
                                onClick={confirmDelete}
                            >
                                Yes, Delete
                            </button>
                            <button
                                className="modal-dismiss"
                                onClick={() => setDeleteTarget(null)}
                            >
                                Keep It
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                            className="dash-nav-item active"
                            onClick={() => setNavOpen(false)}
                        >
                            <LayoutDashboard size={17} /> Dashboard
                        </Link>
                        <Link
                            href="/admin/orders"
                            className="dash-nav-item"
                            onClick={() => setNavOpen(false)}
                        >
                            <ClipboardList size={17} /> Orders
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
                                <h1 className="dash-title">Overview</h1>
                            </div>
                            <div className="header-actions">
                                <NotificationBell />
                                <Link
                                    href="/create-product"
                                    className="dash-add-btn"
                                >
                                    <PlusCircle size={16} />
                                    <span>Add Product</span>
                                </Link>
                            </div>
                        </div>

                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-top">
                                    <div className="stat-icon">
                                        <Package size={16} />
                                    </div>
                                    <span className="stat-label">Products</span>
                                </div>
                                <p className="stat-value">
                                    {stats.totalProducts}
                                </p>
                            </div>

                            <div className="stat-card">
                                <div className="stat-top">
                                    <div className="stat-icon">
                                        <Boxes size={16} />
                                    </div>
                                    <span className="stat-label">
                                        Units In Stock
                                    </span>
                                </div>
                                <p className="stat-value">{stats.totalStock}</p>
                            </div>

                            <div
                                className={`stat-card ${stats.outOfStock > 0 ? 'warn-card' : ''}`}
                            >
                                <div className="stat-top">
                                    <div className="stat-icon">
                                        <AlertTriangle size={16} />
                                    </div>
                                    <span className="stat-label">
                                        Out of Stock
                                    </span>
                                </div>
                                <p
                                    className={`stat-value ${stats.outOfStock > 0 ? 'warn' : ''}`}
                                >
                                    {stats.outOfStock}
                                </p>
                            </div>

                            <div className="stat-card">
                                <div className="stat-top">
                                    <div className="stat-icon">
                                        <Wallet size={16} />
                                    </div>
                                    <span className="stat-label">
                                        Inventory Value
                                    </span>
                                </div>
                                <p className="stat-value accent">
                                    ₦
                                    {Number(
                                        stats.inventoryValue,
                                    ).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        {categoryChartData.length > 0 && (
                            <div className="dash-panel">
                                <div className="panel-head">
                                    <div className="panel-icon">
                                        <Boxes size={15} />
                                    </div>
                                    <p className="panel-title">
                                        STOCK BY CATEGORY
                                    </p>
                                </div>
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart data={categoryChartData}>
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="rgba(245,240,232,.06)"
                                        />
                                        <XAxis
                                            dataKey="category"
                                            stroke="rgba(245,240,232,.35)"
                                            fontSize={11}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            stroke="rgba(245,240,232,.35)"
                                            fontSize={11}
                                            tickLine={false}
                                        />
                                        <Tooltip
                                            cursor={{
                                                fill: 'rgba(232,255,0,.04)',
                                            }}
                                            contentStyle={{
                                                background: '#1a1a1a',
                                                border: '1px solid rgba(232,255,0,.2)',
                                                color: '#f5f0e8',
                                                fontSize: '.78rem',
                                            }}
                                        />
                                        <Bar
                                            dataKey="stock"
                                            fill="#e8ff00"
                                            radius={[2, 2, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        <div className="dash-panel">
                            <div className="panel-head">
                                <div className="panel-icon">
                                    <Package size={15} />
                                </div>
                                <p className="panel-title">ALL PRODUCTS</p>
                                <span className="panel-count">
                                    {filteredProducts.length} shown
                                </span>
                            </div>

                            <div className="search-wrap">
                                <Search size={14} className="search-icon" />
                                <input
                                    type="text"
                                    className="dash-search"
                                    placeholder="Search by name or category..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>

                            <div className="table-scroll">
                                <table className="dash-table">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Category</th>
                                            <th>Price</th>
                                            <th>Stock</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredProducts.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={5}
                                                    className="empty-row"
                                                >
                                                    {products.length === 0
                                                        ? 'No products yet — add your first one.'
                                                        : 'No products match your search.'}
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredProducts.map((product) => {
                                                const stockClass =
                                                    product.stock <= 0
                                                        ? 'out'
                                                        : product.stock <= 5
                                                          ? 'low'
                                                          : 'in';
                                                return (
                                                    <tr key={product.id}>
                                                        <td>
                                                            <div className="table-product-cell">
                                                                {product.image ? (
                                                                    <img
                                                                        src={`${appUrl}/storage/${product.image}`}
                                                                        alt={
                                                                            product.name
                                                                        }
                                                                        className="table-thumb"
                                                                    />
                                                                ) : (
                                                                    <div className="table-thumb table-thumb-empty">
                                                                        <ImageOff
                                                                            size={
                                                                                16
                                                                            }
                                                                        />
                                                                    </div>
                                                                )}
                                                                <span className="table-name">
                                                                    {
                                                                        product.name
                                                                    }
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className="cat-badge">
                                                                {
                                                                    product.category
                                                                }
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className="price-cell">
                                                                ₦
                                                                {Number(
                                                                    product.price,
                                                                ).toLocaleString()}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span
                                                                className={`stock-pill ${stockClass}`}
                                                            >
                                                                {product.stock <=
                                                                0
                                                                    ? 'Out of Stock'
                                                                    : `${product.stock} units`}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div className="table-actions">
                                                                <Link
                                                                    href={`/edit-product/${product.id}/edit`}
                                                                    className="action-btn"
                                                                    title="Edit"
                                                                >
                                                                    <Pencil
                                                                        size={
                                                                            14
                                                                        }
                                                                    />
                                                                </Link>
                                                                <button
                                                                    onClick={() =>
                                                                        setDeleteTarget(
                                                                            product,
                                                                        )
                                                                    }
                                                                    className="action-btn danger"
                                                                    title="Delete"
                                                                >
                                                                    <Trash2
                                                                        size={
                                                                            14
                                                                        }
                                                                    />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}

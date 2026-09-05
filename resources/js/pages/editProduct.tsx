import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
    LayoutDashboard,
    PlusCircle,
    Store,
    Truck,
    ClipboardList,
    Users,
    LogOut,
    Menu,
    X,
    ImagePlus,
    RotateCcw,
    Tag,
    Package,
    ArrowLeft,
    Check,
    Info,
    ExternalLink,
    AlertTriangle,
} from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';

export default function EditProduct() {
    const { product, appUrl, categories } = usePage().props as unknown as {
        product: {
            id: number;
            name: string;
            slug: string;
            price: number | string;
            discount_price: number | string | null;
            stock: number | string;
            category: string;
            description: string | null;
            image: string;
        };
        appUrl: string;
        categories: string[];
    };

    const [navOpen, setNavOpen] = useState(false);
    const [dragOver, setDragOver] = useState(false);

    const originalImage = product.image
        ? `${appUrl}/storage/${product.image}`
        : null;

    const [preview, setPreview] = useState<string | null>(originalImage);

    const { data, setData, post, processing, errors, clearErrors, transform } =
        useForm({
            name: product.name ?? '',
            slug: product.slug ?? '',
            category: product.category ?? '',
            price: String(product.price ?? ''),
            discount_price: product.discount_price
                ? String(product.discount_price)
                : '',
            stock: String(product.stock ?? ''),
            description: product.description ?? '',
            image: null as File | null,
            _method: 'put',
        });

    const takeFile = (file: File | null) => {
        if (!file) return;
        clearErrors('image');
        setData('image', file);
        setPreview(URL.createObjectURL(file));
    };

    const revertImage = () => {
        clearErrors('image');
        setData('image', null);
        setPreview(originalImage);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        takeFile(e.dataTransfer.files?.[0] || null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Inertia serialises a null File as an empty string, which Laravel's
        // `image` rule rejects. Drop the key entirely when nothing was picked.
        transform((payload) => {
            const out: Record<string, unknown> = { ...payload };
            if (!out.image) delete out.image;
            return out;
        });

        post(`/update-product/${product.id}`, { forceFormData: true });
    };

    const handleLogout = () => router.post('/logout');

    const price = Number(data.price) || 0;
    const discount = Number(data.discount_price) || 0;
    const savePct =
        price > 0 && discount > 0 && discount < price
            ? Math.round(((price - discount) / price) * 100)
            : 0;

    const stockNum = Number(data.stock);
    const outOfStock = stockNum <= 0;
    const lowStock = stockNum > 0 && stockNum <= 5;

    const slugChanged = data.slug !== product.slug;
    const imageChanged = !!data.image;

    return (
        <>
            <Head title={`Edit ${product.name} — Admin`}>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
                <style>{`
                    :root {
                        --black: #0a0a0a; --white: #f5f0e8; --accent: #e8ff00;
                        --accent2: #ff3d2e; --green: #4ade80; --amber: #ffaa3c;
                        --mid: #1c1c1c; --muted: #555;
                        --serif: 'Bebas Neue', sans-serif; --body: 'DM Sans', sans-serif;

                        --z-content: 1;
                        --z-topbar: 100;
                        --z-sidebar-desktop: 200;
                        --z-drawer-overlay: 800;
                        --z-drawer: 900;
                    }
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    body { background: var(--black); color: var(--white); font-family: var(--body); }

                    @keyframes fadeUp {
                        from { opacity: 0; transform: translateY(14px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }
                    @keyframes pulseSoft {
                        0%,100% { opacity: .85; }
                        50% { opacity: 1; }
                    }

                    .dash-shell {
                        display: grid; grid-template-columns: 262px minmax(0, 1fr);
                        min-height: 100vh;
                    }

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

                    .mobile-topbar {
                        display: none;
                        position: sticky; top: 0;
                        z-index: var(--z-topbar);
                        align-items: center; gap: 1rem;
                        padding: .9rem 1.3rem;
                        background: rgba(10,10,10,.94);
                        backdrop-filter: blur(16px) saturate(140%);
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
                        animation: overlayIn .2s ease;
                    }
                    .sidebar-close {
                        display: none; background: transparent; border: none;
                        color: rgba(245,240,232,.35); cursor: pointer; padding: .3rem;
                        position: absolute; top: 1.5rem; right: 1.2rem;
                        transition: color .2s;
                    }
                    .sidebar-close:hover { color: var(--accent2); }

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
                        font-size: clamp(1.9rem, 4vw, 2.7rem);
                        letter-spacing: .04em; line-height: 1;
                        overflow-wrap: break-word;
                    }
                    .header-actions { display: flex; align-items: center; gap: 1rem; flex-shrink: 0; }

                    .ghost-link {
                        display: inline-flex; align-items: center; gap: .5rem;
                        font-size: .64rem; letter-spacing: .14em; text-transform: uppercase;
                        font-weight: 700;
                        color: rgba(245,240,232,.42); text-decoration: none;
                        padding: .6rem 1rem;
                        border: 1px solid rgba(245,240,232,.1);
                        transition: all .22s;
                    }
                    .ghost-link:hover {
                        color: var(--accent);
                        border-color: rgba(232,255,0,.35);
                        background: rgba(232,255,0,.04);
                    }

                    .form-grid {
                        display: grid; grid-template-columns: minmax(0, 1fr) 340px;
                        gap: 1.4rem; align-items: start;
                        max-width: 1080px;
                    }

                    .panel {
                        background: linear-gradient(158deg, #1f1f1f 0%, #171717 100%);
                        border: 1px solid rgba(245,240,232,.07);
                        padding: 1.8rem; margin-bottom: 1.3rem;
                        animation: fadeUp .5s ease both;
                    }
                    .panel-head {
                        display: flex; align-items: center; gap: .75rem;
                        margin-bottom: 1.5rem; padding-bottom: 1.1rem;
                        border-bottom: 1px solid rgba(245,240,232,.07);
                    }
                    .panel-icon {
                        width: 34px; height: 34px; flex-shrink: 0;
                        border: 1px solid rgba(232,255,0,.24);
                        background: rgba(232,255,0,.05);
                        display: flex; align-items: center; justify-content: center;
                        color: var(--accent);
                    }
                    .panel-title {
                        font-family: var(--serif); font-size: 1.22rem; letter-spacing: .08em;
                    }

                    .field-row { display: flex; gap: 1rem; }
                    .field-row .field-group { flex: 1 1 0; min-width: 0; }
                    .field-group { margin-bottom: 1.15rem; min-width: 0; }
                    .field-group:last-child { margin-bottom: 0; }

                    .field-label {
                        display: block; font-size: .58rem; letter-spacing: .17em;
                        text-transform: uppercase; color: rgba(245,240,232,.42);
                        margin-bottom: .5rem; font-weight: 700;
                    }
                    .field-label .opt {
                        color: rgba(245,240,232,.24); font-weight: 500;
                        text-transform: none; letter-spacing: .02em;
                    }

                    .field-input, .field-textarea {
                        width: 100%; min-width: 0;
                        background: rgba(245,240,232,.04);
                        border: 1px solid rgba(245,240,232,.09);
                        color: var(--white);
                        font-family: var(--body); font-size: .85rem;
                        padding: .85rem 1rem;
                        outline: none;
                        transition: border-color .22s, background .22s;
                    }
                    .field-textarea { min-height: 130px; resize: vertical; line-height: 1.7; }
                    .field-input:focus, .field-textarea:focus {
                        border-color: rgba(232,255,0,.5);
                        background: rgba(232,255,0,.03);
                    }
                    .field-input::placeholder, .field-textarea::placeholder {
                        color: rgba(245,240,232,.2);
                    }
                    .field-error { font-size: .7rem; color: var(--accent2); margin-top: .45rem; }
                    .field-hint {
                        font-size: .67rem; color: rgba(245,240,232,.28);
                        margin-top: .45rem; line-height: 1.55;
                        word-break: break-all;
                    }
                    .field-warn {
                        display: flex; align-items: flex-start; gap: .45rem;
                        font-size: .67rem; color: rgba(255,170,60,.75);
                        margin-top: .45rem; line-height: 1.55;
                    }
                    .field-warn svg { flex-shrink: 0; margin-top: .12rem; }

                    .money-wrap { position: relative; }
                    .money-mark {
                        position: absolute; left: 1rem; top: 50%;
                        transform: translateY(-50%);
                        font-size: .9rem; color: rgba(245,240,232,.35);
                        pointer-events: none;
                    }
                    .money-wrap .field-input { padding-left: 2.2rem; }

                    .save-badge {
                        display: inline-flex; align-items: center; gap: .35rem;
                        margin-top: .5rem;
                        font-size: .58rem; letter-spacing: .13em;
                        text-transform: uppercase; font-weight: 700;
                        color: var(--accent2);
                        border: 1px solid rgba(255,61,46,.32);
                        background: rgba(255,61,46,.08);
                        padding: .3rem .6rem;
                    }

                    .stock-flag {
                        display: inline-flex; align-items: center; gap: .35rem;
                        margin-top: .5rem;
                        font-size: .58rem; letter-spacing: .13em;
                        text-transform: uppercase; font-weight: 700;
                        padding: .3rem .6rem;
                    }
                    .stock-flag.out {
                        color: var(--accent2);
                        border: 1px solid rgba(255,61,46,.32);
                        background: rgba(255,61,46,.08);
                    }
                    .stock-flag.low {
                        color: var(--amber);
                        border: 1px solid rgba(255,170,60,.32);
                        background: rgba(255,170,60,.08);
                        animation: pulseSoft 2.4s ease-in-out infinite;
                    }

                    .img-frame {
                        position: relative; display: block;
                        aspect-ratio: 1; overflow: hidden;
                        border: 1px solid rgba(245,240,232,.08);
                        background: #141414;
                        cursor: pointer;
                        transition: border-color .22s;
                    }
                    .img-frame:hover { border-color: rgba(232,255,0,.3); }
                    .img-frame img { width: 100%; height: 100%; object-fit: cover; }
                    .img-frame.over { border-color: var(--accent); }
                    .img-badge {
                        position: absolute; top: .7rem; left: .7rem; z-index: 2;
                        font-size: .55rem; letter-spacing: .13em;
                        text-transform: uppercase; font-weight: 700;
                        background: rgba(232,255,0,.92); color: var(--black);
                        padding: .3rem .6rem;
                    }
                    .img-empty {
                        position: absolute; inset: 0;
                        display: flex; flex-direction: column;
                        align-items: center; justify-content: center; gap: .6rem;
                        color: rgba(245,240,232,.28);
                        font-size: .68rem; letter-spacing: .1em;
                        text-transform: uppercase;
                    }

                    .img-actions { display: flex; gap: .5rem; margin-top: .9rem; }
                    .img-btn {
                        flex: 1;
                        display: inline-flex; align-items: center; justify-content: center; gap: .45rem;
                        background: transparent;
                        border: 1px solid rgba(232,255,0,.28);
                        color: var(--accent);
                        font-family: var(--body); font-size: .6rem; font-weight: 700;
                        letter-spacing: .13em; text-transform: uppercase;
                        padding: .65rem; cursor: pointer;
                        transition: all .22s;
                    }
                    .img-btn:hover {
                        background: var(--accent); color: var(--black);
                        transform: translateY(-2px);
                    }
                    .img-btn.revert {
                        border-color: rgba(245,240,232,.14);
                        color: rgba(245,240,232,.5);
                    }
                    .img-btn.revert:hover {
                        background: transparent;
                        border-color: var(--accent2); color: var(--accent2);
                    }

                    .file-hidden {
                        position: absolute; width: 1px; height: 1px;
                        padding: 0; margin: -1px; overflow: hidden;
                        clip: rect(0,0,0,0); white-space: nowrap; border: 0;
                    }

                    .cat-chips {
                        display: flex; flex-wrap: wrap; gap: .4rem;
                        margin-top: .6rem;
                    }
                    .cat-chip {
                        background: transparent;
                        border: 1px solid rgba(245,240,232,.11);
                        color: rgba(245,240,232,.5);
                        font-family: var(--body); font-size: .64rem;
                        text-transform: capitalize;
                        padding: .32rem .7rem; cursor: pointer;
                        transition: all .2s;
                    }
                    .cat-chip:hover {
                        border-color: var(--accent); color: var(--accent);
                        background: rgba(232,255,0,.05);
                    }
                    .cat-chip.on {
                        background: var(--accent); color: var(--black);
                        border-color: var(--accent); font-weight: 700;
                    }

                    .submit-panel {
                        position: sticky; top: 2rem;
                        background: linear-gradient(158deg, #212121 0%, #181818 100%);
                        border: 1px solid rgba(232,255,0,.18);
                        padding: 1.7rem;
                        animation: fadeUp .5s .1s ease both;
                    }
                    .submit-title {
                        font-family: var(--serif); font-size: 1.2rem;
                        letter-spacing: .08em; margin-bottom: 1.2rem;
                        padding-bottom: 1rem;
                        border-bottom: 1px solid rgba(245,240,232,.07);
                    }

                    .summary-row {
                        display: flex; justify-content: space-between; gap: 1rem;
                        font-size: .78rem; padding: .55rem 0;
                        color: rgba(245,240,232,.36);
                    }
                    .summary-row span:last-child {
                        color: rgba(245,240,232,.75); font-weight: 500;
                        text-align: right; min-width: 0;
                        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                    }
                    .summary-row span.changed { color: var(--accent); }

                    .btn-submit {
                        width: 100%; margin-top: 1.3rem;
                        position: relative; overflow: hidden;
                        display: inline-flex; align-items: center; justify-content: center; gap: .55rem;
                        background: var(--accent); color: var(--black); border: none;
                        font-family: var(--body); font-size: .72rem; font-weight: 700;
                        letter-spacing: .15em; text-transform: uppercase;
                        padding: 1.05rem; cursor: pointer;
                        box-shadow: 0 5px 22px rgba(232,255,0,.14);
                        transition: transform .2s, box-shadow .26s;
                    }
                    .btn-submit::before {
                        content: ''; position: absolute; inset: 0;
                        background: linear-gradient(115deg, #ff3d2e, #ff6b4a);
                        transform: translateX(-101%);
                        transition: transform .36s cubic-bezier(.4,0,.2,1);
                    }
                    .btn-submit:hover:not(:disabled)::before { transform: translateX(0); }
                    .btn-submit:hover:not(:disabled) {
                        transform: translateY(-2px);
                        box-shadow: 0 10px 32px rgba(232,255,0,.24);
                    }
                    .btn-submit:hover:not(:disabled) span,
                    .btn-submit:hover:not(:disabled) svg { color: #f5f0e8; }
                    .btn-submit:disabled { opacity: .45; transform: none; }
                    .btn-submit span, .btn-submit svg {
                        position: relative; z-index: 1; transition: color .25s;
                    }

                    .submit-note {
                        display: flex; align-items: flex-start; gap: .55rem;
                        font-size: .68rem; line-height: 1.65;
                        color: rgba(245,240,232,.28); margin-top: 1rem;
                    }
                    .submit-note svg { flex-shrink: 0; margin-top: .12rem; opacity: .6; }

                    @media (max-width: 1000px) {
                        .form-grid { grid-template-columns: minmax(0, 1fr); }
                        .submit-panel { position: static; }
                    }
                    @media (max-width: 900px) {
                        .dash-shell { grid-template-columns: minmax(0, 1fr); }
                        .mobile-topbar { display: flex; }
                        .dash-sidebar {
                            position: fixed; top: 0; left: 0; bottom: 0;
                            width: 262px; height: 100dvh; max-width: 82vw;
                            z-index: var(--z-drawer);
                            transform: translateX(-102%);
                            transition: transform .3s cubic-bezier(.4,0,.2,1);
                            overflow-y: auto;
                        }
                        .dash-sidebar.open {
                            transform: translateX(0);
                            box-shadow: 12px 0 48px rgba(0,0,0,.6);
                        }
                        .sidebar-close { display: block; }
                        .nav-overlay.open { display: block; }
                        .dash-main { padding: 1.6rem 1.3rem 4rem; }
                        .dash-header .nb-wrap { display: none; }
                    }
                    @media (max-width: 560px) {
                        .panel { padding: 1.4rem; }
                        .field-row { flex-direction: column; gap: 0; }
                        .header-actions { width: 100%; flex-wrap: wrap; }
                        .ghost-link { flex: 1; justify-content: center; }
                    }
                `}</style>
            </Head>

            <div className="dash-shell">
                <div className={`nav-overlay ${navOpen ? 'open' : ''}`} onClick={() => setNavOpen(false)} />

                <aside className={`dash-sidebar ${navOpen ? 'open' : ''}`}>
                    <button className="sidebar-close" onClick={() => setNavOpen(false)} aria-label="Close menu">
                        <X size={20} />
                    </button>

                    <div className="dash-logo">
                        VANTA <span className="accent">ADMIN</span>
                    </div>

                    <nav className="dash-nav">
                        <p className="nav-section-label">Manage</p>

                        <Link href="/product-dashboard" className="dash-nav-item active" onClick={() => setNavOpen(false)}>
                            <LayoutDashboard size={17} /> Dashboard
                        </Link>
                        <Link href="/admin/orders" className="dash-nav-item" onClick={() => setNavOpen(false)}>
                            <ClipboardList size={17} /> Orders
                        </Link>
                        <Link href="/admin/users" className="dash-nav-item" onClick={() => setNavOpen(false)}>
                            <Users size={17} /> Customers
                        </Link>
                        <Link href="/create-product" className="dash-nav-item" onClick={() => setNavOpen(false)}>
                            <PlusCircle size={17} /> Add Product
                        </Link>
                        <Link href="/shipping-zones" className="dash-nav-item" onClick={() => setNavOpen(false)}>
                            <Truck size={17} /> Shipping
                        </Link>

                        <p className="nav-section-label" style={{ paddingTop: '1.4rem' }}>Store</p>

                        <Link href="/" className="dash-nav-item" onClick={() => setNavOpen(false)}>
                            <Store size={17} /> View Store
                        </Link>
                    </nav>

                    <div className="dash-nav-footer">
                        <button onClick={handleLogout} className="dash-nav-item">
                            <LogOut size={17} /> Log Out
                        </button>
                    </div>
                </aside>

                <div style={{ minWidth: 0 }}>
                    <div className="mobile-topbar">
                        <button className="burger-btn" onClick={() => setNavOpen(true)} aria-label="Open menu">
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
                                <p className="dash-eyebrow">Editing</p>
                                <h1 className="dash-title">{product.name}</h1>
                            </div>
                            <div className="header-actions">
                                <NotificationBell />
                                <a href={`/product/${product.slug}`} target="_blank" rel="noreferrer" className="ghost-link">
                                    <ExternalLink size={13} /> View Live
                                </a>
                                <Link href="/product-dashboard" className="ghost-link">
                                    <ArrowLeft size={13} /> Back
                                </Link>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <div>
                                    <div className="panel">
                                        <div className="panel-head">
                                            <div className="panel-icon">
                                                <Package size={15} />
                                            </div>
                                            <p className="panel-title">PRODUCT DETAILS</p>
                                        </div>

                                        <div className="field-group">
                                            <label className="field-label">Product Name</label>
                                            <input type="text" className="field-input" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="e.g. Oversized Wool Coat" />
                                            {errors.name && <div className="field-error">{errors.name}</div>}
                                        </div>

                                        <div className="field-group">
                                            <label className="field-label">URL Slug</label>
                                            <input type="text" className="field-input" value={data.slug} onChange={(e) => setData('slug', e.target.value)} placeholder="oversized-wool-coat" />
                                            {slugChanged ? (
                                                <p className="field-warn">
                                                    <AlertTriangle size={11} />
                                                    Changing the slug breaks any existing links to this product.
                                                </p>
                                            ) : (
                                                <p className="field-hint">/product/{data.slug}</p>
                                            )}
                                            {errors.slug && <div className="field-error">{errors.slug}</div>}
                                        </div>

                                        <div className="field-group">
                                            <label className="field-label">Category</label>
                                            <input type="text" className="field-input" value={data.category} onChange={(e) => setData('category', e.target.value)} placeholder="e.g. outerwear" />
                                            {categories.length > 0 && (
                                                <div className="cat-chips">
                                                    {categories.map((cat) => (
                                                        <button type="button" key={cat} className={`cat-chip ${data.category === cat ? 'on' : ''}`} onClick={() => setData('category', cat)}>
                                                            {cat}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            {errors.category && <div className="field-error">{errors.category}</div>}
                                        </div>

                                        <div className="field-group">
                                            <label className="field-label">
                                                Description <span className="opt">— optional</span>
                                            </label>
                                            <textarea className="field-textarea" value={data.description} onChange={(e) => setData('description', e.target.value)} placeholder="What is it made of? How does it fit? What makes it worth buying?" />
                                            {errors.description && <div className="field-error">{errors.description}</div>}
                                        </div>
                                    </div>

                                    <div className="panel">
                                        <div className="panel-head">
                                            <div className="panel-icon">
                                                <Tag size={15} />
                                            </div>
                                            <p className="panel-title">PRICING &amp; STOCK</p>
                                        </div>

                                        <div className="field-row">
                                            <div className="field-group">
                                                <label className="field-label">Price</label>
                                                <div className="money-wrap">
                                                    <span className="money-mark">₦</span>
                                                    <input type="number" min="0" step="0.01" className="field-input" value={data.price} onChange={(e) => setData('price', e.target.value)} placeholder="0.00" />
                                                </div>
                                                {errors.price && <div className="field-error">{errors.price}</div>}
                                            </div>

                                            <div className="field-group">
                                                <label className="field-label">
                                                    Sale Price <span className="opt">— optional</span>
                                                </label>
                                                <div className="money-wrap">
                                                    <span className="money-mark">₦</span>
                                                    <input type="number" min="0" step="0.01" className="field-input" value={data.discount_price} onChange={(e) => setData('discount_price', e.target.value)} placeholder="0.00" />
                                                </div>
                                                {savePct > 0 && (
                                                    <span className="save-badge">
                                                        <Tag size={9} /> {savePct}% off
                                                    </span>
                                                )}
                                                <p className="field-hint">Clear this field to end the sale.</p>
                                                {errors.discount_price && <div className="field-error">{errors.discount_price}</div>}
                                            </div>
                                        </div>

                                        <div className="field-group">
                                            <label className="field-label">Stock Quantity</label>
                                            <input type="number" min="0" className="field-input" value={data.stock} onChange={(e) => setData('stock', e.target.value)} placeholder="0" />
                                            {outOfStock && <span className="stock-flag out">Out of stock</span>}
                                            {lowStock && <span className="stock-flag low">Only {stockNum} left</span>}
                                            <p className="field-hint">
                                                Restocking from zero emails everyone who saved this product.
                                            </p>
                                            {errors.stock && <div className="field-error">{errors.stock}</div>}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="panel">
                                        <div className="panel-head">
                                            <div className="panel-icon">
                                                <ImagePlus size={15} />
                                            </div>
                                            <p className="panel-title">IMAGE</p>
                                        </div>

                                        <label className={`img-frame ${dragOver ? 'over' : ''}`} htmlFor="product-image" onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={onDrop}>
                                            {imageChanged && <span className="img-badge">New</span>}
                                            {preview ? (
                                                <img src={preview} alt={product.name} />
                                            ) : (
                                                <span className="img-empty">
                                                    <ImagePlus size={24} />
                                                    No image
                                                </span>
                                            )}
                                        </label>

                                        <input id="product-image" type="file" accept="image/*" className="file-hidden" onChange={(e) => takeFile(e.target.files?.[0] || null)} />

                                        <div className="img-actions">
                                            <label htmlFor="product-image" className="img-btn">
                                                <ImagePlus size={12} /> Replace
                                            </label>
                                            {imageChanged && (
                                                <button type="button" className="img-btn revert" onClick={revertImage}>
                                                    <RotateCcw size={12} /> Undo
                                                </button>
                                            )}
                                        </div>

                                        <p className="field-hint">
                                            JPG, PNG, WEBP or AVIF · Max 2MB · Square works best
                                        </p>

                                        {errors.image && <div className="field-error">{errors.image}</div>}
                                    </div>

                                    <div className="submit-panel">
                                        <p className="submit-title">CHANGES</p>

                                        <div className="summary-row">
                                            <span>Name</span>
                                            <span className={data.name !== product.name ? 'changed' : ''}>
                                                {data.name || '—'}
                                            </span>
                                        </div>
                                        <div className="summary-row">
                                            <span>Category</span>
                                            <span className={data.category !== product.category ? 'changed' : ''}>
                                                {data.category || '—'}
                                            </span>
                                        </div>
                                        <div className="summary-row">
                                            <span>Price</span>
                                            <span className={data.price !== String(product.price) ? 'changed' : ''}>
                                                ₦{price.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="summary-row">
                                            <span>Sale price</span>
                                            <span className={data.discount_price !== (product.discount_price ? String(product.discount_price) : '') ? 'changed' : ''}>
                                                {discount > 0 ? `₦${discount.toLocaleString()}` : 'None'}
                                            </span>
                                        </div>
                                        <div className="summary-row">
                                            <span>Stock</span>
                                            <span className={data.stock !== String(product.stock) ? 'changed' : ''}>
                                                {data.stock || '0'} units
                                            </span>
                                        </div>
                                        <div className="summary-row">
                                            <span>Image</span>
                                            <span className={imageChanged ? 'changed' : ''}>
                                                {imageChanged ? 'Replaced' : 'Unchanged'}
                                            </span>
                                        </div>

                                        <button type="submit" className="btn-submit" disabled={processing}>
                                            <Check size={15} />
                                            <span>{processing ? 'Saving...' : 'Save Changes'}</span>
                                        </button>

                                        <p className="submit-note">
                                            <Info size={12} />
                                            Changes go live on your store immediately.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </main>
                </div>
            </div>
        </>
    );
}

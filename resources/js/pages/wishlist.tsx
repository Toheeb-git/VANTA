import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import {
    Heart,
    ShoppingCart,
    Trash2,
    ArrowLeft,
    ArrowRight,
    User,
    Settings as SettingsIcon,
    Package,
    MapPin,
    AlertTriangle,
    X,
} from 'lucide-react';
import SiteNav from '@/components/SiteNav';
import CartWidget from '@/components/CartWidget';

interface WishlistItem {
    id: number;
    created_at: string;
    product: {
        id: number;
        name: string;
        price: number | string;
        image: string;
        stock: number;
        category: string;
        description?: string;
    };
}

export default function Wishlist() {
    const { items, appUrl } = usePage().props as unknown as {
        items: WishlistItem[];
        appUrl: string;
    };

    const cursorRef = useRef<HTMLDivElement>(null);
    const [busyId, setBusyId] = useState<number | null>(null);
    const [showClear, setShowClear] = useState(false);

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
    }, [items.length, showClear]);

    const moveToCart = (id: number) => {
        setBusyId(id);
        router.post(
            `/wishlist/${id}/move-to-cart`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => window.dispatchEvent(new Event('cart:refresh')),
                onFinish: () => setBusyId(null),
            },
        );
    };

    const removeItem = (id: number) => {
        setBusyId(id);
        router.delete(`/wishlist/${id}`, {
            preserveScroll: true,
            onFinish: () => setBusyId(null),
        });
    };

    const clearAll = () => {
        router.delete('/wishlist/clear', {
            preserveScroll: true,
            onSuccess: () => setShowClear(false),
        });
    };

    const inStockCount = items.filter((i) => i.product.stock > 0).length;

    const totalValue = items
        .filter((i) => i.product.stock > 0)
        .reduce((sum, i) => sum + Number(i.product.price), 0);

    const savedOn = (iso: string) =>
        new Date(iso).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });

    return (
        <>
            <Head title="Wishlist">
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
                        --mid: #1c1c1c; --border: #262626; --muted: #6b6b6b;
                        --serif: 'Bebas Neue', sans-serif;
                        --body: 'DM Sans', sans-serif;
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
                    @keyframes heartBeat {
                        0%,100% { transform: scale(1); }
                        14% { transform: scale(1.14); }
                        28% { transform: scale(1); }
                        42% { transform: scale(1.11); }
                        70% { transform: scale(1); }
                    }

                    .wl-page {
                        min-height: 100vh; position: relative; overflow: hidden;
                        padding: 8rem 1.5rem 6rem;
                    }
                    .wl-page::before {
                        content: ''; position: absolute; inset: 0;
                        background:
                            radial-gradient(circle at 72% 8%, rgba(255,61,46,.06) 0%, transparent 55%),
                            radial-gradient(circle at 16% 88%, rgba(232,255,0,.05) 0%, transparent 52%);
                        z-index: 0; pointer-events: none;
                    }
                    .wl-page::after {
                        content: ''; position: absolute; inset: -200%;
                        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
                        opacity: .4; z-index: 0; pointer-events: none;
                        animation: grain 8s steps(10) infinite;
                    }

                    .wl-shell {
                        position: relative; z-index: 2;
                        width: 100%; max-width: 1180px; margin: 0 auto;
                    }

                    /* TABS */
                    .account-tabs {
                        display: flex; gap: .35rem; flex-wrap: wrap;
                        margin-bottom: 2rem;
                        animation: fadeUp .6s ease both;
                    }
                    .account-tab {
                        display: inline-flex; align-items: center; gap: .45rem;
                        font-size: .64rem; letter-spacing: .13em; text-transform: uppercase;
                        font-weight: 600;
                        color: rgba(245,240,232,.4); text-decoration: none;
                        padding: .65rem 1.1rem;
                        border: 1px solid rgba(245,240,232,.09);
                        background: rgba(245,240,232,.02);
                        transition: all .24s;
                    }
                    .account-tab:hover {
                        color: var(--white);
                        border-color: rgba(245,240,232,.22);
                        transform: translateY(-1px);
                    }
                    .account-tab.active {
                        color: var(--black); background: var(--accent);
                        border-color: var(--accent); font-weight: 700;
                        box-shadow: 0 4px 18px rgba(232,255,0,.18);
                    }

                    /* HEADER */
                    .wl-head {
                        display: flex; align-items: flex-end; justify-content: space-between;
                        gap: 1.5rem; flex-wrap: wrap;
                        margin-bottom: 2.2rem;
                        animation: fadeUp .6s .05s ease both;
                    }
                    .wl-eyebrow {
                        display: inline-flex; align-items: center; gap: .5rem;
                        font-size: .62rem; letter-spacing: .34em; text-transform: uppercase;
                        color: var(--accent2); font-weight: 700; margin-bottom: .7rem;
                    }
                    .wl-eyebrow svg { animation: heartBeat 2.4s ease-in-out infinite; }
                    .wl-title {
                        font-family: var(--serif);
                        font-size: clamp(2.4rem, 5.5vw, 3.6rem);
                        letter-spacing: .04em; line-height: .95;
                    }
                    .wl-title .accent { color: var(--accent); }
                    .wl-sub {
                        font-size: .86rem; font-weight: 300; line-height: 1.7;
                        color: rgba(245,240,232,.42); margin-top: .8rem; max-width: 440px;
                    }

                    .wl-meta { display: flex; gap: 2rem; flex-shrink: 0; }
                    .meta-block { text-align: right; }
                    .meta-val {
                        font-family: var(--serif); font-size: 1.9rem;
                        letter-spacing: .03em; line-height: 1;
                    }
                    .meta-val.accent { color: var(--accent); }
                    .meta-lbl {
                        font-size: .55rem; letter-spacing: .17em; text-transform: uppercase;
                        color: rgba(245,240,232,.32); margin-top: .45rem; font-weight: 700;
                    }

                    /* ACTION BAR */
                    .wl-bar {
                        display: flex; align-items: center; justify-content: space-between;
                        gap: 1rem; flex-wrap: wrap;
                        padding-bottom: 1.3rem; margin-bottom: 1.8rem;
                        border-bottom: 1px solid var(--border);
                        animation: fadeUp .6s .08s ease both;
                    }
                    .bar-note { font-size: .8rem; color: rgba(245,240,232,.42); }
                    .bar-note strong { color: var(--white); font-weight: 600; }
                    .clear-btn {
                        display: inline-flex; align-items: center; gap: .45rem;
                        background: transparent;
                        border: 1px solid rgba(255,61,46,.22);
                        color: rgba(255,61,46,.7);
                        font-family: var(--body); font-size: .62rem; font-weight: 700;
                        letter-spacing: .13em; text-transform: uppercase;
                        padding: .6rem 1.1rem; cursor: none;
                        transition: all .22s;
                    }
                    .clear-btn:hover {
                        background: rgba(255,61,46,.08);
                        border-color: var(--accent2); color: var(--accent2);
                    }

                    /* GRID */
                    .wl-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(268px, 1fr));
                        gap: 1.4rem;
                    }

                    .wl-card {
                        position: relative;
                        background: linear-gradient(160deg, #1f1f1f 0%, #151515 100%);
                        border: 1px solid var(--border);
                        border-radius: 14px;
                        overflow: hidden; min-width: 0;
                        animation: fadeUp .5s ease both;
                        transition: transform .32s cubic-bezier(.34,1.5,.64,1),
                                    box-shadow .32s, border-color .28s;
                    }
                    .wl-card:hover {
                        transform: translateY(-6px);
                        box-shadow: 0 26px 64px rgba(0,0,0,.55);
                        border-color: rgba(232,255,0,.26);
                    }
                    .wl-card.gone { opacity: .45; pointer-events: none; }

                    .wl-img-wrap {
                        position: relative; overflow: hidden; aspect-ratio: 1;
                        background: #141414;
                    }
                    .wl-img-wrap img {
                        width: 100%; height: 100%; object-fit: cover;
                        transition: transform .5s;
                    }
                    .wl-card:hover .wl-img-wrap img { transform: scale(1.07); }

                    .wl-remove {
                        position: absolute; top: .75rem; right: .75rem; z-index: 3;
                        width: 32px; height: 32px; border-radius: 50%;
                        background: rgba(10,10,10,.82);
                        backdrop-filter: blur(6px);
                        border: 1px solid rgba(245,240,232,.13);
                        color: rgba(245,240,232,.55);
                        display: flex; align-items: center; justify-content: center;
                        cursor: none;
                        opacity: 0; transform: scale(.85);
                        transition: all .22s;
                    }
                    .wl-card:hover .wl-remove { opacity: 1; transform: scale(1); }
                    .wl-remove:hover {
                        color: var(--accent2);
                        border-color: rgba(255,61,46,.5);
                        background: rgba(255,61,46,.14);
                    }

                    .stock-flag {
                        position: absolute; bottom: .75rem; left: .75rem; z-index: 3;
                        display: inline-flex; align-items: center; gap: .3rem;
                        font-size: .53rem; letter-spacing: .14em;
                        text-transform: uppercase; font-weight: 700;
                        padding: .32rem .6rem;
                        backdrop-filter: blur(6px);
                    }
                    .stock-flag.in {
                        background: rgba(232,255,0,.14); color: var(--accent);
                        border: 1px solid rgba(232,255,0,.36);
                    }
                    .stock-flag.low {
                        background: rgba(255,170,60,.14); color: var(--amber);
                        border: 1px solid rgba(255,170,60,.38);
                    }
                    .stock-flag.out {
                        background: rgba(255,61,46,.16); color: var(--accent2);
                        border: 1px solid rgba(255,61,46,.4);
                    }

                    .wl-info { padding: 1.15rem 1.25rem 1.35rem; min-width: 0; }
                    .wl-cat {
                        font-size: .6rem; letter-spacing: .18em; text-transform: uppercase;
                        color: var(--muted);
                        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                    }
                    .wl-name {
                        font-size: 1.04rem; font-weight: 600; margin-top: .42rem;
                        line-height: 1.3; overflow-wrap: break-word;
                    }
                    .wl-price-row {
                        display: flex; align-items: baseline; justify-content: space-between;
                        gap: .6rem; margin-top: .7rem; flex-wrap: wrap;
                    }
                    .wl-price {
                        font-family: var(--serif); font-size: 1.55rem;
                        color: var(--accent); letter-spacing: .02em; line-height: 1;
                    }
                    .wl-price.dim {
                        color: rgba(245,240,232,.3);
                        text-decoration: line-through;
                    }
                    .wl-date {
                        font-size: .6rem; letter-spacing: .08em;
                        color: rgba(245,240,232,.26);
                    }

                    .wl-cart-btn {
                        margin-top: 1.15rem; width: 100%;
                        position: relative; overflow: hidden;
                        background: transparent; border: 1px solid var(--accent);
                        color: var(--accent);
                        padding: .78rem; border-radius: 8px;
                        font-family: var(--body);
                        font-size: .68rem; font-weight: 700; letter-spacing: .12em;
                        text-transform: uppercase; cursor: none;
                        display: flex; align-items: center; justify-content: center; gap: .5rem;
                        transition: background .22s, color .22s, transform .2s;
                    }
                    .wl-cart-btn:hover:not(:disabled) {
                        background: var(--accent); color: var(--black);
                        transform: translateY(-2px);
                    }
                    .wl-cart-btn:disabled {
                        opacity: .38; border-color: var(--border);
                        color: rgba(245,240,232,.38);
                    }

                    /* EMPTY */
                    .wl-empty {
                        text-align: center; padding: 5.5rem 2rem;
                        border: 1px dashed var(--border); border-radius: 16px;
                        animation: fadeUp .6s .1s ease both;
                    }
                    .empty-icon {
                        width: 68px; height: 68px; margin: 0 auto 1.5rem;
                        border-radius: 50%;
                        border: 1px solid rgba(255,61,46,.24);
                        background: rgba(255,61,46,.05);
                        display: flex; align-items: center; justify-content: center;
                        color: rgba(255,61,46,.6);
                    }
                    .empty-title {
                        font-family: var(--serif); font-size: 2.1rem;
                        letter-spacing: .05em; margin-bottom: .8rem;
                    }
                    .empty-desc {
                        color: rgba(245,240,232,.4); font-size: .86rem;
                        line-height: 1.7; margin-bottom: 2rem;
                        max-width: 340px; margin-left: auto; margin-right: auto;
                    }
                    .empty-cta {
                        display: inline-flex; align-items: center; gap: .55rem;
                        position: relative; overflow: hidden;
                        background: var(--accent); color: var(--black);
                        text-decoration: none;
                        font-size: .7rem; font-weight: 700;
                        letter-spacing: .15em; text-transform: uppercase;
                        padding: 1rem 2rem;
                        box-shadow: 0 4px 20px rgba(232,255,0,.15);
                        transition: transform .22s, box-shadow .28s;
                    }
                    .empty-cta::before {
                        content: ''; position: absolute; inset: 0;
                        background: linear-gradient(115deg, #ff3d2e, #ff6b4a);
                        transform: translateX(-101%);
                        transition: transform .36s cubic-bezier(.4,0,.2,1);
                    }
                    .empty-cta:hover::before { transform: translateX(0); }
                    .empty-cta:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 10px 30px rgba(232,255,0,.24);
                    }
                    .empty-cta:hover span, .empty-cta:hover svg { color: var(--white); }
                    .empty-cta span, .empty-cta svg {
                        position: relative; z-index: 1; transition: color .25s;
                    }

                    /* FOOTER LINK */
                    .wl-foot {
                        display: flex; justify-content: center;
                        margin-top: 2.5rem;
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

                    /* MODAL */
                    .modal-overlay {
                        position: fixed; inset: 0; z-index: 1000;
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
                    .modal-body strong { color: rgba(245,240,232,.85); font-weight: 500; }
                    .modal-actions { display: flex; gap: .7rem; }
                    .modal-confirm {
                        flex: 1; background: var(--accent2); color: #fff; border: none;
                        font-family: var(--body); font-size: .68rem; font-weight: 700;
                        letter-spacing: .14em; text-transform: uppercase;
                        padding: .9rem; cursor: none; transition: transform .2s;
                    }
                    .modal-confirm:hover { transform: translateY(-2px); }
                    .modal-dismiss {
                        background: transparent; border: 1px solid rgba(245,240,232,.15);
                        color: rgba(245,240,232,.5);
                        font-family: var(--body); font-size: .68rem; font-weight: 600;
                        letter-spacing: .13em; text-transform: uppercase;
                        padding: .9rem 1.4rem; cursor: none; transition: all .2s;
                    }
                    .modal-dismiss:hover { border-color: var(--white); color: var(--white); }

                    @media (max-width: 768px) {
                        .wl-page { padding: 6.5rem 1.2rem 6rem; }
                        .wl-head { flex-direction: column; align-items: flex-start; }
                        .wl-meta { gap: 1.6rem; }
                        .meta-block { text-align: left; }
                        .wl-remove { opacity: 1; transform: scale(1); }
                    }
                    @media (max-width: 560px) {
                        .account-tab { font-size: .58rem; padding: .6rem .8rem; }
                        .wl-grid { grid-template-columns: minmax(0, 1fr); }
                        .wl-bar { flex-direction: column; align-items: stretch; }
                        .clear-btn { justify-content: center; }
                        .modal { padding: 1.7rem; }
                        .modal-actions { flex-direction: column-reverse; }
                    }
                `}</style>
            </Head>

            <SiteNav />
            <div className="custom-cursor" ref={cursorRef} />

            {showClear && (
                <div className="modal-overlay" onClick={() => setShowClear(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-icon">
                            <AlertTriangle size={22} />
                        </div>
                        <h2 className="modal-title">CLEAR WISHLIST?</h2>
                        <p className="modal-body">
                            All <strong>{items.length} saved item
                            {items.length === 1 ? '' : 's'}</strong> will be
                            removed. Nothing in your cart or your orders is
                            affected — you can always save them again later.
                        </p>
                        <div className="modal-actions">
                            <button className="modal-confirm" onClick={clearAll}>
                                Yes, Clear It
                            </button>
                            <button
                                className="modal-dismiss"
                                onClick={() => setShowClear(false)}
                            >
                                Keep Them
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="wl-page">
                <div className="wl-shell">
                    <div className="account-tabs">
                        <Link href="/account/profile" className="account-tab">
                            <User size={12} /> Profile
                        </Link>
                        <Link href="/wishlist" className="account-tab active">
                            <Heart size={12} /> Wishlist
                        </Link>
                        <Link href="/account/addresses" className="account-tab">
                            <MapPin size={12} /> Addresses
                        </Link>
                        <Link href="/account/orders" className="account-tab">
                            <Package size={12} /> Orders
                        </Link>
                        <Link href="/account/settings" className="account-tab">
                            <SettingsIcon size={12} /> Settings
                        </Link>
                    </div>

                    <div className="wl-head">
                        <div>
                            <p className="wl-eyebrow">
                                <Heart size={11} fill="currentColor" /> Saved
                            </p>
                            <h1 className="wl-title">
                                YOUR <span className="accent">WISHLIST</span>
                            </h1>
                            <p className="wl-sub">
                                Pieces you're keeping an eye on. Move them to
                                your cart whenever you're ready.
                            </p>
                        </div>

                        {items.length > 0 && (
                            <div className="wl-meta">
                                <div className="meta-block">
                                    <p className="meta-val">{items.length}</p>
                                    <p className="meta-lbl">Saved</p>
                                </div>
                                <div className="meta-block">
                                    <p className="meta-val accent">
                                        ₦{totalValue.toLocaleString()}
                                    </p>
                                    <p className="meta-lbl">Total Value</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {items.length === 0 ? (
                        <div className="wl-empty">
                            <div className="empty-icon">
                                <Heart size={28} />
                            </div>
                            <h2 className="empty-title">NOTHING SAVED YET</h2>
                            <p className="empty-desc">
                                Tap the heart on any product to keep it here for
                                later. Your wishlist stays with your account.
                            </p>
                            <Link href="/product-page" className="empty-cta">
                                <span>Browse Products</span>
                                <ArrowRight size={15} />
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="wl-bar">
                                <p className="bar-note">
                                    <strong>{inStockCount}</strong> of{' '}
                                    <strong>{items.length}</strong> available to
                                    buy right now
                                </p>
                                <button
                                    className="clear-btn"
                                    onClick={() => setShowClear(true)}
                                >
                                    <Trash2 size={12} /> Clear All
                                </button>
                            </div>

                            <div className="wl-grid">
                                {items.map((item) => {
                                    const stock = item.product.stock;
                                    const out = stock <= 0;
                                    const low = stock > 0 && stock <= 5;
                                    const busy = busyId === item.id;

                                    return (
                                        <div
                                            key={item.id}
                                            className={`wl-card ${busy ? 'gone' : ''}`}
                                        >
                                            <div className="wl-img-wrap">
                                                <img
                                                    src={`${appUrl}/storage/${item.product.image}`}
                                                    alt={item.product.name}
                                                    loading="lazy"
                                                    style={
                                                        out
                                                            ? { opacity: 0.42 }
                                                            : undefined
                                                    }
                                                />

                                                <button
                                                    className="wl-remove"
                                                    onClick={() =>
                                                        removeItem(item.id)
                                                    }
                                                    aria-label="Remove from wishlist"
                                                    title="Remove"
                                                >
                                                    <X size={15} />
                                                </button>

                                                <span
                                                    className={`stock-flag ${out ? 'out' : low ? 'low' : 'in'}`}
                                                >
                                                    {out
                                                        ? 'Out of Stock'
                                                        : low
                                                          ? `Only ${stock} left`
                                                          : 'In Stock'}
                                                </span>
                                            </div>

                                            <div className="wl-info">
                                                <p className="wl-cat">
                                                    {item.product.category}
                                                </p>
                                                <h3 className="wl-name">
                                                    {item.product.name}
                                                </h3>

                                                <div className="wl-price-row">
                                                    <span
                                                        className={`wl-price ${out ? 'dim' : ''}`}
                                                    >
                                                        ₦
                                                        {Number(
                                                            item.product.price,
                                                        ).toLocaleString()}
                                                    </span>
                                                    <span className="wl-date">
                                                        Saved{' '}
                                                        {savedOn(
                                                            item.created_at,
                                                        )}
                                                    </span>
                                                </div>

                                                <button
                                                    className="wl-cart-btn"
                                                    disabled={out || busy}
                                                    onClick={() =>
                                                        moveToCart(item.id)
                                                    }
                                                >
                                                    <ShoppingCart size={14} />
                                                    {out
                                                        ? 'Out of Stock'
                                                        : busy
                                                          ? 'Moving...'
                                                          : 'Move to Cart'}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    <div className="wl-foot">
                        <Link href="/product-page" className="back-link">
                            <ArrowLeft size={13} /> Continue Shopping
                        </Link>
                    </div>
                </div>
            </div>

            <CartWidget />
        </>
    );
}

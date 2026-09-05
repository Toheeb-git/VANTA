import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import {
    ArrowLeft,
    ArrowRight,
    PackageOpen,
    ChevronRight,
    Star,
    Check,
} from 'lucide-react';
import SiteNav from '@/components/SiteNav';
import CartWidget from '@/components/CartWidget';
import AccountTabs from '@/components/AccountTabs';

interface OrderItem {
    id: number;
    product_id: number;
    quantity: number;
    price: number | string;
    can_review: boolean;
    reviewed: boolean;
    product: {
        id: number;
        name: string;
        slug: string;
        image: string;
    } | null;
}

interface Order {
    id: number;
    reference: string;
    total_amount: number | string;
    status: string;
    created_at: string;
    items: OrderItem[];
}

export default function Orders() {
    const { orders, appUrl } = usePage().props as unknown as {
        orders: Order[];
        appUrl: string;
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
        const interactables = document.querySelectorAll('a, button, input, label');
        interactables.forEach((el) => {
            el.addEventListener('mouseenter', () =>
                cursor.classList.add('cursor-expand'),
            );
            el.addEventListener('mouseleave', () =>
                cursor.classList.remove('cursor-expand'),
            );
        });
        return () => document.removeEventListener('mousemove', onMove);
    }, [orders.length]);

    const fmtDate = (iso: string) =>
        new Date(iso).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });

    const pendingReviews = orders.reduce(
        (n, o) =>
            n + o.items.filter((i) => i.can_review && !i.reviewed).length,
        0,
    );

    return (
        <>
            <Head title="Orders">
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
                        --blue: #7ab4ff; --purple: #be8cff;
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
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes grain {
                        0%,100%{transform:translate(0,0)}10%{transform:translate(-5%,-10%)}
                        30%{transform:translate(3%,-15%)}50%{transform:translate(12%,9%)}
                        70%{transform:translate(9%,4%)}90%{transform:translate(-1%,7%)}
                    }
                    @keyframes starNudge {
                        0%,88%,100% { transform: rotate(0); }
                        92% { transform: rotate(-12deg); }
                        96% { transform: rotate(12deg); }
                    }

                    .ord-page {
                        min-height: 100vh; position: relative; overflow: hidden;
                        padding: 8rem 1.5rem 5rem;
                    }
                    .ord-page::before {
                        content: ''; position: absolute; inset: 0;
                        background:
                            radial-gradient(circle at 68% 10%, rgba(232,255,0,.06) 0%, transparent 56%),
                            radial-gradient(circle at 18% 88%, rgba(255,61,46,.05) 0%, transparent 52%);
                        z-index: 0; pointer-events: none;
                    }
                    .ord-page::after {
                        content: ''; position: absolute; inset: -200%;
                        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
                        opacity: .4; z-index: 0; pointer-events: none;
                        animation: grain 8s steps(10) infinite;
                    }

                    .ord-shell {
                        position: relative; z-index: 2;
                        width: 100%; max-width: 760px; margin: 0 auto;
                    }

                    .ord-head { margin-bottom: 1.8rem; animation: fadeUp .6s ease both; }
                    .ord-eyebrow {
                        font-size: .62rem; letter-spacing: .34em; text-transform: uppercase;
                        color: var(--accent); font-weight: 700; margin-bottom: .7rem;
                    }
                    .ord-title {
                        font-family: var(--serif);
                        font-size: clamp(2.3rem, 5.5vw, 3.4rem);
                        letter-spacing: .04em; line-height: .95;
                    }
                    .ord-title .accent { color: var(--accent); }
                    .ord-sub {
                        font-size: .86rem; font-weight: 300; line-height: 1.7;
                        color: rgba(245,240,232,.42); margin-top: .8rem; max-width: 440px;
                    }

                    .ord-count {
                        display: flex; align-items: center; justify-content: space-between;
                        gap: 1rem; flex-wrap: wrap;
                        font-size: .8rem; color: rgba(245,240,232,.4);
                        padding-bottom: 1.2rem; margin-bottom: 1.5rem;
                        border-bottom: 1px solid rgba(245,240,232,.08);
                        animation: fadeUp .6s .08s ease both;
                    }
                    .ord-count strong { color: var(--white); font-weight: 600; }

                    .review-nudge {
                        display: inline-flex; align-items: center; gap: .45rem;
                        font-size: .62rem; letter-spacing: .12em;
                        text-transform: uppercase; font-weight: 700;
                        color: var(--accent);
                        background: rgba(232,255,0,.07);
                        border: 1px solid rgba(232,255,0,.28);
                        padding: .42rem .8rem;
                    }
                    .review-nudge svg { animation: starNudge 4s ease-in-out infinite; }

                    /* ORDER CARDS */
                    .order-card {
                        border: 1px solid rgba(245,240,232,.075);
                        background: linear-gradient(158deg, #1f1f1f 0%, #161616 100%);
                        margin-bottom: 1rem;
                        position: relative; overflow: hidden;
                        animation: fadeUp .5s ease both;
                        transition: border-color .25s, box-shadow .28s;
                    }
                    .order-card:hover {
                        border-color: rgba(232,255,0,.24);
                        box-shadow: 0 18px 46px rgba(0,0,0,.4);
                    }
                    .order-card.pending { border-color: rgba(232,255,0,.24); }
                    .order-card.delivered::before {
                        content: ''; position: absolute;
                        left: 0; top: 0; bottom: 0; width: 2px;
                        background: var(--green);
                    }

                    .order-body {
                        display: block; text-decoration: none; color: inherit;
                        cursor: none; padding: 1.5rem;
                        transition: background .22s;
                    }
                    .order-body:hover { background: rgba(232,255,0,.015); }

                    .order-header {
                        display: flex; align-items: flex-start; justify-content: space-between;
                        gap: 1rem;
                        margin-bottom: 1rem; padding-bottom: 1rem;
                        border-bottom: 1px solid rgba(245,240,232,.06);
                    }
                    .order-id {
                        font-family: var(--serif); font-size: 1.24rem;
                        letter-spacing: .09em; color: var(--white); line-height: 1;
                    }
                    .order-date {
                        font-size: .62rem; letter-spacing: .11em;
                        color: rgba(245,240,232,.28); margin-top: .5rem;
                        text-transform: uppercase; font-weight: 600;
                    }
                    .order-status {
                        font-size: .55rem; letter-spacing: .14em; text-transform: uppercase;
                        padding: .38rem .72rem; font-weight: 700; white-space: nowrap;
                        flex-shrink: 0;
                    }
                    .order-status.pending { background: rgba(245,240,232,.05); color: rgba(245,240,232,.48); border: 1px solid rgba(245,240,232,.14); }
                    .order-status.paid { background: rgba(232,255,0,.1); color: var(--accent); border: 1px solid rgba(232,255,0,.32); }
                    .order-status.confirmed { background: rgba(120,180,255,.09); color: var(--blue); border: 1px solid rgba(120,180,255,.3); }
                    .order-status.processing { background: rgba(190,140,255,.09); color: var(--purple); border: 1px solid rgba(190,140,255,.3); }
                    .order-status.shipped { background: rgba(255,170,60,.09); color: var(--amber); border: 1px solid rgba(255,170,60,.32); }
                    .order-status.delivered { background: rgba(74,222,128,.1); color: var(--green); border: 1px solid rgba(74,222,128,.32); }
                    .order-status.cancelled { background: rgba(255,61,46,.1); color: var(--accent2); border: 1px solid rgba(255,61,46,.3); }

                    .order-item-row {
                        display: flex; justify-content: space-between; gap: 1rem;
                        font-size: .8rem; color: rgba(245,240,232,.52); padding: .42rem 0;
                    }
                    .order-item-row span:first-child {
                        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                    }
                    .order-item-row span:last-child {
                        white-space: nowrap; color: rgba(245,240,232,.68);
                    }

                    .order-total {
                        display: flex; justify-content: space-between; align-items: center;
                        margin-top: 1rem; padding-top: 1rem;
                        border-top: 1px solid rgba(245,240,232,.06);
                        font-size: .6rem; letter-spacing: .17em;
                        text-transform: uppercase; font-weight: 700;
                        color: rgba(245,240,232,.4);
                    }
                    .order-total-amount {
                        font-family: var(--serif); font-size: 1.45rem;
                        letter-spacing: .03em; color: var(--accent);
                    }

                    .order-action-hint {
                        display: flex; align-items: center; gap: .45rem;
                        margin-top: 1rem; padding-top: .9rem;
                        border-top: 1px solid rgba(232,255,0,.16);
                        font-size: .62rem; letter-spacing: .13em;
                        text-transform: uppercase; font-weight: 700;
                        color: var(--accent);
                    }

                    .order-view-hint {
                        display: flex; align-items: center; justify-content: flex-end;
                        gap: .3rem; margin-top: .9rem;
                        font-size: .58rem; letter-spacing: .13em;
                        text-transform: uppercase; font-weight: 600;
                        color: rgba(245,240,232,.24);
                        transition: color .22s, gap .22s;
                    }
                    .order-body:hover .order-view-hint {
                        color: var(--accent); gap: .5rem;
                    }

                    /* ===== REVIEW STRIP ===== */
                    .rate-strip {
                        border-top: 1px solid rgba(245,240,232,.07);
                        background: rgba(232,255,0,.022);
                        padding: 1.2rem 1.5rem 1.35rem;
                    }
                    .rate-head {
                        display: flex; align-items: center; gap: .5rem;
                        font-size: .6rem; letter-spacing: .16em;
                        text-transform: uppercase; font-weight: 700;
                        color: rgba(232,255,0,.8);
                        margin-bottom: 1rem;
                    }
                    .rate-head .done-label { color: rgba(74,222,128,.8); }

                    .rate-list { display: flex; flex-direction: column; gap: .6rem; }

                    .rate-row {
                        display: flex; align-items: center; gap: .85rem;
                        padding: .7rem .85rem;
                        background: rgba(245,240,232,.028);
                        border: 1px solid rgba(245,240,232,.06);
                        text-decoration: none; color: inherit;
                        cursor: none;
                        transition: border-color .22s, background .22s, transform .22s;
                    }
                    .rate-row.pending-review:hover {
                        border-color: rgba(232,255,0,.35);
                        background: rgba(232,255,0,.05);
                        transform: translateX(3px);
                    }
                    .rate-row.done { opacity: .62; }

                    .rate-thumb {
                        width: 42px; height: 42px; flex-shrink: 0;
                        object-fit: cover;
                        border: 1px solid rgba(245,240,232,.07);
                        background: #141414;
                    }
                    .rate-name {
                        flex: 1; min-width: 0;
                        font-size: .82rem; font-weight: 500;
                        color: rgba(245,240,232,.84);
                        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                    }

                    .rate-cta {
                        display: inline-flex; align-items: center; gap: .4rem;
                        flex-shrink: 0;
                        font-size: .58rem; letter-spacing: .13em;
                        text-transform: uppercase; font-weight: 700;
                        color: var(--accent);
                        border: 1px solid rgba(232,255,0,.3);
                        background: rgba(232,255,0,.06);
                        padding: .42rem .75rem;
                        transition: all .22s;
                    }
                    .rate-row.pending-review:hover .rate-cta {
                        background: var(--accent); color: var(--black);
                        border-color: var(--accent);
                    }

                    .rate-done-tag {
                        display: inline-flex; align-items: center; gap: .35rem;
                        flex-shrink: 0;
                        font-size: .55rem; letter-spacing: .12em;
                        text-transform: uppercase; font-weight: 700;
                        color: var(--green);
                        border: 1px solid rgba(74,222,128,.26);
                        background: rgba(74,222,128,.07);
                        padding: .42rem .7rem;
                    }

                    /* EMPTY */
                    .orders-empty {
                        text-align: center; padding: 5rem 2rem;
                        border: 1px dashed rgba(245,240,232,.1);
                        color: rgba(245,240,232,.35);
                        animation: fadeUp .6s .1s ease both;
                    }
                    .empty-icon {
                        width: 66px; height: 66px; margin: 0 auto 1.5rem;
                        border-radius: 50%;
                        border: 1px solid rgba(232,255,0,.22);
                        background: rgba(232,255,0,.04);
                        display: flex; align-items: center; justify-content: center;
                        color: rgba(232,255,0,.55);
                    }
                    .empty-title {
                        font-family: var(--serif); font-size: 2rem;
                        letter-spacing: .05em; margin-bottom: .8rem;
                        color: var(--white);
                    }
                    .empty-desc {
                        font-size: .85rem; line-height: 1.7; margin-bottom: 2rem;
                        max-width: 320px; margin-left: auto; margin-right: auto;
                    }
                    .empty-cta {
                        display: inline-flex; align-items: center; gap: .55rem;
                        position: relative; overflow: hidden;
                        background: var(--accent); color: var(--black);
                        text-decoration: none;
                        font-family: var(--body); font-size: .7rem; font-weight: 700;
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

                    .ord-foot {
                        display: flex; justify-content: center;
                        margin-top: 2.2rem;
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

                    @media (max-width: 768px) {
                        .ord-page { padding: 6.5rem 1.2rem 6rem; }
                    }
                    @media (max-width: 560px) {
                        .order-body { padding: 1.25rem; }
                        .rate-strip { padding: 1.1rem 1.25rem 1.25rem; }
                        .order-header { flex-direction: column; gap: .8rem; }
                        .rate-row { flex-wrap: wrap; row-gap: .7rem; }
                        .rate-name { flex: 1 1 calc(100% - 3.6rem); }
                        .rate-cta, .rate-done-tag {
                            flex: 1 1 100%; justify-content: center;
                        }
                    }
                `}</style>
            </Head>

            <SiteNav />
            <div className="custom-cursor" ref={cursorRef} />

            <div className="ord-page">
                <div className="ord-shell">
                    <div className="ord-head">
                        <p className="ord-eyebrow">Account</p>
                        <h1 className="ord-title">
                            ORDER <span className="accent">HISTORY</span>
                        </h1>
                        <p className="ord-sub">
                            A record of everything you've purchased. Tap any
                            order to track it or view the full receipt.
                        </p>
                    </div>

                    <AccountTabs />

                    {orders.length === 0 ? (
                        <div className="orders-empty">
                            <div className="empty-icon">
                                <PackageOpen size={28} />
                            </div>
                            <h2 className="empty-title">NO ORDERS YET</h2>
                            <p className="empty-desc">
                                When you place your first order, it'll appear
                                here with full tracking.
                            </p>
                            <Link href="/product-page" className="empty-cta">
                                <span>Start Shopping</span>
                                <ArrowRight size={15} />
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="ord-count">
                                <span>
                                    <strong>{orders.length}</strong> order
                                    {orders.length === 1 ? '' : 's'} placed
                                </span>
                                {pendingReviews > 0 && (
                                    <span className="review-nudge">
                                        <Star size={11} fill="currentColor" />
                                        {pendingReviews} item
                                        {pendingReviews === 1 ? '' : 's'} to
                                        rate
                                    </span>
                                )}
                            </div>

                            {orders.map((order) => {
                                const rateable = order.items.filter(
                                    (i) => i.can_review,
                                );
                                const allDone =
                                    rateable.length > 0 &&
                                    rateable.every((i) => i.reviewed);

                                return (
                                    <div
                                        key={order.id}
                                        className={`order-card ${order.status === 'pending' ? 'pending' : ''} ${order.status === 'delivered' ? 'delivered' : ''}`}
                                    >
                                        <Link
                                            href={`/order/${order.reference}`}
                                            className="order-body"
                                        >
                                            <div className="order-header">
                                                <div>
                                                    <p className="order-id">
                                                        {order.reference}
                                                    </p>
                                                    <p className="order-date">
                                                        {fmtDate(
                                                            order.created_at,
                                                        )}
                                                    </p>
                                                </div>
                                                <span
                                                    className={`order-status ${order.status}`}
                                                >
                                                    {order.status}
                                                </span>
                                            </div>

                                            {order.items.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="order-item-row"
                                                >
                                                    <span>
                                                        {item.product?.name ??
                                                            'Product'}{' '}
                                                        × {item.quantity}
                                                    </span>
                                                    <span>
                                                        ₦
                                                        {(
                                                            Number(item.price) *
                                                            item.quantity
                                                        ).toLocaleString()}
                                                    </span>
                                                </div>
                                            ))}

                                            <div className="order-total">
                                                <span>Total</span>
                                                <span className="order-total-amount">
                                                    ₦
                                                    {Number(
                                                        order.total_amount,
                                                    ).toLocaleString()}
                                                </span>
                                            </div>

                                            {order.status === 'pending' ? (
                                                <p className="order-action-hint">
                                                    <ArrowRight size={12} />
                                                    Payment required — tap to
                                                    pay
                                                </p>
                                            ) : (
                                                <p className="order-view-hint">
                                                    View details
                                                    <ChevronRight size={12} />
                                                </p>
                                            )}
                                        </Link>

                                        {rateable.length > 0 && (
                                            <div className="rate-strip">
                                                <p className="rate-head">
                                                    <Star
                                                        size={11}
                                                        fill="currentColor"
                                                    />
                                                    {allDone ? (
                                                        <span className="done-label">
                                                            You've rated
                                                            everything in this
                                                            order
                                                        </span>
                                                    ) : (
                                                        'How was your purchase?'
                                                    )}
                                                </p>

                                                <div className="rate-list">
                                                    {rateable.map((item) =>
                                                        item.reviewed ? (
                                                            <div
                                                                key={item.id}
                                                                className="rate-row done"
                                                            >
                                                                <img
                                                                    src={`${appUrl}/storage/${item.product!.image}`}
                                                                    alt={
                                                                        item
                                                                            .product!
                                                                            .name
                                                                    }
                                                                    className="rate-thumb"
                                                                    loading="lazy"
                                                                />
                                                                <span className="rate-name">
                                                                    {
                                                                        item
                                                                            .product!
                                                                            .name
                                                                    }
                                                                </span>
                                                                <span className="rate-done-tag">
                                                                    <Check
                                                                        size={
                                                                            10
                                                                        }
                                                                    />
                                                                    Reviewed
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <Link
                                                                key={item.id}
                                                                href={`/product/${item.product!.slug}?review=1`}
                                                                className="rate-row pending-review"
                                                            >
                                                                <img
                                                                    src={`${appUrl}/storage/${item.product!.image}`}
                                                                    alt={
                                                                        item
                                                                            .product!
                                                                            .name
                                                                    }
                                                                    className="rate-thumb"
                                                                    loading="lazy"
                                                                />
                                                                <span className="rate-name">
                                                                    {
                                                                        item
                                                                            .product!
                                                                            .name
                                                                    }
                                                                </span>
                                                                <span className="rate-cta">
                                                                    <Star
                                                                        size={
                                                                            10
                                                                        }
                                                                    />
                                                                    Rate It
                                                                </span>
                                                            </Link>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </>
                    )}

                    <div className="ord-foot">
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

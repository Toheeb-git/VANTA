import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
    ArrowLeft,
    Package,
    MapPin,
    User,
    Phone,
    Mail,
    Clock,
    CheckCircle2,
    ArrowRight,
    XCircle,
    AlertTriangle,
    Receipt,
    Copy,
} from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';

interface OrderItem {
    id: number;
    quantity: number;
    price: number | string;
    product: { name: string; image: string } | null;
}

interface HistoryEntry {
    id: number;
    status: string;
    note: string | null;
    created_at: string;
    changed_by: { name: string } | null;
}

interface Order {
    id: number;
    reference: string;
    subtotal: number | string;
    shipping_fee: number | string;
    total_amount: number | string;
    status: string;
    created_at: string;
    paid_at: string | null;
    payment_reference: string | null;
    ship_full_name: string;
    ship_phone: string;
    ship_country: string;
    ship_state: string;
    ship_city: string;
    ship_street: string;
    ship_apartment: string | null;
    ship_postal_code: string | null;
    ship_instructions: string | null;
    items: OrderItem[];
    status_history: HistoryEntry[];
    user: { name: string; email: string; phone: string | null } | null;
}

export default function AdminOrderDetail() {
    const { order, nextStatus, appUrl } = usePage().props as unknown as {
        order: Order;
        nextStatus: string | null;
        appUrl: string;
    };

    const [showCancel, setShowCancel] = useState(false);
    const [copied, setCopied] = useState(false);

    const { data, setData, processing, errors, reset } = useForm({
        status: '',
        note: '',
    });

    const advance = (status: string) => {
        router.patch(
            `/admin/orders/${order.reference}/status`,
            { status, note: data.note || null },
            { onSuccess: () => reset('note') },
        );
    };

    const doCancel = () => {
        router.patch(
            `/admin/orders/${order.reference}/status`,
            { status: 'cancelled', note: data.note || 'Cancelled by admin' },
            {
                onSuccess: () => {
                    reset('note');
                    setShowCancel(false);
                },
            },
        );
    };

    const copyRef = () => {
        navigator.clipboard.writeText(order.reference);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const fmtDateTime = (iso: string) =>
        new Date(iso).toLocaleString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

    const canCancel = !['delivered', 'cancelled'].includes(order.status);
    const history = order.status_history ?? [];

    return (
        <>
            <Head title={`${order.reference} — Admin`}>
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
                        --z-sticky: 100;
                        --z-modal: 1000;
                    }
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    body { background: var(--black); color: var(--white); font-family: var(--body); }

                    @keyframes fadeUp {
                        from { opacity: 0; transform: translateY(16px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes modalIn {
                        from { opacity: 0; transform: scale(.94) translateY(10px); }
                        to { opacity: 1; transform: scale(1) translateY(0); }
                    }
                    @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }

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
                    .detail-shell {
                        max-width: 1080px; margin: 0 auto;
                        position: relative;
                    }

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

                    .detail-head {
                        display: flex; align-items: flex-start; justify-content: space-between;
                        gap: 1.5rem; flex-wrap: wrap; margin-bottom: 2.2rem;
                        animation: fadeUp .5s ease both;
                    }
                    .head-ref-row {
                        display: flex; align-items: center; gap: .7rem;
                    }
                    .head-ref {
                        font-family: var(--serif);
                        font-size: clamp(2.2rem, 5vw, 3rem);
                        letter-spacing: .07em; line-height: 1;
                    }
                    .ref-copy {
                        background: none; border: none;
                        color: rgba(245,240,232,.28);
                        cursor: pointer; padding: .25rem; display: flex;
                        transition: color .2s, transform .2s;
                    }
                    .ref-copy:hover { color: var(--accent); transform: scale(1.12); }
                    .copied-tag {
                        font-size: .56rem; letter-spacing: .14em;
                        text-transform: uppercase; color: var(--accent); font-weight: 700;
                    }
                    .head-meta {
                        font-size: .68rem; letter-spacing: .11em; text-transform: uppercase;
                        color: rgba(245,240,232,.3); margin-top: .75rem;
                    }
                    .head-status {
                        font-size: .6rem; letter-spacing: .16em; text-transform: uppercase;
                        font-weight: 700; padding: .55rem 1.05rem; flex-shrink: 0;
                    }
                    .head-status.pending { background: rgba(245,240,232,.05); color: rgba(245,240,232,.48); border: 1px solid rgba(245,240,232,.13); }
                    .head-status.paid { background: rgba(232,255,0,.09); color: var(--accent); border: 1px solid rgba(232,255,0,.3); }
                    .head-status.confirmed { background: rgba(120,180,255,.08); color: #7ab4ff; border: 1px solid rgba(120,180,255,.28); }
                    .head-status.processing { background: rgba(190,140,255,.08); color: #be8cff; border: 1px solid rgba(190,140,255,.28); }
                    .head-status.shipped { background: rgba(255,170,60,.08); color: #ffaa3c; border: 1px solid rgba(255,170,60,.3); }
                    .head-status.delivered { background: rgba(74,222,128,.09); color: #4ade80; border: 1px solid rgba(74,222,128,.3); }
                    .head-status.cancelled { background: rgba(255,61,46,.09); color: var(--accent2); border: 1px solid rgba(255,61,46,.3); }

                    .detail-grid {
                        display: grid; grid-template-columns: minmax(0, 1fr) 336px;
                        gap: 1.4rem; align-items: start;
                    }

                    /* PANELS */
                    .panel {
                        background: linear-gradient(158deg, #1f1f1f 0%, #171717 100%);
                        border: 1px solid rgba(245,240,232,.07);
                        padding: 1.7rem; margin-bottom: 1.3rem;
                        animation: fadeUp .5s .05s ease both;
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

                    /* ITEMS */
                    .d-item {
                        display: flex; gap: 1rem; align-items: center;
                        padding: .9rem 0;
                        border-bottom: 1px solid rgba(245,240,232,.045);
                    }
                    .d-item:last-of-type { border-bottom: none; }
                    .d-item-img {
                        width: 56px; height: 56px; object-fit: cover; flex-shrink: 0;
                        border: 1px solid rgba(245,240,232,.07);
                    }
                    .d-item-info { flex: 1; min-width: 0; }
                    .d-item-name {
                        font-size: .87rem; font-weight: 500; color: rgba(245,240,232,.9);
                        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                    }
                    .d-item-qty {
                        font-size: .7rem; color: rgba(245,240,232,.34); margin-top: .25rem;
                    }
                    .d-item-price {
                        font-size: .87rem; font-weight: 600; color: var(--accent);
                        white-space: nowrap;
                    }

                    .sum-block {
                        margin-top: 1.35rem; padding-top: 1.2rem;
                        border-top: 1px solid rgba(245,240,232,.07);
                    }
                    .sum-row {
                        display: flex; justify-content: space-between;
                        font-size: .8rem; color: rgba(245,240,232,.42); padding: .42rem 0;
                    }
                    .sum-row .val { color: rgba(245,240,232,.76); font-weight: 500; }
                    .sum-total {
                        display: flex; justify-content: space-between; align-items: flex-end;
                        margin-top: .9rem; padding-top: 1rem;
                        border-top: 1px solid rgba(245,240,232,.08);
                    }
                    .sum-total-label {
                        font-size: .6rem; letter-spacing: .18em; text-transform: uppercase;
                        font-weight: 700; color: rgba(245,240,232,.42); padding-bottom: .22rem;
                    }
                    .sum-total-val {
                        font-family: var(--serif); font-size: 2rem;
                        color: var(--accent); letter-spacing: .03em; line-height: .9;
                    }

                    /* INFO */
                    .info-line {
                        display: flex; align-items: flex-start; gap: .7rem;
                        font-size: .81rem; color: rgba(245,240,232,.55);
                        padding: .5rem 0; line-height: 1.6;
                    }
                    .info-line svg { flex-shrink: 0; margin-top: .18rem; color: rgba(245,240,232,.24); }
                    .info-line a { color: rgba(245,240,232,.55); text-decoration: none; transition: color .2s; }
                    .info-line a:hover { color: var(--accent); }
                    .info-line strong { color: rgba(245,240,232,.88); font-weight: 500; }
                    .ref-mono {
                        font-size: .7rem; word-break: break-all;
                        color: rgba(245,240,232,.4);
                    }

                    .addr-block {
                        font-size: .81rem; color: rgba(245,240,232,.52); line-height: 1.85;
                    }
                    .addr-block .name { color: rgba(245,240,232,.88); font-weight: 500; }
                    .addr-note {
                        margin-top: .85rem; padding: .75rem .9rem;
                        background: rgba(232,255,0,.04);
                        border-left: 2px solid rgba(232,255,0,.4);
                        font-size: .75rem; color: rgba(245,240,232,.5);
                        font-style: italic; line-height: 1.6;
                    }

                    /* TIMELINE */
                    .timeline { position: relative; padding-left: 1.65rem; }
                    .timeline::before {
                        content: ''; position: absolute;
                        left: 5px; top: 6px; bottom: 6px; width: 1px;
                        background: rgba(245,240,232,.09);
                    }
                    .tl-entry { position: relative; padding-bottom: 1.35rem; }
                    .tl-entry:last-child { padding-bottom: 0; }
                    .tl-dot {
                        position: absolute; left: -1.65rem; top: 3px;
                        width: 11px; height: 11px; border-radius: 50%;
                        background: var(--mid);
                        border: 2px solid rgba(245,240,232,.18);
                    }
                    .tl-entry:first-child .tl-dot {
                        border-color: var(--accent);
                        background: var(--accent);
                        box-shadow: 0 0 12px rgba(232,255,0,.45);
                    }
                    .tl-status {
                        font-size: .7rem; font-weight: 700; letter-spacing: .14em;
                        text-transform: uppercase; color: rgba(245,240,232,.85);
                    }
                    .tl-time {
                        font-size: .65rem; color: rgba(245,240,232,.28); margin-top: .28rem;
                    }
                    .tl-note {
                        font-size: .74rem; color: rgba(245,240,232,.45);
                        margin-top: .35rem; line-height: 1.55;
                    }
                    .tl-by {
                        font-size: .62rem; color: rgba(245,240,232,.22);
                        margin-top: .28rem; font-style: italic;
                    }

                    /* ACTION PANEL */
                    .action-panel {
                        position: sticky; top: 2rem;
                        background: linear-gradient(158deg, #212121 0%, #181818 100%);
                        border: 1px solid rgba(232,255,0,.18);
                        padding: 1.7rem;
                        animation: fadeUp .5s .1s ease both;
                    }
                    .action-title {
                        font-family: var(--serif); font-size: 1.22rem;
                        letter-spacing: .08em; margin-bottom: 1.2rem;
                        padding-bottom: 1rem;
                        border-bottom: 1px solid rgba(245,240,232,.07);
                    }
                    .action-current {
                        font-size: .6rem; letter-spacing: .16em; text-transform: uppercase;
                        color: rgba(245,240,232,.3); font-weight: 700;
                    }
                    .action-current strong {
                        display: block; margin-top: .4rem;
                        font-family: var(--serif); font-size: 1.55rem;
                        letter-spacing: .07em; color: var(--white);
                        font-weight: 400;
                    }

                    .note-field {
                        width: 100%; margin: 1.25rem 0 1rem;
                        background: rgba(245,240,232,.04);
                        border: 1px solid rgba(245,240,232,.09);
                        color: var(--white); font-family: var(--body);
                        font-size: .8rem; padding: .75rem .85rem;
                        outline: none; min-height: 74px; resize: vertical;
                        transition: border-color .22s, background .22s;
                    }
                    .note-field:focus {
                        border-color: rgba(232,255,0,.45);
                        background: rgba(232,255,0,.03);
                    }
                    .note-field::placeholder { color: rgba(245,240,232,.2); }

                    .advance-btn {
                        width: 100%;
                        display: inline-flex; align-items: center; justify-content: center; gap: .6rem;
                        background: var(--accent); color: var(--black); border: none;
                        font-family: var(--body); font-size: .72rem; font-weight: 700;
                        letter-spacing: .16em; text-transform: uppercase;
                        padding: 1.05rem; cursor: pointer;
                        transition: transform .2s, box-shadow .25s;
                        box-shadow: 0 6px 24px rgba(232,255,0,.14);
                    }
                    .advance-btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 10px 34px rgba(232,255,0,.22);
                    }
                    .advance-btn:disabled { opacity: .5; transform: none; cursor: wait; }

                    .cancel-btn {
                        width: 100%; margin-top: .7rem;
                        display: inline-flex; align-items: center; justify-content: center; gap: .5rem;
                        background: transparent; border: 1px solid rgba(255,61,46,.2);
                        color: rgba(255,61,46,.72);
                        font-family: var(--body); font-size: .64rem; font-weight: 600;
                        letter-spacing: .14em; text-transform: uppercase;
                        padding: .88rem; cursor: pointer; transition: all .22s;
                    }
                    .cancel-btn:hover {
                        background: rgba(255,61,46,.07);
                        border-color: var(--accent2); color: var(--accent2);
                    }

                    .terminal-note {
                        font-size: .76rem; color: rgba(245,240,232,.35);
                        line-height: 1.65; text-align: center;
                        padding: 1.2rem 0;
                    }

                    .err-msg {
                        font-size: .72rem; color: var(--accent2);
                        margin-top: .75rem; line-height: 1.5;
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
                        width: 100%; max-width: 424px;
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
                        font-size: .83rem; font-weight: 300;
                        color: rgba(245,240,232,.5); line-height: 1.75;
                        margin-bottom: 1.7rem;
                    }
                    .modal-body strong {
                        color: var(--accent); font-family: var(--serif);
                        font-weight: 400; letter-spacing: .07em; font-size: 1rem;
                    }
                    .modal-note {
                        display: block; margin-top: .85rem;
                        font-size: .75rem; color: rgba(255,61,46,.8);
                        border-left: 2px solid rgba(255,61,46,.4);
                        padding-left: .85rem;
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
                        .detail-page { padding: 1.8rem 1.3rem 5rem; }
                        .detail-grid { grid-template-columns: minmax(0, 1fr); }
                        .action-panel { position: static; }
                    }
                    @media (max-width: 560px) {
                        .modal { padding: 1.7rem; }
                        .modal-actions { flex-direction: column-reverse; }
                        .detail-head { flex-direction: column; gap: 1rem; }
                    }
                `}</style>
            </Head>

            {showCancel && (
                <div
                    className="modal-overlay"
                    onClick={() => setShowCancel(false)}
                >
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-icon">
                            <AlertTriangle size={22} />
                        </div>
                        <h2 className="modal-title">CANCEL ORDER?</h2>
                        <p className="modal-body">
                            Order <strong>{order.reference}</strong> will be
                            marked cancelled and the customer notified.
                            {order.status !== 'pending' && (
                                <span className="modal-note">
                                    This order was already paid. You'll need to
                                    issue the refund through Paystack
                                    separately — cancelling here does not refund
                                    automatically.
                                </span>
                            )}
                        </p>
                        <div className="modal-actions">
                            <button
                                className="modal-confirm"
                                onClick={doCancel}
                            >
                                Yes, Cancel Order
                            </button>
                            <button
                                className="modal-dismiss"
                                onClick={() => setShowCancel(false)}
                            >
                                Keep It
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="detail-page">
                <div className="detail-shell">
                    <div className="detail-topbar">
                        <Link href="/admin/orders" className="back-link">
                            <ArrowLeft size={13} /> All Orders
                        </Link>
                        <NotificationBell />
                    </div>

                    <div className="detail-head">
                        <div>
                            <div className="head-ref-row">
                                <h1 className="head-ref">{order.reference}</h1>
                                {copied ? (
                                    <span className="copied-tag">Copied</span>
                                ) : (
                                    <button
                                        className="ref-copy"
                                        onClick={copyRef}
                                        aria-label="Copy reference"
                                    >
                                        <Copy size={15} />
                                    </button>
                                )}
                            </div>
                            <p className="head-meta">
                                Placed {fmtDateTime(order.created_at)}
                                {order.paid_at &&
                                    ` · Paid ${fmtDateTime(order.paid_at)}`}
                            </p>
                        </div>
                        <span className={`head-status ${order.status}`}>
                            {order.status}
                        </span>
                    </div>

                    <div className="detail-grid">
                        <div>
                            <div className="panel">
                                <div className="panel-head">
                                    <div className="panel-icon">
                                        <Package size={15} />
                                    </div>
                                    <p className="panel-title">ITEMS</p>
                                    <span className="panel-count">
                                        {order.items.length} item
                                        {order.items.length === 1 ? '' : 's'}
                                    </span>
                                </div>

                                {order.items.map((item) => (
                                    <div key={item.id} className="d-item">
                                        {item.product?.image && (
                                            <img
                                                src={`${appUrl}/storage/${item.product.image}`}
                                                alt={item.product.name}
                                                className="d-item-img"
                                            />
                                        )}
                                        <div className="d-item-info">
                                            <p className="d-item-name">
                                                {item.product?.name ??
                                                    'Product'}
                                            </p>
                                            <p className="d-item-qty">
                                                Qty {item.quantity} × ₦
                                                {Number(
                                                    item.price,
                                                ).toLocaleString()}
                                            </p>
                                        </div>
                                        <p className="d-item-price">
                                            ₦
                                            {(
                                                Number(item.price) *
                                                item.quantity
                                            ).toLocaleString()}
                                        </p>
                                    </div>
                                ))}

                                <div className="sum-block">
                                    <div className="sum-row">
                                        <span>Subtotal</span>
                                        <span className="val">
                                            ₦
                                            {Number(
                                                order.subtotal,
                                            ).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="sum-row">
                                        <span>Shipping</span>
                                        <span className="val">
                                            ₦
                                            {Number(
                                                order.shipping_fee,
                                            ).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="sum-total">
                                        <span className="sum-total-label">
                                            Total
                                        </span>
                                        <span className="sum-total-val">
                                            ₦
                                            {Number(
                                                order.total_amount,
                                            ).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="panel">
                                <div className="panel-head">
                                    <div className="panel-icon">
                                        <User size={15} />
                                    </div>
                                    <p className="panel-title">CUSTOMER</p>
                                </div>

                                <div className="info-line">
                                    <User size={13} />
                                    <span>
                                        <strong>
                                            {order.user?.name ?? '—'}
                                        </strong>
                                    </span>
                                </div>
                                {order.user?.email && (
                                    <div className="info-line">
                                        <Mail size={13} />
                                        <a href={`mailto:${order.user.email}`}>
                                            {order.user.email}
                                        </a>
                                    </div>
                                )}
                                {order.user?.phone && (
                                    <div className="info-line">
                                        <Phone size={13} />
                                        <a href={`tel:${order.user.phone}`}>
                                            {order.user.phone}
                                        </a>
                                    </div>
                                )}
                                {order.payment_reference && (
                                    <div className="info-line">
                                        <Receipt size={13} />
                                        <span className="ref-mono">
                                            {order.payment_reference}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="panel">
                                <div className="panel-head">
                                    <div className="panel-icon">
                                        <MapPin size={15} />
                                    </div>
                                    <p className="panel-title">
                                        DELIVERY ADDRESS
                                    </p>
                                </div>

                                <div className="addr-block">
                                    <p className="name">
                                        {order.ship_full_name}
                                    </p>
                                    <p>
                                        <a href={`tel:${order.ship_phone}`}>
                                            {order.ship_phone}
                                        </a>
                                    </p>
                                    <p>
                                        {order.ship_street}
                                        {order.ship_apartment &&
                                            `, ${order.ship_apartment}`}
                                    </p>
                                    <p>
                                        {order.ship_city}, {order.ship_state}
                                        {order.ship_postal_code &&
                                            ` ${order.ship_postal_code}`}
                                    </p>
                                    <p>{order.ship_country}</p>
                                </div>

                                {order.ship_instructions && (
                                    <p className="addr-note">
                                        "{order.ship_instructions}"
                                    </p>
                                )}
                            </div>

                            <div className="panel">
                                <div className="panel-head">
                                    <div className="panel-icon">
                                        <Clock size={15} />
                                    </div>
                                    <p className="panel-title">HISTORY</p>
                                </div>

                                <div className="timeline">
                                    {history.length === 0 ? (
                                        <p className="tl-note">
                                            No history recorded.
                                        </p>
                                    ) : (
                                        history.map((entry) => (
                                            <div
                                                key={entry.id}
                                                className="tl-entry"
                                            >
                                                <div className="tl-dot" />
                                                <p className="tl-status">
                                                    {entry.status}
                                                </p>
                                                <p className="tl-time">
                                                    {fmtDateTime(
                                                        entry.created_at,
                                                    )}
                                                </p>
                                                {entry.note && (
                                                    <p className="tl-note">
                                                        {entry.note}
                                                    </p>
                                                )}
                                                <p className="tl-by">
                                                    {entry.changed_by
                                                        ? `by ${entry.changed_by.name}`
                                                        : 'automatic'}
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="action-panel">
                            <p className="action-title">MANAGE</p>

                            <p className="action-current">
                                Current status
                                <strong>{order.status}</strong>
                            </p>

                            {nextStatus ? (
                                <>
                                    <textarea
                                        className="note-field"
                                        placeholder="Optional note — tracking number, courier, anything the customer should know."
                                        value={data.note}
                                        onChange={(e) =>
                                            setData('note', e.target.value)
                                        }
                                    />
                                    <button
                                        className="advance-btn"
                                        onClick={() => advance(nextStatus)}
                                        disabled={processing}
                                    >
                                        <ArrowRight size={15} />
                                        Mark as {nextStatus}
                                    </button>
                                </>
                            ) : order.status === 'pending' ? (
                                <p className="terminal-note">
                                    <Clock
                                        size={18}
                                        style={{
                                            display: 'block',
                                            margin: '0 auto .7rem',
                                            color: 'rgba(245,240,232,.3)',
                                        }}
                                    />
                                    Waiting for the customer to complete
                                    payment. Nothing to do yet.
                                </p>
                            ) : order.status === 'delivered' ? (
                                <p className="terminal-note">
                                    <CheckCircle2
                                        size={18}
                                        style={{
                                            display: 'block',
                                            margin: '0 auto .7rem',
                                            color: '#4ade80',
                                        }}
                                    />
                                    This order is complete.
                                </p>
                            ) : (
                                <p className="terminal-note">
                                    <XCircle
                                        size={18}
                                        style={{
                                            display: 'block',
                                            margin: '0 auto .7rem',
                                            color: 'var(--accent2)',
                                        }}
                                    />
                                    This order was cancelled.
                                </p>
                            )}

                            {canCancel && (
                                <button
                                    className="cancel-btn"
                                    onClick={() => setShowCancel(true)}
                                >
                                    <XCircle size={13} /> Cancel Order
                                </button>
                            )}

                            {errors.status && (
                                <p className="err-msg">{errors.status}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

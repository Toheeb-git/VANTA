import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import {
    MapPin,
    Plus,
    ShoppingBag,
    Truck,
    Lock,
    ArrowLeft,
    Check,
    AlertTriangle,
} from 'lucide-react';
import SiteNav from '@/components/SiteNav';

interface CartItem {
    id: number;
    quantity: number;
    product: {
        id: number;
        name: string;
        price: number | string;
        image: string;
        stock: number;
    };
}

interface Address {
    id: number;
    label: string | null;
    full_name: string;
    phone: string;
    country: string;
    state: string;
    city: string;
    street: string;
    apartment: string | null;
    postal_code: string | null;
    is_default: boolean;
}

export default function Checkout() {
    const {
        items,
        addresses,
        subtotal,
        shippingFee: initialShipping,
        selectedAddressId,
        appUrl,
        errors,
    } = usePage().props as unknown as {
        items: CartItem[];
        addresses: Address[];
        subtotal: number;
        shippingFee: number;
        selectedAddressId: number | null;
        appUrl: string;
        errors: Record<string, string>;
    };

    const [selected, setSelected] = useState<number | null>(selectedAddressId);
    const [shippingFee, setShippingFee] = useState<number>(initialShipping);
    const [feeLoading, setFeeLoading] = useState(false);

    const { post, processing } = useForm({});

    const csrf = () =>
        document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content') || '';

    useEffect(() => {
        if (!selected) return;

        let cancelled = false;
        setFeeLoading(true);

        fetch('/checkout/shipping-fee', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-CSRF-TOKEN': csrf(),
            },
            body: JSON.stringify({ address_id: selected }),
        })
            .then((res) => {
                if (res.status === 419) {
                    window.location.reload();
                    throw new Error('csrf');
                }
                return res.json();
            })
            .then((data) => {
                if (cancelled) return;
                setShippingFee(Number(data.shippingFee) || 0);
                setFeeLoading(false);
            })
            .catch(() => {
                if (!cancelled) setFeeLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [selected]);

    const handlePlaceOrder = () => {
        if (!selected) return;
        router.post('/checkout', { address_id: selected });
    };

    const total = Number(subtotal) + Number(shippingFee);

    return (
        <>
            <Head title="Checkout">
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin="anonymous"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap"
                    rel="stylesheet"
                />
                <style>{`
                    :root {
                        --black: #0a0a0a; --white: #f5f0e8; --accent: #e8ff00;
                        --accent2: #ff3d2e; --mid: #1c1c1c; --muted: #555;
                        --serif: 'Bebas Neue', sans-serif; --body: 'DM Sans', sans-serif;
                    }
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    body { background: var(--black); color: var(--white); font-family: var(--body); overflow-x: hidden; }

                    @keyframes fadeUp {
                        from { opacity: 0; transform: translateY(18px); }
                        to { opacity: 1; transform: translateY(0); }
                    }

                    .checkout-page {
                        min-height: 100vh;
                        padding: 7.5rem 2rem 6rem;
                    }
                    .checkout-shell {
                        max-width: 1100px; margin: 0 auto;
                    }

                    .checkout-head { margin-bottom: 2.5rem; }
                    .checkout-eyebrow {
                        font-size: .68rem; letter-spacing: .3em; text-transform: uppercase;
                        color: var(--accent); margin-bottom: .7rem; font-weight: 500;
                    }
                    .checkout-title {
                        font-family: var(--serif);
                        font-size: clamp(2.4rem, 5vw, 3.6rem);
                        letter-spacing: .03em; line-height: 1;
                    }
                    .checkout-title .accent { color: var(--accent); }

                    .checkout-grid {
                        display: grid;
                        grid-template-columns: minmax(0, 1fr) 360px;
                        gap: 2rem;
                        align-items: start;
                    }

                    .panel {
                        background: linear-gradient(160deg, #1f1f1f 0%, #171717 100%);
                        border: 1px solid rgba(245,240,232,.08);
                        padding: 1.8rem;
                        margin-bottom: 1.5rem;
                        animation: fadeUp .5s ease both;
                    }
                    .panel-head {
                        display: flex; align-items: center; gap: .7rem;
                        margin-bottom: 1.4rem; padding-bottom: 1rem;
                        border-bottom: 1px solid rgba(245,240,232,.07);
                    }
                    .panel-icon {
                        width: 34px; height: 34px; flex-shrink: 0;
                        border: 1px solid rgba(232,255,0,.25);
                        background: rgba(232,255,0,.05);
                        display: flex; align-items: center; justify-content: center;
                        color: var(--accent);
                    }
                    .panel-title {
                        font-family: var(--serif); font-size: 1.3rem; letter-spacing: .05em;
                    }

                    /* ADDRESS SELECTION */
                    .addr-option {
                        display: flex; gap: .9rem; align-items: flex-start;
                        border: 1px solid rgba(245,240,232,.08);
                        background: rgba(245,240,232,.02);
                        padding: 1.1rem;
                        margin-bottom: .8rem;
                        cursor: pointer;
                        transition: border-color .2s, background .2s;
                    }
                    .addr-option:hover { border-color: rgba(232,255,0,.25); }
                    .addr-option.selected {
                        border-color: var(--accent);
                        background: rgba(232,255,0,.04);
                    }
                    .addr-radio {
                        width: 17px; height: 17px; flex-shrink: 0; margin-top: .15rem;
                        accent-color: var(--accent); cursor: pointer;
                    }
                    .addr-content { min-width: 0; flex: 1; }
                    .addr-top {
                        display: flex; align-items: center; gap: .5rem;
                        flex-wrap: wrap; margin-bottom: .4rem;
                    }
                    .addr-label {
                        font-family: var(--serif); font-size: 1.05rem; letter-spacing: .05em;
                    }
                    .addr-default-tag {
                        font-size: .55rem; letter-spacing: .12em; text-transform: uppercase;
                        font-weight: 600; padding: .2rem .45rem;
                        background: rgba(232,255,0,.12); color: var(--accent);
                        border: 1px solid rgba(232,255,0,.3);
                    }
                    .addr-lines {
                        font-size: .78rem; color: rgba(245,240,232,.5); line-height: 1.6;
                    }
                    .addr-lines .name { color: rgba(245,240,232,.8); font-weight: 500; }

                    .add-addr-link {
                        display: inline-flex; align-items: center; gap: .5rem;
                        margin-top: .6rem;
                        border: 1px dashed rgba(232,255,0,.3);
                        color: var(--accent); text-decoration: none;
                        font-size: .68rem; font-weight: 600;
                        letter-spacing: .12em; text-transform: uppercase;
                        padding: .8rem 1.2rem;
                        transition: background .25s;
                    }
                    .add-addr-link:hover { background: rgba(232,255,0,.06); }

                    .no-addr {
                        text-align: center; padding: 2rem 1rem;
                        border: 1px dashed rgba(245,240,232,.12);
                        color: rgba(245,240,232,.4);
                        margin-bottom: 1rem;
                    }
                    .no-addr svg { margin: 0 auto .9rem; display: block; opacity: .5; }
                    .no-addr p { font-size: .82rem; }

                    /* ITEMS */
                    .co-item {
                        display: flex; gap: 1rem; align-items: center;
                        padding: .9rem 0;
                        border-bottom: 1px solid rgba(245,240,232,.05);
                    }
                    .co-item:last-child { border-bottom: none; }
                    .co-item-img {
                        width: 62px; height: 62px; object-fit: cover; flex-shrink: 0;
                        border: 1px solid rgba(245,240,232,.07);
                    }
                    .co-item-info { flex: 1; min-width: 0; }
                    .co-item-name {
                        font-size: .88rem; font-weight: 500;
                        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                    }
                    .co-item-qty {
                        font-size: .72rem; color: rgba(245,240,232,.4); margin-top: .25rem;
                    }
                    .co-item-price {
                        font-size: .88rem; font-weight: 600; color: var(--accent);
                        white-space: nowrap;
                    }

                    /* SUMMARY */
                    .summary {
                        position: sticky; top: 6.5rem;
                        background: linear-gradient(160deg, #1f1f1f 0%, #171717 100%);
                        border: 1px solid rgba(232,255,0,.15);
                        padding: 1.8rem;
                        animation: fadeUp .5s .1s ease both;
                    }
                    .summary-title {
                        font-family: var(--serif); font-size: 1.4rem; letter-spacing: .05em;
                        margin-bottom: 1.4rem; padding-bottom: 1rem;
                        border-bottom: 1px solid rgba(245,240,232,.07);
                    }
                    .sum-row {
                        display: flex; justify-content: space-between; align-items: center;
                        font-size: .84rem; color: rgba(245,240,232,.55);
                        padding: .5rem 0;
                    }
                    .sum-row .val { color: rgba(245,240,232,.85); font-weight: 500; }
                    .sum-row.muted .val { color: rgba(245,240,232,.4); font-style: italic; }
                    .sum-total {
                        display: flex; justify-content: space-between; align-items: center;
                        margin-top: 1rem; padding-top: 1.1rem;
                        border-top: 1px solid rgba(245,240,232,.08);
                    }
                    .sum-total-label {
                        font-size: .7rem; letter-spacing: .14em;
                        text-transform: uppercase; font-weight: 600;
                        color: rgba(245,240,232,.5);
                    }
                    .sum-total-val {
                        font-family: var(--serif); font-size: 2rem;
                        color: var(--accent); letter-spacing: .03em; line-height: 1;
                    }

                    .place-order-btn {
                        width: 100%; margin-top: 1.5rem;
                        display: inline-flex; align-items: center; justify-content: center; gap: .6rem;
                        background: var(--accent); color: var(--black); border: none;
                        font-family: var(--body); font-size: .76rem; font-weight: 600;
                        letter-spacing: .16em; text-transform: uppercase;
                        padding: 1.1rem; cursor: pointer;
                        position: relative; overflow: hidden;
                        transition: transform .2s;
                    }
                    .place-order-btn::after {
                        content: ''; position: absolute; inset: 0;
                        background: var(--accent2); transform: translateX(-101%);
                        transition: transform .3s cubic-bezier(.4,0,.2,1); z-index: 0;
                    }
                    .place-order-btn:hover:not(:disabled)::after { transform: translateX(0); }
                    .place-order-btn:hover:not(:disabled) { transform: translateY(-2px); }
                    .place-order-btn:disabled {
                        opacity: .4; cursor: not-allowed; transform: none;
                    }
                    .place-order-btn span, .place-order-btn svg { position: relative; z-index: 1; }

                    .secure-note {
                        display: flex; align-items: center; justify-content: center; gap: .4rem;
                        font-size: .66rem; color: rgba(245,240,232,.3);
                        margin-top: .9rem; letter-spacing: .04em;
                    }

                    .err-banner {
                        display: flex; align-items: flex-start; gap: .6rem;
                        background: rgba(255,61,46,.08);
                        border-left: 2px solid var(--accent2);
                        color: var(--accent2);
                        font-size: .8rem; line-height: 1.5;
                        padding: .9rem 1.1rem;
                        margin-bottom: 1.5rem;
                    }
                    .err-banner svg { flex-shrink: 0; margin-top: .1rem; }

                    .back-link {
                        display: inline-flex; align-items: center; gap: .5rem;
                        margin-top: 2rem;
                        font-size: .7rem; letter-spacing: .1em; text-transform: uppercase;
                        color: rgba(245,240,232,.35); text-decoration: none;
                        transition: color .2s;
                    }
                    .back-link:hover { color: var(--accent); }

                    @media (max-width: 900px) {
                        .checkout-page { padding: 6rem 1.3rem 6rem; }
                        .checkout-grid { grid-template-columns: minmax(0, 1fr); }
                        .summary { position: static; }
                    }
                `}</style>
            </Head>

            <SiteNav />

            <div className="checkout-page">
                <div className="checkout-shell">
                    <div className="checkout-head">
                        <p className="checkout-eyebrow">Almost there</p>
                        <h1 className="checkout-title">
                            CHECK<span className="accent">OUT</span>
                        </h1>
                    </div>

                    {errors?.cart && (
                        <div className="err-banner">
                            <AlertTriangle size={16} />
                            {errors.cart}
                        </div>
                    )}

                    <div className="checkout-grid">
                        <div>
                            {/* DELIVERY ADDRESS */}
                            <div className="panel">
                                <div className="panel-head">
                                    <div className="panel-icon">
                                        <MapPin size={16} />
                                    </div>
                                    <p className="panel-title">
                                        DELIVERY ADDRESS
                                    </p>
                                </div>

                                {addresses.length === 0 ? (
                                    <div className="no-addr">
                                        <MapPin size={32} />
                                        <p>
                                            You need a delivery address before
                                            you can place an order.
                                        </p>
                                    </div>
                                ) : (
                                    addresses.map((address) => (
                                        <label
                                            key={address.id}
                                            className={`addr-option ${selected === address.id ? 'selected' : ''}`}
                                        >
                                            <input
                                                type="radio"
                                                name="address"
                                                className="addr-radio"
                                                checked={selected === address.id}
                                                onChange={() =>
                                                    setSelected(address.id)
                                                }
                                            />
                                            <div className="addr-content">
                                                <div className="addr-top">
                                                    <span className="addr-label">
                                                        {address.label ||
                                                            'ADDRESS'}
                                                    </span>
                                                    {address.is_default && (
                                                        <span className="addr-default-tag">
                                                            Default
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="addr-lines">
                                                    <p className="name">
                                                        {address.full_name}
                                                    </p>
                                                    <p>{address.phone}</p>
                                                    <p>
                                                        {address.street}
                                                        {address.apartment &&
                                                            `, ${address.apartment}`}
                                                    </p>
                                                    <p>
                                                        {address.city},{' '}
                                                        {address.state}
                                                        {address.postal_code &&
                                                            ` ${address.postal_code}`}
                                                        , {address.country}
                                                    </p>
                                                </div>
                                            </div>
                                        </label>
                                    ))
                                )}

                                <Link
                                    href="/account/addresses"
                                    className="add-addr-link"
                                >
                                    <Plus size={14} />
                                    {addresses.length === 0
                                        ? 'Add an Address'
                                        : 'Manage Addresses'}
                                </Link>
                            </div>

                            {/* ORDER ITEMS */}
                            <div className="panel">
                                <div className="panel-head">
                                    <div className="panel-icon">
                                        <ShoppingBag size={16} />
                                    </div>
                                    <p className="panel-title">
                                        YOUR ITEMS ({items.length})
                                    </p>
                                </div>

                                {items.map((item) => (
                                    <div key={item.id} className="co-item">
                                        <img
                                            src={`${appUrl}/storage/${item.product.image}`}
                                            alt={item.product.name}
                                            className="co-item-img"
                                        />
                                        <div className="co-item-info">
                                            <p className="co-item-name">
                                                {item.product.name}
                                            </p>
                                            <p className="co-item-qty">
                                                Qty {item.quantity} × ₦
                                                {Number(
                                                    item.product.price,
                                                ).toLocaleString()}
                                            </p>
                                        </div>
                                        <p className="co-item-price">
                                            ₦
                                            {(
                                                Number(item.product.price) *
                                                item.quantity
                                            ).toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* SUMMARY */}
                        <div className="summary">
                            <p className="summary-title">ORDER SUMMARY</p>

                            <div className="sum-row">
                                <span>Subtotal</span>
                                <span className="val">
                                    ₦{Number(subtotal).toLocaleString()}
                                </span>
                            </div>

                            <div
                                className={`sum-row ${!selected ? 'muted' : ''}`}
                            >
                                <span>Shipping</span>
                                <span className="val">
                                    {!selected
                                        ? 'Select address'
                                        : feeLoading
                                          ? 'Calculating...'
                                          : `₦${Number(shippingFee).toLocaleString()}`}
                                </span>
                            </div>

                            <div className="sum-total">
                                <span className="sum-total-label">Total</span>
                                <span className="sum-total-val">
                                    ₦{total.toLocaleString()}
                                </span>
                            </div>

                            <button
                                className="place-order-btn"
                                onClick={handlePlaceOrder}
                                disabled={
                                    !selected || processing || items.length === 0
                                }
                            >
                                <Lock size={14} />
                                <span>
                                    {processing
                                        ? 'Placing Order...'
                                        : 'Place Order'}
                                </span>
                            </button>

                            <p className="secure-note">
                                <Truck size={11} />
                                Payment collected at the next step
                            </p>
                        </div>
                    </div>

                    <Link href="/product-page" className="back-link">
                        <ArrowLeft size={13} /> Continue Shopping
                    </Link>
                </div>
            </div>
        </>
    );
}

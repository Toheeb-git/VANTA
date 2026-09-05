import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import {
    ArrowLeft,
    MapPin,
    Plus,
    Pencil,
    Trash2,
    Star,
    X,
    AlertTriangle,
} from 'lucide-react';
import SiteNav from '@/components/SiteNav';
import CartWidget from '@/components/CartWidget';
import SearchSelect from '@/components/SearchSelect';
import AccountTabs from '@/components/AccountTabs';
import { useCountries, useStates } from '@/hooks/useLocations';

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
    delivery_instructions: string | null;
    is_default: boolean;
}

export default function Addresses() {
    const { addresses } = usePage().props as unknown as {
        addresses: Address[];
    };

    const cursorRef = useRef<HTMLDivElement>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Address | null>(null);

    const { data, setData, post, patch, processing, errors, reset } = useForm({
        label: '',
        full_name: '',
        phone: '',
        country: 'Nigeria',
        state: '',
        city: '',
        street: '',
        apartment: '',
        postal_code: '',
        delivery_instructions: '',
        is_default: false as boolean,
    });

    const {
        countries,
        loading: countriesLoading,
        failed: countriesFailed,
    } = useCountries();

    const {
        states,
        loading: statesLoading,
        failed: statesFailed,
    } = useStates(data.country);

    useEffect(() => {
        const cursor = cursorRef.current;
        if (!cursor) return;
        const onMove = (e: MouseEvent) => {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
        };
        document.addEventListener('mousemove', onMove);
        const interactables = document.querySelectorAll(
            'a, button, input, label, textarea',
        );
        interactables.forEach((el) => {
            el.addEventListener('mouseenter', () =>
                cursor.classList.add('cursor-expand'),
            );
            el.addEventListener('mouseleave', () =>
                cursor.classList.remove('cursor-expand'),
            );
        });
        return () => document.removeEventListener('mousemove', onMove);
    }, [showForm, addresses.length, deleteTarget]);

    const openNew = () => {
        reset();
        setData('country', 'Nigeria');
        setEditingId(null);
        setShowForm(true);
    };

    const openEdit = (address: Address) => {
        setData({
            label: address.label ?? '',
            full_name: address.full_name,
            phone: address.phone,
            country: address.country,
            state: address.state,
            city: address.city,
            street: address.street,
            apartment: address.apartment ?? '',
            postal_code: address.postal_code ?? '',
            delivery_instructions: address.delivery_instructions ?? '',
            is_default: address.is_default,
        });
        setEditingId(address.id);
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingId(null);
        reset();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            patch(`/account/addresses/${editingId}`, {
                onSuccess: () => closeForm(),
            });
        } else {
            post('/account/addresses', {
                onSuccess: () => closeForm(),
            });
        }
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;
        router.delete(`/account/addresses/${deleteTarget.id}`, {
            onSuccess: () => setDeleteTarget(null),
        });
    };

    const handleSetDefault = (id: number) => {
        router.patch(`/account/addresses/${id}/default`);
    };

    return (
        <>
            <Head title="Addresses">
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
                    @keyframes modalIn {
                        from { opacity: 0; transform: scale(.94) translateY(10px); }
                        to { opacity: 1; transform: scale(1) translateY(0); }
                    }
                    @keyframes overlayIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }

                    .addr-page {
                        min-height: 100vh; position: relative; overflow: hidden;
                        padding: 8rem 1.5rem 5rem;
                    }
                    .addr-page::before {
                        content: ''; position: absolute; inset: 0;
                        background:
                            radial-gradient(circle at 68% 10%, rgba(232,255,0,.06) 0%, transparent 56%),
                            radial-gradient(circle at 18% 88%, rgba(255,61,46,.05) 0%, transparent 52%);
                        z-index: 0; pointer-events: none;
                    }
                    .addr-page::after {
                        content: ''; position: absolute; inset: -200%;
                        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
                        opacity: .4; z-index: 0; pointer-events: none;
                        animation: grain 8s steps(10) infinite;
                    }

                    .addr-shell {
                        position: relative; z-index: 2;
                        width: 100%; max-width: 760px; margin: 0 auto;
                    }

                    .addr-head-block { margin-bottom: 1.8rem; animation: fadeUp .6s ease both; }
                    .addr-eyebrow {
                        font-size: .62rem; letter-spacing: .34em; text-transform: uppercase;
                        color: var(--accent); font-weight: 700; margin-bottom: .7rem;
                    }
                    .addr-title {
                        font-family: var(--serif);
                        font-size: clamp(2.3rem, 5.5vw, 3.4rem);
                        letter-spacing: .04em; line-height: .95;
                    }
                    .addr-title .accent { color: var(--accent); }
                    .addr-sub {
                        font-size: .86rem; font-weight: 300; line-height: 1.7;
                        color: rgba(245,240,232,.42); margin-top: .8rem; max-width: 440px;
                    }

                    .addr-count {
                        font-size: .8rem; color: rgba(245,240,232,.4);
                        padding-bottom: 1.2rem; margin-bottom: 1.5rem;
                        border-bottom: 1px solid rgba(245,240,232,.08);
                        animation: fadeUp .6s .08s ease both;
                    }
                    .addr-count strong { color: var(--white); font-weight: 600; }

                    /* ADDRESS CARDS */
                    .addr-card {
                        position: relative; overflow: hidden;
                        border: 1px solid rgba(245,240,232,.075);
                        background: linear-gradient(158deg, #1f1f1f 0%, #161616 100%);
                        padding: 1.5rem;
                        margin-bottom: 1rem;
                        animation: fadeUp .5s ease both;
                        transition: border-color .25s, transform .24s, box-shadow .28s;
                    }
                    .addr-card:hover {
                        border-color: rgba(232,255,0,.26);
                        transform: translateY(-3px);
                        box-shadow: 0 18px 46px rgba(0,0,0,.4);
                    }
                    .addr-card.default { border-color: rgba(232,255,0,.3); }
                    .addr-card.default::before {
                        content: ''; position: absolute;
                        left: 0; top: 0; bottom: 0; width: 2px;
                        background: var(--accent);
                    }

                    .addr-head {
                        display: flex; align-items: flex-start; justify-content: space-between;
                        gap: 1rem; margin-bottom: .9rem;
                    }
                    .addr-label-row { display: flex; align-items: center; gap: .6rem; flex-wrap: wrap; }
                    .addr-label {
                        font-family: var(--serif); font-size: 1.2rem;
                        letter-spacing: .06em; color: var(--white); line-height: 1;
                    }
                    .default-badge {
                        font-size: .55rem; letter-spacing: .13em; text-transform: uppercase;
                        font-weight: 700; padding: .26rem .58rem;
                        background: rgba(232,255,0,.12); color: var(--accent);
                        border: 1px solid rgba(232,255,0,.32);
                    }

                    .addr-actions { display: flex; gap: .4rem; flex-shrink: 0; }
                    .addr-btn {
                        width: 31px; height: 31px;
                        display: flex; align-items: center; justify-content: center;
                        border: 1px solid rgba(245,240,232,.1); background: transparent;
                        color: rgba(245,240,232,.48); cursor: none;
                        transition: all .22s;
                    }
                    .addr-btn:hover {
                        border-color: var(--accent); color: var(--accent);
                        transform: translateY(-1px);
                    }
                    .addr-btn.danger:hover { border-color: var(--accent2); color: var(--accent2); }

                    .addr-body {
                        font-size: .82rem; color: rgba(245,240,232,.52); line-height: 1.75;
                    }
                    .addr-name { color: rgba(245,240,232,.86); font-weight: 500; }
                    .addr-note {
                        font-size: .74rem; color: rgba(245,240,232,.36);
                        font-style: italic; margin-top: .6rem;
                        border-left: 2px solid rgba(232,255,0,.3);
                        padding-left: .8rem; line-height: 1.6;
                    }

                    .set-default-btn {
                        display: inline-flex; align-items: center; gap: .4rem;
                        margin-top: 1rem;
                        background: transparent; border: 1px solid rgba(245,240,232,.12);
                        color: rgba(245,240,232,.45);
                        font-family: var(--body); font-size: .6rem; font-weight: 700;
                        letter-spacing: .13em; text-transform: uppercase;
                        padding: .45rem .85rem; cursor: none;
                        transition: all .22s;
                    }
                    .set-default-btn:hover {
                        border-color: var(--accent); color: var(--accent);
                        background: rgba(232,255,0,.05);
                    }

                    /* ADD BUTTON */
                    .add-addr-btn {
                        width: 100%;
                        display: inline-flex; align-items: center; justify-content: center; gap: .5rem;
                        background: transparent; border: 1px dashed rgba(232,255,0,.3);
                        color: var(--accent);
                        font-family: var(--body); font-size: .7rem; font-weight: 700;
                        letter-spacing: .14em; text-transform: uppercase;
                        padding: 1.1rem; cursor: none;
                        transition: background .25s, border-color .25s, transform .22s;
                    }
                    .add-addr-btn:hover {
                        background: rgba(232,255,0,.06);
                        border-color: var(--accent);
                        transform: translateY(-2px);
                    }

                    /* FORM */
                    .addr-form {
                        border: 1px solid rgba(232,255,0,.24);
                        background: linear-gradient(158deg, rgba(232,255,0,.04), rgba(232,255,0,.012));
                        padding: 1.7rem;
                        margin-bottom: 1.2rem;
                        animation: fadeUp .3s ease;
                    }
                    .form-head {
                        display: flex; align-items: center; justify-content: space-between;
                        margin-bottom: 1.5rem; padding-bottom: 1.1rem;
                        border-bottom: 1px solid rgba(245,240,232,.08);
                    }
                    .form-title {
                        font-family: var(--serif); font-size: 1.3rem; letter-spacing: .07em;
                    }
                    .form-close {
                        background: none; border: none; color: rgba(245,240,232,.38);
                        cursor: none; padding: .2rem; display: flex;
                        transition: color .2s;
                    }
                    .form-close:hover { color: var(--accent2); }

                    .field-row { display: flex; gap: .9rem; }
                    .field-row .field-group { flex: 1 1 0; min-width: 0; }

                    .field-group { margin-bottom: 1rem; min-width: 0; }
                    .field-label {
                        display: block; font-size: .58rem; letter-spacing: .16em;
                        text-transform: uppercase; color: rgba(245,240,232,.42);
                        margin-bottom: .48rem; font-weight: 700;
                    }
                    .field-input, .field-textarea {
                        width: 100%; min-width: 0;
                        background: rgba(245,240,232,.05);
                        border: 1px solid rgba(245,240,232,.09); color: var(--white);
                        font-family: var(--body); font-size: .82rem;
                        padding: .72rem .85rem;
                        outline: none; transition: border-color .2s, background .2s;
                    }
                    .field-textarea { min-height: 72px; resize: vertical; }
                    .field-input:focus, .field-textarea:focus {
                        border-color: rgba(232,255,0,.5);
                        background: rgba(232,255,0,.035);
                    }
                    .field-input::placeholder, .field-textarea::placeholder {
                        color: rgba(245,240,232,.22);
                    }
                    .field-input:disabled { opacity: .4; cursor: not-allowed; }
                    .field-error { font-size: .68rem; color: var(--accent2); margin-top: .4rem; }
                    .field-hint {
                        font-size: .66rem; color: rgba(245,240,232,.28);
                        margin-top: .4rem; font-style: italic;
                    }

                    .default-check {
                        display: flex; align-items: center; gap: .6rem;
                        font-size: .78rem; color: rgba(245,240,232,.6);
                        margin-bottom: 1.3rem; cursor: none;
                    }
                    .default-check input {
                        width: 15px; height: 15px; accent-color: var(--accent);
                        cursor: none; flex-shrink: 0;
                    }

                    .form-actions { display: flex; gap: .7rem; }
                    .btn-save {
                        flex: 1; position: relative; overflow: hidden;
                        background: var(--accent); color: var(--black); border: none;
                        font-family: var(--body); font-size: .7rem; font-weight: 700;
                        letter-spacing: .15em; text-transform: uppercase;
                        padding: .95rem; cursor: none;
                        box-shadow: 0 4px 18px rgba(232,255,0,.13);
                        transition: transform .2s, box-shadow .26s;
                    }
                    .btn-save:hover:not(:disabled) {
                        transform: translateY(-2px);
                        box-shadow: 0 9px 28px rgba(232,255,0,.22);
                    }
                    .btn-save:disabled { opacity: .5; transform: none; }
                    .btn-cancel {
                        background: transparent; border: 1px solid rgba(245,240,232,.15);
                        color: rgba(245,240,232,.5);
                        font-family: var(--body); font-size: .7rem; font-weight: 700;
                        letter-spacing: .13em; text-transform: uppercase;
                        padding: .95rem 1.4rem; cursor: none;
                        transition: all .22s;
                    }
                    .btn-cancel:hover { border-color: var(--accent2); color: var(--accent2); }

                    /* EMPTY */
                    .addr-empty {
                        text-align: center; padding: 4.5rem 2rem;
                        border: 1px dashed rgba(245,240,232,.1);
                        color: rgba(245,240,232,.35);
                        margin-bottom: 1.2rem;
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
                        font-size: .85rem; line-height: 1.7;
                        max-width: 320px; margin: 0 auto;
                    }

                    .addr-foot {
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

                    /* MODAL */
                    .modal-overlay {
                        position: fixed; inset: 0; z-index: 1000;
                        background: rgba(0,0,0,.8);
                        backdrop-filter: blur(5px);
                        display: flex; align-items: center; justify-content: center;
                        padding: 1.5rem;
                        animation: overlayIn .2s ease;
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
                        letter-spacing: .05em; line-height: 1;
                        margin-bottom: .8rem;
                    }
                    .modal-body {
                        font-size: .84rem; font-weight: 300;
                        color: rgba(245,240,232,.5); line-height: 1.75;
                        margin-bottom: 1.8rem;
                    }
                    .modal-note {
                        display: block; margin-top: .85rem;
                        font-size: .76rem; color: rgba(232,255,0,.75);
                        border-left: 2px solid rgba(232,255,0,.4);
                        padding-left: .85rem;
                    }
                    .modal-actions { display: flex; gap: .7rem; }
                    .modal-confirm {
                        flex: 1;
                        background: var(--accent2); color: #fff; border: none;
                        font-family: var(--body); font-size: .68rem; font-weight: 700;
                        letter-spacing: .14em; text-transform: uppercase;
                        padding: .9rem; cursor: none;
                        transition: transform .2s;
                    }
                    .modal-confirm:hover { transform: translateY(-2px); }
                    .modal-dismiss {
                        background: transparent;
                        border: 1px solid rgba(245,240,232,.15);
                        color: rgba(245,240,232,.5);
                        font-family: var(--body); font-size: .68rem; font-weight: 600;
                        letter-spacing: .13em; text-transform: uppercase;
                        padding: .9rem 1.4rem; cursor: none;
                        transition: all .2s;
                    }
                    .modal-dismiss:hover { border-color: var(--white); color: var(--white); }

                    @media (max-width: 768px) {
                        .addr-page { padding: 6.5rem 1.2rem 6rem; }
                    }
                    @media (max-width: 560px) {
                        .addr-card { padding: 1.25rem; }
                        .addr-form { padding: 1.4rem; }
                        .field-row { flex-direction: column; gap: 0; }
                        .addr-head { flex-direction: column; gap: .8rem; }
                        .form-actions { flex-direction: column-reverse; }
                        .modal { padding: 1.7rem; }
                        .modal-actions { flex-direction: column-reverse; }
                    }
                `}</style>
            </Head>

            <SiteNav />
            <div className="custom-cursor" ref={cursorRef} />

            {deleteTarget && (
                <div
                    className="modal-overlay"
                    onClick={() => setDeleteTarget(null)}
                >
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-icon">
                            <AlertTriangle size={22} />
                        </div>
                        <h2 className="modal-title">DELETE ADDRESS?</h2>
                        <p className="modal-body">
                            {deleteTarget.label || 'This address'} —{' '}
                            {deleteTarget.street}, {deleteTarget.city} — will
                            be removed from your saved addresses.
                            {deleteTarget.is_default && (
                                <span className="modal-note">
                                    This is your default address. Another saved
                                    address will become the default
                                    automatically.
                                </span>
                            )}
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

            <div className="addr-page">
                <div className="addr-shell">
                    <div className="addr-head-block">
                        <p className="addr-eyebrow">Account</p>
                        <h1 className="addr-title">
                            DELIVERY <span className="accent">ADDRESSES</span>
                        </h1>
                        <p className="addr-sub">
                            Manage where your orders get delivered. Your default
                            address is used automatically at checkout.
                        </p>
                    </div>

                    <AccountTabs />

                    {showForm && (
                        <div className="addr-form">
                            <div className="form-head">
                                <p className="form-title">
                                    {editingId ? 'EDIT ADDRESS' : 'NEW ADDRESS'}
                                </p>
                                <button
                                    type="button"
                                    className="form-close"
                                    onClick={closeForm}
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="field-group">
                                    <label className="field-label">
                                        Label (optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={data.label}
                                        onChange={(e) =>
                                            setData('label', e.target.value)
                                        }
                                        className="field-input"
                                        placeholder="Home, Office, etc."
                                    />
                                    {errors.label && (
                                        <div className="field-error">
                                            {errors.label}
                                        </div>
                                    )}
                                </div>

                                <div className="field-row">
                                    <div className="field-group">
                                        <label className="field-label">
                                            Recipient Name
                                        </label>
                                        <input
                                            type="text"
                                            value={data.full_name}
                                            onChange={(e) =>
                                                setData(
                                                    'full_name',
                                                    e.target.value,
                                                )
                                            }
                                            className="field-input"
                                            placeholder="Full name"
                                        />
                                        {errors.full_name && (
                                            <div className="field-error">
                                                {errors.full_name}
                                            </div>
                                        )}
                                    </div>

                                    <div className="field-group">
                                        <label className="field-label">
                                            Phone
                                        </label>
                                        <input
                                            type="tel"
                                            value={data.phone}
                                            onChange={(e) =>
                                                setData('phone', e.target.value)
                                            }
                                            className="field-input"
                                            placeholder="+234 800 000 0000"
                                        />
                                        {errors.phone && (
                                            <div className="field-error">
                                                {errors.phone}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="field-group">
                                    <label className="field-label">
                                        Street Address
                                    </label>
                                    <input
                                        type="text"
                                        value={data.street}
                                        onChange={(e) =>
                                            setData('street', e.target.value)
                                        }
                                        className="field-input"
                                        placeholder="12 Example Road"
                                    />
                                    {errors.street && (
                                        <div className="field-error">
                                            {errors.street}
                                        </div>
                                    )}
                                </div>

                                <div className="field-group">
                                    <label className="field-label">
                                        Apartment / Suite (optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={data.apartment}
                                        onChange={(e) =>
                                            setData('apartment', e.target.value)
                                        }
                                        className="field-input"
                                        placeholder="Flat 4B"
                                    />
                                </div>

                                <div className="field-row">
                                    <div className="field-group">
                                        <label className="field-label">
                                            Country
                                        </label>
                                        {countriesFailed ? (
                                            <>
                                                <input
                                                    type="text"
                                                    value={data.country}
                                                    onChange={(e) =>
                                                        setData(
                                                            'country',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="field-input"
                                                    placeholder="Country"
                                                />
                                                <p className="field-hint">
                                                    Country list unavailable —
                                                    type it manually.
                                                </p>
                                            </>
                                        ) : (
                                            <SearchSelect
                                                value={data.country}
                                                onChange={(v) => {
                                                    setData('country', v);
                                                    setData('state', '');
                                                }}
                                                options={countries}
                                                loading={countriesLoading}
                                                placeholder="Select country"
                                            />
                                        )}
                                        {errors.country && (
                                            <div className="field-error">
                                                {errors.country}
                                            </div>
                                        )}
                                    </div>

                                    <div className="field-group">
                                        <label className="field-label">
                                            State / Region
                                        </label>
                                        {!data.country ? (
                                            <input
                                                type="text"
                                                className="field-input"
                                                placeholder="Select country first"
                                                disabled
                                            />
                                        ) : statesFailed ? (
                                            <input
                                                type="text"
                                                value={data.state}
                                                onChange={(e) =>
                                                    setData(
                                                        'state',
                                                        e.target.value,
                                                    )
                                                }
                                                className="field-input"
                                                placeholder="Enter state or region"
                                            />
                                        ) : (
                                            <SearchSelect
                                                value={data.state}
                                                onChange={(v) =>
                                                    setData('state', v)
                                                }
                                                options={states}
                                                loading={statesLoading}
                                                placeholder="Select state"
                                                allowFreeText
                                            />
                                        )}
                                        {errors.state && (
                                            <div className="field-error">
                                                {errors.state}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="field-row">
                                    <div className="field-group">
                                        <label className="field-label">
                                            City
                                        </label>
                                        <input
                                            type="text"
                                            value={data.city}
                                            onChange={(e) =>
                                                setData('city', e.target.value)
                                            }
                                            className="field-input"
                                            placeholder="Ikeja"
                                        />
                                        {errors.city && (
                                            <div className="field-error">
                                                {errors.city}
                                            </div>
                                        )}
                                    </div>

                                    <div className="field-group">
                                        <label className="field-label">
                                            Postal Code (optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={data.postal_code}
                                            onChange={(e) =>
                                                setData(
                                                    'postal_code',
                                                    e.target.value,
                                                )
                                            }
                                            className="field-input"
                                            placeholder="100001"
                                        />
                                    </div>
                                </div>

                                <div className="field-group">
                                    <label className="field-label">
                                        Delivery Instructions (optional)
                                    </label>
                                    <textarea
                                        value={data.delivery_instructions}
                                        onChange={(e) =>
                                            setData(
                                                'delivery_instructions',
                                                e.target.value,
                                            )
                                        }
                                        className="field-textarea"
                                        placeholder="Gate code, landmark, best time to deliver..."
                                    />
                                </div>

                                <label className="default-check">
                                    <input
                                        type="checkbox"
                                        checked={data.is_default}
                                        onChange={(e) =>
                                            setData(
                                                'is_default',
                                                e.target.checked,
                                            )
                                        }
                                    />
                                    Set as default delivery address
                                </label>

                                <div className="form-actions">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="btn-save"
                                    >
                                        {processing
                                            ? 'Saving...'
                                            : editingId
                                              ? 'Update Address'
                                              : 'Save Address'}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-cancel"
                                        onClick={closeForm}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {addresses.length === 0 && !showForm ? (
                        <div className="addr-empty">
                            <div className="empty-icon">
                                <MapPin size={28} />
                            </div>
                            <h2 className="empty-title">NO ADDRESSES YET</h2>
                            <p className="empty-desc">
                                Add one now, or you'll be asked for it at
                                checkout.
                            </p>
                        </div>
                    ) : (
                        addresses.length > 0 && (
                            <p className="addr-count">
                                <strong>{addresses.length}</strong> saved
                                address{addresses.length === 1 ? '' : 'es'}
                            </p>
                        )
                    )}

                    {addresses.map((address) => (
                        <div
                            key={address.id}
                            className={`addr-card ${address.is_default ? 'default' : ''}`}
                        >
                            <div className="addr-head">
                                <div className="addr-label-row">
                                    <span className="addr-label">
                                        {address.label || 'ADDRESS'}
                                    </span>
                                    {address.is_default && (
                                        <span className="default-badge">
                                            Default
                                        </span>
                                    )}
                                </div>
                                <div className="addr-actions">
                                    <button
                                        className="addr-btn"
                                        onClick={() => openEdit(address)}
                                        title="Edit"
                                    >
                                        <Pencil size={13} />
                                    </button>
                                    <button
                                        className="addr-btn danger"
                                        onClick={() => setDeleteTarget(address)}
                                        title="Delete"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>

                            <div className="addr-body">
                                <p className="addr-name">
                                    {address.full_name}
                                </p>
                                <p>{address.phone}</p>
                                <p>
                                    {address.street}
                                    {address.apartment &&
                                        `, ${address.apartment}`}
                                </p>
                                <p>
                                    {address.city}, {address.state}
                                    {address.postal_code &&
                                        ` ${address.postal_code}`}
                                </p>
                                <p>{address.country}</p>
                                {address.delivery_instructions && (
                                    <p className="addr-note">
                                        "{address.delivery_instructions}"
                                    </p>
                                )}
                            </div>

                            {!address.is_default && (
                                <button
                                    className="set-default-btn"
                                    onClick={() => handleSetDefault(address.id)}
                                >
                                    <Star size={11} /> Set as Default
                                </button>
                            )}
                        </div>
                    ))}

                    {!showForm && (
                        <button className="add-addr-btn" onClick={openNew}>
                            <Plus size={15} /> Add New Address
                        </button>
                    )}

                    <div className="addr-foot">
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

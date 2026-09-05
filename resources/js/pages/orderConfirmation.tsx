import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
    CheckCircle2,
    Package,
    MapPin,
    ArrowRight,
    Copy,
    XCircle,
    Pencil,
    X,
    Plus,
    AlertTriangle,
    CreditCard,
    Truck,
    Clock,
    ShieldCheck,
    PackageCheck,
} from 'lucide-react';
import SiteNav from '@/components/SiteNav';
import SearchSelect from '@/components/SearchSelect';
import { useCountries, useStates } from '@/hooks/useLocations';

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
    ship_full_name: string;
    ship_phone: string;
    ship_country: string;
    ship_state: string;
    ship_city: string;
    ship_street: string;
    ship_apartment: string | null;
    ship_postal_code: string | null;
    items: OrderItem[];
    status_history: HistoryEntry[];
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

interface DuplicateOrder {
    reference: string;
    created_at: string;
    total_amount: number | string;
}

export default function OrderConfirmation() {
    const { order, addresses, duplicateOrder, appUrl } =
        usePage().props as unknown as {
            order: Order;
            addresses: Address[];
            duplicateOrder: DuplicateOrder | null;
            appUrl: string;
        };

    const [copied, setCopied] = useState(false);
    const [changingAddress, setChangingAddress] = useState(false);
    const [showNewForm, setShowNewForm] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);
    const [showConfirmDeliveryModal, setShowConfirmDeliveryModal] =
        useState(false);
    const [paying, setPaying] = useState(false);

    const isPending = order.status === 'pending';
    const isCancelled = order.status === 'cancelled';
    const isPaid = order.status === 'paid';
    const isShipped = order.status === 'shipped';
    const isDelivered = order.status === 'delivered';

    const { data, setData, post, processing, errors, reset } = useForm({
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
        save_as_default: false,
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

    const copyRef = () => {
        navigator.clipboard.writeText(order.reference);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const confirmCancel = () => {
        router.post(`/order/${order.reference}/cancel`);
    };

    const confirmDelivery = () => {
        router.post(
            `/order/${order.reference}/confirm-delivery`,
            {},
            { onSuccess: () => setShowConfirmDeliveryModal(false) },
        );
    };

    const startPayment = () => {
        setPaying(true);

        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `/order/${order.reference}/pay`;

        const token = document.createElement('input');
        token.type = 'hidden';
        token.name = '_token';
        token.value =
            document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content') || '';

        form.appendChild(token);
        document.body.appendChild(form);
        form.submit();
    };

    const handlePayClick = () => {
        if (duplicateOrder) {
            setShowDuplicateModal(true);
            return;
        }
        startPayment();
    };

    const handleAddressChange = (addressId: number) => {
        router.patch(
            `/order/${order.reference}/address`,
            { address_id: addressId },
            {
                onSuccess: () => {
                    setChangingAddress(false);
                    setShowNewForm(false);
                },
            },
        );
    };

    const handleNewAddress = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/order/${order.reference}/address`, {
            onSuccess: () => {
                reset();
                setShowNewForm(false);
                setChangingAddress(false);
            },
        });
    };

    const timeAgo = (iso: string) => {
        const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
        const hrs = Math.round(mins / 60);
        if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
        const days = Math.round(hrs / 24);
        return `${days} day${days === 1 ? '' : 's'} ago`;
    };

    const formatDate = (iso: string) =>
        new Date(iso).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });

    const formatDateTime = (iso: string) =>
        new Date(iso).toLocaleString('en-GB', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });

    const steps = [
        { key: 'placed', label: 'Placed', icon: CheckCircle2 },
        { key: 'paid', label: 'Paid', icon: CreditCard },
        { key: 'shipped', label: 'Shipped', icon: Truck },
        { key: 'delivered', label: 'Delivered', icon: PackageCheck },
    ];

    const stepIndex: Record<string, number> = {
        pending: 0,
        paid: 1,
        confirmed: 1,
        processing: 1,
        shipped: 2,
        delivered: 3,
    };

    const currentStep = stepIndex[order.status] ?? 0;

    const history = order.status_history ?? [];

    return (
        <>
            <Head title={`Order ${order.reference}`}>
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
                    body { background: var(--black); color: var(--white); font-family: var(--body); overflow-x: hidden; }

                    @keyframes fadeUp {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes popIn {
                        0% { transform: scale(.6); opacity: 0; }
                        60% { transform: scale(1.08); }
                        100% { transform: scale(1); opacity: 1; }
                    }
                    @keyframes modalIn {
                        from { opacity: 0; transform: scale(.94) translateY(10px); }
                        to { opacity: 1; transform: scale(1) translateY(0); }
                    }
                    @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }
                    @keyframes ringGlow {
                        0%, 100% { box-shadow: 0 0 0 0 rgba(232,255,0,.18), 0 0 40px rgba(232,255,0,.06); }
                        50% { box-shadow: 0 0 0 10px rgba(232,255,0,0), 0 0 55px rgba(232,255,0,.12); }
                    }
                    @keyframes lineGrow {
                        from { transform: scaleX(0); }
                        to { transform: scaleX(1); }
                    }

                    .conf-page {
                        min-height: 100vh;
                        padding: 8rem 1.5rem 6rem;
                        display: flex; justify-content: center;
                        position: relative; overflow: hidden;
                    }
                    .conf-page::before {
                        content: ''; position: absolute; inset: 0;
                        background:
                            radial-gradient(circle at 50% 0%, rgba(232,255,0,.06) 0%, transparent 55%),
                            radial-gradient(circle at 15% 85%, rgba(255,61,46,.05) 0%, transparent 50%);
                        pointer-events: none; z-index: 0;
                    }
                    .conf-shell { width: 100%; max-width: 660px; position: relative; z-index: 1; }

                    .conf-hero {
                        text-align: center; margin-bottom: 2.8rem;
                        animation: fadeUp .6s ease both;
                    }
                    .conf-check {
                        width: 84px; height: 84px; margin: 0 auto 1.6rem;
                        border-radius: 50%;
                        background: radial-gradient(circle at 40% 35%, rgba(232,255,0,.14), rgba(232,255,0,.04));
                        border: 1px solid rgba(232,255,0,.35);
                        display: flex; align-items: center; justify-content: center;
                        color: var(--accent);
                        animation: popIn .5s cubic-bezier(.34,1.56,.64,1) both,
                                   ringGlow 3.5s ease-in-out 1s infinite;
                    }
                    .conf-check.cancelled {
                        background: radial-gradient(circle at 40% 35%, rgba(255,61,46,.14), rgba(255,61,46,.04));
                        border-color: rgba(255,61,46,.35);
                        color: var(--accent2);
                        animation: popIn .5s cubic-bezier(.34,1.56,.64,1) both;
                    }
                    .conf-check.delivered {
                        background: radial-gradient(circle at 40% 35%, rgba(74,222,128,.16), rgba(74,222,128,.04));
                        border-color: rgba(74,222,128,.4);
                        color: #4ade80;
                    }
                    .conf-title {
                        font-family: var(--serif);
                        font-size: clamp(2.6rem, 6vw, 3.8rem);
                        letter-spacing: .035em; line-height: .95;
                        margin-bottom: .8rem;
                    }
                    .conf-title .accent { color: var(--accent); }
                    .conf-title .danger { color: var(--accent2); }
                    .conf-title .success { color: #4ade80; }
                    .conf-sub {
                        font-size: .9rem; font-weight: 300;
                        color: rgba(245,240,232,.45); line-height: 1.75;
                        max-width: 400px; margin: 0 auto;
                    }

                    .ref-box {
                        display: inline-flex; align-items: center; gap: .9rem;
                        margin-top: 1.8rem;
                        background: rgba(232,255,0,.04);
                        border: 1px dashed rgba(232,255,0,.28);
                        padding: .85rem 1.4rem;
                        transition: border-color .25s, background .25s;
                    }
                    .ref-box:hover {
                        border-color: rgba(232,255,0,.5);
                        background: rgba(232,255,0,.07);
                    }
                    .ref-label {
                        font-size: .58rem; letter-spacing: .2em;
                        text-transform: uppercase; color: rgba(245,240,232,.35);
                    }
                    .ref-code {
                        font-family: var(--serif); font-size: 1.35rem;
                        letter-spacing: .12em; color: var(--accent);
                    }
                    .ref-copy {
                        background: none; border: none; color: rgba(245,240,232,.35);
                        cursor: pointer; padding: .2rem; display: flex;
                        transition: color .2s, transform .2s;
                    }
                    .ref-copy:hover { color: var(--accent); transform: scale(1.15); }
                    .copied-tag {
                        font-size: .56rem; letter-spacing: .14em;
                        text-transform: uppercase; color: var(--accent); font-weight: 600;
                    }

                    /* PROGRESS STEPPER */
                    .stepper {
                        display: flex; align-items: flex-start; justify-content: center;
                        gap: 0; margin-bottom: 2.5rem;
                        animation: fadeUp .6s .1s ease both;
                    }
                    .step {
                        display: flex; flex-direction: column; align-items: center;
                        gap: .55rem; flex: 0 0 auto; width: 78px;
                    }
                    .step-dot {
                        width: 38px; height: 38px; border-radius: 50%;
                        display: flex; align-items: center; justify-content: center;
                        border: 1px solid rgba(245,240,232,.12);
                        background: rgba(245,240,232,.03);
                        color: rgba(245,240,232,.25);
                        transition: all .35s;
                    }
                    .step.done .step-dot {
                        border-color: var(--accent);
                        background: rgba(232,255,0,.1);
                        color: var(--accent);
                    }
                    .step.current .step-dot {
                        border-color: var(--accent);
                        background: var(--accent);
                        color: var(--black);
                        box-shadow: 0 0 22px rgba(232,255,0,.3);
                    }
                    .step.final-done .step-dot {
                        border-color: #4ade80;
                        background: #4ade80;
                        color: var(--black);
                        box-shadow: 0 0 22px rgba(74,222,128,.35);
                    }
                    .step-label {
                        font-size: .58rem; letter-spacing: .14em;
                        text-transform: uppercase; font-weight: 600;
                        color: rgba(245,240,232,.28);
                        transition: color .3s;
                    }
                    .step.done .step-label, .step.current .step-label { color: var(--accent); }
                    .step.final-done .step-label { color: #4ade80; }

                    .step-line {
                        flex: 1 1 auto; height: 1px; min-width: 14px;
                        background: rgba(245,240,232,.1);
                        margin-top: 19px;
                        position: relative; overflow: hidden;
                    }
                    .step-line.filled::after {
                        content: ''; position: absolute; inset: 0;
                        background: var(--accent);
                        transform-origin: left;
                        animation: lineGrow .6s .3s cubic-bezier(.4,0,.2,1) both;
                    }
                    .step-line.filled-final::after { background: #4ade80; }

                    /* PANELS */
                    .panel {
                        background: linear-gradient(158deg, #1f1f1f 0%, #161616 100%);
                        border: 1px solid rgba(245,240,232,.08);
                        padding: 1.8rem;
                        margin-bottom: 1.3rem;
                        animation: fadeUp .6s .15s ease both;
                    }
                    .panel-head {
                        display: flex; align-items: center; gap: .75rem;
                        margin-bottom: 1.4rem; padding-bottom: 1.1rem;
                        border-bottom: 1px solid rgba(245,240,232,.07);
                    }
                    .panel-icon {
                        width: 34px; height: 34px; flex-shrink: 0;
                        border: 1px solid rgba(232,255,0,.22);
                        background: rgba(232,255,0,.05);
                        display: flex; align-items: center; justify-content: center;
                        color: var(--accent);
                    }
                    .panel-title {
                        font-family: var(--serif); font-size: 1.25rem;
                        letter-spacing: .07em;
                    }

                    .panel-action {
                        margin-left: auto;
                        display: inline-flex; align-items: center; gap: .35rem;
                        background: transparent; border: 1px solid rgba(245,240,232,.12);
                        color: rgba(245,240,232,.5);
                        font-family: var(--body); font-size: .58rem; font-weight: 600;
                        letter-spacing: .12em; text-transform: uppercase;
                        padding: .38rem .75rem; cursor: pointer;
                        transition: all .2s;
                    }
                    .panel-action:hover { border-color: var(--accent); color: var(--accent); }

                    .status-pill {
                        margin-left: auto;
                        font-size: .56rem; letter-spacing: .14em; text-transform: uppercase;
                        font-weight: 700; padding: .32rem .75rem;
                        background: rgba(245,240,232,.06); color: rgba(245,240,232,.5);
                        border: 1px solid rgba(245,240,232,.15);
                    }
                    .status-pill.paid, .status-pill.confirmed, .status-pill.processing {
                        background: rgba(232,255,0,.1); color: var(--accent);
                        border-color: rgba(232,255,0,.32);
                    }
                    .status-pill.shipped {
                        background: rgba(255,170,60,.1); color: #ffaa3c;
                        border-color: rgba(255,170,60,.32);
                    }
                    .status-pill.delivered {
                        background: rgba(74,222,128,.1); color: #4ade80;
                        border-color: rgba(74,222,128,.32);
                    }
                    .status-pill.cancelled {
                        background: rgba(255,61,46,.1); color: var(--accent2);
                        border-color: rgba(255,61,46,.3);
                    }

                    /* ITEMS */
                    .oc-item {
                        display: flex; gap: 1rem; align-items: center;
                        padding: .9rem 0;
                        border-bottom: 1px solid rgba(245,240,232,.05);
                    }
                    .oc-item:last-of-type { border-bottom: none; }
                    .oc-item-img {
                        width: 58px; height: 58px; object-fit: cover; flex-shrink: 0;
                        border: 1px solid rgba(245,240,232,.07);
                    }
                    .oc-item-info { flex: 1; min-width: 0; }
                    .oc-item-name {
                        font-size: .87rem; font-weight: 500;
                        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                    }
                    .oc-item-qty {
                        font-size: .71rem; color: rgba(245,240,232,.38); margin-top: .25rem;
                        letter-spacing: .02em;
                    }
                    .oc-item-price {
                        font-size: .87rem; font-weight: 600; color: var(--accent);
                        white-space: nowrap;
                    }

                    /* SUMMARY */
                    .sum-block {
                        margin-top: 1.4rem; padding-top: 1.3rem;
                        border-top: 1px solid rgba(245,240,232,.07);
                    }
                    .sum-row {
                        display: flex; justify-content: space-between;
                        font-size: .81rem; color: rgba(245,240,232,.45);
                        padding: .45rem 0;
                    }
                    .sum-row .val { color: rgba(245,240,232,.78); font-weight: 500; }
                    .sum-total {
                        display: flex; justify-content: space-between; align-items: flex-end;
                        margin-top: 1rem; padding-top: 1.1rem;
                        border-top: 1px solid rgba(245,240,232,.08);
                    }
                    .sum-total-label {
                        font-size: .64rem; letter-spacing: .16em;
                        text-transform: uppercase; font-weight: 700;
                        color: rgba(245,240,232,.45);
                        padding-bottom: .25rem;
                    }
                    .sum-total-val {
                        font-family: var(--serif); font-size: 2.1rem;
                        color: var(--accent); letter-spacing: .03em; line-height: .9;
                    }

                    /* TIMELINE */
                    .timeline { position: relative; padding-left: 1.6rem; }
                    .timeline::before {
                        content: ''; position: absolute;
                        left: 5px; top: 6px; bottom: 6px; width: 1px;
                        background: rgba(245,240,232,.1);
                    }
                    .tl-entry { position: relative; padding-bottom: 1.3rem; }
                    .tl-entry:last-child { padding-bottom: 0; }
                    .tl-dot {
                        position: absolute; left: -1.6rem; top: 3px;
                        width: 11px; height: 11px; border-radius: 50%;
                        background: var(--mid);
                        border: 2px solid rgba(245,240,232,.2);
                    }
                    .tl-entry:first-child .tl-dot {
                        border-color: var(--accent);
                        background: var(--accent);
                        box-shadow: 0 0 12px rgba(232,255,0,.4);
                    }
                    .tl-entry.delivered-dot:first-child .tl-dot {
                        border-color: #4ade80;
                        background: #4ade80;
                        box-shadow: 0 0 12px rgba(74,222,128,.45);
                    }
                    .tl-status {
                        font-size: .72rem; font-weight: 700; letter-spacing: .12em;
                        text-transform: uppercase; color: rgba(245,240,232,.85);
                    }
                    .tl-time {
                        font-size: .66rem; color: rgba(245,240,232,.3); margin-top: .25rem;
                    }
                    .tl-note {
                        font-size: .74rem; color: rgba(245,240,232,.45);
                        margin-top: .35rem; line-height: 1.5;
                    }

                    /* ADDRESS */
                    .addr-lines {
                        font-size: .81rem; color: rgba(245,240,232,.52); line-height: 1.85;
                    }
                    .addr-lines .name { color: rgba(245,240,232,.85); font-weight: 500; }

                    .addr-switch {
                        display: block; width: 100%; text-align: left;
                        background: rgba(245,240,232,.02);
                        border: 1px solid rgba(245,240,232,.08);
                        padding: .95rem 1.05rem; margin-bottom: .6rem;
                        cursor: pointer; font-family: var(--body);
                        transition: border-color .2s, background .2s, transform .2s;
                    }
                    .addr-switch:hover {
                        border-color: var(--accent);
                        background: rgba(232,255,0,.04);
                        transform: translateX(3px);
                    }
                    .addr-switch-label {
                        display: flex; align-items: center; gap: .5rem;
                        font-family: var(--serif); font-size: 1.02rem;
                        letter-spacing: .06em; color: var(--white);
                        margin-bottom: .32rem;
                    }
                    .mini-tag {
                        font-family: var(--body);
                        font-size: .48rem; letter-spacing: .14em; text-transform: uppercase;
                        font-weight: 700; padding: .18rem .42rem;
                        background: rgba(232,255,0,.12); color: var(--accent);
                        border: 1px solid rgba(232,255,0,.3);
                    }
                    .addr-switch-lines {
                        display: block;
                        font-size: .73rem; color: rgba(245,240,232,.42); line-height: 1.5;
                    }

                    .shipping-notice {
                        display: flex; align-items: flex-start; gap: .6rem;
                        background: rgba(232,255,0,.04);
                        border-left: 2px solid rgba(232,255,0,.45);
                        font-size: .73rem; color: rgba(245,240,232,.5);
                        line-height: 1.65;
                        padding: .75rem .95rem;
                        margin-bottom: 1.1rem;
                    }
                    .shipping-notice svg { flex-shrink: 0; margin-top: .12rem; color: var(--accent); }

                    .new-addr-toggle {
                        width: 100%;
                        display: inline-flex; align-items: center; justify-content: center; gap: .5rem;
                        border: 1px dashed rgba(232,255,0,.28);
                        background: transparent; color: var(--accent);
                        font-family: var(--body); font-size: .64rem; font-weight: 700;
                        letter-spacing: .14em; text-transform: uppercase;
                        padding: .9rem; cursor: pointer;
                        transition: background .25s, border-color .25s;
                    }
                    .new-addr-toggle:hover {
                        background: rgba(232,255,0,.06);
                        border-color: var(--accent);
                    }

                    /* INLINE FORM */
                    .inline-form {
                        border: 1px solid rgba(232,255,0,.18);
                        background: rgba(232,255,0,.02);
                        padding: 1.4rem;
                        margin-top: .8rem;
                        animation: fadeUp .3s ease;
                    }
                    .inline-form-head {
                        display: flex; align-items: center; justify-content: space-between;
                        margin-bottom: 1.2rem; padding-bottom: .85rem;
                        border-bottom: 1px solid rgba(245,240,232,.07);
                    }
                    .inline-form-title {
                        font-family: var(--serif); font-size: 1.12rem; letter-spacing: .06em;
                    }
                    .inline-form-close {
                        background: none; border: none; color: rgba(245,240,232,.35);
                        cursor: pointer; padding: .2rem; display: flex;
                        transition: color .2s;
                    }
                    .inline-form-close:hover { color: var(--accent2); }

                    .f-row { display: flex; gap: .8rem; }
                    .f-row .f-group { flex: 1 1 0; min-width: 0; }
                    .f-group { margin-bottom: .9rem; min-width: 0; }
                    .f-label {
                        display: block; font-size: .56rem; letter-spacing: .16em;
                        text-transform: uppercase; color: rgba(245,240,232,.42);
                        margin-bottom: .42rem; font-weight: 600;
                    }
                    .f-input, .f-textarea {
                        width: 100%; min-width: 0;
                        background: rgba(245,240,232,.05);
                        border: 1px solid rgba(245,240,232,.09); color: var(--white);
                        font-family: var(--body); font-size: .8rem;
                        padding: .68rem .82rem;
                        outline: none; transition: border-color .2s, background .2s;
                    }
                    .f-textarea { min-height: 60px; resize: vertical; }
                    .f-input:focus, .f-textarea:focus {
                        border-color: rgba(232,255,0,.5);
                        background: rgba(232,255,0,.035);
                    }
                    .f-input::placeholder, .f-textarea::placeholder { color: rgba(245,240,232,.2); }
                    .f-input:disabled { opacity: .4; }
                    .f-err { font-size: .65rem; color: var(--accent2); margin-top: .35rem; }

                    .f-check {
                        display: flex; align-items: center; gap: .55rem;
                        font-size: .74rem; color: rgba(245,240,232,.55);
                        margin-bottom: 1.1rem; cursor: pointer;
                    }
                    .f-check input {
                        width: 14px; height: 14px; accent-color: var(--accent);
                        cursor: pointer; flex-shrink: 0;
                    }

                    .f-save {
                        width: 100%;
                        background: var(--accent); color: var(--black); border: none;
                        font-family: var(--body); font-size: .68rem; font-weight: 700;
                        letter-spacing: .16em; text-transform: uppercase;
                        padding: .88rem; cursor: pointer;
                        transition: transform .2s;
                    }
                    .f-save:hover { transform: translateY(-2px); }
                    .f-save:disabled { opacity: .5; transform: none; }

                    /* PAY BUTTON */
                    .pay-now-btn {
                        width: 100%; margin-top: 1.8rem;
                        display: inline-flex; align-items: center; justify-content: center; gap: .65rem;
                        background: var(--accent); color: var(--black); border: none;
                        font-family: var(--body); font-size: .82rem; font-weight: 700;
                        letter-spacing: .17em; text-transform: uppercase;
                        padding: 1.25rem; cursor: pointer;
                        position: relative; overflow: hidden;
                        transition: transform .2s, box-shadow .3s;
                        box-shadow: 0 8px 30px rgba(232,255,0,.12);
                        animation: fadeUp .6s .25s ease both;
                    }
                    .pay-now-btn::after {
                        content: ''; position: absolute; inset: 0;
                        background: var(--accent2); transform: translateX(-101%);
                        transition: transform .35s cubic-bezier(.4,0,.2,1); z-index: 0;
                    }
                    .pay-now-btn:hover:not(:disabled)::after { transform: translateX(0); }
                    .pay-now-btn:hover:not(:disabled) {
                        transform: translateY(-2px);
                        box-shadow: 0 12px 40px rgba(232,255,0,.2);
                    }
                    .pay-now-btn:disabled { opacity: .55; cursor: wait; transform: none; }
                    .pay-now-btn span, .pay-now-btn svg { position: relative; z-index: 1; }

                    /* CONFIRM DELIVERY */
                    .confirm-delivery-btn {
                        width: 100%; margin-top: 1.8rem;
                        display: inline-flex; align-items: center; justify-content: center; gap: .65rem;
                        background: #4ade80; color: #0a0a0a; border: none;
                        font-family: var(--body); font-size: .82rem; font-weight: 700;
                        letter-spacing: .17em; text-transform: uppercase;
                        padding: 1.25rem; cursor: pointer;
                        transition: transform .2s, box-shadow .3s;
                        box-shadow: 0 8px 30px rgba(74,222,128,.14);
                        animation: fadeUp .6s .25s ease both;
                    }
                    .confirm-delivery-btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 12px 40px rgba(74,222,128,.22);
                    }

                    .pay-secure {
                        display: flex; align-items: center; justify-content: center; gap: .45rem;
                        font-size: .64rem; color: rgba(245,240,232,.28);
                        margin-top: .9rem; letter-spacing: .06em;
                        text-align: center;
                    }

                    /* ACTIONS */
                    .conf-actions {
                        display: flex; gap: .8rem; margin-top: 1.6rem;
                        animation: fadeUp .6s .3s ease both;
                    }
                    .btn-primary-full {
                        flex: 1;
                        display: inline-flex; align-items: center; justify-content: center; gap: .5rem;
                        background: transparent; border: 1px solid var(--accent);
                        color: var(--accent); text-decoration: none;
                        font-family: var(--body); font-size: .7rem; font-weight: 700;
                        letter-spacing: .15em; text-transform: uppercase;
                        padding: 1rem; transition: all .25s;
                    }
                    .btn-primary-full:hover { background: var(--accent); color: var(--black); }
                    .btn-ghost-full {
                        display: inline-flex; align-items: center; justify-content: center; gap: .5rem;
                        border: 1px solid rgba(245,240,232,.15);
                        color: rgba(245,240,232,.5); text-decoration: none;
                        font-family: var(--body); font-size: .7rem; font-weight: 600;
                        letter-spacing: .13em; text-transform: uppercase;
                        padding: 1rem 1.5rem; transition: all .25s;
                    }
                    .btn-ghost-full:hover { border-color: var(--white); color: var(--white); }

                    .cancel-order-btn {
                        width: 100%; margin-top: .8rem;
                        display: inline-flex; align-items: center; justify-content: center; gap: .5rem;
                        background: transparent; border: 1px solid rgba(255,61,46,.22);
                        color: rgba(255,61,46,.75);
                        font-family: var(--body); font-size: .66rem; font-weight: 600;
                        letter-spacing: .14em; text-transform: uppercase;
                        padding: .9rem; cursor: pointer;
                        transition: all .25s;
                    }
                    .cancel-order-btn:hover {
                        background: rgba(255,61,46,.07);
                        border-color: var(--accent2);
                        color: var(--accent2);
                    }

                    /* MODALS */
                    .modal-overlay {
                        position: fixed; inset: 0; z-index: 600;
                        background: rgba(0,0,0,.78);
                        backdrop-filter: blur(5px);
                        display: flex; align-items: center; justify-content: center;
                        padding: 1.5rem;
                        animation: overlayIn .2s ease;
                    }
                    .modal {
                        width: 100%; max-width: 430px;
                        background: linear-gradient(158deg, #202020 0%, #151515 100%);
                        border: 1px solid rgba(255,61,46,.25);
                        box-shadow: 0 30px 90px rgba(0,0,0,.75);
                        padding: 2.1rem;
                        animation: modalIn .22s cubic-bezier(.34,1.4,.64,1);
                    }
                    .modal.warn { border-color: rgba(232,255,0,.28); }
                    .modal.success { border-color: rgba(74,222,128,.3); }
                    .modal-icon {
                        width: 54px; height: 54px; margin-bottom: 1.4rem;
                        border-radius: 50%;
                        background: rgba(255,61,46,.08);
                        border: 1px solid rgba(255,61,46,.3);
                        display: flex; align-items: center; justify-content: center;
                        color: var(--accent2);
                    }
                    .modal-icon.warn {
                        background: rgba(232,255,0,.08);
                        border-color: rgba(232,255,0,.35);
                        color: var(--accent);
                    }
                    .modal-icon.success {
                        background: rgba(74,222,128,.08);
                        border-color: rgba(74,222,128,.35);
                        color: #4ade80;
                    }
                    .modal-title {
                        font-family: var(--serif); font-size: 1.8rem;
                        letter-spacing: .05em; line-height: 1;
                        margin-bottom: .85rem;
                    }
                    .modal-body {
                        font-size: .84rem; font-weight: 300;
                        color: rgba(245,240,232,.5); line-height: 1.75;
                        margin-bottom: 1.9rem;
                    }
                    .modal-body strong {
                        color: var(--accent); font-weight: 400;
                        font-family: var(--serif); letter-spacing: .07em;
                        font-size: 1.05rem;
                    }
                    .modal-note {
                        display: block; margin-top: .85rem;
                        font-size: .76rem; color: rgba(232,255,0,.75);
                        border-left: 2px solid rgba(232,255,0,.4);
                        padding-left: .85rem;
                    }
                    .modal-note.success-note {
                        color: rgba(74,222,128,.85);
                        border-left-color: rgba(74,222,128,.4);
                    }
                    .modal-actions { display: flex; gap: .7rem; }
                    .modal-confirm {
                        flex: 1;
                        background: var(--accent2); color: var(--white); border: none;
                        font-family: var(--body); font-size: .68rem; font-weight: 700;
                        letter-spacing: .15em; text-transform: uppercase;
                        padding: .95rem; cursor: pointer;
                        transition: transform .2s;
                    }
                    .modal-confirm.warn { background: var(--accent); color: var(--black); }
                    .modal-confirm.success { background: #4ade80; color: var(--black); }
                    .modal-confirm:hover { transform: translateY(-2px); }
                    .modal-dismiss {
                        display: inline-flex; align-items: center; justify-content: center;
                        background: transparent;
                        border: 1px solid rgba(245,240,232,.15);
                        color: rgba(245,240,232,.5); text-decoration: none;
                        font-family: var(--body); font-size: .68rem; font-weight: 600;
                        letter-spacing: .13em; text-transform: uppercase;
                        padding: .95rem 1.4rem; cursor: pointer;
                        transition: all .2s; white-space: nowrap;
                    }
                    .modal-dismiss:hover { border-color: var(--white); color: var(--white); }

                    .order-date {
                        text-align: center; font-size: .66rem;
                        letter-spacing: .14em; text-transform: uppercase;
                        color: rgba(245,240,232,.22); margin-top: 2rem;
                    }

                    @media (max-width: 600px) {
                        .conf-page { padding: 6.5rem 1.2rem 6rem; }
                        .conf-actions { flex-direction: column; }
                        .f-row { flex-direction: column; gap: 0; }
                        .modal { padding: 1.7rem; }
                        .modal-actions { flex-direction: column-reverse; }
                        .step { width: 64px; }
                        .step-label { font-size: .5rem; letter-spacing: .08em; }
                    }
                `}</style>
            </Head>

            <SiteNav />

            {showCancelModal && (
                <div
                    className="modal-overlay"
                    onClick={() => setShowCancelModal(false)}
                >
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-icon">
                            <AlertTriangle size={22} />
                        </div>
                        <h2 className="modal-title">CANCEL ORDER?</h2>
                        <p className="modal-body">
                            Order <strong>{order.reference}</strong> will be
                            cancelled. Your items go back to your cart, so you
                            can place the order again whenever you're ready.
                        </p>
                        <div className="modal-actions">
                            <button
                                className="modal-confirm"
                                onClick={confirmCancel}
                            >
                                Yes, Cancel Order
                            </button>
                            <button
                                className="modal-dismiss"
                                onClick={() => setShowCancelModal(false)}
                            >
                                Keep It
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showDuplicateModal && duplicateOrder && (
                <div
                    className="modal-overlay"
                    onClick={() => setShowDuplicateModal(false)}
                >
                    <div
                        className="modal warn"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-icon warn">
                            <AlertTriangle size={22} />
                        </div>
                        <h2 className="modal-title">POSSIBLE DUPLICATE</h2>
                        <p className="modal-body">
                            You have another unpaid order for the same amount —{' '}
                            <strong>{duplicateOrder.reference}</strong>, placed{' '}
                            {timeAgo(duplicateOrder.created_at)}.
                            <span className="modal-note">
                                If this was a mistake, view the other order
                                instead of paying twice.
                            </span>
                        </p>
                        <div className="modal-actions">
                            <button
                                className="modal-confirm warn"
                                onClick={() => {
                                    setShowDuplicateModal(false);
                                    startPayment();
                                }}
                            >
                                Pay Anyway
                            </button>
                            <Link
                                href={`/order/${duplicateOrder.reference}`}
                                className="modal-dismiss"
                                onClick={() => setShowDuplicateModal(false)}
                            >
                                View Other Order
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {showConfirmDeliveryModal && (
                <div
                    className="modal-overlay"
                    onClick={() => setShowConfirmDeliveryModal(false)}
                >
                    <div
                        className="modal success"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-icon success">
                            <PackageCheck size={22} />
                        </div>
                        <h2 className="modal-title">CONFIRM DELIVERY</h2>
                        <p className="modal-body">
                            Confirming marks <strong>{order.reference}</strong>{' '}
                            as delivered and closes it.
                            <span className="modal-note success-note">
                                Only do this if you actually have the package.
                                If something's wrong, contact support before
                                confirming.
                            </span>
                        </p>
                        <div className="modal-actions">
                            <button
                                className="modal-confirm success"
                                onClick={confirmDelivery}
                            >
                                Yes, I Received It
                            </button>
                            <button
                                className="modal-dismiss"
                                onClick={() =>
                                    setShowConfirmDeliveryModal(false)
                                }
                            >
                                Not Yet
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="conf-page">
                <div className="conf-shell">
                    <div className="conf-hero">
                        <div
                            className={`conf-check ${isCancelled ? 'cancelled' : ''} ${isDelivered ? 'delivered' : ''}`}
                        >
                            {isCancelled ? (
                                <XCircle size={38} />
                            ) : isDelivered ? (
                                <PackageCheck size={38} />
                            ) : isPaid || isShipped ? (
                                <ShieldCheck size={38} />
                            ) : (
                                <CheckCircle2 size={38} />
                            )}
                        </div>

                        <h1 className="conf-title">
                            {isCancelled ? (
                                <>
                                    ORDER{' '}
                                    <span className="danger">CANCELLED</span>
                                </>
                            ) : isDelivered ? (
                                <>
                                    ORDER{' '}
                                    <span className="success">DELIVERED</span>
                                </>
                            ) : isShipped ? (
                                <>
                                    ON THE <span className="accent">WAY</span>
                                </>
                            ) : isPaid ? (
                                <>
                                    PAYMENT{' '}
                                    <span className="accent">CONFIRMED</span>
                                </>
                            ) : (
                                <>
                                    ORDER <span className="accent">PLACED</span>
                                </>
                            )}
                        </h1>

                        <p className="conf-sub">
                            {isCancelled
                                ? 'This order was cancelled. Your items were returned to your cart.'
                                : isDelivered
                                  ? 'Thanks for shopping with us. This order is complete.'
                                  : isShipped
                                    ? "Your order has shipped. Confirm once it's in your hands."
                                    : isPaid
                                      ? "Payment received — we're preparing your order for delivery."
                                      : 'Your order is reserved. Complete payment to confirm it.'}
                        </p>

                        <div className="ref-box">
                            <span className="ref-label">Ref</span>
                            <span className="ref-code">{order.reference}</span>
                            {copied ? (
                                <span className="copied-tag">Copied</span>
                            ) : (
                                <button
                                    className="ref-copy"
                                    onClick={copyRef}
                                    aria-label="Copy reference"
                                >
                                    <Copy size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    {!isCancelled && (
                        <div className="stepper">
                            {steps.map((step, i) => {
                                const Icon = step.icon;
                                const done = i < currentStep;
                                const current = i === currentStep;
                                const finalDone =
                                    isDelivered && i <= currentStep;
                                return (
                                    <div
                                        key={step.key}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                        }}
                                    >
                                        <div
                                            className={`step ${done ? 'done' : ''} ${current && !isDelivered ? 'current' : ''} ${finalDone ? 'final-done' : ''}`}
                                        >
                                            <div className="step-dot">
                                                {done || finalDone ? (
                                                    <CheckCircle2 size={17} />
                                                ) : (
                                                    <Icon size={17} />
                                                )}
                                            </div>
                                            <span className="step-label">
                                                {step.label}
                                            </span>
                                        </div>
                                        {i < steps.length - 1 && (
                                            <div
                                                className={`step-line ${i < currentStep ? 'filled' : ''} ${isDelivered && i < currentStep ? 'filled-final' : ''}`}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="panel">
                        <div className="panel-head">
                            <div className="panel-icon">
                                <Package size={15} />
                            </div>
                            <p className="panel-title">ITEMS</p>
                            <span className={`status-pill ${order.status}`}>
                                {order.status}
                            </span>
                        </div>

                        {order.items.map((item) => (
                            <div key={item.id} className="oc-item">
                                {item.product?.image && (
                                    <img
                                        src={`${appUrl}/storage/${item.product.image}`}
                                        alt={item.product.name}
                                        className="oc-item-img"
                                    />
                                )}
                                <div className="oc-item-info">
                                    <p className="oc-item-name">
                                        {item.product?.name ?? 'Product'}
                                    </p>
                                    <p className="oc-item-qty">
                                        Qty {item.quantity} × ₦
                                        {Number(item.price).toLocaleString()}
                                    </p>
                                </div>
                                <p className="oc-item-price">
                                    ₦
                                    {(
                                        Number(item.price) * item.quantity
                                    ).toLocaleString()}
                                </p>
                            </div>
                        ))}

                        <div className="sum-block">
                            <div className="sum-row">
                                <span>Subtotal</span>
                                <span className="val">
                                    ₦{Number(order.subtotal).toLocaleString()}
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
                                    {isPending ? 'Total Due' : 'Paid'}
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

                    {!isPending && history.length > 0 && (
                        <div className="panel">
                            <div className="panel-head">
                                <div className="panel-icon">
                                    <Clock size={15} />
                                </div>
                                <p className="panel-title">TRACKING</p>
                            </div>

                            <div className="timeline">
                                {history.map((entry, i) => (
                                    <div
                                        key={entry.id}
                                        className={`tl-entry ${i === 0 && isDelivered ? 'delivered-dot' : ''}`}
                                    >
                                        <div className="tl-dot" />
                                        <p className="tl-status">
                                            {entry.status}
                                        </p>
                                        <p className="tl-time">
                                            {formatDateTime(entry.created_at)}
                                        </p>
                                        {entry.note && (
                                            <p className="tl-note">
                                                {entry.note}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="panel">
                        <div className="panel-head">
                            <div className="panel-icon">
                                <MapPin size={15} />
                            </div>
                            <p className="panel-title">DELIVERING TO</p>
                            {isPending && !changingAddress && (
                                <button
                                    className="panel-action"
                                    onClick={() => setChangingAddress(true)}
                                >
                                    <Pencil size={11} /> Change
                                </button>
                            )}
                            {changingAddress && (
                                <button
                                    className="panel-action"
                                    onClick={() => {
                                        setChangingAddress(false);
                                        setShowNewForm(false);
                                    }}
                                >
                                    <X size={12} /> Close
                                </button>
                            )}
                        </div>

                        {changingAddress ? (
                            <>
                                <div className="shipping-notice">
                                    <AlertTriangle size={13} />
                                    Shipping is recalculated for the new
                                    location — your order total will update
                                    automatically.
                                </div>

                                {addresses.map((a) => (
                                    <button
                                        key={a.id}
                                        className="addr-switch"
                                        onClick={() =>
                                            handleAddressChange(a.id)
                                        }
                                    >
                                        <span className="addr-switch-label">
                                            {a.label || 'Address'}
                                            {a.is_default && (
                                                <span className="mini-tag">
                                                    Default
                                                </span>
                                            )}
                                        </span>
                                        <span className="addr-switch-lines">
                                            {a.full_name} · {a.street},{' '}
                                            {a.city}, {a.state}, {a.country}
                                        </span>
                                    </button>
                                ))}

                                {!showNewForm ? (
                                    <button
                                        className="new-addr-toggle"
                                        onClick={() => setShowNewForm(true)}
                                    >
                                        <Plus size={14} /> Add New Address
                                    </button>
                                ) : (
                                    <div className="inline-form">
                                        <div className="inline-form-head">
                                            <p className="inline-form-title">
                                                NEW ADDRESS
                                            </p>
                                            <button
                                                type="button"
                                                className="inline-form-close"
                                                onClick={() =>
                                                    setShowNewForm(false)
                                                }
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>

                                        <form onSubmit={handleNewAddress}>
                                            <div className="f-group">
                                                <label className="f-label">
                                                    Label (optional)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.label}
                                                    onChange={(e) =>
                                                        setData(
                                                            'label',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="f-input"
                                                    placeholder="Home, Office..."
                                                />
                                            </div>

                                            <div className="f-row">
                                                <div className="f-group">
                                                    <label className="f-label">
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
                                                        className="f-input"
                                                        placeholder="Full name"
                                                    />
                                                    {errors.full_name && (
                                                        <div className="f-err">
                                                            {errors.full_name}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="f-group">
                                                    <label className="f-label">
                                                        Phone
                                                    </label>
                                                    <input
                                                        type="tel"
                                                        value={data.phone}
                                                        onChange={(e) =>
                                                            setData(
                                                                'phone',
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="f-input"
                                                        placeholder="+234 800 000 0000"
                                                    />
                                                    {errors.phone && (
                                                        <div className="f-err">
                                                            {errors.phone}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="f-group">
                                                <label className="f-label">
                                                    Street Address
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.street}
                                                    onChange={(e) =>
                                                        setData(
                                                            'street',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="f-input"
                                                    placeholder="12 Example Road"
                                                />
                                                {errors.street && (
                                                    <div className="f-err">
                                                        {errors.street}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="f-group">
                                                <label className="f-label">
                                                    Apartment (optional)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.apartment}
                                                    onChange={(e) =>
                                                        setData(
                                                            'apartment',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="f-input"
                                                    placeholder="Flat 4B"
                                                />
                                            </div>

                                            <div className="f-row">
                                                <div className="f-group">
                                                    <label className="f-label">
                                                        Country
                                                    </label>
                                                    {countriesFailed ? (
                                                        <input
                                                            type="text"
                                                            value={data.country}
                                                            onChange={(e) =>
                                                                setData(
                                                                    'country',
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            className="f-input"
                                                            placeholder="Country"
                                                        />
                                                    ) : (
                                                        <SearchSelect
                                                            value={data.country}
                                                            onChange={(v) => {
                                                                setData(
                                                                    'country',
                                                                    v,
                                                                );
                                                                setData(
                                                                    'state',
                                                                    '',
                                                                );
                                                            }}
                                                            options={countries}
                                                            loading={
                                                                countriesLoading
                                                            }
                                                            placeholder="Select country"
                                                        />
                                                    )}
                                                    {errors.country && (
                                                        <div className="f-err">
                                                            {errors.country}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="f-group">
                                                    <label className="f-label">
                                                        State / Region
                                                    </label>
                                                    {!data.country ? (
                                                        <input
                                                            type="text"
                                                            className="f-input"
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
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            className="f-input"
                                                            placeholder="Enter state"
                                                        />
                                                    ) : (
                                                        <SearchSelect
                                                            value={data.state}
                                                            onChange={(v) =>
                                                                setData(
                                                                    'state',
                                                                    v,
                                                                )
                                                            }
                                                            options={states}
                                                            loading={
                                                                statesLoading
                                                            }
                                                            placeholder="Select state"
                                                            allowFreeText
                                                        />
                                                    )}
                                                    {errors.state && (
                                                        <div className="f-err">
                                                            {errors.state}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="f-row">
                                                <div className="f-group">
                                                    <label className="f-label">
                                                        City
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={data.city}
                                                        onChange={(e) =>
                                                            setData(
                                                                'city',
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="f-input"
                                                        placeholder="Ikeja"
                                                    />
                                                    {errors.city && (
                                                        <div className="f-err">
                                                            {errors.city}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="f-group">
                                                    <label className="f-label">
                                                        Postal Code
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
                                                        className="f-input"
                                                        placeholder="Optional"
                                                    />
                                                </div>
                                            </div>

                                            <div className="f-group">
                                                <label className="f-label">
                                                    Delivery Instructions
                                                </label>
                                                <textarea
                                                    value={
                                                        data.delivery_instructions
                                                    }
                                                    onChange={(e) =>
                                                        setData(
                                                            'delivery_instructions',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="f-textarea"
                                                    placeholder="Gate code, landmark, best time to deliver..."
                                                />
                                            </div>

                                            <label className="f-check">
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        data.save_as_default
                                                    }
                                                    onChange={(e) =>
                                                        setData(
                                                            'save_as_default',
                                                            e.target.checked,
                                                        )
                                                    }
                                                />
                                                Make this my default address
                                            </label>

                                            <button
                                                type="submit"
                                                disabled={processing}
                                                className="f-save"
                                            >
                                                {processing
                                                    ? 'Saving...'
                                                    : 'Use This Address'}
                                            </button>
                                        </form>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="addr-lines">
                                <p className="name">{order.ship_full_name}</p>
                                <p>{order.ship_phone}</p>
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
                        )}
                    </div>

                    {isPending && (
                        <>
                            <button
                                className="pay-now-btn"
                                onClick={handlePayClick}
                                disabled={paying}
                            >
                                <CreditCard size={17} />
                                <span>
                                    {paying
                                        ? 'Redirecting to Paystack...'
                                        : `Pay ₦${Number(order.total_amount).toLocaleString()}`}
                                </span>
                            </button>
                            <p className="pay-secure">
                                <ShieldCheck size={12} />
                                Secured by Paystack
                            </p>
                        </>
                    )}

                    {isShipped && (
                        <>
                            <button
                                className="confirm-delivery-btn"
                                onClick={() =>
                                    setShowConfirmDeliveryModal(true)
                                }
                            >
                                <PackageCheck size={17} />
                                <span>I've Received This Order</span>
                            </button>
                            <p className="pay-secure">
                                Only confirm once the package is actually in
                                your hands
                            </p>
                        </>
                    )}

                    <div className="conf-actions">
                        <Link
                            href="/account/orders"
                            className="btn-primary-full"
                        >
                            View My Orders
                            <ArrowRight size={14} />
                        </Link>
                        <Link href="/product-page" className="btn-ghost-full">
                            Continue Shopping
                        </Link>
                    </div>

                    {isPending && (
                        <button
                            className="cancel-order-btn"
                            onClick={() => setShowCancelModal(true)}
                        >
                            <XCircle size={13} /> Cancel Order
                        </button>
                    )}

                    <p className="order-date">
                        <Clock
                            size={11}
                            style={{
                                display: 'inline',
                                verticalAlign: '-1px',
                                marginRight: '.35rem',
                            }}
                        />
                        Placed {formatDate(order.created_at)}
                        {order.paid_at && ` · Paid ${formatDate(order.paid_at)}`}
                    </p>
                </div>
            </div>
        </>
    );
}

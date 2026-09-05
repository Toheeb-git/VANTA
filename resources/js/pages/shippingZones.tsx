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
    Pencil,
    Trash2,
    X,
    Plus,
    Globe,
    MapPin,
    Menu,
    AlertTriangle,
} from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';

interface Zone {
    id: number;
    name: string;
    country: string | null;
    states: string[] | null;
    fee: string | number;
    is_fallback: boolean;
    is_active: boolean;
    priority: number;
}

export default function ShippingZones() {
    const { zones } = usePage().props as unknown as { zones: Zone[] };

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [stateInput, setStateInput] = useState('');
    const [navOpen, setNavOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Zone | null>(null);

    const { data, setData, post, patch, processing, errors, reset } = useForm({
        name: '',
        country: '',
        states: [] as string[],
        fee: '',
        is_fallback: false,
        is_active: true,
        priority: 0,
    });

    const openNew = () => {
        reset();
        setStateInput('');
        setEditingId(null);
        setShowForm(true);
    };

    const openEdit = (zone: Zone) => {
        setData({
            name: zone.name,
            country: zone.country ?? '',
            states: zone.states ?? [],
            fee: String(zone.fee),
            is_fallback: zone.is_fallback,
            is_active: zone.is_active,
            priority: zone.priority,
        });
        setStateInput('');
        setEditingId(zone.id);
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingId(null);
        setStateInput('');
        reset();
    };

    const addState = () => {
        const trimmed = stateInput.trim();
        if (!trimmed) return;
        if (data.states.some((s) => s.toLowerCase() === trimmed.toLowerCase()))
            return;
        setData('states', [...data.states, trimmed]);
        setStateInput('');
    };

    const removeState = (state: string) => {
        setData(
            'states',
            data.states.filter((s) => s !== state),
        );
    };

    const handleStateKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addState();
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            patch(`/shipping-zones/${editingId}`, {
                onSuccess: () => closeForm(),
            });
        } else {
            post('/shipping-zones', { onSuccess: () => closeForm() });
        }
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;
        router.delete(`/shipping-zones/${deleteTarget.id}`, {
            onSuccess: () => setDeleteTarget(null),
        });
    };

    const handleLogout = () => router.post('/logout');

    const hasFallback = zones.some((z) => z.is_fallback && z.is_active);

    return (
        <>
            <Head title="Shipping — Admin">
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
                        display: flex; align-items: center; gap: 1rem; flex-shrink: 0;
                    }

                    .dash-add-btn {
                        position: relative; overflow: hidden;
                        display: inline-flex; align-items: center; gap: .5rem;
                        background: var(--accent); color: var(--black);
                        border: none;
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

                    .warn-banner {
                        display: flex; align-items: flex-start; gap: .7rem;
                        background: rgba(255,61,46,.07);
                        border-left: 2px solid var(--accent2);
                        color: rgba(255,61,46,.9);
                        font-size: .8rem; line-height: 1.6;
                        padding: .95rem 1.15rem;
                        margin-bottom: 1.6rem;
                    }
                    .warn-banner svg { flex-shrink: 0; margin-top: .1rem; }

                    /* ZONE GRID */
                    .zone-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(288px, 1fr));
                        gap: 1.1rem;
                    }

                    .zone-card {
                        position: relative; overflow: hidden;
                        background: linear-gradient(158deg, #1f1f1f 0%, #171717 100%);
                        border: 1px solid rgba(245,240,232,.07);
                        padding: 1.5rem;
                        animation: fadeUp .45s ease both;
                        transition: border-color .26s, transform .26s, box-shadow .28s;
                    }
                    .zone-card:hover {
                        border-color: rgba(232,255,0,.26);
                        transform: translateY(-3px);
                        box-shadow: 0 14px 42px rgba(0,0,0,.4);
                    }
                    .zone-card::after {
                        content: ''; position: absolute;
                        top: 0; right: 0; width: 100px; height: 100px;
                        background: radial-gradient(circle at 72% 28%, rgba(232,255,0,.06), transparent 70%);
                        pointer-events: none;
                    }
                    .zone-card.fallback { border-color: rgba(232,255,0,.3); }
                    .zone-card.inactive { opacity: .45; }

                    .zone-head {
                        display: flex; align-items: flex-start; justify-content: space-between;
                        gap: .8rem; margin-bottom: 1.1rem;
                    }
                    .zone-name {
                        font-family: var(--serif); font-size: 1.32rem;
                        letter-spacing: .05em; line-height: 1.1;
                    }
                    .zone-badges { display: flex; gap: .35rem; flex-wrap: wrap; margin-top: .55rem; }
                    .zone-badge {
                        font-size: .52rem; letter-spacing: .14em; text-transform: uppercase;
                        font-weight: 700; padding: .24rem .5rem;
                    }
                    .zone-badge.fallback {
                        background: rgba(232,255,0,.11); color: var(--accent);
                        border: 1px solid rgba(232,255,0,.3);
                    }
                    .zone-badge.inactive {
                        background: rgba(245,240,232,.05); color: rgba(245,240,232,.38);
                        border: 1px solid rgba(245,240,232,.11);
                    }
                    .zone-badge.priority {
                        background: rgba(245,240,232,.04); color: rgba(245,240,232,.42);
                        border: 1px solid rgba(245,240,232,.09);
                    }

                    .zone-actions { display: flex; gap: .4rem; flex-shrink: 0; }
                    .zone-btn {
                        width: 31px; height: 31px;
                        display: flex; align-items: center; justify-content: center;
                        border: 1px solid rgba(245,240,232,.09); background: transparent;
                        color: rgba(245,240,232,.48); cursor: pointer;
                        transition: all .2s;
                    }
                    .zone-btn:hover {
                        border-color: var(--accent); color: var(--accent);
                        transform: translateY(-1px);
                    }
                    .zone-btn.danger:hover { border-color: var(--accent2); color: var(--accent2); }

                    .zone-fee {
                        font-family: var(--serif); font-size: 2.1rem;
                        color: var(--accent); letter-spacing: .03em;
                        line-height: 1; margin-bottom: 1.1rem;
                    }

                    .zone-scope {
                        display: flex; align-items: flex-start; gap: .55rem;
                        font-size: .76rem; color: rgba(245,240,232,.48);
                        line-height: 1.6;
                    }
                    .zone-scope svg { flex-shrink: 0; margin-top: .18rem; opacity: .55; }

                    .state-chips { display: flex; flex-wrap: wrap; gap: .3rem; margin-top: .55rem; }
                    .state-chip {
                        font-size: .64rem; padding: .22rem .52rem;
                        background: rgba(245,240,232,.04);
                        border: 1px solid rgba(245,240,232,.08);
                        color: rgba(245,240,232,.52);
                    }
                    .all-states-note {
                        margin-top: .35rem; font-size: .7rem;
                        color: rgba(245,240,232,.32);
                    }

                    /* FORM */
                    .zone-form {
                        background: linear-gradient(158deg, #1f1f1f 0%, #171717 100%);
                        border: 1px solid rgba(232,255,0,.2);
                        padding: 1.8rem;
                        margin-bottom: 1.8rem;
                        max-width: 620px;
                        animation: fadeUp .3s ease;
                    }
                    .form-head {
                        display: flex; align-items: center; justify-content: space-between;
                        margin-bottom: 1.5rem; padding-bottom: 1rem;
                        border-bottom: 1px solid rgba(245,240,232,.07);
                    }
                    .form-title {
                        font-family: var(--serif); font-size: 1.38rem; letter-spacing: .06em;
                    }
                    .form-close {
                        background: none; border: none; color: rgba(245,240,232,.35);
                        cursor: pointer; padding: .2rem; display: flex;
                        transition: color .2s;
                    }
                    .form-close:hover { color: var(--accent2); }

                    .field-row { display: flex; gap: 1rem; }
                    .field-row .field-group { flex: 1 1 0; min-width: 0; }

                    .field-group { margin-bottom: 1.1rem; min-width: 0; }
                    .field-label {
                        display: block; font-size: .58rem; letter-spacing: .16em;
                        text-transform: uppercase; color: rgba(245,240,232,.42);
                        margin-bottom: .45rem; font-weight: 600;
                    }
                    .field-input {
                        width: 100%; min-width: 0;
                        background: rgba(245,240,232,.04);
                        border: 1px solid rgba(245,240,232,.09); color: var(--white);
                        font-family: var(--body); font-size: .82rem;
                        padding: .72rem .85rem;
                        outline: none; transition: border-color .22s, background .22s;
                    }
                    .field-input:focus {
                        border-color: rgba(232,255,0,.48);
                        background: rgba(232,255,0,.03);
                    }
                    .field-input::placeholder { color: rgba(245,240,232,.2); }
                    .field-error { font-size: .66rem; color: var(--accent2); margin-top: .4rem; }
                    .field-hint {
                        font-size: .64rem; color: rgba(245,240,232,.28);
                        margin-top: .4rem; line-height: 1.5;
                    }

                    .state-add-row { display: flex; gap: .5rem; }
                    .state-add-btn {
                        background: transparent; border: 1px solid rgba(232,255,0,.28);
                        color: var(--accent); padding: 0 1rem;
                        cursor: pointer; display: flex; align-items: center;
                        transition: background .2s, border-color .2s;
                    }
                    .state-add-btn:hover {
                        background: rgba(232,255,0,.08);
                        border-color: var(--accent);
                    }

                    .editable-chip {
                        display: inline-flex; align-items: center; gap: .4rem;
                        font-size: .7rem; padding: .3rem .5rem .3rem .6rem;
                        background: rgba(232,255,0,.07);
                        border: 1px solid rgba(232,255,0,.2);
                        color: var(--accent);
                    }
                    .chip-remove {
                        background: none; border: none; color: var(--accent);
                        cursor: pointer; display: flex; padding: 0;
                        opacity: .55; transition: opacity .2s;
                    }
                    .chip-remove:hover { opacity: 1; }

                    .check-row {
                        display: flex; align-items: flex-start; gap: .6rem;
                        font-size: .78rem; color: rgba(245,240,232,.58);
                        margin-bottom: .9rem; cursor: pointer;
                    }
                    .check-row input {
                        width: 15px; height: 15px; accent-color: var(--accent);
                        cursor: pointer; flex-shrink: 0; margin-top: .16rem;
                    }
                    .check-desc {
                        display: block;
                        font-size: .66rem; color: rgba(245,240,232,.28);
                        margin-top: .22rem; line-height: 1.5;
                    }

                    .form-actions { display: flex; gap: .7rem; margin-top: 1.5rem; }
                    .btn-save {
                        flex: 1;
                        background: var(--accent); color: var(--black); border: none;
                        font-family: var(--body); font-size: .7rem; font-weight: 700;
                        letter-spacing: .15em; text-transform: uppercase;
                        padding: .92rem; cursor: pointer;
                        transition: transform .2s;
                    }
                    .btn-save:hover { transform: translateY(-2px); }
                    .btn-save:disabled { opacity: .5; transform: none; }
                    .btn-cancel {
                        background: transparent; border: 1px solid rgba(245,240,232,.14);
                        color: rgba(245,240,232,.48);
                        font-family: var(--body); font-size: .7rem; font-weight: 600;
                        letter-spacing: .13em; text-transform: uppercase;
                        padding: .92rem 1.4rem; cursor: pointer;
                        transition: all .2s;
                    }
                    .btn-cancel:hover { border-color: var(--accent2); color: var(--accent2); }

                    .zones-empty {
                        text-align: center; padding: 4.5rem 2rem;
                        border: 1px dashed rgba(245,240,232,.1);
                        color: rgba(245,240,232,.3);
                    }
                    .zones-empty svg { margin: 0 auto 1.2rem; display: block; opacity: .4; }
                    .zones-empty p { font-size: .85rem; line-height: 1.7; }

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
                    .modal.warn { border-color: rgba(232,255,0,.28); }
                    .modal-icon {
                        width: 52px; height: 52px; margin-bottom: 1.3rem;
                        border-radius: 50%;
                        background: rgba(255,61,46,.08);
                        border: 1px solid rgba(255,61,46,.3);
                        display: flex; align-items: center; justify-content: center;
                        color: var(--accent2);
                    }
                    .modal-icon.warn {
                        background: rgba(232,255,0,.08);
                        border-color: rgba(232,255,0,.34);
                        color: var(--accent);
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
                    .modal-note {
                        display: block; margin-top: .8rem;
                        font-size: .76rem; color: rgba(232,255,0,.75);
                        border-left: 2px solid rgba(232,255,0,.4);
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
                    .modal-confirm.warn { background: var(--accent); color: var(--black); }
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
                        .zone-grid { grid-template-columns: minmax(0, 1fr); }
                    }
                    @media (max-width: 560px) {
                        .field-row { flex-direction: column; gap: 0; }
                        .header-actions { width: 100%; }
                        .dash-add-btn { flex: 1; justify-content: center; }
                        .zone-form { padding: 1.4rem; }
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
                    <div
                        className={`modal ${deleteTarget.is_fallback ? 'warn' : ''}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            className={`modal-icon ${deleteTarget.is_fallback ? 'warn' : ''}`}
                        >
                            <AlertTriangle size={22} />
                        </div>
                        <h2 className="modal-title">
                            {deleteTarget.is_fallback
                                ? 'CANNOT DELETE'
                                : 'DELETE ZONE?'}
                        </h2>
                        <p className="modal-body">
                            {deleteTarget.is_fallback ? (
                                <>
                                    <strong>{deleteTarget.name}</strong> is your
                                    fallback zone.
                                    <span className="modal-note">
                                        Set another zone as fallback first —
                                        without one, orders to unmatched
                                        locations get no shipping fee at all.
                                    </span>
                                </>
                            ) : (
                                <>
                                    <strong>{deleteTarget.name}</strong> will be
                                    removed. Orders shipping to those locations
                                    will fall through to your fallback zone
                                    instead.
                                </>
                            )}
                        </p>
                        <div className="modal-actions">
                            {!deleteTarget.is_fallback && (
                                <button
                                    className="modal-confirm"
                                    onClick={confirmDelete}
                                >
                                    Yes, Delete
                                </button>
                            )}
                            <button
                                className="modal-dismiss"
                                onClick={() => setDeleteTarget(null)}
                                style={
                                    deleteTarget.is_fallback
                                        ? { flex: 1 }
                                        : undefined
                                }
                            >
                                {deleteTarget.is_fallback
                                    ? 'Got It'
                                    : 'Keep It'}
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
                            className="dash-nav-item"
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
                            className="dash-nav-item active"
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
                                <h1 className="dash-title">Shipping Zones</h1>
                            </div>
                            <div className="header-actions">
                                <NotificationBell />
                                {!showForm && (
                                    <button
                                        className="dash-add-btn"
                                        onClick={openNew}
                                    >
                                        <PlusCircle size={16} />
                                        <span>Add Zone</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {!hasFallback && zones.length > 0 && (
                            <div className="warn-banner">
                                <Globe size={16} />
                                No active fallback zone. Orders to locations
                                that match no zone will be charged nothing for
                                shipping.
                            </div>
                        )}

                        {showForm && (
                            <div className="zone-form">
                                <div className="form-head">
                                    <p className="form-title">
                                        {editingId ? 'EDIT ZONE' : 'NEW ZONE'}
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
                                    <div className="field-row">
                                        <div className="field-group">
                                            <label className="field-label">
                                                Zone Name
                                            </label>
                                            <input
                                                type="text"
                                                value={data.name}
                                                onChange={(e) =>
                                                    setData(
                                                        'name',
                                                        e.target.value,
                                                    )
                                                }
                                                className="field-input"
                                                placeholder="Lagos, Southwest, International..."
                                            />
                                            {errors.name && (
                                                <div className="field-error">
                                                    {errors.name}
                                                </div>
                                            )}
                                        </div>

                                        <div className="field-group">
                                            <label className="field-label">
                                                Shipping Fee (₦)
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={data.fee}
                                                onChange={(e) =>
                                                    setData(
                                                        'fee',
                                                        e.target.value,
                                                    )
                                                }
                                                className="field-input"
                                                placeholder="2000"
                                            />
                                            {errors.fee && (
                                                <div className="field-error">
                                                    {errors.fee}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="field-row">
                                        <div className="field-group">
                                            <label className="field-label">
                                                Country
                                            </label>
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
                                                placeholder="Nigeria"
                                            />
                                            <p className="field-hint">
                                                Leave empty to match any
                                                country.
                                            </p>
                                            {errors.country && (
                                                <div className="field-error">
                                                    {errors.country}
                                                </div>
                                            )}
                                        </div>

                                        <div className="field-group">
                                            <label className="field-label">
                                                Priority
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="1000"
                                                value={data.priority}
                                                onChange={(e) =>
                                                    setData(
                                                        'priority',
                                                        Number(e.target.value),
                                                    )
                                                }
                                                className="field-input"
                                            />
                                            <p className="field-hint">
                                                Higher wins. Specific zones need
                                                higher priority than broad ones.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="field-group">
                                        <label className="field-label">
                                            States / Regions
                                        </label>
                                        <div className="state-add-row">
                                            <input
                                                type="text"
                                                value={stateInput}
                                                onChange={(e) =>
                                                    setStateInput(
                                                        e.target.value,
                                                    )
                                                }
                                                onKeyDown={handleStateKeyDown}
                                                className="field-input"
                                                placeholder="Type a state and press Enter"
                                            />
                                            <button
                                                type="button"
                                                className="state-add-btn"
                                                onClick={addState}
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                        <p className="field-hint">
                                            Leave empty to cover the whole
                                            country.
                                        </p>
                                        {data.states.length > 0 && (
                                            <div className="state-chips">
                                                {data.states.map((s) => (
                                                    <span
                                                        key={s}
                                                        className="editable-chip"
                                                    >
                                                        {s}
                                                        <button
                                                            type="button"
                                                            className="chip-remove"
                                                            onClick={() =>
                                                                removeState(s)
                                                            }
                                                        >
                                                            <X size={11} />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <label className="check-row">
                                        <input
                                            type="checkbox"
                                            checked={data.is_fallback}
                                            onChange={(e) =>
                                                setData(
                                                    'is_fallback',
                                                    e.target.checked,
                                                )
                                            }
                                        />
                                        <span>
                                            Use as fallback zone
                                            <span className="check-desc">
                                                Applied when no other zone
                                                matches. Only one zone can be
                                                the fallback.
                                            </span>
                                        </span>
                                    </label>

                                    <label className="check-row">
                                        <input
                                            type="checkbox"
                                            checked={data.is_active}
                                            onChange={(e) =>
                                                setData(
                                                    'is_active',
                                                    e.target.checked,
                                                )
                                            }
                                        />
                                        <span>
                                            Active
                                            <span className="check-desc">
                                                Inactive zones are skipped when
                                                calculating shipping.
                                            </span>
                                        </span>
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
                                                  ? 'Update Zone'
                                                  : 'Create Zone'}
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

                        {zones.length === 0 && !showForm ? (
                            <div className="zones-empty">
                                <Truck size={40} />
                                <p>
                                    No shipping zones yet.
                                    <br />
                                    Add one to start charging for delivery.
                                </p>
                            </div>
                        ) : (
                            <div className="zone-grid">
                                {zones.map((zone) => (
                                    <div
                                        key={zone.id}
                                        className={`zone-card ${zone.is_fallback ? 'fallback' : ''} ${!zone.is_active ? 'inactive' : ''}`}
                                    >
                                        <div className="zone-head">
                                            <div>
                                                <p className="zone-name">
                                                    {zone.name}
                                                </p>
                                                <div className="zone-badges">
                                                    {zone.is_fallback && (
                                                        <span className="zone-badge fallback">
                                                            Fallback
                                                        </span>
                                                    )}
                                                    {!zone.is_active && (
                                                        <span className="zone-badge inactive">
                                                            Inactive
                                                        </span>
                                                    )}
                                                    <span className="zone-badge priority">
                                                        Priority {zone.priority}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="zone-actions">
                                                <button
                                                    className="zone-btn"
                                                    onClick={() =>
                                                        openEdit(zone)
                                                    }
                                                    title="Edit"
                                                >
                                                    <Pencil size={13} />
                                                </button>
                                                <button
                                                    className="zone-btn danger"
                                                    onClick={() =>
                                                        setDeleteTarget(zone)
                                                    }
                                                    title="Delete"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </div>

                                        <p className="zone-fee">
                                            ₦{Number(zone.fee).toLocaleString()}
                                        </p>

                                        <div className="zone-scope">
                                            {zone.country ? (
                                                <MapPin size={13} />
                                            ) : (
                                                <Globe size={13} />
                                            )}
                                            <div>
                                                {zone.country || 'Any country'}
                                                {zone.states &&
                                                zone.states.length > 0 ? (
                                                    <div className="state-chips">
                                                        {zone.states.map(
                                                            (s) => (
                                                                <span
                                                                    key={s}
                                                                    className="state-chip"
                                                                >
                                                                    {s}
                                                                </span>
                                                            ),
                                                        )}
                                                    </div>
                                                ) : (
                                                    zone.country && (
                                                        <div className="all-states-note">
                                                            All states
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </>
    );
}

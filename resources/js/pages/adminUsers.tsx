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
    ShieldOff,
    UserX,
    UserCheck,
    Ghost,
    MessageSquareQuote,
    CircleSlash,
} from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';

interface UserRow {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    profile_picture: string | null;
    avatar_url: string | null;
    role: string;
    created_at: string;
    last_login_at: string | null;
    suspended_at: string | null;
    deleted_at: string | null;
    anonymised_at: string | null;
    completed_orders: number;
    total_spent: number | string | null;
}

interface PageLink {
    url: string | null;
    label: string;
    active: boolean;
}

const TABS = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'suspended', label: 'Suspended' },
    { key: 'pending_deletion', label: 'Leaving' },
    { key: 'anonymised', label: 'Anonymised' },
    { key: 'admins', label: 'Admins' },
];

export default function AdminUsers() {
    const { users, filters, counts, feedback, recentComments, appUrl } =
        usePage().props as unknown as {
            users: { data: UserRow[]; links: PageLink[]; total: number };
            filters: { search?: string; status?: string };
            counts: Record<string, number>;
            feedback: { reason: string; total: number }[];
            recentComments: {
                id: number;
                reason: string;
                comment: string;
                created_at: string;
            }[];
            appUrl: string;
        };

    const [search, setSearch] = useState(filters.search ?? '');
    const [navOpen, setNavOpen] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const activeStatus = filters.status ?? 'all';

    const applyFilters = (overrides: Record<string, string> = {}) => {
        router.get(
            '/admin/users',
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

    const fmtDate = (iso: string | null) =>
        iso
            ? new Date(iso).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
              })
            : '—';

    const relative = (iso: string | null) => {
        if (!iso) return 'Never';
        const days = Math.floor(
            (Date.now() - new Date(iso).getTime()) / 86400000,
        );
        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 30) return `${days}d ago`;
        if (days < 365) return `${Math.floor(days / 30)}mo ago`;
        return `${Math.floor(days / 365)}y ago`;
    };

    const statusOf = (u: UserRow) => {
        if (u.anonymised_at) return { key: 'anonymised', label: 'Anonymised' };
        if (u.deleted_at) return { key: 'leaving', label: 'Leaving' };
        if (u.suspended_at) return { key: 'suspended', label: 'Suspended' };
        if (u.role === 'admin') return { key: 'admin', label: 'Admin' };
        return { key: 'active', label: 'Active' };
    };

    const avatarOf = (u: UserRow) =>
        u.profile_picture
            ? `${appUrl}/storage/${u.profile_picture}`
            : u.avatar_url || null;

    const topReason = feedback[0];

    return (
        <>
            <Head title="Customers — Admin">
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
                    @keyframes slideDown {
                        from { opacity: 0; transform: translateY(-10px); }
                        to { opacity: 1; transform: translateY(0); }
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

                    .nav-badge {
                        margin-left: auto;
                        background: var(--accent2); color: #fff;
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

                    .feedback-btn {
                        display: inline-flex; align-items: center; gap: .5rem;
                        background: transparent;
                        border: 1px solid rgba(245,240,232,.12);
                        color: rgba(245,240,232,.55);
                        font-family: var(--body); font-size: .62rem; font-weight: 700;
                        letter-spacing: .13em; text-transform: uppercase;
                        padding: .65rem 1.1rem; cursor: pointer;
                        transition: all .22s;
                    }
                    .feedback-btn:hover {
                        border-color: var(--accent); color: var(--accent);
                        background: rgba(232,255,0,.05);
                    }
                    .feedback-btn.open {
                        border-color: var(--accent); color: var(--accent);
                        background: rgba(232,255,0,.07);
                    }

                    /* FEEDBACK PANEL */
                    .feedback-panel {
                        background: linear-gradient(158deg, #1f1f1f 0%, #171717 100%);
                        border: 1px solid rgba(232,255,0,.22);
                        padding: 1.8rem;
                        margin-bottom: 1.8rem;
                        animation: slideDown .3s ease;
                    }
                    .fb-head {
                        display: flex; align-items: center; gap: .75rem;
                        padding-bottom: 1.1rem; margin-bottom: 1.4rem;
                        border-bottom: 1px solid rgba(245,240,232,.07);
                    }
                    .fb-icon {
                        width: 34px; height: 34px; flex-shrink: 0;
                        border: 1px solid rgba(232,255,0,.24);
                        background: rgba(232,255,0,.05);
                        display: flex; align-items: center; justify-content: center;
                        color: var(--accent);
                    }
                    .fb-title {
                        font-family: var(--serif); font-size: 1.2rem; letter-spacing: .08em;
                    }
                    .fb-close {
                        margin-left: auto;
                        background: none; border: none;
                        color: rgba(245,240,232,.35); cursor: pointer;
                        padding: .2rem; display: flex;
                        transition: color .2s;
                    }
                    .fb-close:hover { color: var(--accent2); }

                    .fb-grid {
                        display: grid; grid-template-columns: minmax(0, 320px) minmax(0, 1fr);
                        gap: 2rem;
                    }

                    .fb-reasons { display: flex; flex-direction: column; gap: .7rem; }
                    .fb-reason-row {
                        display: flex; align-items: center; gap: .8rem;
                    }
                    .fb-reason-label {
                        font-size: .76rem; color: rgba(245,240,232,.6);
                        flex: 1; min-width: 0;
                        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                    }
                    .fb-bar-track {
                        width: 70px; height: 5px; flex-shrink: 0;
                        background: rgba(245,240,232,.07);
                    }
                    .fb-bar-fill { display: block; height: 100%; background: var(--accent2); }
                    .fb-reason-count {
                        font-size: .72rem; font-weight: 700;
                        color: rgba(245,240,232,.5);
                        width: 22px; text-align: right; flex-shrink: 0;
                    }

                    .fb-comments {
                        display: flex; flex-direction: column; gap: .8rem;
                        max-height: 260px; overflow-y: auto;
                        padding-right: .4rem;
                    }
                    .fb-comments::-webkit-scrollbar { width: 4px; }
                    .fb-comments::-webkit-scrollbar-thumb { background: rgba(245,240,232,.14); }
                    .fb-comment {
                        background: rgba(245,240,232,.025);
                        border-left: 2px solid rgba(255,61,46,.35);
                        padding: .8rem 1rem;
                    }
                    .fb-comment-meta {
                        display: flex; align-items: center; gap: .6rem;
                        margin-bottom: .45rem; flex-wrap: wrap;
                    }
                    .fb-comment-reason {
                        font-size: .56rem; letter-spacing: .12em;
                        text-transform: uppercase; font-weight: 700;
                        color: var(--accent2);
                    }
                    .fb-comment-date {
                        font-size: .62rem; color: rgba(245,240,232,.26);
                    }
                    .fb-comment-text {
                        font-size: .79rem; line-height: 1.7;
                        color: rgba(245,240,232,.55);
                        overflow-wrap: break-word;
                    }
                    .fb-empty {
                        font-size: .8rem; color: rgba(245,240,232,.3);
                        font-style: italic; padding: 1rem 0;
                    }

                    /* STATS */
                    .stats-row {
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
                    .stat-card.warn { border-color: rgba(255,61,46,.26); }
                    .stat-card.warn::after {
                        background: radial-gradient(circle at 70% 30%, rgba(255,61,46,.1), transparent 70%);
                    }
                    .stat-card.warn .stat-icon {
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
                    }
                    .stat-value.warn { color: var(--accent2); }

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

                    /* USER ROWS */
                    .user-list { display: flex; flex-direction: column; gap: .65rem; }

                    .user-row {
                        position: relative;
                        display: grid;
                        grid-template-columns: 46px minmax(0, 1fr) 120px 112px 100px 22px;
                        align-items: center; gap: 1.1rem;
                        background: linear-gradient(158deg, #1e1e1e 0%, #171717 100%);
                        border: 1px solid rgba(245,240,232,.06);
                        padding: 1.1rem 1.35rem;
                        text-decoration: none; color: inherit;
                        transition: border-color .22s, transform .22s, box-shadow .25s;
                        animation: fadeUp .4s ease both;
                    }
                    .user-row::before {
                        content: ''; position: absolute;
                        left: 0; top: 0; bottom: 0; width: 2px;
                        background: var(--accent);
                        transform: scaleY(0); transition: transform .25s;
                    }
                    .user-row:hover {
                        border-color: rgba(232,255,0,.3);
                        transform: translateX(3px);
                        box-shadow: 0 8px 30px rgba(0,0,0,.35);
                    }
                    .user-row:hover::before { transform: scaleY(1); }
                    .user-row.gone { opacity: .55; }

                    .row-avatar {
                        width: 42px; height: 42px; flex-shrink: 0;
                        border-radius: 50%; overflow: hidden;
                        background: linear-gradient(145deg, #272727, #131313);
                        display: flex; align-items: center; justify-content: center;
                        box-shadow: 0 0 0 1px rgba(245,240,232,.08);
                    }
                    .row-avatar img { width: 100%; height: 100%; object-fit: cover; }
                    .row-avatar span {
                        font-family: var(--serif); font-size: 1.15rem;
                        color: rgba(245,240,232,.5); line-height: 1;
                    }

                    .row-identity { min-width: 0; }
                    .row-name {
                        font-size: .88rem; font-weight: 600; color: rgba(245,240,232,.9);
                        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                    }
                    .row-email {
                        font-size: .72rem; color: rgba(245,240,232,.32); margin-top: .28rem;
                        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                    }

                    .row-metric { min-width: 0; }
                    .row-metric-val {
                        font-family: var(--serif); font-size: 1.15rem;
                        color: rgba(245,240,232,.85); letter-spacing: .02em; line-height: 1;
                    }
                    .row-metric-val.accent { color: var(--accent); }
                    .row-metric-lbl {
                        font-size: .55rem; letter-spacing: .14em; text-transform: uppercase;
                        color: rgba(245,240,232,.26); margin-top: .35rem; font-weight: 700;
                    }

                    .row-status {
                        font-size: .55rem; letter-spacing: .13em; text-transform: uppercase;
                        font-weight: 700; padding: .38rem .6rem; text-align: center;
                        white-space: nowrap;
                    }
                    .row-status.active { background: rgba(74,222,128,.09); color: var(--green); border: 1px solid rgba(74,222,128,.28); }
                    .row-status.admin { background: rgba(232,255,0,.09); color: var(--accent); border: 1px solid rgba(232,255,0,.3); }
                    .row-status.suspended { background: rgba(255,61,46,.1); color: var(--accent2); border: 1px solid rgba(255,61,46,.3); }
                    .row-status.leaving { background: rgba(255,170,60,.09); color: var(--amber); border: 1px solid rgba(255,170,60,.3); }
                    .row-status.anonymised { background: rgba(245,240,232,.04); color: rgba(245,240,232,.38); border: 1px solid rgba(245,240,232,.12); }

                    .row-chevron { color: rgba(245,240,232,.18); transition: color .22s, transform .22s; }
                    .user-row:hover .row-chevron { color: var(--accent); transform: translateX(3px); }

                    .users-empty {
                        text-align: center; padding: 4.5rem 2rem;
                        border: 1px dashed rgba(245,240,232,.1);
                        color: rgba(245,240,232,.3);
                    }
                    .users-empty svg { margin: 0 auto 1.2rem; display: block; opacity: .4; }
                    .users-empty p { font-size: .86rem; }

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

                    @media (max-width: 1200px) {
                        .stats-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                        .user-row {
                            grid-template-columns: 46px minmax(0, 1fr) 112px 22px;
                            row-gap: .8rem;
                        }
                        .row-metric { grid-column: 2 / 3; }
                        .row-metric.spend { grid-column: 3 / 4; }
                    }
                    @media (max-width: 1000px) {
                        .fb-grid { grid-template-columns: minmax(0, 1fr); gap: 1.6rem; }
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
                        .admin-search-wrap { width: 100%; }
                    }
                    @media (max-width: 560px) {
                        .stats-row { grid-template-columns: minmax(0, 1fr); }
                        .user-row {
                            grid-template-columns: 46px minmax(0, 1fr);
                            row-gap: .9rem;
                        }
                        .row-metric, .row-status { grid-column: 1 / -1; }
                        .row-status { text-align: left; justify-self: start; }
                        .row-chevron { display: none; }
                        .header-actions { width: 100%; }
                        .feedback-btn { flex: 1; justify-content: center; }
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
                            className="dash-nav-item"
                            onClick={() => setNavOpen(false)}
                        >
                            <ClipboardList size={17} /> Orders
                        </Link>
                        <Link
                            href="/admin/users"
                            className="dash-nav-item active"
                            onClick={() => setNavOpen(false)}
                        >
                            <Users size={17} /> Customers
                            {counts.suspended > 0 && (
                                <span className="nav-badge">
                                    {counts.suspended}
                                </span>
                            )}
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
                        <button onClick={handleLogout} className="dash-nav-item">
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
                                <h1 className="dash-title">Customers</h1>
                            </div>
                            <div className="header-actions">
                                <NotificationBell />
                                <button
                                    className={`feedback-btn ${showFeedback ? 'open' : ''}`}
                                    onClick={() => setShowFeedback((o) => !o)}
                                >
                                    <MessageSquareQuote size={13} />
                                    Why They Leave
                                </button>
                            </div>
                        </div>

                        {showFeedback && (
                            <div className="feedback-panel">
                                <div className="fb-head">
                                    <div className="fb-icon">
                                        <MessageSquareQuote size={15} />
                                    </div>
                                    <p className="fb-title">
                                        DELETION FEEDBACK
                                    </p>
                                    <button
                                        className="fb-close"
                                        onClick={() => setShowFeedback(false)}
                                    >
                                        <X size={17} />
                                    </button>
                                </div>

                                {feedback.length === 0 ? (
                                    <p className="fb-empty">
                                        No feedback collected yet. Reasons appear
                                        here when customers choose to share one
                                        on deletion.
                                    </p>
                                ) : (
                                    <div className="fb-grid">
                                        <div className="fb-reasons">
                                            {feedback.map((f, i) => (
                                                <div
                                                    key={i}
                                                    className="fb-reason-row"
                                                >
                                                    <span className="fb-reason-label">
                                                        {f.reason}
                                                    </span>
                                                    <span className="fb-bar-track">
                                                        <span
                                                            className="fb-bar-fill"
                                                            style={{
                                                                width: `${
                                                                    topReason
                                                                        ? (f.total /
                                                                              topReason.total) *
                                                                          100
                                                                        : 0
                                                                }%`,
                                                            }}
                                                        />
                                                    </span>
                                                    <span className="fb-reason-count">
                                                        {f.total}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="fb-comments">
                                            {recentComments.length === 0 ? (
                                                <p className="fb-empty">
                                                    No written comments yet.
                                                </p>
                                            ) : (
                                                recentComments.map((c) => (
                                                    <div
                                                        key={c.id}
                                                        className="fb-comment"
                                                    >
                                                        <div className="fb-comment-meta">
                                                            <span className="fb-comment-reason">
                                                                {c.reason}
                                                            </span>
                                                            <span className="fb-comment-date">
                                                                {fmtDate(
                                                                    c.created_at,
                                                                )}
                                                            </span>
                                                        </div>
                                                        <p className="fb-comment-text">
                                                            {c.comment}
                                                        </p>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="stats-row">
                            <div className="stat-card">
                                <div className="stat-top">
                                    <div className="stat-icon">
                                        <Users size={16} />
                                    </div>
                                    <span className="stat-label">
                                        Total Customers
                                    </span>
                                </div>
                                <p className="stat-value">{counts.all ?? 0}</p>
                            </div>

                            <div className="stat-card">
                                <div className="stat-top">
                                    <div className="stat-icon">
                                        <UserCheck size={16} />
                                    </div>
                                    <span className="stat-label">Active</span>
                                </div>
                                <p className="stat-value">
                                    {counts.active ?? 0}
                                </p>
                            </div>

                            <div
                                className={`stat-card ${counts.suspended > 0 ? 'warn' : ''}`}
                            >
                                <div className="stat-top">
                                    <div className="stat-icon">
                                        <UserX size={16} />
                                    </div>
                                    <span className="stat-label">
                                        Suspended
                                    </span>
                                </div>
                                <p
                                    className={`stat-value ${counts.suspended > 0 ? 'warn' : ''}`}
                                >
                                    {counts.suspended ?? 0}
                                </p>
                            </div>

                            <div className="stat-card">
                                <div className="stat-top">
                                    <div className="stat-icon">
                                        <Ghost size={16} />
                                    </div>
                                    <span className="stat-label">
                                        Leaving
                                    </span>
                                </div>
                                <p className="stat-value">
                                    {counts.pending_deletion ?? 0}
                                </p>
                            </div>
                        </div>

                        <div className="filter-bar">
                            <div className="status-tabs">
                                {TABS.map((tab) => (
                                    <button
                                        key={tab.key}
                                        className={`status-tab ${activeStatus === tab.key ? 'active' : ''}`}
                                        onClick={() =>
                                            applyFilters({ status: tab.key })
                                        }
                                    >
                                        {tab.label}
                                        <span className="tab-count">
                                            {counts[tab.key] ?? 0}
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
                                    placeholder="Name, email or phone..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        {users.data.length === 0 ? (
                            <div className="users-empty">
                                <CircleSlash size={40} />
                                <p>No customers match this view.</p>
                            </div>
                        ) : (
                            <div className="user-list">
                                {users.data.map((user) => {
                                    const status = statusOf(user);
                                    const avatar = avatarOf(user);
                                    const gone =
                                        !!user.deleted_at ||
                                        !!user.anonymised_at;

                                    return (
                                        <Link
                                            key={user.id}
                                            href={`/admin/users/${user.id}`}
                                            className={`user-row ${gone ? 'gone' : ''}`}
                                        >
                                            <div className="row-avatar">
                                                {avatar ? (
                                                    <img
                                                        src={avatar}
                                                        alt={user.name}
                                                    />
                                                ) : (
                                                    <span>
                                                        {user.name
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="row-identity">
                                                <p className="row-name">
                                                    {user.name}
                                                </p>
                                                <p className="row-email">
                                                    {user.email}
                                                    {user.phone &&
                                                        ` · ${user.phone}`}
                                                </p>
                                            </div>

                                            <div className="row-metric">
                                                <p className="row-metric-val">
                                                    {user.completed_orders}
                                                </p>
                                                <p className="row-metric-lbl">
                                                    Orders
                                                </p>
                                            </div>

                                            <div className="row-metric spend">
                                                <p className="row-metric-val accent">
                                                    ₦
                                                    {Number(
                                                        user.total_spent ?? 0,
                                                    ).toLocaleString()}
                                                </p>
                                                <p className="row-metric-lbl">
                                                    Spent
                                                </p>
                                            </div>

                                            <span
                                                className={`row-status ${status.key}`}
                                            >
                                                {status.label}
                                            </span>

                                            <ChevronRight
                                                size={17}
                                                className="row-chevron"
                                            />
                                        </Link>
                                    );
                                })}
                            </div>
                        )}

                        {users.links.length > 3 && (
                            <div className="pagination">
                                {users.links.map((link, i) => (
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

import { router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import {
    Bell,
    Package,
    CreditCard,
    Truck,
    PackageCheck,
    XCircle,
    CheckCheck,
    Inbox,
} from 'lucide-react';

interface NotificationItem {
    id: string;
    title: string;
    message: string;
    url: string | null;
    reference: string | null;
    status: string | null;
    is_admin: boolean;
    read: boolean;
    created_at: string;
}

const csrf = () =>
    document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute('content') || '';

const statusIcon = (status: string | null) => {
    switch (status) {
        case 'pending':
            return Package;
        case 'paid':
            return CreditCard;
        case 'shipped':
            return Truck;
        case 'delivered':
            return PackageCheck;
        case 'cancelled':
            return XCircle;
        default:
            return Bell;
    }
};

const statusTone = (status: string | null) => {
    switch (status) {
        case 'shipped':
            return 'tone-orange';
        case 'delivered':
            return 'tone-green';
        case 'cancelled':
            return 'tone-red';
        default:
            return 'tone-accent';
    }
};

const timeAgo = (iso: string) => {
    const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.round(hrs / 24);
    if (days < 7) return `${days}d`;
    return new Date(iso).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
    });
};

export default function NotificationBell() {
    const { auth } = usePage().props as unknown as {
        auth: { user: { id: number } | null };
    };

    const [open, setOpen] = useState(false);
    const [unread, setUnread] = useState(0);
    const [items, setItems] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(false);
    const wrapRef = useRef<HTMLDivElement>(null);

    const fetchCount = () => {
        fetch('/notifications/unread-count', {
            headers: { Accept: 'application/json' },
        })
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => d && setUnread(d.unread))
            .catch(() => {});
    };

    const fetchList = () => {
        setLoading(true);
        fetch('/notifications', { headers: { Accept: 'application/json' } })
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
                if (!d) return;
                setItems(d.notifications);
                setUnread(d.unread);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (!auth.user) return;

        fetchCount();
        const interval = setInterval(fetchCount, 30000);
        return () => clearInterval(interval);
    }, [auth.user]);

    useEffect(() => {
        const onClickOutside = (e: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, []);

    const toggle = () => {
        const next = !open;
        setOpen(next);
        if (next) fetchList();
    };

    const openItem = (item: NotificationItem) => {
        if (!item.read) {
            fetch(`/notifications/${item.id}/read`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrf(),
                },
            })
                .then((r) => (r.ok ? r.json() : null))
                .then((d) => d && setUnread(d.unread))
                .catch(() => {});
        }

        setOpen(false);

        if (item.url) router.visit(item.url);
    };

    const markAll = () => {
        fetch('/notifications/read-all', {
            method: 'POST',
            headers: { Accept: 'application/json', 'X-CSRF-TOKEN': csrf() },
        })
            .then((r) => (r.ok ? r.json() : null))
            .then(() => {
                setUnread(0);
                setItems((prev) => prev.map((i) => ({ ...i, read: true })));
            })
            .catch(() => {});
    };

    if (!auth.user) return null;

    return (
        <div className="nb-wrap" ref={wrapRef}>
            <button
                className="nb-trigger"
                onClick={toggle}
                aria-label="Notifications"
            >
                <Bell size={18} />
                {unread > 0 && (
                    <span className="nb-badge">
                        {unread > 9 ? '9+' : unread}
                    </span>
                )}
            </button>

            {open && (
                <div className="nb-panel">
                    <div className="nb-head">
                        <p className="nb-title">Notifications</p>
                        {unread > 0 && (
                            <button className="nb-mark-all" onClick={markAll}>
                                <CheckCheck size={12} /> Mark all read
                            </button>
                        )}
                    </div>

                    <div className="nb-list">
                        {loading ? (
                            <div className="nb-empty">
                                <p>Loading...</p>
                            </div>
                        ) : items.length === 0 ? (
                            <div className="nb-empty">
                                <Inbox size={30} />
                                <p>Nothing here yet.</p>
                            </div>
                        ) : (
                            items.map((item) => {
                                const Icon = statusIcon(item.status);
                                return (
                                    <button
                                        key={item.id}
                                        className={`nb-item ${item.read ? '' : 'unread'}`}
                                        onClick={() => openItem(item)}
                                    >
                                        <div
                                            className={`nb-icon ${statusTone(item.status)}`}
                                        >
                                            <Icon size={14} />
                                        </div>
                                        <div className="nb-body">
                                            <div className="nb-item-top">
                                                <span className="nb-item-title">
                                                    {item.title}
                                                </span>
                                                <span className="nb-time">
                                                    {timeAgo(item.created_at)}
                                                </span>
                                            </div>
                                            <p className="nb-msg">
                                                {item.message}
                                            </p>
                                            {item.reference && (
                                                <p className="nb-ref">
                                                    {item.reference}
                                                    {item.is_admin && (
                                                        <span className="nb-admin-tag">
                                                            Admin
                                                        </span>
                                                    )}
                                                </p>
                                            )}
                                        </div>
                                        {!item.read && (
                                            <span className="nb-dot" />
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            <style>{`
                .nb-wrap { position: relative; }

                .nb-trigger {
                    position: relative;
                    width: 38px; height: 38px;
                    background: transparent;
                    border: 1px solid rgba(245,240,232,.12);
                    color: rgba(245,240,232,.7);
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer;
                    transition: border-color .2s, color .2s, transform .2s;
                }
                .nb-trigger:hover {
                    border-color: #e8ff00; color: #e8ff00;
                    transform: translateY(-1px);
                }

                .nb-badge {
                    position: absolute; top: -6px; right: -6px;
                    min-width: 18px; height: 18px; padding: 0 4px;
                    border-radius: 9px;
                    background: #ff3d2e; color: #fff;
                    font-family: 'DM Sans', sans-serif;
                    font-size: .6rem; font-weight: 700;
                    display: flex; align-items: center; justify-content: center;
                    border: 2px solid #0a0a0a;
                }

                .nb-panel {
                    position: absolute; top: 48px; right: 0;
                    width: 340px; z-index: 400;
                    background: linear-gradient(160deg, #1f1f1f 0%, #161616 100%);
                    border: 1px solid rgba(245,240,232,.1);
                    box-shadow: 0 24px 70px rgba(0,0,0,.65);
                    animation: nbDrop .18s ease;
                    overflow: hidden;
                    font-family: 'DM Sans', sans-serif;
                }
                @keyframes nbDrop {
                    from { opacity: 0; transform: translateY(-8px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .nb-head {
                    display: flex; align-items: center; justify-content: space-between;
                    padding: .95rem 1.1rem;
                    border-bottom: 1px solid rgba(245,240,232,.08);
                    background: rgba(0,0,0,.25);
                }
                .nb-title {
                    font-size: .72rem; letter-spacing: .16em;
                    text-transform: uppercase; font-weight: 700;
                    color: rgba(245,240,232,.8);
                }
                .nb-mark-all {
                    display: inline-flex; align-items: center; gap: .3rem;
                    background: none; border: none;
                    color: rgba(232,255,0,.7);
                    font-family: 'DM Sans', sans-serif;
                    font-size: .6rem; letter-spacing: .1em;
                    text-transform: uppercase; font-weight: 600;
                    cursor: pointer; padding: 0;
                    transition: color .2s;
                }
                .nb-mark-all:hover { color: #e8ff00; }

                .nb-list { max-height: 380px; overflow-y: auto; }
                .nb-list::-webkit-scrollbar { width: 4px; }
                .nb-list::-webkit-scrollbar-thumb { background: rgba(245,240,232,.14); }

                .nb-item {
                    position: relative;
                    display: flex; gap: .75rem; align-items: flex-start;
                    width: 100%; text-align: left;
                    padding: .9rem 1.1rem;
                    background: none; border: none;
                    border-bottom: 1px solid rgba(245,240,232,.05);
                    cursor: pointer;
                    transition: background .15s;
                }
                .nb-item:hover { background: rgba(245,240,232,.035); }
                .nb-item.unread { background: rgba(232,255,0,.028); }
                .nb-item.unread:hover { background: rgba(232,255,0,.055); }

                .nb-icon {
                    width: 30px; height: 30px; flex-shrink: 0;
                    display: flex; align-items: center; justify-content: center;
                    border-width: 1px; border-style: solid;
                }
                .nb-icon.tone-accent {
                    border-color: rgba(232,255,0,.28);
                    background: rgba(232,255,0,.07);
                    color: #e8ff00;
                }
                .nb-icon.tone-orange {
                    border-color: rgba(255,170,60,.3);
                    background: rgba(255,170,60,.08);
                    color: #ffaa3c;
                }
                .nb-icon.tone-green {
                    border-color: rgba(74,222,128,.3);
                    background: rgba(74,222,128,.08);
                    color: #4ade80;
                }
                .nb-icon.tone-red {
                    border-color: rgba(255,61,46,.3);
                    background: rgba(255,61,46,.08);
                    color: #ff3d2e;
                }

                .nb-body { flex: 1; min-width: 0; }
                .nb-item-top {
                    display: flex; align-items: baseline; justify-content: space-between;
                    gap: .5rem;
                }
                .nb-item-title {
                    font-size: .78rem; font-weight: 600;
                    color: rgba(245,240,232,.9);
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                }
                .nb-time {
                    font-size: .62rem; color: rgba(245,240,232,.3);
                    flex-shrink: 0;
                }
                .nb-msg {
                    font-size: .72rem; line-height: 1.55;
                    color: rgba(245,240,232,.45);
                    margin-top: .25rem;
                    display: -webkit-box; -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical; overflow: hidden;
                }
                .nb-ref {
                    display: flex; align-items: center; gap: .4rem;
                    font-size: .6rem; letter-spacing: .1em;
                    color: rgba(245,240,232,.28);
                    margin-top: .4rem;
                }
                .nb-admin-tag {
                    font-size: .52rem; letter-spacing: .1em;
                    text-transform: uppercase; font-weight: 700;
                    padding: .12rem .35rem;
                    background: rgba(232,255,0,.12); color: rgba(232,255,0,.8);
                    border: 1px solid rgba(232,255,0,.25);
                }

                .nb-dot {
                    position: absolute; top: 1.15rem; right: .9rem;
                    width: 6px; height: 6px; border-radius: 50%;
                    background: #e8ff00;
                    box-shadow: 0 0 8px rgba(232,255,0,.6);
                }

                .nb-empty {
                    padding: 2.5rem 1rem; text-align: center;
                    color: rgba(245,240,232,.3);
                }
                .nb-empty svg { margin: 0 auto .8rem; display: block; opacity: .5; }
                .nb-empty p { font-size: .78rem; }

                @media (max-width: 768px) {
                    .nb-panel {
                        position: fixed;
                        top: 62px; right: 1rem; left: 1rem;
                        width: auto;
                    }
                }
            `}</style>
        </div>
    );
}

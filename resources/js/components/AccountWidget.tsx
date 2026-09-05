import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { User, Settings, Package, LogOut, LogIn } from 'lucide-react';

export default function AccountWidget() {
    const { auth, appUrl } = usePage().props as unknown as {
        auth: {
            user: {
                name: string;
                email: string;
                role: string;
                profile_picture: string | null;
            } | null;
        };
        appUrl: string;
    };

    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        router.post('/logout');
    };

    if (!auth.user) {
        return (
            <>
                <Link
                    href="/login"
                    className="aw-fab aw-fab-guest"
                    aria-label="Log in"
                >
                    <LogIn size={19} />
                </Link>
                <style>{`
                    .aw-fab {
                        position: fixed; top: 1.5rem; right: 1.5rem; z-index: 500;
                        width: 46px; height: 46px;
                        background: var(--mid, #1c1c1c);
                        border: 1px solid rgba(245,240,232,.12);
                        color: var(--white, #f5f0e8);
                        display: flex; align-items: center; justify-content: center;
                        cursor: pointer; text-decoration: none;
                        transition: border-color .2s, transform .2s;
                    }
                    .aw-fab:hover { border-color: var(--accent, #e8ff00); transform: translateY(-2px); }
                    @media (max-width: 480px) {
                        .aw-fab { top: 1rem; right: 1rem; width: 42px; height: 42px; }
                    }
                `}</style>
            </>
        );
    }

    const initial = auth.user.name?.charAt(0).toUpperCase() || 'U';

    return (
        <div className="aw-wrap" ref={ref}>
            <button
                className="aw-fab aw-fab-user"
                onClick={() => setOpen((o) => !o)}
                aria-label="Account menu"
            >
                {auth.user.profile_picture ? (
                    <img
                        src={`${appUrl}/storage/${auth.user.profile_picture}`}
                        alt={auth.user.name}
                        className="aw-avatar-img"
                    />
                ) : (
                    initial
                )}
            </button>

            {open && (
                <div className="aw-dropdown">
                    <div className="aw-dropdown-header">
                        <p className="aw-name">{auth.user.name}</p>
                        <p className="aw-email">{auth.user.email}</p>
                    </div>

                    <Link href="/account/profile" className="aw-item">
                        <User size={16} /> Profile
                    </Link>
                    <Link href="/account/settings" className="aw-item">
                        <Settings size={16} /> Settings
                    </Link>
                    <Link href="/account/orders" className="aw-item">
                        <Package size={16} /> Orders
                    </Link>

                    <button className="aw-item aw-logout" onClick={handleLogout}>
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            )}

            <style>{`
                .aw-wrap { position: fixed; top: 1.5rem; right: 1.5rem; z-index: 500; }

                .aw-fab {
                    width: 46px; height: 46px;
                    border: none; cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    transition: transform .2s;
                }
                .aw-fab-user {
                    background: var(--accent, #e8ff00);
                    color: var(--black, #0a0a0a);
                    font-family: 'DM Sans', sans-serif;
                    font-weight: 700; font-size: .95rem;
                    box-shadow: 0 8px 24px rgba(0,0,0,.4);
                    overflow: hidden;
                    padding: 0;
                }
                .aw-fab:hover { transform: translateY(-2px); }
                .aw-avatar-img {
                    width: 100%; height: 100%; object-fit: cover;
                }

                .aw-dropdown {
                    position: absolute; top: 56px; right: 0;
                    width: 230px;
                    background: var(--mid, #1c1c1c);
                    border: 1px solid rgba(245,240,232,.1);
                    box-shadow: 0 20px 60px rgba(0,0,0,.5);
                    animation: awDrop .18s ease;
                    font-family: 'DM Sans', sans-serif;
                }
                @keyframes awDrop {
                    from { opacity: 0; transform: translateY(-6px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .aw-dropdown-header {
                    padding: 1rem 1.1rem;
                    border-bottom: 1px solid rgba(245,240,232,.08);
                }
                .aw-name { font-size: .85rem; font-weight: 600; color: var(--white, #f5f0e8); }
                .aw-email {
                    font-size: .72rem; color: rgba(245,240,232,.4); margin-top: .2rem;
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                }

                .aw-item {
                    display: flex; align-items: center; gap: .7rem;
                    padding: .75rem 1.1rem;
                    color: rgba(245,240,232,.7);
                    font-size: .82rem;
                    text-decoration: none;
                    border: none; background: none; width: 100%; text-align: left;
                    cursor: pointer;
                    transition: background .15s, color .15s;
                }
                .aw-item:hover { background: rgba(245,240,232,.05); color: var(--white, #f5f0e8); }
                .aw-logout {
                    border-top: 1px solid rgba(245,240,232,.08);
                    color: var(--accent2, #ff3d2e);
                }
                .aw-logout:hover { background: rgba(255,61,46,.08); color: var(--accent2, #ff3d2e); }

                @media (max-width: 480px) {
                    .aw-wrap { top: 1rem; right: 1rem; }
                    .aw-fab { width: 42px; height: 42px; }
                    .aw-dropdown { width: 200px; }
                }
            `}</style>
        </div>
    );
}

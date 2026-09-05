import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import {
    Home,
    Store,
    User,
    Settings,
    Package,
    LogOut,
    LogIn,
    MapPin,
    X,
    ChevronDown,
    LayoutDashboard,
    Heart,
} from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';

export default function SiteNav() {
    const { auth, appUrl, url } = usePage().props as unknown as {
        auth: {
            user: {
                name: string;
                email: string;
                role: string;
                profile_picture: string | null;
            } | null;
        };
        appUrl: string;
        url?: string;
    };

    const currentPath =
        typeof window !== 'undefined' ? window.location.pathname : url || '/';

    const [menuOpen, setMenuOpen] = useState(false);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [unread, setUnread] = useState(0);
    const [wishCount, setWishCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node)
            ) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 12);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        document.body.style.overflow = sheetOpen ? 'hidden' : '';
        return () => {
            document.body.style.overflow = '';
        };
    }, [sheetOpen]);

    useEffect(() => {
        if (!auth.user) return;

        const fetchCount = () => {
            fetch('/notifications/unread-count', {
                headers: { Accept: 'application/json' },
            })
                .then((r) => (r.ok ? r.json() : null))
                .then((d) => d && setUnread(d.unread))
                .catch(() => {});
        };

        fetchCount();
        const interval = setInterval(fetchCount, 30000);
        return () => clearInterval(interval);
    }, [auth.user]);

    /* ---- wishlist count: initial fetch + live updates ---- */
    useEffect(() => {
        if (!auth.user) {
            setWishCount(0);
            return;
        }

        fetch('/wishlist/ids', { headers: { Accept: 'application/json' } })
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => d && setWishCount(d.count))
            .catch(() => {});
    }, [auth.user]);

    useEffect(() => {
        const onWishChange = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (detail && typeof detail.count === 'number') {
                setWishCount(detail.count);
            }
        };
        window.addEventListener('wishlist:changed', onWishChange);
        return () =>
            window.removeEventListener('wishlist:changed', onWishChange);
    }, []);

    const handleLogout = () => {
        setMenuOpen(false);
        setSheetOpen(false);
        router.post('/logout');
    };

    const initial = auth.user?.name?.charAt(0).toUpperCase() || 'U';
    const isActive = (path: string) => currentPath === path;
    const isAdmin = auth.user?.role === 'admin';

    const avatarInner = auth.user?.profile_picture ? (
        <img
            src={`${appUrl}/storage/${auth.user.profile_picture}`}
            alt={auth.user.name}
            className="nav-avatar-img"
        />
    ) : (
        <span className="nav-avatar-initial">{initial}</span>
    );

    return (
        <>
            {/* DESKTOP / TOP NAV */}
            <nav className={`site-nav ${scrolled ? 'scrolled' : ''}`}>
                <Link href="/" className="nav-logo">
                    VANTA
                </Link>

                <div className="nav-right">
                    <Link
                        href="/product-page"
                        className={`nav-link ${isActive('/product-page') ? 'active' : ''}`}
                    >
                        <span>Shop</span>
                    </Link>

                    {isAdmin && (
                        <Link
                            href="/admin/orders"
                            className={`nav-link ${currentPath.startsWith('/admin') ? 'active' : ''}`}
                        >
                            <span>Admin</span>
                        </Link>
                    )}

                    {auth.user && (
                        <>
                            <span className="nav-divider" />

                            <Link
                                href="/wishlist"
                                className={`nav-wish ${isActive('/wishlist') ? 'active' : ''}`}
                                aria-label="Wishlist"
                                title="Wishlist"
                            >
                                <Heart
                                    size={18}
                                    fill={
                                        isActive('/wishlist')
                                            ? 'currentColor'
                                            : 'none'
                                    }
                                />
                                {wishCount > 0 && (
                                    <span className="nav-wish-badge">
                                        {wishCount > 99 ? '99+' : wishCount}
                                    </span>
                                )}
                            </Link>

                            <NotificationBell />
                        </>
                    )}

                    {auth.user ? (
                        <div className="nav-account" ref={dropdownRef}>
                            <button
                                className={`nav-avatar-btn ${menuOpen ? 'open' : ''}`}
                                onClick={() => setMenuOpen((o) => !o)}
                                aria-label="Account menu"
                            >
                                <span className="nav-avatar">
                                    {avatarInner}
                                </span>
                                <ChevronDown
                                    size={13}
                                    className="nav-avatar-chev"
                                />
                            </button>

                            {menuOpen && (
                                <div className="nav-dropdown">
                                    <div className="nav-dropdown-header">
                                        <div className="nav-dd-avatar">
                                            {avatarInner}
                                        </div>
                                        <div className="nav-dd-meta">
                                            <p className="nav-dd-name">
                                                {auth.user.name}
                                            </p>
                                            <p className="nav-dd-email">
                                                {auth.user.email}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="nav-dd-group">
                                        <Link
                                            href="/account/profile"
                                            className="nav-dd-item"
                                            onClick={() => setMenuOpen(false)}
                                        >
                                            <User size={15} /> Profile
                                        </Link>
                                        <Link
                                            href="/wishlist"
                                            className="nav-dd-item"
                                            onClick={() => setMenuOpen(false)}
                                        >
                                            <Heart size={15} /> Wishlist
                                            {wishCount > 0 && (
                                                <span className="nav-dd-count">
                                                    {wishCount}
                                                </span>
                                            )}
                                        </Link>
                                        <Link
                                            href="/account/addresses"
                                            className="nav-dd-item"
                                            onClick={() => setMenuOpen(false)}
                                        >
                                            <MapPin size={15} /> Addresses
                                        </Link>
                                        <Link
                                            href="/account/orders"
                                            className="nav-dd-item"
                                            onClick={() => setMenuOpen(false)}
                                        >
                                            <Package size={15} /> Orders
                                        </Link>
                                        <Link
                                            href="/account/settings"
                                            className="nav-dd-item"
                                            onClick={() => setMenuOpen(false)}
                                        >
                                            <Settings size={15} /> Settings
                                        </Link>
                                    </div>

                                    {isAdmin && (
                                        <div className="nav-dd-group">
                                            <p className="nav-dd-label">
                                                Admin
                                            </p>
                                            <Link
                                                href="/product-dashboard"
                                                className="nav-dd-item"
                                                onClick={() =>
                                                    setMenuOpen(false)
                                                }
                                            >
                                                <LayoutDashboard size={15} />{' '}
                                                Dashboard
                                            </Link>
                                            <Link
                                                href="/admin/orders"
                                                className="nav-dd-item"
                                                onClick={() =>
                                                    setMenuOpen(false)
                                                }
                                            >
                                                <Package size={15} /> Manage
                                                Orders
                                            </Link>
                                        </div>
                                    )}

                                    <button
                                        className="nav-dd-item nav-dd-logout"
                                        onClick={handleLogout}
                                    >
                                        <LogOut size={15} /> Log Out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="nav-auth-actions">
                            <Link href="/register" className="nav-ghost-btn">
                                Sign Up
                            </Link>
                            <Link href="/login" className="nav-login-btn">
                                <span className="nav-login-label">
                                    <LogIn size={14} />
                                    Log In
                                </span>
                            </Link>
                        </div>
                    )}
                </div>

                {/* MOBILE ICONS — sit in the top bar on small screens */}
                {auth.user && (
                    <div className="nav-mobile-icons">
                        <Link
                            href="/wishlist"
                            className={`nav-wish ${isActive('/wishlist') ? 'active' : ''}`}
                            aria-label="Wishlist"
                        >
                            <Heart
                                size={18}
                                fill={
                                    isActive('/wishlist')
                                        ? 'currentColor'
                                        : 'none'
                                }
                            />
                            {wishCount > 0 && (
                                <span className="nav-wish-badge">
                                    {wishCount > 99 ? '99+' : wishCount}
                                </span>
                            )}
                        </Link>
                        <NotificationBell />
                    </div>
                )}
            </nav>

            {/* MOBILE ACCOUNT SHEET */}
            {sheetOpen && auth.user && (
                <div
                    className="sheet-overlay"
                    onClick={() => setSheetOpen(false)}
                >
                    <div
                        className="account-sheet"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="sheet-grabber" />

                        <div className="sheet-header">
                            <div className="sheet-avatar">{avatarInner}</div>
                            <div className="sheet-meta">
                                <p className="sheet-name">{auth.user.name}</p>
                                <p className="sheet-email">
                                    {auth.user.email}
                                </p>
                            </div>
                            <button
                                className="sheet-close"
                                onClick={() => setSheetOpen(false)}
                                aria-label="Close"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <Link
                            href="/account/profile"
                            className="sheet-item"
                            onClick={() => setSheetOpen(false)}
                        >
                            <User size={17} /> Profile
                        </Link>
                        <Link
                            href="/wishlist"
                            className="sheet-item"
                            onClick={() => setSheetOpen(false)}
                        >
                            <Heart size={17} /> Wishlist
                            {wishCount > 0 && (
                                <span className="sheet-badge neutral">
                                    {wishCount}
                                </span>
                            )}
                        </Link>
                        <Link
                            href="/account/addresses"
                            className="sheet-item"
                            onClick={() => setSheetOpen(false)}
                        >
                            <MapPin size={17} /> Addresses
                        </Link>
                        <Link
                            href="/account/orders"
                            className="sheet-item"
                            onClick={() => setSheetOpen(false)}
                        >
                            <Package size={17} /> Orders
                            {unread > 0 && (
                                <span className="sheet-badge">{unread}</span>
                            )}
                        </Link>
                        <Link
                            href="/account/settings"
                            className="sheet-item"
                            onClick={() => setSheetOpen(false)}
                        >
                            <Settings size={17} /> Settings
                        </Link>

                        {isAdmin && (
                            <>
                                <p className="sheet-label">Admin</p>
                                <Link
                                    href="/product-dashboard"
                                    className="sheet-item"
                                    onClick={() => setSheetOpen(false)}
                                >
                                    <LayoutDashboard size={17} /> Dashboard
                                </Link>
                                <Link
                                    href="/admin/orders"
                                    className="sheet-item"
                                    onClick={() => setSheetOpen(false)}
                                >
                                    <Package size={17} /> Manage Orders
                                </Link>
                            </>
                        )}

                        <button
                            className="sheet-item sheet-logout"
                            onClick={handleLogout}
                        >
                            <LogOut size={17} /> Log Out
                        </button>
                    </div>
                </div>
            )}

            {/* MOBILE BOTTOM BAR */}
            <nav className="mobile-nav">
                <Link
                    href="/"
                    className={`mnav-item ${isActive('/') ? 'active' : ''}`}
                >
                    <Home size={19} />
                    <span>Home</span>
                </Link>

                <Link
                    href="/product-page"
                    className={`mnav-item ${isActive('/product-page') ? 'active' : ''}`}
                >
                    <Store size={19} />
                    <span>Shop</span>
                </Link>

                {auth.user && (
                    <Link
                        href="/wishlist"
                        className={`mnav-item ${isActive('/wishlist') ? 'active' : ''}`}
                    >
                        <Heart
                            size={19}
                            fill={
                                isActive('/wishlist') ? 'currentColor' : 'none'
                            }
                        />
                        {wishCount > 0 && <span className="mnav-count" />}
                        <span>Saved</span>
                    </Link>
                )}

                {auth.user ? (
                    <button
                        className={`mnav-item ${currentPath.startsWith('/account') || sheetOpen ? 'active' : ''}`}
                        onClick={() => setSheetOpen(true)}
                    >
                        <div className="mnav-avatar">{avatarInner}</div>
                        {unread > 0 && <span className="mnav-dot" />}
                        <span>Account</span>
                    </button>
                ) : (
                    <Link
                        href="/login"
                        className={`mnav-item ${isActive('/login') ? 'active' : ''}`}
                    >
                        <User size={19} />
                        <span>Log In</span>
                    </Link>
                )}
            </nav>

            <style>{`
                /* ===== DESKTOP TOP NAV ===== */
                .site-nav {
                    position: fixed; top: 0; left: 0; right: 0; z-index: 300;
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 1.15rem 3rem;
                    background: rgba(10,10,10,.55);
                    backdrop-filter: blur(16px) saturate(140%);
                    -webkit-backdrop-filter: blur(16px) saturate(140%);
                    border-bottom: 1px solid rgba(245,240,232,.05);
                    font-family: 'DM Sans', sans-serif;
                    transition: background .35s ease, border-color .35s ease,
                                padding .35s ease, box-shadow .35s ease;
                }
                .site-nav.scrolled {
                    padding: .85rem 3rem;
                    background: rgba(10,10,10,.86);
                    border-bottom-color: rgba(245,240,232,.09);
                    box-shadow: 0 12px 40px rgba(0,0,0,.35);
                }

                .nav-logo {
                    font-family: 'Bebas Neue', sans-serif;
                    font-size: 1.8rem; letter-spacing: .18em;
                    color: #f5f0e8; text-decoration: none;
                    position: relative;
                    transition: color .25s;
                }
                .nav-logo::after {
                    content: ''; position: absolute;
                    left: 0; bottom: -3px; width: 0; height: 1px;
                    background: #e8ff00;
                    transition: width .3s cubic-bezier(.4,0,.2,1);
                }
                .nav-logo:hover { color: #e8ff00; }
                .nav-logo:hover::after { width: 100%; }

                .nav-right { display: flex; align-items: center; gap: 1.35rem; }

                .nav-mobile-icons {
                    display: none;
                    align-items: center; gap: .85rem;
                }

                .nav-divider {
                    width: 1px; height: 20px;
                    background: rgba(245,240,232,.12);
                }

                .nav-link {
                    position: relative;
                    color: rgba(245,240,232,.62); text-decoration: none;
                    font-size: .73rem; font-weight: 600;
                    letter-spacing: .18em; text-transform: uppercase;
                    padding: .4rem 0;
                    transition: color .25s;
                }
                .nav-link::after {
                    content: ''; position: absolute;
                    left: 0; bottom: 0; width: 0; height: 1px;
                    background: #e8ff00;
                    transition: width .28s cubic-bezier(.4,0,.2,1);
                }
                .nav-link:hover { color: #f5f0e8; }
                .nav-link:hover::after { width: 100%; }
                .nav-link.active { color: #e8ff00; }
                .nav-link.active::after { width: 100%; }

                /* ===== WISHLIST ICON ===== */
                .nav-wish {
                    position: relative;
                    display: inline-flex; align-items: center; justify-content: center;
                    width: 34px; height: 34px;
                    color: rgba(245,240,232,.6);
                    text-decoration: none;
                    transition: color .22s, transform .22s;
                }
                .nav-wish:hover {
                    color: #ff3d2e;
                    transform: translateY(-1px) scale(1.06);
                }
                .nav-wish.active { color: #ff3d2e; }

                .nav-wish-badge {
                    position: absolute;
                    top: -1px; right: -3px;
                    min-width: 17px; height: 17px; padding: 0 4px;
                    border-radius: 9px;
                    background: #ff3d2e; color: #fff;
                    font-family: 'DM Sans', sans-serif;
                    font-size: .58rem; font-weight: 700;
                    display: flex; align-items: center; justify-content: center;
                    border: 1.5px solid #0a0a0a;
                    animation: wishPop .32s cubic-bezier(.34,1.6,.64,1);
                }
                @keyframes wishPop {
                    0% { transform: scale(0); }
                    70% { transform: scale(1.2); }
                    100% { transform: scale(1); }
                }

                /* AUTH BUTTONS */
                .nav-auth-actions {
                    display: flex; align-items: center; gap: .7rem;
                }

                .nav-ghost-btn {
                    display: inline-flex; align-items: center;
                    color: rgba(245,240,232,.6);
                    text-decoration: none;
                    font-size: .7rem; font-weight: 600;
                    letter-spacing: .15em; text-transform: uppercase;
                    padding: .72rem 1.15rem;
                    border: 1px solid rgba(245,240,232,.14);
                    transition: border-color .25s, color .25s, background .25s;
                }
                .nav-ghost-btn:hover {
                    color: #f5f0e8;
                    border-color: rgba(245,240,232,.4);
                    background: rgba(245,240,232,.04);
                }

                .nav-login-btn {
                    position: relative; overflow: hidden;
                    display: inline-flex; align-items: center;
                    background: #e8ff00; color: #0a0a0a;
                    text-decoration: none;
                    font-size: .7rem; font-weight: 700;
                    letter-spacing: .15em; text-transform: uppercase;
                    padding: .72rem 1.5rem;
                    box-shadow: 0 4px 18px rgba(232,255,0,.18);
                    transition: transform .22s cubic-bezier(.34,1.4,.64,1),
                                box-shadow .28s;
                }
                .nav-login-btn::before {
                    content: ''; position: absolute; inset: 0;
                    background: linear-gradient(115deg, #ff3d2e 0%, #ff6b4a 100%);
                    transform: translateX(-101%);
                    transition: transform .38s cubic-bezier(.4,0,.2,1);
                }
                .nav-login-btn:hover::before { transform: translateX(0); }
                .nav-login-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 28px rgba(232,255,0,.28);
                }
                .nav-login-btn:hover .nav-login-label { color: #f5f0e8; }
                .nav-login-btn:active { transform: translateY(0); }
                .nav-login-label {
                    position: relative; z-index: 1;
                    display: inline-flex; align-items: center; gap: .45rem;
                    transition: color .25s;
                }

                /* AVATAR TRIGGER */
                .nav-account { position: relative; }
                .nav-avatar-btn {
                    display: inline-flex; align-items: center; gap: .4rem;
                    background: transparent; border: none; padding: 0;
                    cursor: pointer;
                }
                .nav-avatar {
                    width: 38px; height: 38px;
                    border-radius: 50%;
                    overflow: hidden;
                    background: linear-gradient(145deg, #262626, #131313);
                    display: flex; align-items: center; justify-content: center;
                    box-shadow:
                        0 0 0 1px rgba(232,255,0,.28),
                        0 0 0 4px rgba(232,255,0,.05);
                    transition: box-shadow .28s, transform .22s;
                }
                .nav-avatar-btn:hover .nav-avatar {
                    transform: translateY(-1px);
                    box-shadow:
                        0 0 0 1px rgba(232,255,0,.75),
                        0 0 0 5px rgba(232,255,0,.12);
                }
                .nav-avatar-btn.open .nav-avatar {
                    box-shadow:
                        0 0 0 1px #e8ff00,
                        0 0 0 5px rgba(232,255,0,.15);
                }
                .nav-avatar-chev {
                    color: rgba(245,240,232,.35);
                    transition: transform .28s, color .22s;
                }
                .nav-avatar-btn.open .nav-avatar-chev {
                    transform: rotate(180deg); color: #e8ff00;
                }
                .nav-avatar-img { width: 100%; height: 100%; object-fit: cover; }
                .nav-avatar-initial {
                    font-family: 'Bebas Neue', sans-serif;
                    font-size: 1.05rem; color: #e8ff00;
                    letter-spacing: .04em; line-height: 1;
                }

                /* DROPDOWN */
                .nav-dropdown {
                    position: absolute; top: 52px; right: 0;
                    width: 258px;
                    background: linear-gradient(158deg, #202020 0%, #151515 100%);
                    border: 1px solid rgba(245,240,232,.1);
                    box-shadow: 0 28px 80px rgba(0,0,0,.7);
                    animation: navDrop .2s cubic-bezier(.34,1.3,.64,1);
                    overflow: hidden;
                }
                @keyframes navDrop {
                    from { opacity: 0; transform: translateY(-10px) scale(.97); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }

                .nav-dropdown-header {
                    display: flex; align-items: center; gap: .8rem;
                    padding: 1.1rem;
                    border-bottom: 1px solid rgba(245,240,232,.07);
                    background: rgba(0,0,0,.3);
                }
                .nav-dd-avatar {
                    width: 42px; height: 42px; flex-shrink: 0;
                    border-radius: 50%; overflow: hidden;
                    background: linear-gradient(145deg, #262626, #131313);
                    display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 0 0 1px rgba(232,255,0,.25);
                }
                .nav-dd-meta { min-width: 0; }
                .nav-dd-name {
                    font-size: .84rem; font-weight: 600; color: #f5f0e8;
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                }
                .nav-dd-email {
                    font-size: .68rem; color: rgba(245,240,232,.36); margin-top: .15rem;
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                }

                .nav-dd-group {
                    padding: .4rem 0;
                    border-bottom: 1px solid rgba(245,240,232,.06);
                }
                .nav-dd-label {
                    padding: .5rem 1.1rem .3rem;
                    font-size: .55rem; letter-spacing: .18em;
                    text-transform: uppercase; font-weight: 700;
                    color: rgba(232,255,0,.55);
                }

                .nav-dd-item {
                    display: flex; align-items: center; gap: .75rem;
                    padding: .72rem 1.1rem;
                    color: rgba(245,240,232,.66);
                    font-family: 'DM Sans', sans-serif;
                    font-size: .8rem;
                    text-decoration: none;
                    border: none; background: none;
                    width: 100%; text-align: left;
                    cursor: pointer;
                    position: relative;
                    transition: background .16s, color .16s, padding-left .22s;
                }
                .nav-dd-item svg { flex-shrink: 0; color: rgba(245,240,232,.4); transition: color .16s; }
                .nav-dd-item::before {
                    content: ''; position: absolute;
                    left: 0; top: 0; bottom: 0; width: 2px;
                    background: #e8ff00;
                    transform: scaleY(0);
                    transition: transform .2s;
                }
                .nav-dd-item:hover {
                    background: rgba(232,255,0,.05);
                    color: #f5f0e8;
                    padding-left: 1.32rem;
                }
                .nav-dd-item:hover svg { color: #e8ff00; }
                .nav-dd-item:hover::before { transform: scaleY(1); }

                .nav-dd-count {
                    margin-left: auto;
                    min-width: 19px; height: 19px; padding: 0 5px;
                    border-radius: 10px;
                    background: rgba(245,240,232,.08);
                    border: 1px solid rgba(245,240,232,.12);
                    color: rgba(245,240,232,.6);
                    font-size: .6rem; font-weight: 700;
                    display: flex; align-items: center; justify-content: center;
                }

                .nav-dd-logout { color: rgba(255,61,46,.85); }
                .nav-dd-logout svg { color: rgba(255,61,46,.7); }
                .nav-dd-logout::before { background: #ff3d2e; }
                .nav-dd-logout:hover {
                    background: rgba(255,61,46,.07);
                    color: #ff3d2e;
                }
                .nav-dd-logout:hover svg { color: #ff3d2e; }

                /* ===== MOBILE ACCOUNT SHEET ===== */
                .sheet-overlay {
                    display: none;
                    position: fixed; inset: 0; z-index: 400;
                    background: rgba(0,0,0,.72);
                    backdrop-filter: blur(5px);
                    align-items: flex-end;
                    animation: sheetFade .2s ease;
                }
                @keyframes sheetFade { from { opacity: 0; } to { opacity: 1; } }

                .account-sheet {
                    width: 100%;
                    background: linear-gradient(160deg, #202020 0%, #141414 100%);
                    border-top: 1px solid rgba(232,255,0,.22);
                    padding: .6rem 0 calc(1.2rem + env(safe-area-inset-bottom, 0px));
                    animation: sheetUp .3s cubic-bezier(.32,1.25,.6,1);
                    font-family: 'DM Sans', sans-serif;
                    max-height: 85vh; overflow-y: auto;
                }
                @keyframes sheetUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }

                .sheet-grabber {
                    width: 40px; height: 4px; border-radius: 4px;
                    background: rgba(245,240,232,.22);
                    margin: 0 auto .9rem;
                }

                .sheet-header {
                    display: flex; align-items: center; gap: .85rem;
                    padding: .6rem 1.3rem 1.1rem;
                    border-bottom: 1px solid rgba(245,240,232,.07);
                    margin-bottom: .4rem;
                }
                .sheet-avatar {
                    width: 48px; height: 48px; flex-shrink: 0;
                    border-radius: 50%; overflow: hidden;
                    background: linear-gradient(145deg, #262626, #131313);
                    display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 0 0 1px rgba(232,255,0,.32),
                                0 0 0 4px rgba(232,255,0,.06);
                }
                .sheet-avatar .nav-avatar-initial { font-size: 1.35rem; }
                .sheet-meta { flex: 1; min-width: 0; }
                .sheet-name {
                    font-size: .94rem; font-weight: 600; color: #f5f0e8;
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                }
                .sheet-email {
                    font-size: .72rem; color: rgba(245,240,232,.36); margin-top: .18rem;
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                }
                .sheet-close {
                    background: none; border: none; flex-shrink: 0;
                    color: rgba(245,240,232,.32); padding: .3rem;
                    cursor: pointer; display: flex;
                    transition: color .2s;
                }
                .sheet-close:active { color: #ff3d2e; }

                .sheet-label {
                    padding: .9rem 1.3rem .35rem;
                    font-size: .56rem; letter-spacing: .18em;
                    text-transform: uppercase; font-weight: 700;
                    color: rgba(232,255,0,.5);
                }

                .sheet-item {
                    display: flex; align-items: center; gap: .9rem;
                    width: 100%; text-align: left;
                    padding: 1rem 1.3rem;
                    color: rgba(245,240,232,.75);
                    font-family: 'DM Sans', sans-serif;
                    font-size: .88rem;
                    text-decoration: none;
                    border: none; background: none;
                    cursor: pointer;
                    transition: background .15s;
                }
                .sheet-item svg { flex-shrink: 0; color: rgba(245,240,232,.42); }
                .sheet-item:active { background: rgba(232,255,0,.07); }

                .sheet-badge {
                    margin-left: auto;
                    min-width: 20px; height: 20px; padding: 0 6px;
                    border-radius: 10px;
                    background: #ff3d2e; color: #fff;
                    font-size: .62rem; font-weight: 700;
                    display: flex; align-items: center; justify-content: center;
                }
                .sheet-badge.neutral {
                    background: rgba(245,240,232,.08);
                    border: 1px solid rgba(245,240,232,.12);
                    color: rgba(245,240,232,.6);
                }

                .sheet-logout {
                    border-top: 1px solid rgba(245,240,232,.07);
                    margin-top: .5rem;
                    color: #ff3d2e;
                }
                .sheet-logout svg { color: #ff3d2e; }
                .sheet-logout:active { background: rgba(255,61,46,.09); }

                /* ===== MOBILE BOTTOM BAR ===== */
                .mobile-nav {
                    display: none;
                    position: fixed; bottom: 0; left: 0; right: 0; z-index: 300;
                    background: rgba(10,10,10,.92);
                    backdrop-filter: blur(18px) saturate(140%);
                    -webkit-backdrop-filter: blur(18px) saturate(140%);
                    border-top: 1px solid rgba(245,240,232,.08);
                    padding: .5rem 0 calc(.5rem + env(safe-area-inset-bottom, 0px));
                    font-family: 'DM Sans', sans-serif;
                }

                .mnav-item {
                    flex: 1;
                    display: flex; flex-direction: column; align-items: center; gap: .3rem;
                    color: rgba(245,240,232,.4);
                    text-decoration: none;
                    padding: .45rem 0;
                    background: none; border: none;
                    font-family: 'DM Sans', sans-serif;
                    cursor: pointer;
                    position: relative;
                    transition: color .22s;
                }
                .mnav-item span {
                    font-size: .57rem; letter-spacing: .12em;
                    text-transform: uppercase; font-weight: 600;
                }
                .mnav-item::before {
                    content: ''; position: absolute;
                    top: -1px; left: 50%; transform: translateX(-50%) scaleX(0);
                    width: 26px; height: 2px;
                    background: #e8ff00;
                    transition: transform .28s cubic-bezier(.4,0,.2,1);
                }
                .mnav-item.active { color: #e8ff00; }
                .mnav-item.active::before { transform: translateX(-50%) scaleX(1); }
                .mnav-item.active .mnav-avatar {
                    box-shadow: 0 0 0 1.5px #e8ff00;
                }

                .mnav-avatar {
                    width: 22px; height: 22px;
                    border-radius: 50%; overflow: hidden;
                    background: linear-gradient(145deg, #262626, #131313);
                    display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 0 0 1px rgba(232,255,0,.3);
                    transition: box-shadow .22s;
                }
                .mnav-avatar .nav-avatar-initial { font-size: .7rem; }

                .mnav-dot {
                    position: absolute;
                    top: .35rem; right: 50%;
                    transform: translateX(20px);
                    width: 7px; height: 7px; border-radius: 50%;
                    background: #ff3d2e;
                    border: 1.5px solid #0a0a0a;
                }

                .mnav-count {
                    position: absolute;
                    top: .35rem; right: 50%;
                    transform: translateX(16px);
                    width: 6px; height: 6px; border-radius: 50%;
                    background: #ff3d2e;
                    border: 1.5px solid #0a0a0a;
                }

                @media (max-width: 900px) {
                    .site-nav { padding: .9rem 1.3rem; }
                    .site-nav.scrolled { padding: .75rem 1.3rem; }
                }
                @media (max-width: 768px) {
                    .site-nav .nav-right { display: none; }
                    .nav-mobile-icons { display: flex; }
                    .mobile-nav { display: flex; }
                    .sheet-overlay { display: flex; }
                    body { padding-bottom: 68px; }
                }
            `}</style>
        </>
    );
}

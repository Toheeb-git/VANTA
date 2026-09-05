import { Link, usePage } from '@inertiajs/react';
import { User, Heart, MapPin, Package, Settings } from 'lucide-react';

const TABS = [
    { href: '/account/profile', label: 'Profile', Icon: User },
    { href: '/wishlist', label: 'Wishlist', Icon: Heart },
    { href: '/account/addresses', label: 'Addresses', Icon: MapPin },
    { href: '/account/orders', label: 'Orders', Icon: Package },
    { href: '/account/settings', label: 'Settings', Icon: Settings },
];

export default function AccountTabs() {
    const { url } = usePage();

    return (
        <>
            <nav className="acct-tabs" aria-label="Account sections">
                {TABS.map(({ href, label, Icon }) => (
                    <Link
                        key={href}
                        href={href}
                        className={`acct-tab ${url.startsWith(href) ? 'active' : ''}`}
                    >
                        <Icon size={12} />
                        <span>{label}</span>
                    </Link>
                ))}
            </nav>

            <style>{`
                .acct-tabs {
                    display: flex;
                    gap: .35rem;
                    margin-bottom: 2rem;
                    overflow-x: auto;
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                    padding-bottom: .2rem;
                }
                .acct-tabs::-webkit-scrollbar { display: none; }

                .acct-tab {
                    display: inline-flex;
                    align-items: center;
                    gap: .45rem;
                    flex-shrink: 0;
                    font-family: 'DM Sans', sans-serif;
                    font-size: .64rem;
                    letter-spacing: .13em;
                    text-transform: uppercase;
                    font-weight: 600;
                    color: rgba(245,240,232,.4);
                    text-decoration: none;
                    padding: .65rem 1.1rem;
                    border: 1px solid rgba(245,240,232,.09);
                    background: rgba(245,240,232,.02);
                    white-space: nowrap;
                    transition: all .24s;
                }
                .acct-tab:hover {
                    color: #f5f0e8;
                    border-color: rgba(245,240,232,.22);
                    transform: translateY(-1px);
                }
                .acct-tab.active {
                    color: #0a0a0a;
                    background: #e8ff00;
                    border-color: #e8ff00;
                    font-weight: 700;
                    box-shadow: 0 4px 18px rgba(232,255,0,.18);
                }

                @media (max-width: 560px) {
                    .acct-tab { font-size: .58rem; padding: .6rem .85rem; }
                }
            `}</style>
        </>
    );
}

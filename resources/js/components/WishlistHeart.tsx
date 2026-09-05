import { router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';

interface Props {
    productId: number;
    initialSaved?: boolean;
    size?: number;
    onToggled?: (saved: boolean) => void;
}

const csrf = () =>
    document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute('content') || '';

export default function WishlistHeart({
    productId,
    initialSaved = false,
    size = 16,
    onToggled,
}: Props) {
    const { auth } = usePage().props as unknown as {
        auth: { user: { id: number } | null };
    };

    const [saved, setSaved] = useState(initialSaved);
    const [busy, setBusy] = useState(false);
    const [pop, setPop] = useState(false);

    // Keep in sync when the parent's wishlist IDs arrive after mount
    useEffect(() => {
        setSaved(initialSaved);
    }, [initialSaved]);

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!auth.user) {
            router.visit(`/login?redirect=${window.location.pathname}`);
            return;
        }

        if (busy) return;

        const next = !saved;
        setSaved(next);
        setBusy(true);

        if (next) {
            setPop(true);
            setTimeout(() => setPop(false), 420);
        }

        fetch('/wishlist/toggle', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-CSRF-TOKEN': csrf(),
            },
            body: JSON.stringify({ product_id: productId }),
        })
            .then((r) => {
                if (r.status === 419) {
                    window.location.reload();
                    return null;
                }
                return r.ok ? r.json() : null;
            })
            .then((d) => {
                if (!d) {
                    setSaved(!next);
                    return;
                }
                setSaved(d.saved);
                onToggled?.(d.saved);
                window.dispatchEvent(
                    new CustomEvent('wishlist:changed', {
                        detail: { count: d.count },
                    }),
                );
            })
            .catch(() => setSaved(!next))
            .finally(() => setBusy(false));
    };

    return (
        <button
            className={`wl-heart ${saved ? 'wl-on' : ''} ${pop ? 'wl-pop' : ''}`}
            onClick={handleClick}
            aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
            aria-pressed={saved}
            title={saved ? 'Saved' : 'Save for later'}
        >
            <Heart size={size} fill={saved ? 'currentColor' : 'none'} />
            <style>{`
                .wl-heart {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 34px;
                    height: 34px;
                    background: rgba(10,10,10,.85);
                    backdrop-filter: blur(6px);
                    border: 1px solid rgba(245,240,232,.14);
                    color: rgba(245,240,232,.6);
                    padding: 0;
                    transition: color .22s, border-color .22s, background .22s, transform .18s;
                }
                .wl-heart:hover {
                    color: #ff3d2e;
                    border-color: rgba(255,61,46,.45);
                    background: rgba(255,61,46,.12);
                    transform: scale(1.08);
                }
                .wl-heart:active { transform: scale(.94); }
                .wl-on {
                    color: #ff3d2e;
                    border-color: rgba(255,61,46,.5);
                    background: rgba(255,61,46,.14);
                }
                .wl-pop { animation: wlPop .42s cubic-bezier(.34,1.6,.64,1); }
                @keyframes wlPop {
                    0% { transform: scale(1); }
                    45% { transform: scale(1.35); }
                    100% { transform: scale(1); }
                }
                @media (prefers-reduced-motion: reduce) {
                    .wl-heart, .wl-pop { transition: none; animation: none; }
                    .wl-heart:hover { transform: none; }
                }
            `}</style>
        </button>
    );
}

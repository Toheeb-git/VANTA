import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { X, Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';

interface CartItem {
    id: number;
    quantity: number;
    product: {
        id: number;
        name: string;
        price: number | string;
        image: string;
        stock: number;
        discount_price: number | string | null;
    };
}

interface CartResponse {
    items: CartItem[];
    total: number;
    count: number;
}

export default function CartWidget() {
    const { appUrl, auth } = usePage().props as unknown as {
        appUrl: string;
        auth: { user: { role: string } | null };
    };

    const [open, setOpen] = useState(false);
    const [cart, setCart] = useState<CartResponse>({
        items: [],
        total: 0,
        count: 0,
    });
    const [loading, setLoading] = useState(false);

    const fetchCart = () => {
        fetch('/cart', {
            headers: { Accept: 'application/json' },
        })
            .then((res) => res.json())
            .then((data: CartResponse) => setCart(data))
            .catch(() => {});
    };

    useEffect(() => {
        fetchCart();
    }, []);

    useEffect(() => {
        const handler = () => fetchCart();
        window.addEventListener('cart:refresh', handler);
        return () => window.removeEventListener('cart:refresh', handler);
    }, []);

    const updateQuantity = async (id: number, quantity: number) => {
        if (quantity < 1) return;
        setLoading(true);
        try {
            const res = await fetch(`/cart/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN':
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') || '',
                },
                body: JSON.stringify({ quantity }),
            });

            if (res.status === 419) {
                window.location.reload();
                return;
            }

            const data = await res.json();
            if (res.ok) setCart(data);
        } finally {
            setLoading(false);
        }
    };
    const removeItem = async (id: number) => {
        setLoading(true);
        try {
            const res = await fetch(`/cart/${id}`, {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN':
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') || '',
                },
            });

            if (res.status === 419) {
                window.location.reload();
                return;
            }

            const data = await res.json();
            if (res.ok) setCart(data);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckout = () => {
        if (!auth.user) {
            router.visit('/login?redirect=/checkout');
            return;
        }
        router.visit('/checkout');
    };

    return (
        <>
            <button
                className="cw-fab"
                onClick={() => setOpen(true)}
                aria-label="Open cart"
            >
                <ShoppingCart size={20} />
                {cart.count > 0 && (
                    <span className="cw-badge">{cart.count}</span>
                )}
            </button>

            {open && (
                <div className="cw-overlay" onClick={() => setOpen(false)}>
                    <div
                        className="cw-drawer"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="cw-header">
                            <h3>
                                Your Cart{' '}
                                {cart.count > 0 && (
                                    <span className="cw-count">
                                        ({cart.count})
                                    </span>
                                )}
                            </h3>
                            <button
                                className="cw-close"
                                onClick={() => setOpen(false)}
                                aria-label="Close cart"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="cw-body">
                            {cart.items.length === 0 ? (
                                <div className="cw-empty">
                                    <ShoppingCart size={36} />
                                    <p>Your cart is empty</p>
                                </div>
                            ) : (
                                cart.items.map((item) => (
                                    <div key={item.id} className="cw-item">
                                        <img
                                            src={`${appUrl}/storage/${item.product.image}`}
                                            alt={item.product.name}
                                            className="cw-item-img"
                                        />
                                        <div className="cw-item-info">
                                            <p className="cw-item-name">
                                                {item.product.name}
                                            </p>
                                            <p className="cw-item-price">
                                                ₦
                                                {Number(
                                                    item.product
                                                        .discount_price ??
                                                        item.product.price,
                                                ).toLocaleString()}
                                            </p>
                                            <div className="cw-qty-row">
                                                <button
                                                    disabled={loading}
                                                    onClick={() =>
                                                        updateQuantity(
                                                            item.id,
                                                            item.quantity - 1,
                                                        )
                                                    }
                                                >
                                                    <Minus size={12} />
                                                </button>
                                                <span>{item.quantity}</span>
                                                <button
                                                    disabled={
                                                        loading ||
                                                        item.quantity >=
                                                            item.product.stock
                                                    }
                                                    onClick={() =>
                                                        updateQuantity(
                                                            item.id,
                                                            item.quantity + 1,
                                                        )
                                                    }
                                                >
                                                    <Plus size={12} />
                                                </button>
                                            </div>
                                        </div>
                                        <button
                                            className="cw-remove"
                                            disabled={loading}
                                            onClick={() => removeItem(item.id)}
                                            aria-label="Remove item"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {cart.items.length > 0 && (
                            <div className="cw-footer">
                                <div className="cw-total-row">
                                    <span>Total</span>
                                    <span className="cw-total-amount">
                                        ₦{Number(cart.total).toLocaleString()}
                                    </span>
                                </div>
                                <button
                                    className="cw-checkout-btn"
                                    onClick={handleCheckout}
                                >
                                    Checkout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style>{`
                .cw-fab {
                    position: fixed; bottom: 2rem; right: 2rem; z-index: 500;
                    width: 56px; height: 56px;
                    background: var(--accent, #e8ff00);
                    color: var(--black, #0a0a0a);
                    border: none;
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer;
                    box-shadow: 0 8px 30px rgba(0,0,0,.5);
                    transition: transform .2s;
                }
                .cw-fab:hover { transform: translateY(-3px) scale(1.05); }

                .cw-badge {
                    position: absolute; top: -6px; right: -6px;
                    background: var(--accent2, #ff3d2e); color: #fff;
                    width: 22px; height: 22px; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    font-size: .68rem; font-weight: 700;
                    font-family: 'DM Sans', sans-serif;
                    border: 2px solid var(--black, #0a0a0a);
                }

                .cw-overlay {
                    position: fixed; inset: 0; z-index: 600;
                    background: rgba(0,0,0,.6);
                    display: flex; justify-content: flex-end;
                    animation: cwFadeIn .2s ease;
                }
                @keyframes cwFadeIn { from { opacity: 0; } to { opacity: 1; } }

                .cw-drawer {
                    width: 100%; max-width: 400px; height: 100%;
                    background: var(--mid, #1c1c1c);
                    border-left: 1px solid rgba(245,240,232,.08);
                    display: flex; flex-direction: column;
                    animation: cwSlideIn .25s cubic-bezier(.4,0,.2,1);
                }
                @keyframes cwSlideIn {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }

                .cw-header {
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 1.4rem 1.5rem;
                    border-bottom: 1px solid rgba(245,240,232,.08);
                    font-family: 'DM Sans', sans-serif;
                    color: #f5f0e8;
                }
                .cw-header h3 { font-size: 1rem; font-weight: 600; }
                .cw-count { color: rgba(245,240,232,.4); font-weight: 400; }
                .cw-close {
                    background: none; border: none; color: rgba(245,240,232,.5);
                    cursor: pointer; padding: .3rem;
                }
                .cw-close:hover { color: #fff; }

                .cw-body {
                    flex: 1; overflow-y: auto; padding: 1rem 1.5rem;
                }
                .cw-empty {
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    height: 100%; color: rgba(245,240,232,.3);
                    font-family: 'DM Sans', sans-serif; font-size: .85rem; gap: .8rem;
                }

                .cw-item {
                    display: flex; gap: .9rem; padding: 1rem 0;
                    border-bottom: 1px solid rgba(245,240,232,.06);
                }
                .cw-item-img {
                    width: 60px; height: 60px; object-fit: cover; flex-shrink: 0;
                }
                .cw-item-info { flex: 1; min-width: 0; font-family: 'DM Sans', sans-serif; }
                .cw-item-name {
                    font-size: .85rem; color: #f5f0e8; font-weight: 500;
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                }
                .cw-item-price {
                    font-size: .8rem; color: var(--accent, #e8ff00); margin-top: .25rem;
                }
                .cw-qty-row {
                    display: flex; align-items: center; gap: .7rem; margin-top: .6rem;
                }
                .cw-qty-row button {
                    width: 22px; height: 22px;
                    border: 1px solid rgba(245,240,232,.15); background: transparent;
                    color: #f5f0e8; display: flex; align-items: center; justify-content: center;
                    cursor: pointer;
                }
                .cw-qty-row button:disabled { opacity: .3; cursor: not-allowed; }
                .cw-qty-row span { font-size: .82rem; color: #f5f0e8; min-width: 16px; text-align: center; }

                .cw-remove {
                    background: none; border: none; color: rgba(245,240,232,.3);
                    cursor: pointer; align-self: flex-start; padding: .3rem;
                    transition: color .2s;
                }
                .cw-remove:hover { color: var(--accent2, #ff3d2e); }

                .cw-footer {
                    padding: 1.4rem 1.5rem;
                    border-top: 1px solid rgba(245,240,232,.08);
                }
                .cw-total-row {
                    display: flex; justify-content: space-between; align-items: center;
                    font-family: 'DM Sans', sans-serif; margin-bottom: 1rem;
                }
                .cw-total-row span:first-child {
                    font-size: .75rem; letter-spacing: .1em; text-transform: uppercase;
                    color: rgba(245,240,232,.5);
                }
                .cw-total-amount {
                    font-size: 1.2rem; font-weight: 700; color: var(--accent, #e8ff00);
                }
                .cw-checkout-btn {
                    width: 100%; background: var(--accent, #e8ff00); color: var(--black, #0a0a0a);
                    border: none; padding: .9rem; font-family: 'DM Sans', sans-serif;
                    font-size: .78rem; font-weight: 600; letter-spacing: .1em; text-transform: uppercase;
                    cursor: pointer; transition: background .2s;
                }
                .cw-checkout-btn:hover { background: var(--accent2, #ff3d2e); color: #fff; }
@media (max-width: 768px) {
    .cw-fab { bottom: 5.5rem; }
}
                }
            `}</style>
        </>
    );
}

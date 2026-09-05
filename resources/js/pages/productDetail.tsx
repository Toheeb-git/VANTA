import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import {
    ShoppingCart,
    Minus,
    Plus,
    Check,
    Truck,
    RotateCcw,
    ShieldCheck,
    ArrowLeft,
    ChevronRight,
    PackageX,
    MessageSquare,
    BadgeCheck,
    Pencil,
    Trash2,
    X,
    AlertTriangle,
} from 'lucide-react';
import SiteNav from '@/components/SiteNav';
import CartWidget from '@/components/CartWidget';
import WishlistHeart from '@/components/WishlistHeart';
import StarRating from '@/components/StarRating';

interface Product {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    price: number | string;
    discount_price: number | string | null;
    stock: number;
    image: string;
    category: string;
}

interface Review {
    id: number;
    rating: number;
    title: string | null;
    body: string | null;
    created_at: string;
    is_verified: boolean;
    is_mine: boolean;
    user: {
        name: string;
        profile_picture: string | null;
        avatar_url: string | null;
    };
}

interface MyReview {
    id: number;
    rating: number;
    title: string | null;
    body: string | null;
}

export default function ProductDetail() {
    const {
        product,
        related,
        appUrl,
        inWishlist,
        canReview,
        myReview,
        reviews,
        ratingSummary,
    } = usePage().props as unknown as {
        product: Product;
        related: Product[];
        appUrl: string;
        inWishlist: boolean;
        canReview: boolean;
        myReview: MyReview | null;
        reviews: Review[];
        ratingSummary: {
            average: number;
            total: number;
            breakdown: Record<string, number>;
        };
    };

    const cursorRef = useRef<HTMLDivElement>(null);
    const reviewsRef = useRef<HTMLDivElement>(null);

    const [qty, setQty] = useState(1);
    const [adding, setAdding] = useState(false);
    const [added, setAdded] = useState(false);

    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(false);
    const [hoverStar, setHoverStar] = useState(0);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [filter, setFilter] = useState<number | null>(null);

    const reviewForm = useForm({
        rating: myReview?.rating ?? 0,
        title: myReview?.title ?? '',
        body: myReview?.body ?? '',
    });

    const outOfStock = product.stock <= 0;
    const lowStock = product.stock > 0 && product.stock <= 5;

    const price = Number(product.discount_price ?? product.price);
    const wasPrice = product.discount_price ? Number(product.price) : null;
    const savePct = wasPrice
        ? Math.round(((wasPrice - price) / wasPrice) * 100)
        : 0;

    const scrollToReviews = () => {
        reviewsRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
        });
    };

    const openWrite = () => {
        reviewForm.setData({ rating: 0, title: '', body: '' });
        setEditing(false);
        setShowForm(true);
        setTimeout(scrollToReviews, 80);
    };

    const openEdit = () => {
        if (!myReview) return;
        reviewForm.setData({
            rating: myReview.rating,
            title: myReview.title ?? '',
            body: myReview.body ?? '',
        });
        setEditing(true);
        setShowForm(true);
        setTimeout(scrollToReviews, 80);
    };

    /* ---- cursor ---- */
    useEffect(() => {
        const cursor = cursorRef.current;
        if (!cursor) return;
        const onMove = (e: MouseEvent) => {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
        };
        document.addEventListener('mousemove', onMove);
        const els = document.querySelectorAll(
            'a, button, input, textarea, span[role="radio"]',
        );
        els.forEach((el) => {
            el.addEventListener('mouseenter', () =>
                cursor.classList.add('cursor-expand'),
            );
            el.addEventListener('mouseleave', () =>
                cursor.classList.remove('cursor-expand'),
            );
        });
        return () => document.removeEventListener('mousemove', onMove);
    }, [product.id, related.length, showForm, reviews.length, deleteOpen]);

    /* ---- reset when navigating between products ---- */
    useEffect(() => {
        setQty(1);
        setAdded(false);
        setShowForm(false);
        setEditing(false);
        setFilter(null);
    }, [product.id]);

    /* ---- auto-open the form when arriving from an order ---- */
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('review') !== '1') return;

        if (canReview) {
            openWrite();
        } else if (myReview) {
            openEdit();
        } else {
            setTimeout(scrollToReviews, 120);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [product.id]);

    useEffect(() => {
        if (!added) return;
        const t = setTimeout(() => setAdded(false), 2600);
        return () => clearTimeout(t);
    }, [added]);

    const clampQty = (n: number) =>
        Math.max(1, Math.min(n, Math.max(product.stock, 1)));

    const addToCart = async () => {
        if (outOfStock || adding) return;
        setAdding(true);

        try {
            const res = await fetch('/cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN':
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    product_id: product.id,
                    quantity: qty,
                }),
            });

            if (res.status === 419) {
                window.location.reload();
                return;
            }

            if (res.ok) {
                window.dispatchEvent(new Event('cart:refresh'));
                setAdded(true);
            }
        } catch {
            // network error — ignore
        } finally {
            setAdding(false);
        }
    };

    const closeForm = () => {
        setShowForm(false);
        setEditing(false);
        setHoverStar(0);
        reviewForm.clearErrors();
    };

    const submitReview = (e: React.FormEvent) => {
        e.preventDefault();

        if (editing && myReview) {
            reviewForm.patch(`/review/${myReview.id}`, {
                preserveScroll: true,
                onSuccess: () => closeForm(),
            });
        } else {
            reviewForm.post(`/product/${product.id}/review`, {
                preserveScroll: true,
                onSuccess: () => closeForm(),
            });
        }
    };

    const deleteReview = () => {
        if (!myReview) return;
        router.delete(`/review/${myReview.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteOpen(false);
                closeForm();
            },
        });
    };

    const fmtDate = (iso: string) =>
        new Date(iso).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });

    const shown = filter ? reviews.filter((r) => r.rating === filter) : reviews;

    const pct = (n: number) =>
        ratingSummary.total ? (n / ratingSummary.total) * 100 : 0;

    const avatarOf = (u: Review['user']) =>
        u.profile_picture
            ? `${appUrl}/storage/${u.profile_picture}`
            : u.avatar_url || null;

    const VERDICTS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

    return (
        <>
            <Head title={product.name}>
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
                        --mid: #1c1c1c; --border: #262626; --muted: #6b6b6b;
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
                        from { opacity: 0; transform: translateY(22px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes slideDown {
                        from { opacity: 0; transform: translateY(-12px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }
                    @keyframes modalIn {
                        from { opacity: 0; transform: scale(.94) translateY(10px); }
                        to { opacity: 1; transform: scale(1) translateY(0); }
                    }
                    @keyframes grain {
                        0%,100%{transform:translate(0,0)}10%{transform:translate(-5%,-10%)}
                        30%{transform:translate(3%,-15%)}50%{transform:translate(12%,9%)}
                        70%{transform:translate(9%,4%)}90%{transform:translate(-1%,7%)}
                    }
                    @keyframes pulseSoft {
                        0%,100% { opacity: .85; }
                        50% { opacity: 1; }
                    }
                    @keyframes barGrow {
                        from { transform: scaleX(0); }
                        to { transform: scaleX(1); }
                    }

                    .pd-page {
                        min-height: 100vh; position: relative; overflow: hidden;
                        padding: 7.5rem 1.5rem 5rem;
                    }
                    .pd-page::before {
                        content: ''; position: absolute; inset: 0;
                        background:
                            radial-gradient(circle at 72% 12%, rgba(232,255,0,.06) 0%, transparent 55%),
                            radial-gradient(circle at 14% 86%, rgba(255,61,46,.045) 0%, transparent 50%);
                        z-index: 0; pointer-events: none;
                    }
                    .pd-page::after {
                        content: ''; position: absolute; inset: -200%;
                        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
                        opacity: .4; z-index: 0; pointer-events: none;
                        animation: grain 8s steps(10) infinite;
                    }

                    .pd-shell {
                        position: relative; z-index: 2;
                        width: 100%; max-width: 1120px; margin: 0 auto;
                    }

                    .pd-crumbs {
                        display: flex; align-items: center; gap: .4rem;
                        font-size: .64rem; letter-spacing: .12em; text-transform: uppercase;
                        color: rgba(245,240,232,.3); font-weight: 600;
                        margin-bottom: 1.8rem; flex-wrap: wrap;
                        animation: fadeUp .5s ease both;
                    }
                    .pd-crumbs a {
                        color: rgba(245,240,232,.45); text-decoration: none;
                        transition: color .2s;
                    }
                    .pd-crumbs a:hover { color: var(--accent); }
                    .pd-crumbs .current { color: rgba(245,240,232,.7); }

                    .pd-grid {
                        display: grid;
                        grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
                        gap: 3rem;
                        align-items: start;
                        margin-bottom: 4.5rem;
                    }

                    .pd-media {
                        position: relative;
                        animation: fadeUp .6s .05s ease both;
                    }
                    .pd-img-frame {
                        position: relative;
                        aspect-ratio: 1;
                        overflow: hidden;
                        background: linear-gradient(158deg, #1e1e1e 0%, #131313 100%);
                        border: 1px solid rgba(245,240,232,.075);
                    }
                    .pd-img-frame img {
                        width: 100%; height: 100%; object-fit: cover;
                        transition: transform .7s cubic-bezier(.22,1,.36,1);
                    }
                    .pd-img-frame:hover img { transform: scale(1.05); }
                    .pd-img-frame.dim img { opacity: .42; }

                    .pd-heart { position: absolute; top: 1rem; right: 1rem; z-index: 3; }
                    .pd-heart .wl-heart {
                        width: 40px; height: 40px; border-radius: 50%;
                        cursor: none;
                    }

                    .pd-badge {
                        position: absolute; top: 1rem; left: 1rem; z-index: 3;
                        font-size: .58rem; letter-spacing: .16em;
                        text-transform: uppercase; font-weight: 700;
                        padding: .45rem .8rem;
                        backdrop-filter: blur(6px);
                    }
                    .pd-badge.sale { background: rgba(255,61,46,.92); color: #fff; }
                    .pd-badge.out {
                        background: rgba(10,10,10,.85); color: var(--accent2);
                        border: 1px solid rgba(255,61,46,.45);
                    }

                    .pd-trust {
                        display: grid; grid-template-columns: repeat(3, minmax(0, 1fr));
                        gap: 1px; margin-top: 1px;
                        background: rgba(245,240,232,.075);
                        border: 1px solid rgba(245,240,232,.075);
                        border-top: none;
                    }
                    .trust-cell { background: #151515; padding: 1.1rem .8rem; text-align: center; }
                    .trust-cell svg { color: var(--accent); margin: 0 auto .55rem; display: block; }
                    .trust-title {
                        font-size: .6rem; letter-spacing: .13em; text-transform: uppercase;
                        font-weight: 700; color: rgba(245,240,232,.72);
                    }
                    .trust-sub {
                        font-size: .62rem; color: rgba(245,240,232,.3);
                        margin-top: .25rem; line-height: 1.4;
                    }

                    .pd-info {
                        animation: fadeUp .6s .1s ease both;
                        position: sticky; top: 6.5rem;
                    }

                    .pd-cat {
                        display: inline-block;
                        font-size: .6rem; letter-spacing: .22em; text-transform: uppercase;
                        color: var(--accent); font-weight: 700;
                        margin-bottom: .9rem;
                    }
                    .pd-name {
                        font-family: var(--serif);
                        font-size: clamp(2.3rem, 5vw, 3.4rem);
                        letter-spacing: .03em; line-height: .98;
                        overflow-wrap: break-word;
                    }

                    .pd-rating-link {
                        display: inline-flex; align-items: center; gap: .55rem;
                        background: none; border: none; padding: 0;
                        margin-top: .9rem; cursor: none;
                        font-family: var(--body);
                        transition: opacity .2s;
                    }
                    .pd-rating-link:hover { opacity: .75; }
                    .pd-rating-num {
                        font-size: .78rem; font-weight: 700;
                        color: rgba(245,240,232,.82);
                    }
                    .pd-rating-count {
                        font-size: .72rem; color: rgba(245,240,232,.34);
                        text-decoration: underline; text-underline-offset: 3px;
                    }
                    .pd-rating-none {
                        font-size: .72rem; color: rgba(245,240,232,.3);
                        font-style: italic; margin-top: .9rem;
                    }

                    .pd-price-row {
                        display: flex; align-items: baseline; gap: .9rem;
                        flex-wrap: wrap; margin: 1.3rem 0 .5rem;
                    }
                    .pd-price {
                        font-family: var(--serif); font-size: 2.6rem;
                        color: var(--accent); letter-spacing: .02em; line-height: 1;
                    }
                    .pd-was {
                        font-size: 1.05rem; color: rgba(245,240,232,.3);
                        text-decoration: line-through;
                    }
                    .pd-save {
                        font-size: .6rem; letter-spacing: .13em;
                        text-transform: uppercase; font-weight: 700;
                        background: rgba(255,61,46,.14); color: var(--accent2);
                        border: 1px solid rgba(255,61,46,.35);
                        padding: .3rem .6rem;
                    }

                    .pd-stock {
                        display: inline-flex; align-items: center; gap: .45rem;
                        font-size: .66rem; letter-spacing: .12em;
                        text-transform: uppercase; font-weight: 700;
                        margin-bottom: 1.6rem;
                    }
                    .pd-stock.in { color: var(--green); }
                    .pd-stock.low { color: var(--amber); animation: pulseSoft 2s ease-in-out infinite; }
                    .pd-stock.out { color: var(--accent2); }
                    .stock-dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }

                    .pd-desc {
                        font-size: .89rem; line-height: 1.85;
                        color: rgba(245,240,232,.5);
                        padding-bottom: 1.7rem; margin-bottom: 1.7rem;
                        border-bottom: 1px solid rgba(245,240,232,.08);
                        white-space: pre-line;
                    }
                    .pd-desc-empty { font-style: italic; color: rgba(245,240,232,.25); }

                    .pd-qty-row {
                        display: flex; align-items: center; gap: 1.1rem;
                        margin-bottom: 1.3rem; flex-wrap: wrap;
                    }
                    .qty-label {
                        font-size: .58rem; letter-spacing: .17em;
                        text-transform: uppercase; font-weight: 700;
                        color: rgba(245,240,232,.4);
                    }
                    .qty-control {
                        display: flex; align-items: center;
                        border: 1px solid rgba(245,240,232,.13);
                        background: rgba(245,240,232,.03);
                    }
                    .qty-btn {
                        width: 40px; height: 42px;
                        display: flex; align-items: center; justify-content: center;
                        background: none; border: none;
                        color: rgba(245,240,232,.55); cursor: none;
                        transition: color .2s, background .2s;
                    }
                    .qty-btn:hover:not(:disabled) {
                        color: var(--accent); background: rgba(232,255,0,.06);
                    }
                    .qty-btn:disabled { opacity: .25; }
                    .qty-value {
                        width: 52px; height: 42px;
                        background: none; border: none;
                        border-left: 1px solid rgba(245,240,232,.09);
                        border-right: 1px solid rgba(245,240,232,.09);
                        color: var(--white); text-align: center;
                        font-family: var(--body); font-size: .92rem; font-weight: 600;
                        outline: none; cursor: none;
                    }
                    .qty-max { font-size: .66rem; color: rgba(245,240,232,.28); }

                    .pd-actions { display: flex; gap: .7rem; margin-bottom: 1.6rem; }

                    .pd-cart-btn {
                        flex: 1; position: relative; overflow: hidden;
                        display: inline-flex; align-items: center; justify-content: center; gap: .6rem;
                        background: var(--accent); color: var(--black); border: none;
                        font-family: var(--body); font-size: .74rem; font-weight: 700;
                        letter-spacing: .15em; text-transform: uppercase;
                        padding: 1.15rem; cursor: none;
                        box-shadow: 0 6px 24px rgba(232,255,0,.15);
                        transition: transform .22s, box-shadow .28s;
                    }
                    .pd-cart-btn::before {
                        content: ''; position: absolute; inset: 0;
                        background: linear-gradient(115deg, #ff3d2e, #ff6b4a);
                        transform: translateX(-101%);
                        transition: transform .36s cubic-bezier(.4,0,.2,1);
                    }
                    .pd-cart-btn:hover:not(:disabled)::before { transform: translateX(0); }
                    .pd-cart-btn:hover:not(:disabled) {
                        transform: translateY(-2px);
                        box-shadow: 0 12px 34px rgba(232,255,0,.24);
                    }
                    .pd-cart-btn:hover:not(:disabled) span,
                    .pd-cart-btn:hover:not(:disabled) svg { color: #f5f0e8; }
                    .pd-cart-btn:disabled {
                        opacity: .4; transform: none;
                        background: rgba(245,240,232,.06);
                        color: rgba(245,240,232,.4);
                        box-shadow: none;
                    }
                    .pd-cart-btn span, .pd-cart-btn svg {
                        position: relative; z-index: 1; transition: color .25s;
                    }
                    .pd-cart-btn.done {
                        background: var(--green); color: #0a0a0a;
                        box-shadow: 0 6px 24px rgba(74,222,128,.22);
                    }
                    .pd-cart-btn.done::before { display: none; }

                    .pd-meta-list {
                        border-top: 1px solid rgba(245,240,232,.08);
                        padding-top: 1.4rem;
                    }
                    .meta-row {
                        display: flex; justify-content: space-between; gap: 1rem;
                        font-size: .78rem; padding: .5rem 0;
                        color: rgba(245,240,232,.38);
                    }
                    .meta-row span:last-child {
                        color: rgba(245,240,232,.72); font-weight: 500;
                        text-transform: capitalize;
                    }

                    /* ===== REVIEWS ===== */
                    .rev-section {
                        margin-bottom: 4.5rem;
                        scroll-margin-top: 6.5rem;
                    }
                    .rev-head {
                        display: flex; align-items: baseline; justify-content: space-between;
                        gap: 1rem; flex-wrap: wrap;
                        padding-bottom: 1.3rem; margin-bottom: 2rem;
                        border-bottom: 1px solid rgba(245,240,232,.08);
                    }
                    .rev-title {
                        font-family: var(--serif); font-size: 1.9rem;
                        letter-spacing: .05em; line-height: 1;
                    }
                    .rev-title .accent { color: var(--accent); }

                    .write-btn {
                        display: inline-flex; align-items: center; gap: .5rem;
                        background: transparent; border: 1px solid rgba(232,255,0,.32);
                        color: var(--accent);
                        font-family: var(--body); font-size: .64rem; font-weight: 700;
                        letter-spacing: .14em; text-transform: uppercase;
                        padding: .68rem 1.2rem; cursor: none;
                        text-decoration: none;
                        transition: all .24s;
                    }
                    .write-btn:hover {
                        background: var(--accent); color: var(--black);
                        transform: translateY(-2px);
                        box-shadow: 0 6px 20px rgba(232,255,0,.2);
                    }

                    .rev-summary {
                        display: grid;
                        grid-template-columns: 210px minmax(0, 1fr);
                        gap: 2.5rem; align-items: center;
                        background: linear-gradient(158deg, #1e1e1e 0%, #151515 100%);
                        border: 1px solid rgba(245,240,232,.075);
                        padding: 1.9rem;
                        margin-bottom: 1.8rem;
                    }
                    .sum-score { text-align: center; }
                    .sum-avg {
                        font-family: var(--serif); font-size: 4rem;
                        color: var(--accent); line-height: .9; letter-spacing: .02em;
                    }
                    .sum-avg-out { font-size: 1.3rem; color: rgba(245,240,232,.25); }
                    .sum-stars { margin: .8rem 0 .6rem; }
                    .sum-total {
                        font-size: .64rem; letter-spacing: .13em;
                        text-transform: uppercase; font-weight: 700;
                        color: rgba(245,240,232,.34);
                    }

                    .sum-bars { display: flex; flex-direction: column; gap: .5rem; }
                    .bar-row {
                        display: flex; align-items: center; gap: .8rem;
                        background: none; border: none; padding: 0;
                        cursor: none; width: 100%;
                        transition: opacity .2s;
                    }
                    .bar-row:hover:not(:disabled) { opacity: .8; }
                    .bar-row:disabled { opacity: .45; }
                    .bar-row.active .bar-star { color: var(--accent); }
                    .bar-star {
                        display: inline-flex; align-items: center; gap: .25rem;
                        font-size: .7rem; font-weight: 700;
                        color: rgba(245,240,232,.42);
                        width: 34px; flex-shrink: 0;
                        font-family: var(--body);
                    }
                    .bar-track {
                        flex: 1; height: 7px;
                        background: rgba(245,240,232,.06);
                        overflow: hidden;
                    }
                    .bar-fill {
                        display: block; height: 100%; background: var(--accent);
                        transform-origin: left;
                        animation: barGrow .7s cubic-bezier(.22,1,.36,1) both;
                    }
                    .bar-count {
                        font-size: .7rem; color: rgba(245,240,232,.34);
                        width: 30px; text-align: right; flex-shrink: 0;
                        font-weight: 600;
                    }

                    .filter-note {
                        display: flex; align-items: center; gap: .6rem;
                        font-size: .74rem; color: rgba(245,240,232,.42);
                        margin-bottom: 1.3rem; flex-wrap: wrap;
                    }
                    .clear-filter {
                        display: inline-flex; align-items: center; gap: .3rem;
                        background: none; border: none;
                        color: var(--accent2); cursor: none;
                        font-family: var(--body); font-size: .66rem; font-weight: 700;
                        letter-spacing: .1em; text-transform: uppercase;
                        transition: opacity .2s;
                    }
                    .clear-filter:hover { opacity: .75; }

                    .rev-form {
                        border: 1px solid rgba(232,255,0,.26);
                        background: linear-gradient(158deg, rgba(232,255,0,.045), rgba(232,255,0,.012));
                        padding: 1.8rem;
                        margin-bottom: 1.8rem;
                        animation: slideDown .3s ease;
                    }
                    .rev-form-head {
                        display: flex; align-items: center; justify-content: space-between;
                        gap: 1rem;
                        padding-bottom: 1.2rem; margin-bottom: 1.4rem;
                        border-bottom: 1px solid rgba(245,240,232,.08);
                    }
                    .rev-form-title {
                        font-family: var(--serif); font-size: 1.3rem; letter-spacing: .07em;
                    }
                    .form-close {
                        background: none; border: none; color: rgba(245,240,232,.38);
                        cursor: none; padding: .2rem; display: flex;
                        transition: color .2s;
                    }
                    .form-close:hover { color: var(--accent2); }

                    .star-picker {
                        display: flex; align-items: center; gap: 1rem;
                        flex-wrap: wrap; margin-bottom: 1.4rem;
                    }
                    .star-verdict {
                        font-size: .7rem; letter-spacing: .12em;
                        text-transform: uppercase; font-weight: 700;
                        color: var(--accent);
                    }

                    .field-group { margin-bottom: 1.1rem; }
                    .field-label {
                        display: block; font-size: .58rem; letter-spacing: .17em;
                        text-transform: uppercase; color: rgba(245,240,232,.4);
                        margin-bottom: .5rem; font-weight: 700;
                    }
                    .field-input, .field-textarea {
                        width: 100%;
                        background: rgba(245,240,232,.04);
                        border: 1px solid rgba(245,240,232,.09); color: var(--white);
                        font-family: var(--body); font-size: .85rem;
                        padding: .82rem 1rem;
                        outline: none; transition: border-color .22s, background .22s;
                    }
                    .field-textarea { min-height: 110px; resize: vertical; line-height: 1.7; }
                    .field-input:focus, .field-textarea:focus {
                        border-color: rgba(232,255,0,.5);
                        background: rgba(232,255,0,.03);
                    }
                    .field-input::placeholder, .field-textarea::placeholder {
                        color: rgba(245,240,232,.2);
                    }
                    .field-error { font-size: .7rem; color: var(--accent2); margin-top: .45rem; }
                    .char-count {
                        font-size: .66rem; color: rgba(245,240,232,.26);
                        text-align: right; margin-top: .4rem;
                    }

                    .form-actions { display: flex; gap: .6rem; margin-top: .4rem; }
                    .btn-primary {
                        flex: 1; position: relative; overflow: hidden;
                        display: inline-flex; align-items: center; justify-content: center; gap: .5rem;
                        background: var(--accent); color: var(--black); border: none;
                        font-family: var(--body); font-size: .7rem; font-weight: 700;
                        letter-spacing: .15em; text-transform: uppercase;
                        padding: .95rem; cursor: none;
                        box-shadow: 0 4px 18px rgba(232,255,0,.13);
                        transition: transform .2s, box-shadow .26s;
                    }
                    .btn-primary:hover:not(:disabled) {
                        transform: translateY(-2px);
                        box-shadow: 0 9px 28px rgba(232,255,0,.22);
                    }
                    .btn-primary:disabled { opacity: .42; transform: none; }
                    .btn-ghost {
                        background: transparent; border: 1px solid rgba(245,240,232,.14);
                        color: rgba(245,240,232,.5);
                        font-family: var(--body); font-size: .7rem; font-weight: 700;
                        letter-spacing: .14em; text-transform: uppercase;
                        padding: .95rem 1.3rem; cursor: none;
                        transition: all .22s;
                    }
                    .btn-ghost:hover { border-color: var(--accent2); color: var(--accent2); }

                    .rev-list { display: flex; flex-direction: column; gap: 1rem; }

                    .rev-card {
                        position: relative;
                        background: linear-gradient(158deg, #1e1e1e 0%, #151515 100%);
                        border: 1px solid rgba(245,240,232,.07);
                        padding: 1.5rem;
                        animation: fadeUp .5s ease both;
                        transition: border-color .25s;
                    }
                    .rev-card:hover { border-color: rgba(245,240,232,.14); }
                    .rev-card.mine { border-color: rgba(232,255,0,.26); }
                    .rev-card.mine::before {
                        content: ''; position: absolute;
                        left: 0; top: 0; bottom: 0; width: 2px;
                        background: var(--accent);
                    }

                    .rev-card-head {
                        display: flex; align-items: flex-start; gap: .9rem;
                        margin-bottom: .9rem;
                    }
                    .rev-avatar {
                        width: 40px; height: 40px; flex-shrink: 0;
                        border-radius: 50%; overflow: hidden;
                        background: linear-gradient(145deg, #272727, #131313);
                        display: flex; align-items: center; justify-content: center;
                        box-shadow: 0 0 0 1px rgba(245,240,232,.09);
                    }
                    .rev-avatar img { width: 100%; height: 100%; object-fit: cover; }
                    .rev-avatar span {
                        font-family: var(--serif); font-size: 1.15rem;
                        color: rgba(245,240,232,.55); line-height: 1;
                    }

                    .rev-who { flex: 1; min-width: 0; }
                    .rev-name-row {
                        display: flex; align-items: center; gap: .5rem; flex-wrap: wrap;
                    }
                    .rev-name {
                        font-size: .87rem; font-weight: 600;
                        color: rgba(245,240,232,.88);
                    }
                    .rev-verified {
                        display: inline-flex; align-items: center; gap: .25rem;
                        font-size: .52rem; letter-spacing: .11em;
                        text-transform: uppercase; font-weight: 700;
                        color: var(--green);
                        background: rgba(74,222,128,.09);
                        border: 1px solid rgba(74,222,128,.28);
                        padding: .2rem .45rem;
                    }
                    .rev-mine-tag {
                        font-size: .52rem; letter-spacing: .11em;
                        text-transform: uppercase; font-weight: 700;
                        color: var(--accent);
                        background: rgba(232,255,0,.1);
                        border: 1px solid rgba(232,255,0,.3);
                        padding: .2rem .45rem;
                    }
                    .rev-meta-row {
                        display: flex; align-items: center; gap: .7rem;
                        margin-top: .45rem; flex-wrap: wrap;
                    }
                    .rev-date {
                        font-size: .66rem; color: rgba(245,240,232,.26);
                        letter-spacing: .04em;
                    }

                    .rev-own-actions { display: flex; gap: .4rem; flex-shrink: 0; }
                    .rev-act-btn {
                        width: 29px; height: 29px;
                        display: flex; align-items: center; justify-content: center;
                        border: 1px solid rgba(245,240,232,.1); background: transparent;
                        color: rgba(245,240,232,.42); cursor: none;
                        transition: all .22s;
                    }
                    .rev-act-btn:hover { border-color: var(--accent); color: var(--accent); }
                    .rev-act-btn.danger:hover { border-color: var(--accent2); color: var(--accent2); }

                    .rev-body-title {
                        font-size: .95rem; font-weight: 600;
                        color: rgba(245,240,232,.9); margin-bottom: .5rem;
                        overflow-wrap: break-word;
                    }
                    .rev-body-text {
                        font-size: .85rem; line-height: 1.8;
                        color: rgba(245,240,232,.5);
                        white-space: pre-line; overflow-wrap: break-word;
                    }
                    .rev-body-empty {
                        font-size: .8rem; font-style: italic;
                        color: rgba(245,240,232,.24);
                    }

                    .rev-empty {
                        text-align: center; padding: 4rem 2rem;
                        border: 1px dashed rgba(245,240,232,.1);
                    }
                    .rev-empty-icon {
                        width: 62px; height: 62px; margin: 0 auto 1.4rem;
                        border-radius: 50%;
                        border: 1px solid rgba(232,255,0,.2);
                        background: rgba(232,255,0,.04);
                        display: flex; align-items: center; justify-content: center;
                        color: rgba(232,255,0,.5);
                    }
                    .rev-empty-title {
                        font-family: var(--serif); font-size: 1.8rem;
                        letter-spacing: .05em; margin-bottom: .7rem;
                    }
                    .rev-empty-desc {
                        font-size: .84rem; line-height: 1.7;
                        color: rgba(245,240,232,.38);
                        max-width: 330px; margin: 0 auto;
                    }

                    .rev-locked {
                        display: flex; align-items: flex-start; gap: .7rem;
                        background: rgba(245,240,232,.025);
                        border-left: 2px solid rgba(245,240,232,.14);
                        padding: 1rem 1.2rem;
                        margin-bottom: 1.8rem;
                        font-size: .79rem; line-height: 1.7;
                        color: rgba(245,240,232,.42);
                    }
                    .rev-locked svg {
                        flex-shrink: 0; margin-top: .18rem;
                        color: rgba(245,240,232,.3);
                    }
                    .rev-locked a { color: var(--accent); text-decoration: none; }
                    .rev-locked a:hover { text-decoration: underline; }

                    .rel-head {
                        display: flex; align-items: baseline; justify-content: space-between;
                        gap: 1rem; flex-wrap: wrap;
                        padding-bottom: 1.2rem; margin-bottom: 1.6rem;
                        border-bottom: 1px solid rgba(245,240,232,.08);
                    }
                    .rel-title {
                        font-family: var(--serif); font-size: 1.9rem;
                        letter-spacing: .05em; line-height: 1;
                    }
                    .rel-title .accent { color: var(--accent); }
                    .rel-all {
                        display: inline-flex; align-items: center; gap: .35rem;
                        font-size: .64rem; letter-spacing: .14em;
                        text-transform: uppercase; font-weight: 700;
                        color: rgba(245,240,232,.4); text-decoration: none;
                        transition: color .2s, gap .22s;
                    }
                    .rel-all:hover { color: var(--accent); gap: .6rem; }

                    .rel-grid {
                        display: grid;
                        grid-template-columns: repeat(4, minmax(0, 1fr));
                        gap: 1.2rem;
                    }
                    .rel-card {
                        display: block; text-decoration: none; color: inherit;
                        background: linear-gradient(158deg, #1e1e1e 0%, #151515 100%);
                        border: 1px solid rgba(245,240,232,.07);
                        overflow: hidden; min-width: 0;
                        transition: border-color .25s, transform .26s, box-shadow .28s;
                    }
                    .rel-card:hover {
                        border-color: rgba(232,255,0,.3);
                        transform: translateY(-5px);
                        box-shadow: 0 20px 50px rgba(0,0,0,.45);
                    }
                    .rel-img { aspect-ratio: 1; overflow: hidden; }
                    .rel-img img {
                        width: 100%; height: 100%; object-fit: cover;
                        transition: transform .5s;
                    }
                    .rel-card:hover .rel-img img { transform: scale(1.07); }
                    .rel-body { padding: .95rem 1rem 1.1rem; min-width: 0; }
                    .rel-name {
                        font-size: .86rem; font-weight: 600;
                        color: rgba(245,240,232,.88);
                        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                    }
                    .rel-price {
                        font-family: var(--serif); font-size: 1.2rem;
                        color: var(--accent); margin-top: .45rem; letter-spacing: .02em;
                    }

                    .pd-foot { display: flex; justify-content: center; margin-top: 3rem; }
                    .back-link {
                        display: inline-flex; align-items: center; gap: .5rem;
                        font-size: .66rem; letter-spacing: .14em; text-transform: uppercase;
                        font-weight: 600;
                        color: rgba(245,240,232,.32); text-decoration: none;
                        transition: color .2s;
                    }
                    .back-link:hover { color: var(--accent); }

                    .modal-overlay {
                        position: fixed; inset: 0; z-index: 1000;
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
                        letter-spacing: .05em; line-height: 1; margin-bottom: .8rem;
                    }
                    .modal-body {
                        font-size: .84rem; font-weight: 300;
                        color: rgba(245,240,232,.5); line-height: 1.75;
                        margin-bottom: 1.8rem;
                    }
                    .modal-actions { display: flex; gap: .7rem; }
                    .modal-confirm {
                        flex: 1; background: var(--accent2); color: #fff; border: none;
                        font-family: var(--body); font-size: .68rem; font-weight: 700;
                        letter-spacing: .14em; text-transform: uppercase;
                        padding: .9rem; cursor: none; transition: transform .2s;
                    }
                    .modal-confirm:hover { transform: translateY(-2px); }
                    .modal-dismiss {
                        background: transparent; border: 1px solid rgba(245,240,232,.15);
                        color: rgba(245,240,232,.5);
                        font-family: var(--body); font-size: .68rem; font-weight: 600;
                        letter-spacing: .13em; text-transform: uppercase;
                        padding: .9rem 1.4rem; cursor: none; transition: all .2s;
                    }
                    .modal-dismiss:hover { border-color: var(--white); color: var(--white); }

                    @media (max-width: 900px) {
                        .pd-grid { grid-template-columns: minmax(0, 1fr); gap: 2rem; }
                        .pd-info { position: static; }
                        .rel-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                        .rev-summary { grid-template-columns: minmax(0, 1fr); gap: 1.8rem; }
                    }
                    @media (max-width: 768px) {
                        .pd-page { padding: 6.5rem 1.2rem 6rem; }
                    }
                    @media (max-width: 480px) {
                        .pd-trust { grid-template-columns: minmax(0, 1fr); }
                        .pd-actions { flex-direction: column; }
                        .rel-grid { grid-template-columns: minmax(0, 1fr); }
                        .rev-summary { padding: 1.4rem; }
                        .rev-form { padding: 1.4rem; }
                        .rev-card { padding: 1.25rem; }
                        .form-actions { flex-direction: column-reverse; }
                        .modal { padding: 1.7rem; }
                        .modal-actions { flex-direction: column-reverse; }
                    }
                `}</style>
            </Head>

            <SiteNav />
            <div className="custom-cursor" ref={cursorRef} />

            {deleteOpen && (
                <div className="modal-overlay" onClick={() => setDeleteOpen(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-icon">
                            <AlertTriangle size={22} />
                        </div>
                        <h2 className="modal-title">DELETE YOUR REVIEW?</h2>
                        <p className="modal-body">
                            Your rating and comments for this product will be
                            removed. You can write a new review afterwards if
                            you change your mind.
                        </p>
                        <div className="modal-actions">
                            <button className="modal-confirm" onClick={deleteReview}>
                                Yes, Delete
                            </button>
                            <button
                                className="modal-dismiss"
                                onClick={() => setDeleteOpen(false)}
                            >
                                Keep It
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="pd-page">
                <div className="pd-shell">
                    <div className="pd-crumbs">
                        <Link href="/">Home</Link>
                        <ChevronRight size={11} />
                        <Link href="/product-page">Shop</Link>
                        <ChevronRight size={11} />
                        <Link
                            href={`/product-page?category=${encodeURIComponent(product.category)}`}
                        >
                            {product.category}
                        </Link>
                        <ChevronRight size={11} />
                        <span className="current">{product.name}</span>
                    </div>

                    <div className="pd-grid">
                        <div className="pd-media">
                            <div className={`pd-img-frame ${outOfStock ? 'dim' : ''}`}>
                                {wasPrice && !outOfStock && (
                                    <span className="pd-badge sale">
                                        Save {savePct}%
                                    </span>
                                )}
                                {outOfStock && (
                                    <span className="pd-badge out">
                                        Out of Stock
                                    </span>
                                )}

                                <img
                                    src={`${appUrl}/storage/${product.image}`}
                                    alt={product.name}
                                />

                                <div className="pd-heart">
                                    <WishlistHeart
                                        productId={product.id}
                                        initialSaved={inWishlist}
                                        size={17}
                                    />
                                </div>
                            </div>

                            <div className="pd-trust">
                                <div className="trust-cell">
                                    <Truck size={17} />
                                    <p className="trust-title">Fast Delivery</p>
                                    <p className="trust-sub">Dispatched within 48h</p>
                                </div>
                                <div className="trust-cell">
                                    <RotateCcw size={17} />
                                    <p className="trust-title">30-Day Returns</p>
                                    <p className="trust-sub">No questions asked</p>
                                </div>
                                <div className="trust-cell">
                                    <ShieldCheck size={17} />
                                    <p className="trust-title">Secure Payment</p>
                                    <p className="trust-sub">Protected checkout</p>
                                </div>
                            </div>
                        </div>

                        <div className="pd-info">
                            <span className="pd-cat">{product.category}</span>
                            <h1 className="pd-name">{product.name}</h1>

                            {ratingSummary.total > 0 ? (
                                <button
                                    className="pd-rating-link"
                                    onClick={scrollToReviews}
                                >
                                    <StarRating
                                        value={Math.round(ratingSummary.average)}
                                        size={14}
                                    />
                                    <span className="pd-rating-num">
                                        {ratingSummary.average.toFixed(1)}
                                    </span>
                                    <span className="pd-rating-count">
                                        {ratingSummary.total} review
                                        {ratingSummary.total === 1 ? '' : 's'}
                                    </span>
                                </button>
                            ) : (
                                <p className="pd-rating-none">No reviews yet</p>
                            )}

                            <div className="pd-price-row">
                                <span className="pd-price">
                                    ₦{price.toLocaleString()}
                                </span>
                                {wasPrice && (
                                    <>
                                        <span className="pd-was">
                                            ₦{wasPrice.toLocaleString()}
                                        </span>
                                        <span className="pd-save">
                                            Save {savePct}%
                                        </span>
                                    </>
                                )}
                            </div>

                            <p
                                className={`pd-stock ${outOfStock ? 'out' : lowStock ? 'low' : 'in'}`}
                            >
                                <span className="stock-dot" />
                                {outOfStock
                                    ? 'Currently unavailable'
                                    : lowStock
                                      ? `Only ${product.stock} left`
                                      : `In stock — ${product.stock} available`}
                            </p>

                            <p
                                className={`pd-desc ${!product.description ? 'pd-desc-empty' : ''}`}
                            >
                                {product.description ||
                                    'No description available for this product.'}
                            </p>

                            {!outOfStock && (
                                <div className="pd-qty-row">
                                    <span className="qty-label">Quantity</span>
                                    <div className="qty-control">
                                        <button
                                            className="qty-btn"
                                            onClick={() => setQty((q) => clampQty(q - 1))}
                                            disabled={qty <= 1}
                                            aria-label="Decrease quantity"
                                        >
                                            <Minus size={15} />
                                        </button>
                                        <input
                                            className="qty-value"
                                            inputMode="numeric"
                                            value={qty}
                                            onChange={(e) =>
                                                setQty(
                                                    clampQty(
                                                        Number(
                                                            e.target.value.replace(/\D/g, ''),
                                                        ) || 1,
                                                    ),
                                                )
                                            }
                                        />
                                        <button
                                            className="qty-btn"
                                            onClick={() => setQty((q) => clampQty(q + 1))}
                                            disabled={qty >= product.stock}
                                            aria-label="Increase quantity"
                                        >
                                            <Plus size={15} />
                                        </button>
                                    </div>
                                    {qty >= product.stock && (
                                        <span className="qty-max">Max available</span>
                                    )}
                                </div>
                            )}

                            <div className="pd-actions">
                                <button
                                    className={`pd-cart-btn ${added ? 'done' : ''}`}
                                    onClick={addToCart}
                                    disabled={outOfStock || adding}
                                >
                                    {outOfStock ? (
                                        <>
                                            <PackageX size={16} />
                                            <span>Out of Stock</span>
                                        </>
                                    ) : added ? (
                                        <>
                                            <Check size={16} />
                                            <span>Added to Cart</span>
                                        </>
                                    ) : (
                                        <>
                                            <ShoppingCart size={16} />
                                            <span>
                                                {adding ? 'Adding...' : 'Add to Cart'}
                                            </span>
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="pd-meta-list">
                                <div className="meta-row">
                                    <span>Category</span>
                                    <span>{product.category}</span>
                                </div>
                                <div className="meta-row">
                                    <span>Availability</span>
                                    <span>
                                        {outOfStock ? 'Out of stock' : 'In stock'}
                                    </span>
                                </div>
                                <div className="meta-row">
                                    <span>Product code</span>
                                    <span>
                                        VNT-{String(product.id).padStart(4, '0')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ===== REVIEWS ===== */}
                    <div className="rev-section" ref={reviewsRef}>
                        <div className="rev-head">
                            <h2 className="rev-title">
                                CUSTOMER <span className="accent">REVIEWS</span>
                            </h2>

                            {canReview && !showForm && (
                                <button className="write-btn" onClick={openWrite}>
                                    <Pencil size={13} /> Write a Review
                                </button>
                            )}
                            {myReview && !showForm && (
                                <button className="write-btn" onClick={openEdit}>
                                    <Pencil size={13} /> Edit Your Review
                                </button>
                            )}
                        </div>

                        {ratingSummary.total > 0 && (
                            <div className="rev-summary">
                                <div className="sum-score">
                                    <p className="sum-avg">
                                        {ratingSummary.average.toFixed(1)}
                                        <span className="sum-avg-out">/5</span>
                                    </p>
                                    <div className="sum-stars">
                                        <StarRating
                                            value={Math.round(ratingSummary.average)}
                                            size={17}
                                        />
                                    </div>
                                    <p className="sum-total">
                                        {ratingSummary.total} review
                                        {ratingSummary.total === 1 ? '' : 's'}
                                    </p>
                                </div>

                                <div className="sum-bars">
                                    {[5, 4, 3, 2, 1].map((star) => {
                                        const count = ratingSummary.breakdown[star] ?? 0;
                                        return (
                                            <button
                                                key={star}
                                                className={`bar-row ${filter === star ? 'active' : ''}`}
                                                onClick={() =>
                                                    setFilter(filter === star ? null : star)
                                                }
                                                disabled={count === 0}
                                            >
                                                <span className="bar-star">
                                                    {star}
                                                    <StarRating value={1} size={11} />
                                                </span>
                                                <span className="bar-track">
                                                    <span
                                                        className="bar-fill"
                                                        style={{ width: `${pct(count)}%` }}
                                                    />
                                                </span>
                                                <span className="bar-count">{count}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {showForm && (
                            <div className="rev-form">
                                <div className="rev-form-head">
                                    <p className="rev-form-title">
                                        {editing ? 'EDIT YOUR REVIEW' : 'WRITE A REVIEW'}
                                    </p>
                                    <button
                                        type="button"
                                        className="form-close"
                                        onClick={closeForm}
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                <form onSubmit={submitReview}>
                                    <div className="star-picker">
                                        <StarRating
                                            value={reviewForm.data.rating}
                                            size={26}
                                            interactive
                                            hover={hoverStar}
                                            onHover={setHoverStar}
                                            onChange={(v) => reviewForm.setData('rating', v)}
                                        />
                                        {(hoverStar || reviewForm.data.rating) > 0 && (
                                            <span className="star-verdict">
                                                {VERDICTS[hoverStar || reviewForm.data.rating]}
                                            </span>
                                        )}
                                    </div>
                                    {reviewForm.errors.rating && (
                                        <div
                                            className="field-error"
                                            style={{ marginTop: '-.9rem', marginBottom: '1rem' }}
                                        >
                                            {reviewForm.errors.rating}
                                        </div>
                                    )}

                                    <div className="field-group">
                                        <label className="field-label">
                                            Headline (optional)
                                        </label>
                                        <input
                                            type="text"
                                            maxLength={120}
                                            value={reviewForm.data.title}
                                            onChange={(e) =>
                                                reviewForm.setData('title', e.target.value)
                                            }
                                            className="field-input"
                                            placeholder="Sum it up in a few words"
                                        />
                                        {reviewForm.errors.title && (
                                            <div className="field-error">
                                                {reviewForm.errors.title}
                                            </div>
                                        )}
                                    </div>

                                    <div className="field-group">
                                        <label className="field-label">
                                            Your Review (optional)
                                        </label>
                                        <textarea
                                            maxLength={2000}
                                            value={reviewForm.data.body}
                                            onChange={(e) =>
                                                reviewForm.setData('body', e.target.value)
                                            }
                                            className="field-textarea"
                                            placeholder="What did you like or dislike? How was the quality, fit or finish?"
                                        />
                                        <p className="char-count">
                                            {reviewForm.data.body.length} / 2000
                                        </p>
                                        {reviewForm.errors.body && (
                                            <div className="field-error">
                                                {reviewForm.errors.body}
                                            </div>
                                        )}
                                    </div>

                                    <div className="form-actions">
                                        <button
                                            type="submit"
                                            className="btn-primary"
                                            disabled={
                                                reviewForm.processing ||
                                                reviewForm.data.rating === 0
                                            }
                                        >
                                            {reviewForm.processing
                                                ? 'Posting...'
                                                : editing
                                                  ? 'Update Review'
                                                  : 'Post Review'}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-ghost"
                                            onClick={closeForm}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {!canReview && !myReview && !showForm && (
                            <div className="rev-locked">
                                <ShieldCheck size={15} />
                                <span>
                                    Only customers who have received this product
                                    can review it
                                {' '}
                                    <Link href="/account/orders">
                                        View your orders
                                    </Link>
                                </span>
                            </div>
                        )}

                        {filter && (
                            <div className="filter-note">
                                <span>
                                    Showing {shown.length} {filter}-star review
                                    {shown.length === 1 ? '' : 's'}
                                </span>
                                <button
                                    className="clear-filter"
                                    onClick={() => setFilter(null)}
                                >
                                    <X size={11} /> Clear
                                </button>
                            </div>
                        )}

                        {reviews.length === 0 ? (
                            <div className="rev-empty">
                                <div className="rev-empty-icon">
                                    <MessageSquare size={26} />
                                </div>
                                <h3 className="rev-empty-title">NO REVIEWS YET</h3>
                                <p className="rev-empty-desc">
                                    {canReview
                                        ? "You've received this one — be the first to share what you think."
                                        : 'Be the first to know what other customers think once reviews come in.'}
                                </p>
                            </div>
                        ) : (
                            <div className="rev-list">
                                {shown.map((rev) => {
                                    const avatar = avatarOf(rev.user);
                                    return (
                                        <div
                                            key={rev.id}
                                            className={`rev-card ${rev.is_mine ? 'mine' : ''}`}
                                        >
                                            <div className="rev-card-head">
                                                <div className="rev-avatar">
                                                    {avatar ? (
                                                        <img src={avatar} alt={rev.user.name} />
                                                    ) : (
                                                        <span>
                                                            {rev.user.name
                                                                .charAt(0)
                                                                .toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="rev-who">
                                                    <div className="rev-name-row">
                                                        <span className="rev-name">
                                                            {rev.user.name}
                                                        </span>
                                                        {rev.is_verified && (
                                                            <span className="rev-verified">
                                                                <BadgeCheck size={9} />
                                                                Verified
                                                            </span>
                                                        )}
                                                        {rev.is_mine && (
                                                            <span className="rev-mine-tag">
                                                                You
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="rev-meta-row">
                                                        <StarRating
                                                            value={rev.rating}
                                                            size={13}
                                                        />
                                                        <span className="rev-date">
                                                            {fmtDate(rev.created_at)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {rev.is_mine && (
                                                    <div className="rev-own-actions">
                                                        <button
                                                            className="rev-act-btn"
                                                            onClick={openEdit}
                                                            title="Edit"
                                                        >
                                                            <Pencil size={12} />
                                                        </button>
                                                        <button
                                                            className="rev-act-btn danger"
                                                            onClick={() => setDeleteOpen(true)}
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {rev.title && (
                                                <p className="rev-body-title">{rev.title}</p>
                                            )}
                                            {rev.body ? (
                                                <p className="rev-body-text">{rev.body}</p>
                                            ) : (
                                                !rev.title && (
                                                    <p className="rev-body-empty">
                                                        Rated without a written review.
                                                    </p>
                                                )
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {related.length > 0 && (
                        <>
                            <div className="rel-head">
                                <h2 className="rel-title">
                                    YOU MIGHT ALSO <span className="accent">LIKE</span>
                                </h2>
                                <Link
                                    href={`/product-page?category=${encodeURIComponent(product.category)}`}
                                    className="rel-all"
                                >
                                    View all in {product.category}
                                    <ChevronRight size={12} />
                                </Link>
                            </div>

                            <div className="rel-grid">
                                {related.map((item) => (
                                    <Link
                                        key={item.id}
                                        href={`/product/${item.slug}`}
                                        className="rel-card"
                                    >
                                        <div className="rel-img">
                                            <img
                                                src={`${appUrl}/storage/${item.image}`}
                                                alt={item.name}
                                                loading="lazy"
                                            />
                                        </div>
                                        <div className="rel-body">
                                            <p className="rel-name">{item.name}</p>
                                            <p className="rel-price">
                                                ₦
                                                {Number(
                                                    item.discount_price ?? item.price,
                                                ).toLocaleString()}
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </>
                    )}

                    <div className="pd-foot">
                        <Link href="/product-page" className="back-link">
                            <ArrowLeft size={13} /> Back to Shop
                        </Link>
                    </div>
                </div>
            </div>

            <CartWidget />
        </>
    );
}

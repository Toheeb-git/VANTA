import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { Search, Eye, ShoppingCart, SlidersHorizontal, X } from 'lucide-react';
import SiteNav from '@/components/SiteNav';
import CartWidget from '@/components/CartWidget';
import WishlistHeart from '@/components/WishlistHeart';
import StarRating from '@/components/StarRating';

interface Product {
    id: number;
    name: string;
    price: number | string;
    discount_price: number | string | null;
    stock: number;
    slug: string;
    description?: string;
    image: string;
    category: string;
    created_at: string;
    reviews_avg_rating: number | string | null;
    reviews_count: number;
}

interface PageLink {
    url: string | null;
    label: string;
    active: boolean;
}

export default function ProductPage() {
    const { products, appUrl, categories, filters, auth } = usePage()
        .props as unknown as {
        products: { data: Product[]; links: PageLink[]; total: number };
        appUrl: string;
        categories: string[];
        filters: {
            search?: string;
            category?: string;
            min_price?: string;
            max_price?: string;
            sort?: string;
            availability?: string;
            rating?: string;
            discounted?: string;
        };
        auth: { user: { id: number } | null };
    };

    const [search, setSearch] = useState(filters.search ?? '');
    const [minPrice, setMinPrice] = useState(filters.min_price ?? '');
    const [maxPrice, setMaxPrice] = useState(filters.max_price ?? '');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [wishlistIds, setWishlistIds] = useState<number[]>([]);
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const activeCategory = filters.category ?? 'all';
    const activeSort = filters.sort ?? 'newest';
    const activeRating = filters.rating ?? 'all';
    const activeAvailability = filters.availability ?? 'all';
    const discountedOnly = filters.discounted === '1';

    const applyFilters = (overrides: Record<string, string> = {}) => {
        router.get(
            '/product-page',
            {
                search,
                category: activeCategory,
                min_price: minPrice,
                max_price: maxPrice,
                sort: activeSort,
                availability: activeAvailability,
                rating: activeRating,
                discounted: discountedOnly ? '1' : '',
                ...overrides,
            },
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

    useEffect(() => {
        if (!auth.user) {
            setWishlistIds([]);
            return;
        }
        fetch('/wishlist/ids', { headers: { Accept: 'application/json' } })
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => d && setWishlistIds(d.ids))
            .catch(() => {});
    }, [auth.user]);

    const handleAddToCart = async (productId: number, stock: number) => {
        if (stock <= 0) return;

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
                body: JSON.stringify({ product_id: productId, quantity: 1 }),
            });

            if (res.status === 419) {
                window.location.reload();
                return;
            }

            if (res.ok) {
                window.dispatchEvent(new Event('cart:refresh'));
            }
        } catch {
            // network error — ignore
        }
    };

    const resetFilters = () => {
        setSearch('');
        setMinPrice('');
        setMaxPrice('');
        router.get(
            '/product-page',
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const activeFilterCount = [
        filters.search,
        activeCategory !== 'all' ? activeCategory : null,
        filters.min_price,
        filters.max_price,
        activeAvailability !== 'all' ? activeAvailability : null,
        activeRating !== 'all' ? activeRating : null,
        discountedOnly ? '1' : null,
    ].filter(Boolean).length;

    const savePct = (full: number, sale: number) =>
        Math.round(((full - sale) / full) * 100);

    return (
        <>
            <Head title="Shop">
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
                <style>{`
                    :root {
                        --black: #0a0a0a;
                        --white: #f5f0e8;
                        --accent: #e8ff00;
                        --accent2: #ff3d2e;
                        --mid: #1c1c1c;
                        --border: #262626;
                        --muted: #6b6b6b;
                        --serif: 'Bebas Neue', sans-serif;
                        --body: 'DM Sans', sans-serif;
                    }
                    * { box-sizing: border-box; }
                    body { background: var(--black); color: var(--white); font-family: var(--body); overflow-x: hidden; }

                    @keyframes fadeUp {
                        from { opacity: 0; transform: translateY(16px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes shimmer {
                        0% { background-position: -400px 0; }
                        100% { background-position: 400px 0; }
                    }

                    .shop-page {
                        min-height: 100vh;
                        background: var(--black);
                        padding: 7rem 2rem 6rem;
                        overflow-x: hidden;
                    }
                    .shop-shell {
                        max-width: 1500px;
                        margin: 0 auto;
                        display: grid;
                        grid-template-columns: 280px minmax(0, 1fr);
                        gap: 2.5rem;
                    }

                    .shop-eyebrow {
                        font-size: .7rem; letter-spacing: .3em; text-transform: uppercase;
                        color: var(--accent); margin-bottom: .8rem; font-weight: 500;
                    }
                    .shop-title {
                        font-family: var(--serif);
                        font-size: clamp(2.6rem, 5vw, 4rem);
                        letter-spacing: .03em; line-height: 1;
                        margin-bottom: .6rem;
                    }
                    .shop-title .accent { color: var(--accent); }
                    .shop-sub {
                        color: rgba(245,240,232,.45); font-size: .9rem; max-width: 480px;
                        margin-bottom: 2.5rem; line-height: 1.6;
                    }

                    /* SIDEBAR */
                    .filters-sidebar {
                        position: sticky; top: 6.5rem; align-self: start;
                        max-height: calc(100vh - 8rem);
                        overflow-y: auto;
                        overflow-x: hidden;
                        min-width: 0;
                        padding-right: .5rem;
                    }
                    .filters-sidebar::-webkit-scrollbar { width: 4px; }
                    .filters-sidebar::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

                    .filter-block {
                        border: 1px solid var(--border);
                        background: var(--mid);
                        padding: 1.4rem;
                        margin-bottom: 1rem;
                        border-radius: 12px;
                        min-width: 0;
                        animation: fadeUp .5s ease both;
                    }
                    .filter-label {
                        font-size: .7rem; letter-spacing: .15em; text-transform: uppercase;
                        color: rgba(245,240,232,.5); margin-bottom: .9rem; font-weight: 500;
                        display: flex; align-items: center; gap: .5rem;
                    }

                    .filter-search-wrap { position: relative; min-width: 0; }
                    .filter-search-icon {
                        position: absolute; left: .9rem; top: 50%; transform: translateY(-50%);
                        width: 16px; height: 16px; color: rgba(245,240,232,.35);
                    }
                    .filter-search-input {
                        width: 100%; min-width: 0;
                        background: rgba(245,240,232,.05);
                        border: 1px solid var(--border);
                        border-radius: 8px;
                        color: var(--white);
                        font-family: var(--body);
                        font-size: .85rem;
                        padding: .7rem .8rem .7rem 2.5rem;
                        outline: none;
                        transition: border-color .2s;
                    }
                    .filter-search-input:focus { border-color: var(--accent); }

                    .price-row {
                        display: flex; gap: .5rem; margin-top: .3rem;
                        min-width: 0;
                    }
                    .price-input {
                        flex: 1 1 0; min-width: 0; width: 100%;
                        background: rgba(245,240,232,.05);
                        border: 1px solid var(--border); border-radius: 8px;
                        color: var(--white); font-family: var(--body);
                        font-size: .78rem; padding: .6rem .55rem;
                        outline: none; transition: border-color .2s;
                    }
                    .price-input:focus { border-color: var(--accent); }
                    .price-apply {
                        width: 100%; margin-top: .8rem;
                        background: var(--accent); color: var(--black);
                        border: none; border-radius: 8px; padding: .6rem;
                        font-family: var(--body);
                        font-size: .7rem; font-weight: 600; letter-spacing: .1em;
                        text-transform: uppercase; cursor: pointer;
                        transition: transform .15s;
                    }
                    .price-apply:hover { transform: translateY(-1px); }

                    .checkbox-row {
                        display: flex; align-items: center; gap: .6rem;
                        font-size: .82rem; color: rgba(245,240,232,.75);
                        padding: .45rem 0; cursor: pointer;
                        transition: color .2s;
                    }
                    .checkbox-row:hover { color: var(--white); }
                    .checkbox-row input {
                        width: 16px; height: 16px; flex-shrink: 0;
                        accent-color: var(--accent); cursor: pointer;
                    }

                    .star-row {
                        display: flex; align-items: center; gap: .55rem;
                        font-size: .8rem; color: rgba(245,240,232,.7);
                        padding: .45rem 0; cursor: pointer;
                        transition: color .2s;
                    }
                    .star-row:hover { color: var(--white); }
                    .star-row input {
                        width: 15px; height: 15px; flex-shrink: 0;
                        accent-color: var(--accent); cursor: pointer;
                    }
                    .star-row-label {
                        font-size: .76rem;
                        color: rgba(245,240,232,.5);
                    }

                    .placeholder-note {
                        font-size: .72rem; color: rgba(245,240,232,.3);
                        font-style: italic; line-height: 1.5;
                    }

                    .reset-btn-sidebar {
                        width: 100%; background: transparent;
                        border: 1px solid var(--border); color: rgba(245,240,232,.5);
                        border-radius: 8px; padding: .7rem;
                        font-family: var(--body); font-size: .75rem;
                        letter-spacing: .1em; text-transform: uppercase; cursor: pointer;
                        transition: border-color .2s, color .2s;
                    }
                    .reset-btn-sidebar:hover { border-color: var(--accent); color: var(--accent); }

                    .mobile-filter-toggle {
                        display: none;
                        align-items: center; gap: .5rem;
                        background: var(--mid); border: 1px solid var(--border);
                        color: var(--white); padding: .8rem 1.2rem; border-radius: 8px;
                        font-family: var(--body); font-size: .8rem;
                        margin-bottom: 1.5rem; cursor: pointer;
                    }
                    .filter-count-badge {
                        min-width: 19px; height: 19px; padding: 0 5px;
                        border-radius: 10px;
                        background: var(--accent); color: var(--black);
                        font-size: .62rem; font-weight: 700;
                        display: inline-flex; align-items: center; justify-content: center;
                    }

                    /* MAIN */
                    .shop-main { min-width: 0; }

                    .toolbar {
                        display: flex; align-items: center; justify-content: space-between;
                        flex-wrap: wrap; gap: 1rem;
                        margin-bottom: 1.8rem;
                        padding-bottom: 1.4rem;
                        border-bottom: 1px solid var(--border);
                    }
                    .toolbar-count { font-size: .85rem; color: rgba(245,240,232,.5); }
                    .toolbar-count strong { color: var(--white); }
                    .sort-select {
                        background: var(--mid); border: 1px solid var(--border);
                        color: var(--white); font-family: var(--body);
                        font-size: .82rem; padding: .6rem 1rem;
                        border-radius: 8px; outline: none; cursor: pointer;
                    }

                    .category-pills {
                        display: flex; gap: .6rem; flex-wrap: wrap;
                        margin-bottom: 2rem;
                    }
                    .cat-pill {
                        background: var(--mid); border: 1px solid var(--border);
                        color: rgba(245,240,232,.6);
                        font-family: var(--body); font-size: .78rem;
                        padding: .55rem 1.2rem; border-radius: 999px;
                        cursor: pointer; text-transform: capitalize;
                        transition: all .25s;
                    }
                    .cat-pill:hover { border-color: rgba(232,255,0,.4); color: var(--white); }
                    .cat-pill.active {
                        background: var(--accent); color: var(--black);
                        border-color: var(--accent); font-weight: 600;
                        box-shadow: 0 0 20px rgba(232,255,0,.35);
                    }

                    /* GRID */
                    .products-grid {
                        display: grid;
                        grid-template-columns: repeat(4, minmax(0, 1fr));
                        gap: 1.5rem;
                    }
                    @media (max-width: 1100px) { .products-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
                    @media (max-width: 640px) { .products-grid { grid-template-columns: minmax(0, 1fr); } }

                    .prod-card {
                        background: var(--mid); border: 1px solid var(--border);
                        border-radius: 14px; overflow: hidden; min-width: 0;
                        animation: fadeUp .5s ease both;
                        transition: transform .35s cubic-bezier(.34,1.56,.64,1), box-shadow .35s, border-color .3s;
                        position: relative;
                    }
                    .prod-card:hover {
                        transform: translateY(-6px);
                        box-shadow: 0 24px 60px rgba(0,0,0,.5);
                        border-color: rgba(232,255,0,.25);
                    }

                    .stock-ribbon-wrap {
                        position: absolute; top: 0; left: 0; z-index: 2;
                        width: 90px; height: 90px;
                        overflow: hidden;
                        pointer-events: none;
                    }
                    .stock-ribbon {
                        position: absolute;
                        top: 16px; left: -28px;
                        width: 130px;
                        padding: .35rem 0;
                        text-align: center;
                        transform: rotate(-45deg);
                        font-size: .62rem; font-weight: 700; letter-spacing: .05em;
                        text-transform: uppercase;
                        box-shadow: 0 2px 6px rgba(0,0,0,.35);
                    }
                    .stock-ribbon.in { background: var(--accent); color: var(--black); }
                    .stock-ribbon.out { background: var(--accent2); color: var(--white); }

                    .sale-flag {
                        position: absolute; bottom: .8rem; left: .8rem; z-index: 2;
                        display: inline-flex; align-items: center; gap: .3rem;
                        font-size: .58rem; letter-spacing: .14em;
                        text-transform: uppercase; font-weight: 700;
                        background: var(--accent2); color: #fff;
                        padding: .32rem .6rem;
                        box-shadow: 0 3px 12px rgba(255,61,46,.35);
                        pointer-events: none;
                    }

                    .prod-img-wrap { position: relative; overflow: hidden; aspect-ratio: 1; }
                    .prod-img-wrap img {
                        width: 100%; height: 100%; object-fit: cover;
                        transition: transform .5s;
                    }
                    .prod-card:hover .prod-img-wrap img { transform: scale(1.08); }

                    .quick-actions {
                        position: absolute; top: .8rem; right: .8rem; z-index: 3;
                        display: flex; flex-direction: column; gap: .5rem;
                        opacity: 0; transform: translateX(8px);
                        transition: opacity .25s, transform .25s;
                    }
                    .prod-card:hover .quick-actions { opacity: 1; transform: translateX(0); }
                    .qa-btn {
                        width: 34px; height: 34px; border-radius: 50%;
                        background: rgba(10,10,10,.85); border: 1px solid var(--border);
                        color: var(--white); display: flex; align-items: center; justify-content: center;
                        cursor: pointer; text-decoration: none;
                        transition: background .2s, color .2s;
                    }
                    .qa-btn:hover { background: var(--accent); color: var(--black); }

                    .quick-actions .wl-heart {
                        width: 34px; height: 34px; border-radius: 50%;
                        cursor: pointer;
                    }
                    .prod-card .quick-actions:has(.wl-on) { opacity: 1; transform: translateX(0); }

                    .prod-info { padding: 1.1rem 1.2rem 1.3rem; min-width: 0; }
                    .prod-cat {
                        font-size: .65rem; letter-spacing: .18em; text-transform: uppercase;
                        color: var(--muted);
                        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                    }
                    .prod-name {
                        font-size: 1.05rem; font-weight: 600; margin-top: .4rem;
                        line-height: 1.3;
                        overflow-wrap: break-word;
                    }

                    .card-rating {
                        display: flex; align-items: center; gap: .4rem;
                        margin-top: .5rem; min-height: 15px;
                    }
                    .card-rating-count {
                        font-size: .68rem; color: rgba(245,240,232,.32);
                        font-weight: 600;
                    }
                    .card-rating-none {
                        font-size: .66rem; color: rgba(245,240,232,.2);
                        font-style: italic;
                    }

                    .prod-price-row {
                        display: flex; align-items: baseline; gap: .5rem;
                        margin-top: .6rem; flex-wrap: wrap;
                    }
                    .prod-price { font-size: 1.1rem; font-weight: 700; color: var(--accent); }
                    .prod-was {
                        font-size: .82rem;
                        color: rgba(245,240,232,.3);
                        text-decoration: line-through;
                    }
                    .prod-save {
                        font-size: .6rem; letter-spacing: .1em;
                        font-weight: 700; color: var(--accent2);
                        border: 1px solid rgba(255,61,46,.35);
                        background: rgba(255,61,46,.1);
                        padding: .18rem .42rem;
                    }

                    .prod-desc {
                        font-size: .78rem; color: rgba(245,240,232,.4); margin-top: .5rem;
                        line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2;
                        -webkit-box-orient: vertical; overflow: hidden;
                        overflow-wrap: break-word;
                    }

                    .prod-cart-btn {
                        margin-top: 1rem; width: 100%;
                        background: transparent; border: 1px solid var(--accent);
                        color: var(--accent); padding: .7rem; border-radius: 8px;
                        font-family: var(--body);
                        font-size: .7rem; font-weight: 600; letter-spacing: .1em;
                        text-transform: uppercase; cursor: pointer;
                        display: flex; align-items: center; justify-content: center; gap: .5rem;
                        transition: background .2s, color .2s;
                    }
                    .prod-cart-btn:hover { background: var(--accent); color: var(--black); }
                    .prod-cart-btn:disabled {
                        opacity: .4; cursor: not-allowed; border-color: var(--border); color: rgba(245,240,232,.4);
                    }
                    .prod-cart-btn:disabled:hover { background: transparent; color: rgba(245,240,232,.4); }

                    .empty-state {
                        text-align: center; padding: 5rem 2rem;
                        border: 1px dashed var(--border); border-radius: 16px;
                    }
                    .empty-title {
                        font-family: var(--serif); font-size: 2rem; letter-spacing: .04em;
                        margin: 1.2rem 0 .6rem;
                    }
                    .empty-desc { color: rgba(245,240,232,.4); font-size: .85rem; margin-bottom: 1.6rem; }
                    .empty-reset {
                        background: var(--accent); color: var(--black); border: none;
                        padding: .8rem 1.8rem; border-radius: 8px;
                        font-family: var(--body); font-size: .75rem;
                        font-weight: 600; letter-spacing: .1em; text-transform: uppercase; cursor: pointer;
                    }

                    .pagination { display: flex; flex-wrap: wrap; justify-content: center; gap: .5rem; margin-top: 3rem; }
                    .page-link {
                        border: 1px solid var(--border); color: rgba(245,240,232,.6);
                        padding: .55rem 1rem; border-radius: 8px; font-size: .8rem;
                        text-decoration: none; transition: all .2s;
                    }
                    .page-link:hover { border-color: var(--accent); color: var(--white); }
                    .page-link.active { background: var(--accent); color: var(--black); border-color: var(--accent); font-weight: 600; }
                    .page-link.disabled { opacity: .3; pointer-events: none; }

                    @media (max-width: 900px) {
                        .shop-page { padding: 6rem 1.5rem 5rem; }
                        .shop-shell { grid-template-columns: minmax(0, 1fr); }
                        .filters-sidebar {
                            position: fixed; top: 0; left: 0; bottom: 0; z-index: 400;
                            width: 300px; background: var(--black);
                            padding: 2rem 1.2rem; overflow-y: auto; overflow-x: hidden;
                            transform: translateX(-105%); transition: transform .3s ease;
                            max-height: 100vh;
                        }
                        .filters-sidebar.open { transform: translateX(0); }
                        .mobile-filter-toggle { display: inline-flex; }
                        .quick-actions { opacity: 1; transform: translateX(0); }
                    }
                `}</style>
            </Head>

            <SiteNav />

            <div className="shop-page">
                <div className="shop-shell">
                    {/* SIDEBAR */}
                    <aside className={`filters-sidebar ${sidebarOpen ? 'open' : ''}`}>
                        <button className="mobile-filter-toggle" onClick={() => setSidebarOpen(false)} style={{ marginBottom: '1.5rem' }}>
                            <X size={16} /> Close Filters
                        </button>

                        <div className="filter-block">
                            <div className="filter-label">
                                <Search size={14} /> Search Products
                            </div>
                            <div className="filter-search-wrap">
                                <Search className="filter-search-icon" />
                                <input className="filter-search-input" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
                            </div>
                        </div>

                        <div className="filter-block">
                            <div className="filter-label">Price Range</div>
                            <div className="price-row">
                                <input className="price-input" placeholder="Min" inputMode="numeric" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
                                <input className="price-input" placeholder="Max" inputMode="numeric" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
                            </div>
                            <button className="price-apply" onClick={() => applyFilters({ min_price: minPrice, max_price: maxPrice })}>
                                Apply
                            </button>
                        </div>

                        <div className="filter-block">
                            <div className="filter-label">Minimum Rating</div>

                            <label className="star-row">
                                <input type="radio" name="rating" checked={activeRating === 'all'} onChange={() => applyFilters({ rating: 'all' })} />
                                <span className="star-row-label">Any rating</span>
                            </label>

                            {[4, 3, 2].map((n) => (
                                <label className="star-row" key={n}>
                                    <input type="radio" name="rating" checked={activeRating === String(n)} onChange={() => applyFilters({ rating: String(n) })} />
                                    <StarRating value={n} size={12} />
                                    <span className="star-row-label">&amp; up</span>
                                </label>
                            ))}
                        </div>

                        <div className="filter-block">
                            <div className="filter-label">Availability</div>
                            <label className="checkbox-row">
                                <input type="radio" name="availability" checked={activeAvailability === 'all'} onChange={() => applyFilters({ availability: 'all' })} />
                                All
                            </label>
                            <label className="checkbox-row">
                                <input type="radio" name="availability" checked={activeAvailability === 'in_stock'} onChange={() => applyFilters({ availability: 'in_stock' })} />
                                In Stock
                            </label>
                            <label className="checkbox-row">
                                <input type="radio" name="availability" checked={activeAvailability === 'out_of_stock'} onChange={() => applyFilters({ availability: 'out_of_stock' })} />
                                Out of Stock
                            </label>
                        </div>

                        <div className="filter-block">
                            <div className="filter-label">Offers</div>
                            <label className="checkbox-row">
                                <input type="checkbox" checked={discountedOnly} onChange={(e) => applyFilters({ discounted: e.target.checked ? '1' : '' })} />
                                Discounted only
                            </label>
                        </div>

                        <div className="filter-block">
                            <div className="filter-label">Brands</div>
                            <p className="placeholder-note">
                                Requires a brand field on products — not yet in the database.
                            </p>
                        </div>

                        <div className="filter-block">
                            <div className="filter-label">Colors &amp; Sizes</div>
                            <p className="placeholder-note">
                                Requires product variants — not yet supported.
                            </p>
                        </div>

                        <button className="reset-btn-sidebar" onClick={resetFilters}>
                            Reset All Filters
                        </button>
                    </aside>

                    {/* MAIN */}
                    <main className="shop-main">
                        <button className="mobile-filter-toggle" onClick={() => setSidebarOpen(true)}>
                            <SlidersHorizontal size={16} /> Filters
                            {activeFilterCount > 0 && (
                                <span className="filter-count-badge">{activeFilterCount}</span>
                            )}
                        </button>

                        <p className="shop-eyebrow">Collection</p>
                        <h1 className="shop-title">
                            OUR <span className="accent">PRODUCTS</span>
                        </h1>
                        <p className="shop-sub">
                            Discover our latest collection of premium products crafted for people who appreciate quality and bold design.
                        </p>

                        <div className="category-pills">
                            <button className={`cat-pill ${activeCategory === 'all' ? 'active' : ''}`} onClick={() => applyFilters({ category: 'all' })}>
                                All
                            </button>
                            {categories.map((cat) => (
                                <button key={cat} className={`cat-pill ${activeCategory === cat ? 'active' : ''}`} onClick={() => applyFilters({ category: cat })}>
                                    {cat}
                                </button>
                            ))}
                        </div>

                        <div className="toolbar">
                            <p className="toolbar-count">
                                <strong>{products.total}</strong> product{products.total === 1 ? '' : 's'} found
                            </p>
                            <select className="sort-select" value={activeSort} onChange={(e) => applyFilters({ sort: e.target.value })}>
                                <option value="newest">Newest</option>
                                <option value="oldest">Oldest</option>
                                <option value="price_asc">Price: Low to High</option>
                                <option value="price_desc">Price: High to Low</option>
                                <option value="rating_desc">Highest Rated</option>
                                <option value="popular">Most Reviewed</option>
                            </select>
                        </div>

                        {products.data.length === 0 ? (
                            <div className="empty-state">
                                <Search size={48} style={{ color: 'var(--border)', margin: '0 auto' }} />
                                <h2 className="empty-title">No products found</h2>
                                <p className="empty-desc">Try adjusting your filters or search terms.</p>
                                <button className="empty-reset" onClick={resetFilters}>
                                    Reset Filters
                                </button>
                            </div>
                        ) : (
                            <div className="products-grid">
                                {products.data.map((product) => {
                                    const outOfStock = product.stock <= 0;
                                    const full = Number(product.price);
                                    const sale = product.discount_price
                                        ? Number(product.discount_price)
                                        : null;
                                    const onSale = sale !== null && sale < full;

                                    return (
                                        <div key={product.id} className="prod-card">
                                            <div className="prod-img-wrap">
                                                <div className="stock-ribbon-wrap">
                                                    <div className={`stock-ribbon ${outOfStock ? 'out' : 'in'}`}>
                                                        {outOfStock ? 'Out of Stock' : `In Stock (${product.stock})`}
                                                    </div>
                                                </div>

                                                {onSale && !outOfStock && (
                                                    <span className="sale-flag">
                                                        Save {savePct(full, sale)}%
                                                    </span>
                                                )}

                                                <img src={`${appUrl}/storage/${product.image}`} alt={product.name} loading="lazy" style={outOfStock ? { opacity: 0.5 } : undefined} />

                                                <div className="quick-actions">
                                                    <WishlistHeart productId={product.id} initialSaved={wishlistIds.includes(product.id)} size={15} />
                                                    <Link href={`/product/${product.slug}`} className="qa-btn" title="View details" aria-label={`View ${product.name}`}>
                                                        <Eye size={15} />
                                                    </Link>
                                                </div>
                                            </div>

                                            <div className="prod-info">
                                                <p className="prod-cat">{product.category}</p>
                                                <h3 className="prod-name">{product.name}</h3>

                                                <div className="card-rating">
                                                    {product.reviews_count > 0 ? (
                                                        <>
                                                            <StarRating value={Math.round(Number(product.reviews_avg_rating))} size={11} />
                                                            <span className="card-rating-count">({product.reviews_count})</span>
                                                        </>
                                                    ) : (
                                                        <span className="card-rating-none">No reviews yet</span>
                                                    )}
                                                </div>

                                                <div className="prod-price-row">
                                                    <span className="prod-price" style={outOfStock ? { textDecoration: 'line-through', opacity: 0.5 } : undefined}>
                                                        ₦{(onSale ? sale : full).toLocaleString()}
                                                    </span>

                                                    {onSale && !outOfStock && (
                                                        <>
                                                            <span className="prod-was">
                                                                ₦{full.toLocaleString()}
                                                            </span>
                                                            <span className="prod-save">
                                                                −{savePct(full, sale)}%
                                                            </span>
                                                        </>
                                                    )}
                                                </div>

                                                {product.description && (
                                                    <p className="prod-desc">{product.description}</p>
                                                )}

                                                <button className="prod-cart-btn" disabled={outOfStock} onClick={() => handleAddToCart(product.id, product.stock)}>
                                                    <ShoppingCart size={14} />
                                                    {outOfStock ? 'Out of Stock' : 'Add to Cart'}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {products.links.length > 3 && (
                            <div className="pagination">
                                {products.links.map((link, i) => (
                                    <Link key={i} href={link.url || '#'} dangerouslySetInnerHTML={{ __html: link.label }} preserveScroll className={`page-link ${link.active ? 'active' : ''} ${!link.url ? 'disabled' : ''}`} />
                                ))}
                            </div>
                        )}
                    </main>
                </div>
            </div>

            <CartWidget />
        </>
    );
}

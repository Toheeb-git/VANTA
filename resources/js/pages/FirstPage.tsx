import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { Eye, ShoppingCart, Check, Mail } from 'lucide-react';
import SiteNav from '@/components/SiteNav';
import CartWidget from '@/components/CartWidget';
import WishlistHeart from '@/components/WishlistHeart';

export default function FirstPage() {
    const { auth } = usePage().props as unknown as {
        auth: {
            user: { id: number; name: string; email: string; role: string } | null;
        };
    };
    const cursorRef = useRef<HTMLDivElement>(null);
    const [wishlistIds, setWishlistIds] = useState<number[]>([]);
    const [subscribed, setSubscribed] = useState(false);

    const subForm = useForm({ email: '' });

    useEffect(() => {
        const cursor = cursorRef.current;
        if (!cursor) return;

        const onMove = (e: MouseEvent) => {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
        };
        document.addEventListener('mousemove', onMove);

        const interactables = document.querySelectorAll('a, button, input');
        interactables.forEach((el) => {
            el.addEventListener('mouseenter', () =>
                cursor.classList.add('cursor-expand'),
            );
            el.addEventListener('mouseleave', () =>
                cursor.classList.remove('cursor-expand'),
            );
        });

        const ticker = document.getElementById('ticker-inner');
        if (ticker) {
            const items = [
                'Free Shipping Worldwide',
                'New Drop Available',
                'Limited Stock',
                '30-Day Returns',
                'Handcrafted Quality',
                'Fast Dispatch',
            ];
            const html = items
                .map(
                    (t) =>
                        `<span class="ticker-item">${t}<span class="ticker-sep"></span></span>`,
                )
                .join('');
            ticker.innerHTML = html + html;
        }

        const observer = new IntersectionObserver(
            (entries) =>
                entries.forEach((e) => {
                    if (e.isIntersecting) e.target.classList.add('visible');
                }),
            { threshold: 0.2 },
        );
        document
            .querySelectorAll('.feature-item')
            .forEach((el) => observer.observe(el));

        return () => {
            document.removeEventListener('mousemove', onMove);
            observer.disconnect();
        };
    }, [subscribed]);

    const { products, appUrl } = usePage().props as unknown as {
        products: any[];
        appUrl: string;
    };

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

    useEffect(() => {
        if (!subscribed) return;
        const t = setTimeout(() => setSubscribed(false), 9000);
        return () => clearTimeout(t);
    }, [subscribed]);

    const exploreHref = !auth.user
        ? '/product-page'
        : auth.user.role === 'admin'
          ? '/product-dashboard'
          : '/product-page';

    const submitSubscribe = (e: React.FormEvent) => {
        e.preventDefault();
        subForm.post('/subscribe', {
            preserveScroll: true,
            onSuccess: () => {
                subForm.reset();
                setSubscribed(true);
            },
        });
    };

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

    const savePct = (full: number, sale: number) =>
        Math.round(((full - sale) / full) * 100);

    return (
        <>
            <Head title="Welcome">
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
                <style>{`
                    :root {
                        --black: #0a0a0a;
                        --white: #f5f0e8;
                        --accent: #e8ff00;
                        --accent2: #ff3d2e;
                        --green: #4ade80;
                        --mid: #1c1c1c;
                        --muted: #555;
                        --border: #262626;
                        --serif: 'Bebas Neue', sans-serif;
                        --body: 'DM Sans', sans-serif;
                    }
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    body { background: var(--black); color: var(--white); font-family: var(--body); overflow-x: hidden; cursor: none; }

                    .custom-cursor {
                        position: fixed; top: 0; left: 0;
                        width: 12px; height: 12px;
                        background: var(--accent);
                        border-radius: 50%;
                        pointer-events: none;
                        z-index: 9999;
                        transform: translate(-50%, -50%);
                        transition: width .2s, height .2s;
                        mix-blend-mode: difference;
                    }
                    .custom-cursor.cursor-expand { width: 40px; height: 40px; }

                    @keyframes fadeUp {
                        from { opacity: 0; transform: translateY(24px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes spin { to { transform: rotate(360deg); } }
                    @keyframes ticker {
                        from { transform: translateX(0); }
                        to { transform: translateX(-50%); }
                    }
                    @keyframes scaleIn {
                        from { transform: scale(.85) translateY(20px); opacity: 0; }
                        to { transform: scale(1) translateY(0); opacity: 1; }
                    }
                    @keyframes grain {
                        0%,100%{transform:translate(0,0)}10%{transform:translate(-5%,-10%)}
                        30%{transform:translate(3%,-15%)}50%{transform:translate(12%,9%)}
                        70%{transform:translate(9%,4%)}90%{transform:translate(-1%,7%)}
                    }
                    @keyframes sealIn {
                        0% { transform: scale(.4) rotate(-25deg); opacity: 0; }
                        55% { transform: scale(1.18) rotate(6deg); opacity: 1; }
                        100% { transform: scale(1) rotate(0); opacity: 1; }
                    }
                    @keyframes ringOut {
                        0% { transform: scale(.7); opacity: .7; }
                        100% { transform: scale(2.1); opacity: 0; }
                    }
                    @keyframes lineWipe {
                        from { transform: scaleX(0); }
                        to { transform: scaleX(1); }
                    }

                    .hero {
                        min-height: 100vh;
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        position: relative;
                        overflow: hidden;
                    }
                    .hero::before {
                        content: '';
                        position: absolute; inset: 0;
                        background:
                            radial-gradient(circle at 70% 50%, rgba(232,255,0,.07) 0%, transparent 60%),
                            radial-gradient(circle at 20% 80%, rgba(255,61,46,.06) 0%, transparent 50%);
                        z-index: 0;
                    }
                    .hero::after {
                        content: '';
                        position: absolute; inset: -200%;
                        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
                        opacity: .4; z-index: 0; pointer-events: none;
                        animation: grain 8s steps(10) infinite;
                    }

                    .hero-left {
                        position: relative; z-index: 2;
                        display: flex; flex-direction: column; justify-content: flex-end;
                        padding: 6rem 3rem 5rem;
                    }
                    .hero-eyebrow {
                        display: flex; align-items: center; gap: .75rem; margin-bottom: 1.5rem;
                        opacity: 0; animation: fadeUp .8s .2s forwards;
                    }
                    .eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); }
                    .eyebrow-text { font-size: .7rem; letter-spacing: .25em; text-transform: uppercase; color: var(--accent); font-weight: 500; }

                    .hero-title {
                        font-family: var(--serif);
                        font-size: clamp(5rem, 9vw, 10rem);
                        line-height: .92; letter-spacing: .02em; color: var(--white);
                        opacity: 0; animation: fadeUp .8s .4s forwards;
                    }
                    .hero-title .accent-line { color: var(--accent); display: block; }
                    .hero-title .outline-line { -webkit-text-stroke: 1px var(--white); color: transparent; }

                    .hero-sub {
                        margin-top: 2rem; max-width: 340px; font-size: 1rem; font-weight: 300;
                        line-height: 1.7; color: rgba(245,240,232,.55);
                        opacity: 0; animation: fadeUp .8s .6s forwards;
                    }
                    .hero-actions {
                        margin-top: 2.5rem; display: flex; align-items: center; gap: 1.5rem;
                        opacity: 0; animation: fadeUp .8s .8s forwards;
                    }

                    .btn-primary {
                        display: inline-flex; align-items: center; gap: .6rem;
                        background: var(--accent); color: var(--black); text-decoration: none;
                        font-size: .8rem; font-weight: 500; letter-spacing: .15em; text-transform: uppercase;
                        padding: 1.1rem 2.2rem; position: relative; overflow: hidden; transition: transform .2s;
                    }
                    .btn-primary::after {
                        content: ''; position: absolute; inset: 0;
                        background: var(--accent2); transform: translateX(-101%);
                        transition: transform .3s cubic-bezier(.4,0,.2,1);
                    }
                    .btn-primary:hover::after { transform: translateX(0); }
                    .btn-primary:hover { transform: translateY(-2px); }
                    .btn-primary span { position: relative; z-index: 1; }

                    .btn-ghost {
                        font-size: .8rem; letter-spacing: .15em; text-transform: uppercase;
                        color: rgba(245,240,232,.5); text-decoration: none;
                        border-bottom: 1px solid rgba(245,240,232,.2); padding-bottom: 2px;
                        transition: color .2s, border-color .2s;
                    }
                    .btn-ghost:hover { color: var(--white); border-color: var(--white); }

                    .hero-stats {
                        margin-top: 4rem; display: flex; gap: 2.5rem;
                        opacity: 0; animation: fadeUp .8s 1s forwards;
                    }
                    .stat-num { font-family: var(--serif); font-size: 2.2rem; letter-spacing: .04em; line-height: 1; }
                    .stat-num sup { font-family: var(--body); font-size: .7rem; color: var(--accent); }
                    .stat-label { font-size: .7rem; letter-spacing: .15em; text-transform: uppercase; color: var(--muted); margin-top: .3rem; }

                    .hero-right { position: relative; z-index: 2; overflow: hidden; }
                    .product-stage {
                        position: absolute; inset: 0;
                        display: flex; align-items: center; justify-content: center;
                    }
                    .ring {
                        position: absolute; border-radius: 50%;
                        border: 1px solid rgba(232,255,0,.12);
                        animation: spin linear infinite;
                    }
                    .ring-1 { width: 380px; height: 380px; animation-duration: 30s; }
                    .ring-2 { width: 520px; height: 520px; animation-duration: 50s; animation-direction: reverse; border-style: dashed; }
                    .ring-3 { width: 660px; height: 660px; animation-duration: 70s; border-color: rgba(255,61,46,.08); }

                    .product-card {
                        position: relative; z-index: 3; width: 280px;
                        background: var(--mid); border: 1px solid rgba(245,240,232,.08); overflow: hidden;
                        opacity: 0; animation: scaleIn .9s .5s cubic-bezier(.34,1.56,.64,1) forwards;
                        transition: transform .4s cubic-bezier(.34,1.56,.64,1), box-shadow .4s;
                    }
                    .product-card:hover {
                        transform: translateY(-8px) rotate(-1deg);
                        box-shadow: 0 32px 80px rgba(0,0,0,.6), 0 0 0 1px rgba(232,255,0,.15);
                    }
                    .card-image {
                        width: 100%; aspect-ratio: 3/4;
                        background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 50%, #111 100%);
                        display: flex; align-items: center; justify-content: center;
                        position: relative; overflow: hidden;
                    }
                    .card-image::before {
                        content: ''; position: absolute; inset: 0;
                        background: radial-gradient(circle at 40% 30%, rgba(232,255,0,.12), transparent 60%);
                    }
                    .product-icon { width: 100px; height: 130px; position: relative; }
                    .p-body {
                        position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
                        width: 70px; height: 100px;
                        background: linear-gradient(160deg, #3a3a3a, #222);
                        border: 1px solid rgba(255,255,255,.1);
                    }
                    .p-accent { position: absolute; top: 20px; left: 50%; transform: translateX(-50%); width: 30px; height: 4px; background: var(--accent); }
                    .p-accent2 { position: absolute; top: 32px; left: 50%; transform: translateX(-50%); width: 18px; height: 4px; background: var(--accent2); opacity: .7; }
                    .p-circle {
                        position: absolute; top: -20px; left: 50%; transform: translateX(-50%);
                        width: 40px; height: 40px; border-radius: 50%;
                        border: 1px solid rgba(232,255,0,.4); background: rgba(232,255,0,.05);
                    }
                    .card-badge {
                        position: absolute; top: 1rem; left: 1rem;
                        background: var(--accent2); color: var(--white);
                        font-size: .6rem; font-weight: 500; letter-spacing: .2em; text-transform: uppercase; padding: .3rem .6rem;
                    }
                    .card-info { padding: 1.2rem 1.4rem 1.4rem; border-top: 1px solid rgba(245,240,232,.06); }
                    .card-name { font-family: var(--serif); font-size: 1.4rem; letter-spacing: .06em; line-height: 1.1; }
                    .card-meta { margin-top: .4rem; display: flex; align-items: center; justify-content: space-between; }
                    .card-price { font-size: .85rem; font-weight: 300; color: var(--accent); }
                    .card-avail { font-size: .65rem; letter-spacing: .15em; text-transform: uppercase; color: var(--muted); }

                    .float-tag {
                        position: absolute; z-index: 4;
                        background: rgba(10,10,10,.9); border: 1px solid rgba(245,240,232,.1);
                        padding: .5rem .9rem; font-size: .7rem; letter-spacing: .1em;
                        text-transform: uppercase; color: var(--white); backdrop-filter: blur(8px);
                        opacity: 0; animation: fadeUp .6s forwards;
                    }
                    .float-tag.t1 { top: 22%; right: 8%; animation-delay: 1.1s; }
                    .float-tag.t2 { bottom: 28%; left: 5%; animation-delay: 1.3s; }
                    .float-tag .tag-val { font-family: var(--serif); font-size: 1.1rem; color: var(--accent); display: block; margin-top: .1rem; }

                    .hero-side-label {
                        position: absolute; right: 1.5rem; top: 50%;
                        transform: translateY(-50%) rotate(90deg); transform-origin: center;
                        font-size: .6rem; letter-spacing: .3em; text-transform: uppercase;
                        color: rgba(245,240,232,.2); z-index: 5; white-space: nowrap;
                    }

                    .ticker { position: relative; z-index: 10; background: var(--accent); color: var(--black); padding: .65rem 0; overflow: hidden; white-space: nowrap; }
                    .ticker-inner { display: inline-flex; gap: 0; animation: ticker 20s linear infinite; }
                    .ticker-item { display: inline-flex; align-items: center; gap: 1.5rem; padding: 0 2rem; font-size: .7rem; font-weight: 500; letter-spacing: .2em; text-transform: uppercase; }
                    .ticker-sep { width: 4px; height: 4px; border-radius: 50%; background: rgba(0,0,0,.3); flex-shrink: 0; }

                    .features-strip { display: grid; grid-template-columns: repeat(3, 1fr); border-top: 1px solid rgba(245,240,232,.07); }
                    .feature-item {
                        padding: 3rem; border-right: 1px solid rgba(245,240,232,.07);
                        opacity: 0; transform: translateY(20px); transition: opacity .6s, transform .6s;
                    }
                    .feature-item:last-child { border-right: none; }
                    .feature-item.visible { opacity: 1; transform: translateY(0); }
                    .feature-item:nth-child(2) { transition-delay: .1s; }
                    .feature-item:nth-child(3) { transition-delay: .2s; }
                    .feat-num { font-family: var(--serif); font-size: 3rem; color: rgba(245,240,232,.08); line-height: 1; margin-bottom: .8rem; }
                    .feat-icon { width: 36px; height: 36px; border: 1px solid rgba(232,255,0,.3); display: flex; align-items: center; justify-content: center; margin-bottom: 1.2rem; color: var(--accent); font-size: 1rem; }
                    .feat-title { font-family: var(--serif); font-size: 1.4rem; letter-spacing: .06em; margin-bottom: .6rem; }
                    .feat-desc { font-size: .85rem; font-weight: 300; line-height: 1.7; color: rgba(245,240,232,.45); }

                    /* CTA */
                    .cta-section {
                        position: relative; overflow: hidden; padding: 8rem 3rem;
                        display: flex; flex-direction: column; align-items: center; text-align: center;
                        border-top: 1px solid rgba(245,240,232,.07);
                    }
                    .cta-section::before {
                        content: ''; position: absolute; top: 50%; left: 50%;
                        transform: translate(-50%, -50%); width: 600px; height: 600px; border-radius: 50%;
                        background: radial-gradient(circle, rgba(232,255,0,.06) 0%, transparent 70%); pointer-events: none;
                    }
                    .cta-label { font-size: .7rem; letter-spacing: .3em; text-transform: uppercase; color: var(--accent); margin-bottom: 1.5rem; opacity: 0; animation: fadeUp .7s .2s forwards; }
                    .cta-title {
                        font-family: var(--serif); font-size: clamp(3.5rem, 7vw, 7rem); line-height: .95;
                        letter-spacing: .02em; max-width: 800px; opacity: 0; animation: fadeUp .7s .35s forwards;
                    }
                    .cta-title .outline { -webkit-text-stroke: 1px rgba(245,240,232,.4); color: transparent; }
                    .cta-sub { margin-top: 1.5rem; max-width: 400px; font-size: .95rem; font-weight: 300; line-height: 1.7; color: rgba(245,240,232,.4); opacity: 0; animation: fadeUp .7s .5s forwards; }

                    .cta-form {
                        margin-top: 2.5rem; display: flex; gap: 0;
                        max-width: 420px; width: 100%;
                        opacity: 0; animation: fadeUp .7s .65s forwards;
                        position: relative; z-index: 2;
                    }
                    .cta-input {
                        flex: 1; min-width: 0;
                        background: rgba(245,240,232,.06);
                        border: 1px solid rgba(245,240,232,.1);
                        border-right: none; color: var(--white);
                        font-family: var(--body);
                        font-size: .85rem; padding: 1rem 1.2rem; outline: none;
                        transition: border-color .2s, background .2s;
                    }
                    .cta-input::placeholder { color: rgba(245,240,232,.3); }
                    .cta-input:focus { border-color: var(--accent); background: rgba(232,255,0,.04); }
                    .cta-submit {
                        background: var(--accent); color: var(--black); border: none;
                        font-family: var(--body); font-size: .75rem; font-weight: 500;
                        letter-spacing: .15em; text-transform: uppercase;
                        padding: 1rem 1.5rem; cursor: none;
                        white-space: nowrap;
                        transition: background .2s, color .2s;
                    }
                    .cta-submit:hover:not(:disabled) { background: var(--accent2); color: var(--white); }
                    .cta-submit:disabled { opacity: .5; }

                    .cta-error {
                        margin-top: .9rem; font-size: .78rem;
                        color: var(--accent2);
                        position: relative; z-index: 2;
                    }
                    .cta-note {
                        margin-top: 1rem; font-size: .68rem;
                        letter-spacing: .08em;
                        color: rgba(245,240,232,.22);
                        position: relative; z-index: 2;
                    }

                    .cta-success {
                        position: relative; z-index: 2;
                        margin-top: 2.5rem;
                        width: 100%; max-width: 430px;
                        background: linear-gradient(158deg, rgba(232,255,0,.055) 0%, rgba(232,255,0,.012) 100%);
                        border: 1px solid rgba(232,255,0,.28);
                        padding: 2.1rem 1.9rem 1.9rem;
                        animation: fadeUp .5s cubic-bezier(.22,1,.36,1) both;
                        overflow: hidden;
                    }
                    .cta-success::after {
                        content: ''; position: absolute;
                        left: 0; right: 0; bottom: 0; height: 2px;
                        background: linear-gradient(90deg, var(--accent), rgba(232,255,0,.15));
                        transform-origin: left;
                        animation: lineWipe 9s linear both;
                    }

                    .seal {
                        position: relative;
                        width: 58px; height: 58px; margin: 0 auto 1.3rem;
                        border-radius: 50%;
                        background: var(--accent);
                        display: flex; align-items: center; justify-content: center;
                        color: var(--black);
                        animation: sealIn .6s cubic-bezier(.34,1.5,.64,1) both;
                    }
                    .seal::before, .seal::after {
                        content: ''; position: absolute; inset: 0;
                        border-radius: 50%;
                        border: 1px solid rgba(232,255,0,.5);
                        animation: ringOut 1.9s ease-out infinite;
                    }
                    .seal::after { animation-delay: .65s; }

                    .success-title {
                        font-family: var(--serif);
                        font-size: 1.75rem; letter-spacing: .06em;
                        line-height: 1; margin-bottom: .75rem;
                        color: var(--white);
                    }
                    .success-body {
                        font-size: .86rem; font-weight: 300; line-height: 1.75;
                        color: rgba(245,240,232,.52);
                        max-width: 320px; margin: 0 auto;
                    }
                    .success-mail {
                        display: inline-flex; align-items: center; gap: .45rem;
                        margin-top: 1.4rem; padding-top: 1.2rem;
                        border-top: 1px solid rgba(245,240,232,.08);
                        width: 100%; justify-content: center;
                        font-size: .64rem; letter-spacing: .14em;
                        text-transform: uppercase; font-weight: 600;
                        color: rgba(232,255,0,.6);
                    }

                    /* PRODUCTS */
                    .products-section {
                        position: relative;
                        padding: 6rem 3rem;
                        border-top: 1px solid rgba(245,240,232,.07);
                    }
                    .products-header { text-align: center; margin-bottom: 4rem; }
                    .products-title {
                        font-family: var(--serif);
                        font-size: clamp(2.8rem, 6vw, 4.5rem);
                        letter-spacing: .04em;
                        color: var(--white);
                    }
                    .products-title .accent-line { color: var(--accent); }

                    .products-grid {
                        display: grid;
                        grid-template-columns: repeat(4, minmax(0, 1fr));
                        gap: 1.5rem;
                        max-width: 1400px;
                        margin: 0 auto;
                    }

                    .prod-card {
                        background: var(--mid);
                        border: 1px solid var(--border);
                        border-radius: 14px;
                        overflow: hidden; min-width: 0;
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
                        width: 100%; height: 100%;
                        object-fit: cover;
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
                        cursor: none; text-decoration: none;
                        transition: background .2s, color .2s;
                    }
                    .qa-btn:hover { background: var(--accent); color: var(--black); }

                    .quick-actions .wl-heart {
                        width: 34px; height: 34px; border-radius: 50%;
                        cursor: none;
                    }
                    .prod-card .quick-actions:has(.wl-on) { opacity: 1; transform: translateX(0); }

                    .prod-info { padding: 1.1rem 1.2rem 1.3rem; min-width: 0; }
                    .prod-cat {
                        font-size: .65rem; letter-spacing: .18em; text-transform: uppercase;
                        color: var(--muted);
                    }
                    .prod-name {
                        font-size: 1.05rem; font-weight: 600; margin-top: .4rem;
                        line-height: 1.3; overflow-wrap: break-word;
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
                        text-transform: uppercase; cursor: none;
                        display: flex; align-items: center; justify-content: center; gap: .5rem;
                        transition: background .2s, color .2s;
                    }
                    .prod-cart-btn:hover { background: var(--accent); color: var(--black); }
                    .prod-cart-btn:disabled {
                        opacity: .4; cursor: none; border-color: var(--border); color: rgba(245,240,232,.4);
                    }
                    .prod-cart-btn:disabled:hover { background: transparent; color: rgba(245,240,232,.4); }

                    .products-cta {
                        display: flex; justify-content: center;
                        margin-top: 4rem;
                    }

                    @media (max-width: 1100px) {
                        .products-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                    }
                    @media (max-width: 640px) {
                        .products-grid { grid-template-columns: minmax(0, 1fr); }
                        .products-section { padding: 4rem 1.5rem; }
                        .quick-actions { opacity: 1; transform: translateX(0); }
                    }

                    footer { padding: 2rem 3rem; display: flex; align-items: center; justify-content: space-between; border-top: 1px solid rgba(245,240,232,.07); }
                    .footer-logo { font-family: var(--serif); font-size: 1.4rem; letter-spacing: .12em; color: rgba(245,240,232,.3); }
                    .footer-copy { font-size: .7rem; letter-spacing: .1em; color: rgba(245,240,232,.2); }
                    .footer-links { display: flex; gap: 2rem; list-style: none; }
                    .footer-links a { font-size: .7rem; letter-spacing: .15em; text-transform: uppercase; color: rgba(245,240,232,.3); text-decoration: none; transition: color .2s; }
                    .footer-links a:hover { color: var(--white); }

                    @media (max-width: 900px) {
                        .hero { grid-template-columns: 1fr; min-height: auto; }
                        .hero-right { height: 60vw; }
                        .hero-left { padding: 7rem 1.5rem 3rem; }
                        .features-strip { grid-template-columns: 1fr; }
                        .feature-item { border-right: none; border-bottom: 1px solid rgba(245,240,232,.07); }
                        footer { flex-direction: column; gap: 1rem; text-align: center; }
                        .footer-links { display: none; }
                    }
                    @media (max-width: 520px) {
                        .cta-section { padding: 5rem 1.4rem; }
                        .cta-form { flex-direction: column; gap: .6rem; }
                        .cta-input { border-right: 1px solid rgba(245,240,232,.1); }
                        .cta-submit { padding: 1rem; }
                        .cta-success { padding: 1.8rem 1.4rem 1.6rem; }
                    }
                `}</style>
            </Head>

            <SiteNav />

            <div className="custom-cursor" ref={cursorRef} />

            {/* HERO */}
            <section className="hero">
                <div className="hero-left">
                    <div className="hero-eyebrow">
                        <div className="eyebrow-dot" />
                        <span className="eyebrow-text">
                            SS 2026 Drop — Limited Units
                        </span>
                    </div>
                    <h1 className="hero-title">
                        MADE
                        <br />
                        <span className="accent-line">FOR THE</span>
                        <span className="outline-line">BOLD</span>
                    </h1>
                    <p className="hero-sub">
                        Crafted for those who don't follow trends — they set them. Your next essential piece, reimagined from the ground up.
                    </p>
                    <div className="hero-actions">
                        <Link href="/product-page" className="btn-primary">
                            <span>Shop Now</span>
                            <span>→</span>
                        </Link>
                        <a href="#" className="btn-ghost">
                            View Lookbook
                        </a>
                    </div>
                    <div className="hero-stats">
                        <div>
                            <div className="stat-num">
                                12<sup>K+</sup>
                            </div>
                            <div className="stat-label">Happy Customers</div>
                        </div>
                        <div>
                            <div className="stat-num">
                                48<sup>H</sup>
                            </div>
                            <div className="stat-label">Fast Shipping</div>
                        </div>
                        <div>
                            <div className="stat-num">
                                4.9<sup>★</sup>
                            </div>
                            <div className="stat-label">Average Rating</div>
                        </div>
                    </div>
                </div>

                <div className="hero-right">
                    <div className="product-stage">
                        <div className="ring ring-1" />
                        <div className="ring ring-2" />
                        <div className="ring ring-3" />
                        <div className="product-card">
                            <div className="card-image">
                                <div className="card-badge">New Drop</div>
                                <div className="product-icon">
                                    <div className="p-circle" />
                                    <div className="p-body">
                                        <div className="p-accent" />
                                        <div className="p-accent2" />
                                    </div>
                                </div>
                            </div>
                            <div className="card-info">
                                <div className="card-name">VANTA ONE</div>
                                <div className="card-meta">
                                    <span className="card-price">$129.00</span>
                                    <span className="card-avail">In Stock</span>
                                </div>
                            </div>
                        </div>
                        <div className="float-tag t1">
                            Material
                            <span className="tag-val">Premium</span>
                        </div>
                        <div className="float-tag t2">
                            Ships In
                            <span className="tag-val">48H</span>
                        </div>
                    </div>
                    <div className="hero-side-label">
                        SS 2026 — New Arrivals
                    </div>
                </div>
            </section>

            {/* TICKER */}
            <div className="ticker">
                <div className="ticker-inner" id="ticker-inner" />
            </div>

            {/* FEATURES */}
            <section className="features-strip">
                <div className="feature-item">
                    <div className="feat-num">01</div>
                    <div className="feat-icon">✦</div>
                    <div className="feat-title">Premium Materials</div>
                    <p className="feat-desc">
                        Every piece is constructed from carefully sourced materials built to last and designed to impress.
                    </p>
                </div>
                <div className="feature-item">
                    <div className="feat-num">02</div>
                    <div className="feat-icon">◈</div>
                    <div className="feat-title">Free Worldwide Shipping</div>
                    <p className="feat-desc">
                        We ship everywhere. No minimums, no surprises — just your order at your door within 48 hours.
                    </p>
                </div>
                <div className="feature-item">
                    <div className="feat-num">03</div>
                    <div className="feat-icon">◎</div>
                    <div className="feat-title">30-Day Returns</div>
                    <p className="feat-desc">
                        Not in love? No problem. Full hassle-free returns within 30 days, no questions asked.
                    </p>
                </div>
            </section>

            {/* CTA */}
            <section className="cta-section">
                <p className="cta-label">Join the Drop List</p>
                <h2 className="cta-title">
                    BE FIRST.
                    <br />
                    <span className="outline">ALWAYS.</span>
                </h2>
                <p className="cta-sub">
                    Get early access to new drops, exclusive deals, and behind-the-scenes content before anyone else.
                </p>

                {subscribed ? (
                    <div className="cta-success">
                        <div className="seal">
                            <Check size={26} strokeWidth={3} />
                        </div>
                        <h3 className="success-title">YOU'RE ON THE LIST</h3>
                        <p className="success-body">
                            We've saved your place. When the next drop lands, you'll hear about it before it goes public.
                        </p>
                        <p className="success-mail">
                            <Mail size={12} />
                            Watch your inbox
                        </p>
                    </div>
                ) : (
                    <>
                        <form className="cta-form" onSubmit={submitSubscribe}>
                            <input type="email" className="cta-input" placeholder="your@email.com" value={subForm.data.email} onChange={(e) => subForm.setData('email', e.target.value)} />
                            <button type="submit" className="cta-submit" disabled={subForm.processing}>
                                {subForm.processing ? 'Joining...' : 'Notify Me'}
                            </button>
                        </form>

                        {subForm.errors.email ? (
                            <p className="cta-error">{subForm.errors.email}</p>
                        ) : (
                            <p className="cta-note">No spam. Unsubscribe any time.</p>
                        )}
                    </>
                )}
            </section>

            {/* PRODUCTS */}
            <section className="products-section">
                <div className="products-header">
                    <h2 className="products-title">
                        OUR <span className="accent-line">PRODUCTS</span>
                    </h2>
                </div>

                <div className="products-grid">
                    {products.map((product: any) => {
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

                <div className="products-cta">
                    <Link href={exploreHref} className="btn-primary">
                        <span>Explore All Products</span>
                        <span>→</span>
                    </Link>
                </div>
            </section>

            {/* FOOTER */}
            <footer>
                <div className="footer-logo">VANTA</div>
                <p className="footer-copy">
                    © 2026 Vanta. All rights reserved.
                </p>
                <ul className="footer-links">
                    <li>
                        <a href="#">Privacy</a>
                    </li>
                    <li>
                        <a href="#">Terms</a>
                    </li>
                    <li>
                        <a href="#">Instagram</a>
                    </li>
                </ul>
            </footer>

            <CartWidget />
        </>
    );
}

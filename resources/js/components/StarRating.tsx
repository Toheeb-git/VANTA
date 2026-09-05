import { Star } from 'lucide-react';

interface Props {
    value: number;
    size?: number;
    interactive?: boolean;
    onChange?: (v: number) => void;
    hover?: number;
    onHover?: (v: number) => void;
}

export default function StarRating({
    value,
    size = 15,
    interactive = false,
    onChange,
    hover = 0,
    onHover,
}: Props) {
    const shown = hover || value;

    return (
        <>
            <span
                className={`sr-wrap ${interactive ? 'sr-live' : ''}`}
                onMouseLeave={() => onHover?.(0)}
                role={interactive ? 'radiogroup' : 'img'}
                aria-label={`${value} out of 5 stars`}
            >
                {[1, 2, 3, 4, 5].map((n) => (
                    <span
                        key={n}
                        className={`sr-star ${n <= shown ? 'on' : ''}`}
                        onClick={() => interactive && onChange?.(n)}
                        onMouseEnter={() => interactive && onHover?.(n)}
                        role={interactive ? 'radio' : undefined}
                        aria-checked={interactive ? n === value : undefined}
                        tabIndex={interactive ? 0 : undefined}
                        onKeyDown={(e) => {
                            if (!interactive) return;
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                onChange?.(n);
                            }
                        }}
                    >
                        <Star
                            size={size}
                            fill={n <= shown ? 'currentColor' : 'none'}
                        />
                    </span>
                ))}
            </span>

            <style>{`
                .sr-wrap {
                    display: inline-flex; align-items: center; gap: .18rem;
                    line-height: 0;
                }
                .sr-star {
                    display: inline-flex;
                    color: rgba(245,240,232,.18);
                    transition: color .18s, transform .18s;
                }
                .sr-star.on { color: #e8ff00; }
                .sr-live .sr-star {
                    cursor: none;
                    padding: .12rem;
                }
                .sr-live .sr-star:hover { transform: scale(1.22); }
                .sr-live .sr-star:focus-visible {
                    outline: none;
                    color: #e8ff00;
                    transform: scale(1.15);
                }
            `}</style>
        </>
    );
}

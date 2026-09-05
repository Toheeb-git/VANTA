import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Search, Loader2, X } from 'lucide-react';

interface SearchSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: string[];
    placeholder?: string;
    loading?: boolean;
    disabled?: boolean;
    emptyMessage?: string;
    allowFreeText?: boolean;
}

export default function SearchSelect({
    value,
    onChange,
    options,
    placeholder = 'Select...',
    loading = false,
    disabled = false,
    emptyMessage = 'No matches found',
    allowFreeText = false,
}: SearchSelectProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [highlighted, setHighlighted] = useState(0);
    const wrapRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const filtered = query.trim()
        ? options.filter((o) =>
              o.toLowerCase().includes(query.trim().toLowerCase()),
          )
        : options;

    useEffect(() => {
        const onClickOutside = (e: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
                setOpen(false);
                setQuery('');
            }
        };
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, []);

    useEffect(() => {
        if (open) {
            setHighlighted(0);
            setTimeout(() => inputRef.current?.focus(), 10);
        }
    }, [open]);

    useEffect(() => {
        const el = listRef.current?.children[highlighted] as HTMLElement;
        el?.scrollIntoView({ block: 'nearest' });
    }, [highlighted]);

    const select = (option: string) => {
        onChange(option);
        setOpen(false);
        setQuery('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlighted((h) => Math.max(h - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filtered[highlighted]) {
                select(filtered[highlighted]);
            } else if (allowFreeText && query.trim()) {
                select(query.trim());
            }
        } else if (e.key === 'Escape') {
            setOpen(false);
            setQuery('');
        }
    };

    return (
        <div className="ss-wrap" ref={wrapRef}>
            <button
                type="button"
                className={`ss-trigger ${open ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
                onClick={() => !disabled && setOpen((o) => !o)}
                disabled={disabled}
            >
                <span className={value ? 'ss-value' : 'ss-placeholder'}>
                    {value || placeholder}
                </span>
                {loading ? (
                    <Loader2 size={14} className="ss-spin" />
                ) : (
                    <ChevronDown size={14} className="ss-chevron" />
                )}
            </button>

            {open && (
                <div className="ss-panel">
                    <div className="ss-search-wrap">
                        <Search size={13} className="ss-search-icon" />
                        <input
                            ref={inputRef}
                            className="ss-search"
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setHighlighted(0);
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder="Type to search..."
                        />
                        {query && (
                            <button
                                type="button"
                                className="ss-clear"
                                onClick={() => {
                                    setQuery('');
                                    inputRef.current?.focus();
                                }}
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>

                    <div className="ss-list" ref={listRef}>
                        {filtered.length === 0 ? (
                            <div className="ss-empty">
                                {allowFreeText && query.trim() ? (
                                    <button
                                        type="button"
                                        className="ss-use-custom"
                                        onClick={() => select(query.trim())}
                                    >
                                        Use "{query.trim()}"
                                    </button>
                                ) : (
                                    emptyMessage
                                )}
                            </div>
                        ) : (
                            filtered.map((option, i) => (
                                <button
                                    key={option}
                                    type="button"
                                    className={`ss-option ${i === highlighted ? 'highlighted' : ''} ${option === value ? 'selected' : ''}`}
                                    onClick={() => select(option)}
                                    onMouseEnter={() => setHighlighted(i)}
                                >
                                    {option}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}

            <style>{`
                .ss-wrap { position: relative; width: 100%; min-width: 0; }

                .ss-trigger {
                    width: 100%; min-width: 0;
                    display: flex; align-items: center; justify-content: space-between;
                    gap: .5rem;
                    background: rgba(245,240,232,.05);
                    border: 1px solid rgba(245,240,232,.09);
                    color: #f5f0e8;
                    font-family: 'DM Sans', sans-serif;
                    font-size: .82rem;
                    padding: .7rem .85rem;
                    cursor: none; text-align: left;
                    transition: border-color .2s, background .2s;
                }
                .ss-trigger:hover:not(.disabled) { border-color: rgba(232,255,0,.3); }
                .ss-trigger.open {
                    border-color: rgba(232,255,0,.5);
                    background: rgba(232,255,0,.035);
                }
                .ss-trigger.disabled { opacity: .4; cursor: not-allowed; }

                .ss-value {
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                }
                .ss-placeholder {
                    color: rgba(245,240,232,.22);
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                }
                .ss-chevron { flex-shrink: 0; color: rgba(245,240,232,.35); transition: transform .2s; }
                .ss-trigger.open .ss-chevron { transform: rotate(180deg); color: #e8ff00; }
                .ss-spin { flex-shrink: 0; color: #e8ff00; animation: ssSpin 1s linear infinite; }
                @keyframes ssSpin { to { transform: rotate(360deg); } }

                .ss-panel {
                    position: absolute; top: calc(100% + 4px); left: 0; right: 0;
                    z-index: 500;
                    background: linear-gradient(160deg, #1f1f1f 0%, #161616 100%);
                    border: 1px solid rgba(232,255,0,.25);
                    box-shadow: 0 20px 50px rgba(0,0,0,.6);
                    animation: ssDrop .15s ease;
                    overflow: hidden;
                }
                @keyframes ssDrop {
                    from { opacity: 0; transform: translateY(-6px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .ss-search-wrap {
                    position: relative;
                    border-bottom: 1px solid rgba(245,240,232,.08);
                    background: rgba(0,0,0,.25);
                }
                .ss-search-icon {
                    position: absolute; left: .8rem; top: 50%; transform: translateY(-50%);
                    color: rgba(245,240,232,.3); pointer-events: none;
                }
                .ss-search {
                    width: 100%;
                    background: transparent; border: none;
                    color: #f5f0e8;
                    font-family: 'DM Sans', sans-serif;
                    font-size: .8rem;
                    padding: .75rem 2rem .75rem 2.2rem;
                    outline: none;
                }
                .ss-search::placeholder { color: rgba(245,240,232,.25); }
                .ss-clear {
                    position: absolute; right: .6rem; top: 50%; transform: translateY(-50%);
                    background: none; border: none; color: rgba(245,240,232,.35);
                    cursor: none; padding: .25rem; display: flex;
                    transition: color .2s;
                }
                .ss-clear:hover { color: #ff3d2e; }

                .ss-list { max-height: 220px; overflow-y: auto; }
                .ss-list::-webkit-scrollbar { width: 4px; }
                .ss-list::-webkit-scrollbar-thumb { background: rgba(245,240,232,.15); }

                .ss-option {
                    display: block; width: 100%; text-align: left;
                    background: none; border: none;
                    color: rgba(245,240,232,.68);
                    font-family: 'DM Sans', sans-serif;
                    font-size: .8rem;
                    padding: .65rem 1rem;
                    cursor: none;
                    transition: background .12s, color .12s, padding-left .15s;
                }
                .ss-option.highlighted {
                    background: rgba(232,255,0,.07);
                    color: #f5f0e8;
                    padding-left: 1.2rem;
                }
                .ss-option.selected { color: #e8ff00; font-weight: 500; }

                .ss-empty {
                    padding: 1.2rem 1rem;
                    font-size: .78rem;
                    color: rgba(245,240,232,.3);
                    text-align: center;
                    font-family: 'DM Sans', sans-serif;
                }
                .ss-use-custom {
                    background: none; border: 1px solid rgba(232,255,0,.3);
                    color: #e8ff00;
                    font-family: 'DM Sans', sans-serif;
                    font-size: .72rem; letter-spacing: .05em;
                    padding: .5rem .9rem; cursor: none;
                    transition: background .2s;
                }
                .ss-use-custom:hover { background: rgba(232,255,0,.1); }
            `}</style>
        </div>
    );
}

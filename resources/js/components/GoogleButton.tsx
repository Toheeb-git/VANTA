import { useState } from 'react';

const GOOGLE_MARK = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iIzQyODVGNCIgZD0iTTIyLjU2IDEyLjI1YzAtLjc4LS4wNy0xLjUzLS4yLTIuMjVIMTJ2NC4yNmg1LjkyYTUuMDYgNS4wNiAwIDAgMS0yLjIgMy4zMnYyLjc3aDMuNTdjMi4wOC0xLjkyIDMuMjgtNC43NCAzLjI4LTguMXoiLz48cGF0aCBmaWxsPSIjMzRBODUzIiBkPSJNMTIgMjNjMi45NyAwIDUuNDYtLjk4IDcuMjgtMi42NmwtMy41Ny0yLjc3Yy0uOTguNjYtMi4yMyAxLjA2LTMuNzEgMS4wNi0yLjg2IDAtNS4yOS0xLjkzLTYuMTYtNC41M0gyLjE4djIuODRBMTEgMTEgMCAwIDAgMTIgMjN6Ii8+PHBhdGggZmlsbD0iI0ZCQkMwNSIgZD0iTTUuODQgMTQuMWE2LjYgNi42IDAgMCAxIDAtNC4yMlY3LjA0SDIuMThhMTEgMTEgMCAwIDAgMCA5LjkybDMuNjYtMi44NnoiLz48cGF0aCBmaWxsPSIjRUE0MzM1IiBkPSJNMTIgNC43NWMxLjYyIDAgMy4wNi41NiA0LjIxIDEuNjRsMy4xNS0zLjE1QzE3LjQ1IDEuNDYgMTQuOTcuNSAxMiAuNUExMSAxMSAwIDAgMCAyLjE4IDcuMDRsMy42NiAyLjg0QzYuNzEgNy4yOCA5LjE0IDQuNzUgMTIgNC43NXoiLz48L3N2Zz4=';

export default function GoogleButton({ label = 'Continue with Google' }) {
    const [loading, setLoading] = useState(false);

    const style = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.7rem',
        width: '100%',
        padding: '1rem 1.25rem',
        background: '#f5f0e8',
        color: '#14140f',
        textDecoration: 'none',
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '0.78rem',
        fontWeight: 700,
        letterSpacing: '0.1em',
        cursor: 'none',
        opacity: loading ? 0.6 : 1,
    };

    const iconStyle = {
        width: '18px',
        height: '18px',
        flexShrink: 0,
    };

    return <a href="/auth/google" style={style} onClick={() => setLoading(true)}><img src={GOOGLE_MARK} alt="" style={iconStyle} /><span>{loading ? 'Redirecting...' : label}</span></a>;
}

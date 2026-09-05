import { useEffect, useState } from 'react';

const COUNTRIES_URL = 'https://countriesnow.space/api/v0.1/countries/positions';
const STATES_URL = 'https://countriesnow.space/api/v0.1/countries/states';

export function useCountries() {
    const [countries, setCountries] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let cancelled = false;

        fetch(COUNTRIES_URL)
            .then((res) => {
                if (!res.ok) throw new Error('bad response');
                return res.json();
            })
            .then((json) => {
                if (cancelled) return;
                const names = (json.data || [])
                    .map((c: { name: string }) => c.name)
                    .sort((a: string, b: string) => a.localeCompare(b));
                if (names.length === 0) throw new Error('empty');
                setCountries(names);
                setLoading(false);
            })
            .catch(() => {
                if (cancelled) return;
                setFailed(true);
                setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    return { countries, loading, failed };
}

export function useStates(country: string) {
    const [states, setStates] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        if (!country) {
            setStates([]);
            setFailed(false);
            return;
        }

        let cancelled = false;
        setLoading(true);
        setFailed(false);

        fetch(STATES_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ country }),
        })
            .then((res) => {
                if (!res.ok) throw new Error('bad response');
                return res.json();
            })
            .then((json) => {
                if (cancelled) return;
                const names = (json.data?.states || [])
                    .map((s: { name: string }) => s.name)
                    .sort((a: string, b: string) => a.localeCompare(b));
                setStates(names);
                setFailed(names.length === 0);
                setLoading(false);
            })
            .catch(() => {
                if (cancelled) return;
                setStates([]);
                setFailed(true);
                setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [country]);

    return { states, loading, failed };
}

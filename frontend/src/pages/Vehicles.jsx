import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { errMsg } from '../api.js';
import FilterBar from '../components/FilterBar.jsx';
import VehicleCard from '../components/VehicleCard.jsx';

const EMPTY = { q: '', category: '', transmission: '', fuel: '', location: '', minPrice: '', maxPrice: '', startDate: '', endDate: '' };

export default function Vehicles() {
    const [searchParams] = useSearchParams();
    // filters can be pre-filled from the home page search (e.g. /vehicles?category=SUV)
    const [filters, setFilters] = useState(() => {
        const init = { ...EMPTY };
        searchParams.forEach((v, k) => { if (k in EMPTY) init[k] = v; });
        return init;
    });
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const params = {};
        Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
        // availability filter needs both dates
        if (!(params.startDate && params.endDate)) { delete params.startDate; delete params.endDate; }

        const t = setTimeout(async () => {
            setLoading(true);
            try {
                const { data } = await api.get('/vehicles', { params });
                setVehicles(data.vehicles);
                setError('');
            } catch (e) { setError(errMsg(e)); setVehicles([]); }
            setLoading(false);
        }, 300);
        return () => clearTimeout(t);
    }, [filters]);

    return (
        <>
            <h1>Find your ride</h1>
            <p className="muted">Pick dates to see only the vehicles that are free for your whole trip.</p>
            <FilterBar filters={filters} setFilters={setFilters} onReset={() => setFilters(EMPTY)} />
            {error && <p className="alert error">{error}</p>}
            {loading ? <p>Loading vehicles…</p> : vehicles.length === 0 ? (
                <p className="alert">No vehicles match your search.</p>
            ) : (
                <div className="grid">{vehicles.map((v) => <VehicleCard key={v.vehicle_id} v={v} />)}</div>
            )}
        </>
    );
}

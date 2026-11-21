import { todayLocal } from '../api.js';

export default function FilterBar({ filters, setFilters, onReset }) {
    const set = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });
    const today = todayLocal();

    return (
        <div className="card filter-bar">
            <input placeholder="Search name or model" value={filters.q} onChange={set('q')} />
            <select value={filters.category} onChange={set('category')}>
                <option value="">All categories</option>
                {['Car', 'Bike', 'SUV', 'Van'].map((c) => <option key={c}>{c}</option>)}
            </select>
            <select value={filters.transmission} onChange={set('transmission')}>
                <option value="">Any transmission</option>
                <option>Manual</option><option>Automatic</option>
            </select>
            <select value={filters.fuel} onChange={set('fuel')}>
                <option value="">Any fuel</option>
                {['Petrol', 'Diesel', 'Electric', 'CNG'].map((c) => <option key={c}>{c}</option>)}
            </select>
            <input placeholder="Location" value={filters.location} onChange={set('location')} />
            <input type="number" min="0" placeholder="Min ₹/day" value={filters.minPrice} onChange={set('minPrice')} />
            <input type="number" min="0" placeholder="Max ₹/day" value={filters.maxPrice} onChange={set('maxPrice')} />
            <label>From <input type="date" min={today} value={filters.startDate} onChange={set('startDate')} /></label>
            <label>To <input type="date" min={filters.startDate || today} value={filters.endDate} onChange={set('endDate')} /></label>
            <button className="btn btn-outline" onClick={onReset}>Reset</button>
        </div>
    );
}

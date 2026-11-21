import { Link } from 'react-router-dom';
import { money } from '../api.js';

const ICON = { Car: '🚗', Bike: '🏍️', SUV: '🚙', Van: '🚐' };

export default function VehicleCard({ v }) {
    return (
        <div className="card vehicle-card">
            <div className="vehicle-img">
                {v.image_url ? <img src={v.image_url} alt={v.name} /> : <span>{ICON[v.category]}</span>}
            </div>
            <div className="card-body">
                <h3>{v.name} <small className="muted">{v.model}</small></h3>
                <p className="muted">{v.category} · {v.transmission_type} · {v.fuel_type}</p>
                <p className="muted">📍 {v.location}</p>
                <div className="row between">
                    <strong>{money(v.price_per_day)}<small className="muted"> / day</small></strong>
                    <span className={`badge ${v.status === 'Under Maintenance' ? 'bad' : 'good'}`}>{v.status}</span>
                </div>
                <Link className="btn full" to={`/vehicles/${v.vehicle_id}`}>View &amp; Book</Link>
            </div>
        </div>
    );
}

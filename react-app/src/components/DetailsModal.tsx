import type { RentalLocation } from '../types';
import { formatUnitAddress, hasAccount, locationStreet } from '../lib';

interface Props {
  location: RentalLocation | null;
  onClose: () => void;
}

export default function DetailsModal({ location, onClose }: Props) {
  if (!location) return null;

  const gmaps = `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`;
  const unitWord = location.units.length === 1 ? 'unit' : 'units';

  return (
    <div id="overlay" className="show" onClick={onClose}>
      <div id="dialog" onClick={(e) => e.stopPropagation()}>
        <div id="dlg-head">
          <h2>&#128205; Rental Location</h2>
          <button id="dlg-close" onClick={onClose} aria-label="Close">
            &#x2715;
          </button>
        </div>
        <div id="dlg-body">
          <div className="row">
            <div className="lbl">Street</div>
            <div className="val">
              {locationStreet(location)}
              {location.multi && (
                <span className="badge">Multi-tenant</span>
              )}
            </div>
          </div>

          <div className="row">
            <div className="lbl">
              {location.units.length} {unitWord}
            </div>
          </div>

          {location.units.map((u, i) => (
            <div key={i} className={`unit-card${location.multi ? ' multi' : ''}`}>
              <div className="unit-addr">{formatUnitAddress(u)}</div>
              <div className="unit-meta">
                {u.city}, {u.state} {u.zip}
                {hasAccount(u.wan) ? ` · Account ${u.wan}` : ''}
              </div>
            </div>
          ))}

          <div className="coords">
            <div className="row">
              <div className="lbl">Latitude</div>
              <div className="val">{location.lat.toFixed(5)}</div>
            </div>
            <div className="row">
              <div className="lbl">Longitude</div>
              <div className="val">{location.lng.toFixed(5)}</div>
            </div>
          </div>

          <a className="gmaps-btn" href={gmaps} target="_blank" rel="noopener noreferrer">
            Open in Google Maps
          </a>
        </div>
      </div>
    </div>
  );
}

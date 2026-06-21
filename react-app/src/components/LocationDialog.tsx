import { useEffect, useState } from 'react';
import { resolveJurisdiction } from '../jurisdiction';

interface Props {
  position: { lat: number; lon: number } | null;
  accuracy: number | null;
  open: boolean;
  onClose: () => void;
}

export default function LocationDialog({ position, accuracy, open, onClose }: Props) {
  const [jurisdiction, setJurisdiction] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);

  // Resolve the jurisdiction (offline point-in-polygon) whenever the dialog is
  // opened for a position.
  useEffect(() => {
    if (!open || !position) return;
    let cancelled = false;
    setResolving(true);
    setJurisdiction(null);
    resolveJurisdiction(position.lat, position.lon)
      .then((name) => {
        if (!cancelled) setJurisdiction(name);
      })
      .finally(() => {
        if (!cancelled) setResolving(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, position]);

  if (!open || !position) return null;

  const gmaps = `https://www.google.com/maps/search/?api=1&query=${position.lat},${position.lon}`;

  return (
    <div id="overlay" className="show" onClick={onClose}>
      <div id="dialog" onClick={(e) => e.stopPropagation()}>
        <div id="dlg-head">
          <h2>&#128205; You Are Here</h2>
          <button id="dlg-close" onClick={onClose} aria-label="Close">
            &#x2715;
          </button>
        </div>
        <div id="dlg-body">
          <div className="row">
            <div className="lbl">Jurisdiction</div>
            <div className="val">
              {resolving
                ? 'Locating\u2026'
                : jurisdiction ?? 'Outside mapped area'}
            </div>
          </div>

          <div className="row">
            <div className="lbl">Accuracy</div>
            <div className="val">
              {accuracy != null ? `\u00b1${Math.round(accuracy)} m` : 'Unknown'}
            </div>
          </div>

          <div className="coords">
            <div className="row">
              <div className="lbl">Latitude</div>
              <div className="val">{position.lat.toFixed(5)}</div>
            </div>
            <div className="row">
              <div className="lbl">Longitude</div>
              <div className="val">{position.lon.toFixed(5)}</div>
            </div>
          </div>

          <div className="dlg-actions">
            <a className="gmaps-btn" href={gmaps} target="_blank" rel="noopener noreferrer">
              Open in Google Maps
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

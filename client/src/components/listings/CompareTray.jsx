import { Scale, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useCompare } from "../../context/CompareContext.jsx";

export function CompareTray() {
  const location = useLocation();
  const { clearCompare, selectedCount } = useCompare();

  if (!selectedCount || location.pathname === "/compare") {
    return null;
  }

  return (
    <aside className="compare-tray" aria-label="Anunturi selectate pentru comparare">
      <div>
        <Scale size={18} aria-hidden="true" />
        <span>{selectedCount} {selectedCount === 1 ? "anunt selectat" : "anunturi selectate"}</span>
      </div>
      <div className="compare-tray-actions">
        <Link className="primary-button compact-button" to="/compare">
          Compara acum
        </Link>
        <button className="compare-tray-clear" type="button" onClick={clearCompare} aria-label="Goleste compararea">
          <X size={17} aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}

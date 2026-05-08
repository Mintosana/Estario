import { Scale } from "lucide-react";
import { useCompare } from "../../context/CompareContext.jsx";

export function CompareButton({ listingId, variant = "secondary" }) {
  const { canAddMore, isSelected, maxCompareListings, toggleListing } = useCompare();
  const selected = isSelected(listingId);
  const disabled = !selected && !canAddMore;

  return (
    <button
      className={`${variant === "compact" ? "compare-button compact-button" : "compare-button"} ${selected ? "active" : ""}`}
      type="button"
      disabled={disabled}
      title={disabled ? `Poti compara maximum ${maxCompareListings} anunturi.` : ""}
      onClick={() => toggleListing(listingId)}
    >
      <Scale size={16} aria-hidden="true" />
      {selected ? "Selectat" : "Compara"}
    </button>
  );
}

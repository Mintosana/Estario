import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CompareContext = createContext(null);
const compareStorageKey = "estario_compare_ids";
const maxCompareListings = 4;

function readStoredIds() {
  try {
    const parsed = JSON.parse(localStorage.getItem(compareStorageKey) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter(Boolean).slice(0, maxCompareListings) : [];
  } catch {
    return [];
  }
}

export function CompareProvider({ children }) {
  const [selectedIds, setSelectedIds] = useState(readStoredIds);

  useEffect(() => {
    localStorage.setItem(compareStorageKey, JSON.stringify(selectedIds));
  }, [selectedIds]);

  function addListing(id) {
    let wasAdded = false;

    setSelectedIds((current) => {
      if (current.includes(id)) {
        return current;
      }

      if (current.length >= maxCompareListings) {
        return current;
      }

      wasAdded = true;
      return [...current, id];
    });

    return wasAdded;
  }

  function removeListing(id) {
    setSelectedIds((current) => current.filter((selectedId) => selectedId !== id));
  }

  function toggleListing(id) {
    if (selectedIds.includes(id)) {
      removeListing(id);
      return true;
    }

    return addListing(id);
  }

  function clearCompare() {
    setSelectedIds([]);
  }

  const value = useMemo(
    () => ({
      addListing,
      canAddMore: selectedIds.length < maxCompareListings,
      clearCompare,
      isSelected: (id) => selectedIds.includes(id),
      maxCompareListings,
      removeListing,
      selectedCount: selectedIds.length,
      selectedIds,
      toggleListing
    }),
    [selectedIds]
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const context = useContext(CompareContext);

  if (!context) {
    throw new Error("useCompare must be used inside CompareProvider");
  }

  return context;
}

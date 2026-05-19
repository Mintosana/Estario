import { useMemo, useState } from "react";

function normalizeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function CityAutocomplete({ disabled, name = "city", onChange, options = [], placeholder, required, value }) {
  const [isOpen, setIsOpen] = useState(false);
  const normalizedValue = normalizeText(value);

  const filteredOptions = useMemo(() => {
    const uniqueOptions = [...new Set(options)];

    if (!normalizedValue) {
      return uniqueOptions.slice(0, 8);
    }

    return uniqueOptions
      .filter((option) => normalizeText(option).includes(normalizedValue))
      .sort((first, second) => {
        const firstStarts = normalizeText(first).startsWith(normalizedValue);
        const secondStarts = normalizeText(second).startsWith(normalizedValue);

        if (firstStarts === secondStarts) {
          return first.localeCompare(second, "ro");
        }

        return firstStarts ? -1 : 1;
      })
      .slice(0, 8);
  }, [normalizedValue, options]);

  function updateValue(nextValue) {
    onChange({ target: { name, value: nextValue } });
  }

  function selectCity(city) {
    updateValue(city);
    setIsOpen(false);
  }

  const shouldShowDropdown = isOpen && !disabled && filteredOptions.length > 0;

  return (
    <div className="city-autocomplete">
      <input
        autoComplete="off"
        disabled={disabled}
        name={name}
        onBlur={() => setIsOpen(false)}
        onChange={(event) => {
          updateValue(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        required={required}
        value={value}
      />
      {shouldShowDropdown ? (
        <div className="city-autocomplete-menu">
          {filteredOptions.map((city) => (
            <button
              type="button"
              key={city}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectCity(city)}
            >
              {city}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

import { Save } from "lucide-react";
import {
  buildingConditionOptions,
  currencyOptions,
  energyClassOptions,
  furnishingOptions,
  heatingTypeOptions,
  parkingOptions,
  propertyTypeOptions,
  transactionTypeOptions
} from "../../constants/formOptions.js";
import { countyOptions, romanianLocations } from "../../constants/romaniaLocations.js";
import { LocationPicker } from "./LocationPicker.jsx";

export const emptyListingForm = {
  title: "",
  description: "",
  propertyType: "APARTMENT",
  transactionType: "SALE",
  price: "",
  currency: "EUR",
  city: "",
  county: "",
  address: "",
  latitude: "",
  longitude: "",
  surface: "",
  rooms: "",
  bathrooms: "",
  floor: "",
  yearBuilt: "",
  balcony: "",
  parking: "",
  furnished: "",
  heatingType: "",
  hasOwnCentralHeating: "",
  buildingCondition: "",
  energyClass: ""
};

export function listingToForm(listing) {
  return {
    title: listing.title ?? "",
    description: listing.description ?? "",
    propertyType: listing.propertyType ?? "APARTMENT",
    transactionType: listing.transactionType ?? "SALE",
    price: listing.price ?? "",
    currency: listing.currency ?? "EUR",
    city: listing.city ?? "",
    county: listing.county ?? "",
    address: listing.address ?? "",
    latitude: listing.latitude ?? "",
    longitude: listing.longitude ?? "",
    surface: listing.surface ?? "",
    rooms: listing.rooms ?? "",
    bathrooms: listing.bathrooms ?? "",
    floor: listing.floor ?? "",
    yearBuilt: listing.yearBuilt ?? "",
    balcony: listing.balcony === null || listing.balcony === undefined ? "" : String(listing.balcony),
    parking: listing.parking ?? "",
    furnished: listing.furnished ?? "",
    heatingType: listing.heatingType ?? "",
    hasOwnCentralHeating:
      listing.hasOwnCentralHeating === null || listing.hasOwnCentralHeating === undefined
        ? ""
        : String(listing.hasOwnCentralHeating),
    buildingCondition: listing.buildingCondition ?? "",
    energyClass: listing.energyClass ?? ""
  };
}

export function formToListingPayload(form) {
  const payload = {
    ...form,
    price: Number(form.price),
    latitude: Number(form.latitude),
    longitude: Number(form.longitude),
    surface: Number(form.surface)
  };

  ["rooms", "bathrooms", "floor", "yearBuilt"].forEach((field) => {
    payload[field] = form[field] === "" ? null : Number(form[field]);
  });

  ["balcony", "hasOwnCentralHeating"].forEach((field) => {
    payload[field] = form[field] === "" ? null : form[field] === "true";
  });

  ["parking", "furnished", "heatingType", "buildingCondition", "energyClass"].forEach((field) => {
    payload[field] = form[field] === "" ? null : form[field];
  });

  return payload;
}

export function ListingForm({ childrenBeforeSubmit, form, isSubmitting, onChange, onSubmit, submitLabel }) {
  function updateField(event) {
    const nextValue = event.target.value;
    const nextForm = {
      ...form,
      [event.target.name]: nextValue
    };

    if (event.target.name === "county") {
      nextForm.city = "";
    }

    onChange({
      ...nextForm
    });
  }

  function updateLocation(location) {
    onChange({
      ...form,
      ...location
    });
  }

  const availableCities = romanianLocations[form.county] ?? [];
  const locationSearchQuery = [form.address, form.city, form.county, "Romania"].filter(Boolean).join(", ");

  return (
    <form className="listing-form" onSubmit={onSubmit}>
      <label className="full-span">
        Titlu
        <input name="title" value={form.title} onChange={updateField} minLength={8} maxLength={140} required />
      </label>

      <label>
        Tip proprietate
        <select name="propertyType" value={form.propertyType} onChange={updateField} required>
          {propertyTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        Publica anuntul ca
        <select name="transactionType" value={form.transactionType} onChange={updateField} required>
          {transactionTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        Pret
        <input name="price" type="number" min="1" value={form.price} onChange={updateField} required />
      </label>

      <label>
        Moneda
        <select name="currency" value={form.currency} onChange={updateField} required>
          {currencyOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        Judet
        <select name="county" value={form.county} onChange={updateField} required>
          <option value="">Alege judetul</option>
          {countyOptions.map((county) => (
            <option key={county} value={county}>
              {county}
            </option>
          ))}
        </select>
      </label>

      <label>
        Oras / comuna
        <select name="city" value={form.city} onChange={updateField} disabled={!form.county} required>
          <option value="">{form.county ? "Alege localitatea" : "Alege judetul"}</option>
          {availableCities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </label>

      <label className="full-span">
        Adresa
        <input name="address" value={form.address} onChange={updateField} required />
      </label>

      <div className="full-span location-picker-panel">
        <div>
          <h2>Alege locatia pe harta</h2>
          <p>Completeaza adresa si cauta pe harta, apoi ajusteaza pozitia cu un click daca este nevoie.</p>
        </div>
        <LocationPicker
          latitude={form.latitude}
          longitude={form.longitude}
          onChange={updateLocation}
          searchQuery={locationSearchQuery}
        />
      </div>

      <label>
        Latitudine
        <input name="latitude" type="number" step="0.000001" value={form.latitude} onChange={updateField} required />
      </label>

      <label>
        Longitudine
        <input name="longitude" type="number" step="0.000001" value={form.longitude} onChange={updateField} required />
      </label>

      <label>
        Suprafata mp
        <input name="surface" type="number" min="1" value={form.surface} onChange={updateField} required />
      </label>

      <label>
        Camere
        <input name="rooms" type="number" min="1" value={form.rooms} onChange={updateField} />
      </label>

      <label>
        Bai
        <input name="bathrooms" type="number" min="1" value={form.bathrooms} onChange={updateField} />
      </label>

      <label>
        Etaj
        <input name="floor" type="number" value={form.floor} onChange={updateField} />
      </label>

      <label>
        An constructie
        <input name="yearBuilt" type="number" min="1800" value={form.yearBuilt} onChange={updateField} />
      </label>

      <div className="full-span form-section-heading">
        <h2>Detalii suplimentare</h2>
        <p>Aceste informatii ajuta vizitatorii sa filtreze si sa compare mai usor anunturile.</p>
      </div>

      <label>
        Mobilare
        <select name="furnished" value={form.furnished} onChange={updateField}>
          <option value="">Nespecificat</option>
          {furnishingOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        Parcare
        <select name="parking" value={form.parking} onChange={updateField}>
          <option value="">Nespecificat</option>
          {parkingOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        Balcon
        <select name="balcony" value={form.balcony} onChange={updateField}>
          <option value="">Nespecificat</option>
          <option value="true">Da</option>
          <option value="false">Nu</option>
        </select>
      </label>

      <label>
        Centrala proprie
        <select name="hasOwnCentralHeating" value={form.hasOwnCentralHeating} onChange={updateField}>
          <option value="">Nespecificat</option>
          <option value="true">Da</option>
          <option value="false">Nu</option>
        </select>
      </label>

      <label>
        Tip incalzire
        <select name="heatingType" value={form.heatingType} onChange={updateField}>
          <option value="">Nespecificat</option>
          {heatingTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        Stare imobil
        <select name="buildingCondition" value={form.buildingCondition} onChange={updateField}>
          <option value="">Nespecificat</option>
          {buildingConditionOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        Clasa energetica
        <select name="energyClass" value={form.energyClass} onChange={updateField}>
          <option value="">Nespecificata</option>
          {energyClassOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="full-span">
        Descriere
        <textarea
          name="description"
          value={form.description}
          onChange={updateField}
          minLength={30}
          maxLength={5000}
          rows={7}
          required
        />
      </label>

      {childrenBeforeSubmit}

      <button className="primary-button full-span" type="submit" disabled={isSubmitting}>
        <Save size={18} aria-hidden="true" />
        {isSubmitting ? "Se salveaza..." : submitLabel}
      </button>
    </form>
  );
}

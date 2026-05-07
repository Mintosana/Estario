import { Save } from "lucide-react";
import { currencyOptions, propertyTypeOptions, transactionTypeOptions } from "../../constants/formOptions.js";

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
  yearBuilt: ""
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
    yearBuilt: listing.yearBuilt ?? ""
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

  return payload;
}

export function ListingForm({ childrenBeforeSubmit, form, isSubmitting, onChange, onSubmit, submitLabel }) {
  function updateField(event) {
    onChange({
      ...form,
      [event.target.name]: event.target.value
    });
  }

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
        Tranzactie
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
        Oras
        <input name="city" value={form.city} onChange={updateField} required />
      </label>

      <label>
        Judet
        <input name="county" value={form.county} onChange={updateField} required />
      </label>

      <label className="full-span">
        Adresa
        <input name="address" value={form.address} onChange={updateField} required />
      </label>

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

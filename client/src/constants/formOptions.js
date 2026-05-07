import { propertyTypeLabels, transactionTypeLabels } from "./listingLabels.js";

export const propertyTypeOptions = Object.entries(propertyTypeLabels).map(([value, label]) => ({
  value,
  label
}));

export const transactionTypeOptions = Object.entries(transactionTypeLabels).map(([value, label]) => ({
  value,
  label
}));

export const currencyOptions = [
  { value: "EUR", label: "EUR" },
  { value: "RON", label: "RON" }
];

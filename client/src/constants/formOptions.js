import {
  buildingConditionLabels,
  energyClassLabels,
  furnishingLabels,
  heatingTypeLabels,
  parkingLabels,
  propertyTypeLabels,
  transactionTypeLabels
} from "./listingLabels.js";

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

export const furnishingOptions = Object.entries(furnishingLabels).map(([value, label]) => ({
  value,
  label
}));

export const parkingOptions = Object.entries(parkingLabels).map(([value, label]) => ({
  value,
  label
}));

export const heatingTypeOptions = Object.entries(heatingTypeLabels).map(([value, label]) => ({
  value,
  label
}));

export const buildingConditionOptions = Object.entries(buildingConditionLabels).map(([value, label]) => ({
  value,
  label
}));

export const energyClassOptions = Object.entries(energyClassLabels).map(([value, label]) => ({
  value,
  label
}));

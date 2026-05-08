export const propertyTypes = ["APARTMENT", "HOUSE", "STUDIO", "LAND"];

export const transactionTypes = ["SALE", "RENT"];

export const listingStatuses = ["PENDING", "APPROVED", "REJECTED"];

export const currencies = ["EUR", "RON"];

export const listingSortOptions = ["newest", "price_asc", "price_desc"];

export const furnishingStatuses = ["UNFURNISHED", "PARTIAL", "FURNISHED"];

export const parkingTypes = ["NONE", "PARKING_SPOT", "GARAGE"];

export const heatingTypes = ["OWN_CENTRAL", "DISTRICT", "ELECTRIC", "GAS", "OTHER"];

export const buildingConditions = ["NEW", "RENOVATED", "GOOD", "NEEDS_RENOVATION"];

export const energyClasses = ["A", "B", "C", "D", "E", "UNKNOWN"];

export const publicListingInclude = {
  owner: {
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      phone: true,
      bio: true,
      createdAt: true
    }
  },
  images: {
    orderBy: {
      position: "asc"
    }
  }
};

export const propertyTypes = ["APARTMENT", "HOUSE", "STUDIO", "LAND"];

export const transactionTypes = ["SALE", "RENT"];

export const listingStatuses = ["PENDING", "APPROVED", "REJECTED"];

export const currencies = ["EUR", "RON"];

export const listingSortOptions = ["newest", "price_asc", "price_desc"];

export const publicListingInclude = {
  owner: {
    select: {
      id: true,
      name: true,
      email: true
    }
  },
  images: {
    orderBy: {
      position: "asc"
    }
  }
};

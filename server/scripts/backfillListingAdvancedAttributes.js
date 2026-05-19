import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function advancedAttributesForListing(listing, index) {
  if (listing.propertyType === "LAND") {
    return {
      balcony: null,
      parking: null,
      furnished: null,
      heatingType: null,
      centralHeatingType: null,
      buildingCondition: null,
      energyClass: null
    };
  }

  const isNewer = listing.yearBuilt && listing.yearBuilt >= 2018;
  const isHouse = listing.propertyType === "HOUSE";
  const isStudio = listing.propertyType === "STUDIO";
  const parkingOptions = isHouse ? ["GARAGE", "PARKING_SPOT"] : ["NONE", "PARKING_SPOT"];
  const furnishedOptions =
    listing.transactionType === "RENT" || isStudio
      ? ["FURNISHED", "PARTIAL"]
      : ["UNFURNISHED", "PARTIAL", "FURNISHED"];

  return {
    balcony: isHouse ? false : index % 4 !== 1,
    parking: parkingOptions[index % parkingOptions.length],
    furnished: furnishedOptions[index % furnishedOptions.length],
    heatingType: isNewer || isHouse || index % 3 !== 0 ? "CENTRAL" : "DISTRICT",
    centralHeatingType: isNewer || isHouse || index % 3 !== 0
      ? isHouse
        ? "INDIVIDUAL"
        : index % 5 === 0
          ? "BUILDING"
          : "INDIVIDUAL"
      : null,
    buildingCondition: isNewer ? "NEW" : index % 3 === 0 ? "RENOVATED" : "GOOD",
    energyClass: isNewer ? "A" : index % 2 === 0 ? "B" : "C"
  };
}

async function main() {
  const listings = await prisma.listing.findMany({
    orderBy: {
      createdAt: "asc"
    }
  });

  for (const [index, listing] of listings.entries()) {
    await prisma.listing.update({
      where: {
        id: listing.id
      },
      data: advancedAttributesForListing(listing, index)
    });
  }

  console.log(`Backfilled advanced attributes for ${listings.length} listings.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { demoPois } from "./demoPois.js";

const prisma = new PrismaClient();

const demoImages = {
  APARTMENT: {
    covers: ["/uploads/demo-apartment-01.png", "/uploads/demo-apartment-02.png"],
    supporting: [
      "/uploads/demo-interior-01.png",
      "/uploads/demo-interior-02.png",
      "/uploads/demo-interior-03.png",
      "/uploads/demo-interior-04.png"
    ]
  },
  HOUSE: {
    covers: ["/uploads/demo-house-01.png", "/uploads/demo-house-03.png"],
    supporting: ["/uploads/demo-interior-01.png", "/uploads/demo-interior-03.png"]
  },
  STUDIO: {
    covers: ["/uploads/demo-studio-01.png", "/uploads/demo-studio-02.png"],
    supporting: ["/uploads/demo-interior-02.png"]
  },
  LAND: {
    covers: ["/uploads/demo-land-01.png", "/uploads/demo-land-02.png"],
    supporting: []
  }
};

function imagesForListing(listing, typeIndex) {
  const imageSet = demoImages[listing.propertyType] ?? demoImages.APARTMENT;
  const supportingCount = listing.propertyType === "LAND" ? 0 : listing.propertyType === "STUDIO" ? 1 : 2;
  const cover = imageSet.covers[typeIndex % imageSet.covers.length];
  const supporting = Array.from({ length: Math.min(supportingCount, imageSet.supporting.length) }, (_, index) => {
    return imageSet.supporting[(typeIndex + index) % imageSet.supporting.length];
  });

  return [cover, ...supporting].map((url, position) => ({
    url,
    position
  }));
}

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
  const furnishedOptions = listing.transactionType === "RENT" || isStudio
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

const demoUsers = [
  { name: "Andrei Popescu", email: "user@example.com" },
  { name: "Ioana Ionescu", email: "ioana@example.com" },
  { name: "Mihai Dumitrescu", email: "mihai.dumitrescu@example.com" },
  { name: "Elena Stan", email: "elena.stan@example.com" },
  { name: "Radu Marinescu", email: "radu.marinescu@example.com" },
  { name: "Ana Georgescu", email: "ana.georgescu@example.com" },
  { name: "Vlad Enache", email: "vlad.enache@example.com" },
  { name: "Diana Pavel", email: "diana.pavel@example.com" },
  { name: "Cristian Neagu", email: "cristian.neagu@example.com" },
  { name: "Bianca Tudor", email: "bianca.tudor@example.com" },
  { name: "Sorin Matei", email: "sorin.matei@example.com" },
  { name: "Irina Dobre", email: "irina.dobre@example.com" },
  { name: "Alexandru Munteanu", email: "alex.munteanu@example.com" },
  { name: "Raluca Oprea", email: "raluca.oprea@example.com" },
  { name: "Florin Ilie", email: "florin.ilie@example.com" },
  { name: "Oana Petrescu", email: "oana.petrescu@example.com" },
  { name: "George Rusu", email: "george.rusu@example.com" },
  { name: "Laura Nita", email: "laura.nita@example.com" },
  { name: "Adrian Barbu", email: "adrian.barbu@example.com" },
  { name: "Simona Badea", email: "simona.badea@example.com" },
  { name: "Tudor Preda", email: "tudor.preda@example.com" },
  { name: "Mara Voicu", email: "mara.voicu@example.com" }
];

const listings = [
  {
    title: "Apartament luminos cu 3 camere langa Parcul Herastrau",
    description:
      "Apartament spatios, aproape de parc, cu finisaje moderne, balcon generos si acces rapid catre metrou Aviatorilor.",
    propertyType: "APARTMENT",
    transactionType: "SALE",
    price: 185000,
    city: "Bucuresti",
    county: "Bucuresti",
    address: "Sector 1, Strada Nicolae Caramfil 42",
    latitude: 44.4782,
    longitude: 26.0871,
    surface: 82,
    rooms: 3,
    bathrooms: 2,
    floor: 4,
    yearBuilt: 2018,
    status: "APPROVED"
  },
  {
    title: "Apartament decomandat pe Calea Victoriei",
    description:
      "Locuinta eleganta intr-o cladire consolidata, potrivita pentru locuire urbana sau investitie in zona centrala.",
    propertyType: "APARTMENT",
    transactionType: "SALE",
    price: 212000,
    city: "Bucuresti",
    county: "Bucuresti",
    address: "Sector 1, Bulevardul Aviatorilor 101",
    latitude: 44.4438,
    longitude: 26.0972,
    surface: 74,
    rooms: 3,
    bathrooms: 2,
    floor: 2,
    yearBuilt: 1940,
    status: "APPROVED"
  },
  {
    title: "Studio modern in zona Tineretului",
    description:
      "Garsoniera mobilata complet, aproape de parc si metrou, ideala pentru un chirias activ sau investitie.",
    propertyType: "STUDIO",
    transactionType: "RENT",
    price: 430,
    city: "Bucuresti",
    county: "Bucuresti",
    address: "Sector 4, Bulevardul Tineretului 21",
    latitude: 44.4115,
    longitude: 26.1046,
    surface: 34,
    rooms: 1,
    bathrooms: 1,
    floor: 6,
    yearBuilt: 1987,
    status: "APPROVED"
  },
  {
    title: "Apartament cu vedere spre Parcul Carol",
    description:
      "Apartament renovat, cu living luminos si bucatarie inchisa, la cateva minute de Parcul Carol.",
    propertyType: "APARTMENT",
    transactionType: "SALE",
    price: 139000,
    city: "Bucuresti",
    county: "Bucuresti",
    address: "Sector 4, Strada Cutitul de Argint 14",
    latitude: 44.4142,
    longitude: 26.0961,
    surface: 61,
    rooms: 2,
    bathrooms: 1,
    floor: 3,
    yearBuilt: 1982,
    status: "APPROVED"
  },
  {
    title: "Apartament nou in cartierul Aviatiei",
    description:
      "Apartament intr-un imobil recent, cu incalzire in pardoseala, parcare subterana si acces rapid catre Promenada.",
    propertyType: "APARTMENT",
    transactionType: "SALE",
    price: 198000,
    city: "Bucuresti",
    county: "Bucuresti",
    address: "Sector 1, Strada Alexandru Serbanescu 87",
    latitude: 44.487,
    longitude: 26.0968,
    surface: 70,
    rooms: 2,
    bathrooms: 2,
    floor: 7,
    yearBuilt: 2021,
    status: "APPROVED"
  },
  {
    title: "Penthouse cu terasa in zona Pipera",
    description:
      "Locuinta moderna cu terasa generoasa, doua locuri de parcare si acces rapid catre zona de birouri Pipera.",
    propertyType: "APARTMENT",
    transactionType: "SALE",
    price: 248000,
    city: "Bucuresti",
    county: "Ilfov",
    address: "Sector 1, Soseaua Pipera 46",
    latitude: 44.4908,
    longitude: 26.1194,
    surface: 96,
    rooms: 3,
    bathrooms: 2,
    floor: 9,
    yearBuilt: 2022,
    status: "APPROVED"
  },
  {
    title: "Apartament de inchiriat langa Piata Romana",
    description:
      "Apartament mobilat, bine compartimentat, potrivit pentru studenti sau profesionisti care lucreaza in centru.",
    propertyType: "APARTMENT",
    transactionType: "RENT",
    price: 680,
    city: "Bucuresti",
    county: "Bucuresti",
    address: "Sector 2, Soseaua Colentina 33",
    latitude: 44.4468,
    longitude: 26.1018,
    surface: 56,
    rooms: 2,
    bathrooms: 1,
    floor: 4,
    yearBuilt: 1976,
    status: "APPROVED"
  },
  {
    title: "Apartament familial in Drumul Taberei",
    description:
      "Apartament decomandat, aproape de metrou, scoli si spatii verzi, ideal pentru o familie tanara.",
    propertyType: "APARTMENT",
    transactionType: "SALE",
    price: 112000,
    city: "Bucuresti",
    county: "Bucuresti",
    address: "Sector 6, Bulevardul Drumul Taberei 25",
    latitude: 44.4216,
    longitude: 26.0349,
    surface: 73,
    rooms: 3,
    bathrooms: 2,
    floor: 5,
    yearBuilt: 1984,
    status: "APPROVED"
  },
  {
    title: "Garsoniera renovata in Militari",
    description:
      "Garsoniera renovata recent, aproape de metrou Pacii si centre comerciale, disponibila imediat.",
    propertyType: "STUDIO",
    transactionType: "RENT",
    price: 330,
    city: "Bucuresti",
    county: "Bucuresti",
    address: "Sector 6, Bulevardul Iuliu Maniu 188",
    latitude: 44.4342,
    longitude: 26.0134,
    surface: 32,
    rooms: 1,
    bathrooms: 1,
    floor: 8,
    yearBuilt: 2012,
    status: "APPROVED"
  },
  {
    title: "Apartament pe Bulevardul Unirii",
    description:
      "Apartament spatios, cu acces rapid catre Piata Unirii, potrivit pentru locuire sau inchiriere premium.",
    propertyType: "APARTMENT",
    transactionType: "SALE",
    price: 176000,
    city: "Bucuresti",
    county: "Bucuresti",
    address: "Sector 3, Bulevardul Decebal 59",
    latitude: 44.4277,
    longitude: 26.1196,
    surface: 79,
    rooms: 3,
    bathrooms: 2,
    floor: 6,
    yearBuilt: 1991,
    status: "APPROVED"
  },
  {
    title: "Casa urbana in Cotroceni",
    description:
      "Casa cu farmec interbelic, curte privata si camere inalte, intr-una dintre cele mai cautate zone istorice.",
    propertyType: "HOUSE",
    transactionType: "SALE",
    price: 395000,
    city: "Bucuresti",
    county: "Bucuresti",
    address: "Sector 5, Calea Rahovei 24",
    latitude: 44.4346,
    longitude: 26.0702,
    surface: 155,
    rooms: 5,
    bathrooms: 3,
    floor: null,
    yearBuilt: 1938,
    status: "APPROVED"
  },
  {
    title: "Apartament langa Parcul IOR",
    description:
      "Apartament luminos, cu vedere deschisa si acces facil catre parc, metrou si zona comerciala ParkLake.",
    propertyType: "APARTMENT",
    transactionType: "SALE",
    price: 124000,
    city: "Bucuresti",
    county: "Bucuresti",
    address: "Sector 3, Strada Liviu Rebreanu 8",
    latitude: 44.4219,
    longitude: 26.1574,
    surface: 60,
    rooms: 2,
    bathrooms: 1,
    floor: 7,
    yearBuilt: 1988,
    status: "APPROVED"
  },
  {
    title: "Apartament modern in Floreasca",
    description:
      "Apartament intr-un bloc boutique, cu finisaje premium, aproape de restaurante, parcuri si zona de business.",
    propertyType: "APARTMENT",
    transactionType: "RENT",
    price: 950,
    city: "Bucuresti",
    county: "Bucuresti",
    address: "Sector 1, Calea Floreasca 169",
    latitude: 44.4637,
    longitude: 26.1028,
    surface: 68,
    rooms: 2,
    bathrooms: 1,
    floor: 5,
    yearBuilt: 2017,
    status: "APPROVED"
  },
  {
    title: "Apartament spatios in Bucurestii Noi",
    description:
      "Locuinta decomandata, cu balcon mare si acces rapid catre metrou Jiului si Parcul Bazilescu.",
    propertyType: "APARTMENT",
    transactionType: "SALE",
    price: 118000,
    city: "Bucuresti",
    county: "Bucuresti",
    address: "Sector 1, Bulevardul Bucurestii Noi 64",
    latitude: 44.4937,
    longitude: 26.0362,
    surface: 72,
    rooms: 3,
    bathrooms: 1,
    floor: 4,
    yearBuilt: 1981,
    status: "APPROVED"
  },
  {
    title: "Studio langa Calea Mosilor",
    description:
      "Studio cochet, renovat, aproape de zona Armeneasca si Universitate, potrivit pentru inchiriere.",
    propertyType: "STUDIO",
    transactionType: "SALE",
    price: 78000,
    city: "Bucuresti",
    county: "Bucuresti",
    address: "Sector 2, Soseaua Pantelimon 88",
    latitude: 44.4389,
    longitude: 26.1101,
    surface: 35,
    rooms: 1,
    bathrooms: 1,
    floor: 2,
    yearBuilt: 1970,
    status: "APPROVED"
  },
  {
    title: "Casa individuala in zona Baneasa",
    description:
      "Casa pe doua niveluri, cu gradina si garaj, aproape de padure, scoli internationale si zona comerciala.",
    propertyType: "HOUSE",
    transactionType: "SALE",
    price: 465000,
    city: "Bucuresti",
    county: "Bucuresti",
    address: "Sector 1, Aleea Privighetorilor 18",
    latitude: 44.5106,
    longitude: 26.0833,
    surface: 210,
    rooms: 6,
    bathrooms: 3,
    floor: null,
    yearBuilt: 2016,
    status: "APPROVED"
  },
  {
    title: "Apartament in zona Dorobanti",
    description:
      "Apartament elegant, aproape de restaurante, cafenele si parcuri, intr-un imobil bine intretinut.",
    propertyType: "APARTMENT",
    transactionType: "SALE",
    price: 235000,
    city: "Bucuresti",
    county: "Bucuresti",
    address: "Sector 1, Calea Dorobanti 134",
    latitude: 44.4584,
    longitude: 26.0979,
    surface: 84,
    rooms: 3,
    bathrooms: 2,
    floor: 3,
    yearBuilt: 1980,
    status: "APPROVED"
  },
  {
    title: "Teren intravilan in Chitila",
    description:
      "Teren cu deschidere buna si acces rapid catre Bucuresti, potrivit pentru locuinta individuala.",
    propertyType: "LAND",
    transactionType: "SALE",
    price: 92000,
    city: "Chitila",
    county: "Ilfov",
    address: "Strada Banatului 72",
    latitude: 44.5081,
    longitude: 25.9826,
    surface: 760,
    rooms: null,
    bathrooms: null,
    floor: null,
    yearBuilt: null,
    status: "APPROVED"
  },
  {
    title: "Apartament central cu 2 camere in Timisoara",
    description:
      "Locuinta renovata recent, aproape de Piata Unirii si mijloace de transport, potrivita pentru inchiriere.",
    propertyType: "APARTMENT",
    transactionType: "RENT",
    price: 550,
    city: "Timisoara",
    county: "Timis",
    address: "Bulevardul Revolutiei 22",
    latitude: 45.7562,
    longitude: 21.2301,
    surface: 58,
    rooms: 2,
    bathrooms: 1,
    floor: 2,
    yearBuilt: 1985,
    status: "APPROVED"
  },
  {
    title: "Casa individuala in zona Buna Ziua",
    description:
      "Casa potrivita pentru familie, cu terasa, curte amenajata si doua locuri de parcare.",
    propertyType: "HOUSE",
    transactionType: "SALE",
    price: 275000,
    city: "Cluj-Napoca",
    county: "Cluj",
    address: "Strada Buna Ziua 18",
    latitude: 46.7512,
    longitude: 23.6218,
    surface: 145,
    rooms: 5,
    bathrooms: 3,
    floor: null,
    yearBuilt: 2020,
    status: "APPROVED"
  },
  {
    title: "Studio modern aproape de Palas Iasi",
    description:
      "Garsoniera complet mobilata, ideala pentru studenti sau investitie in regim hotelier.",
    propertyType: "STUDIO",
    transactionType: "RENT",
    price: 420,
    city: "Iasi",
    county: "Iasi",
    address: "Strada Palas 7A",
    latitude: 47.1571,
    longitude: 27.5895,
    surface: 36,
    rooms: 1,
    bathrooms: 1,
    floor: 6,
    yearBuilt: 2019,
    status: "APPROVED"
  },
  {
    title: "Teren intravilan pentru locuinta in Brasov",
    description:
      "Teren cu utilitati la limita proprietatii, amplasat intr-o zona linistita si accesibila.",
    propertyType: "LAND",
    transactionType: "SALE",
    price: 68000,
    city: "Brasov",
    county: "Brasov",
    address: "Strada Lanii 12",
    latitude: 45.6427,
    longitude: 25.5887,
    surface: 720,
    rooms: null,
    bathrooms: null,
    floor: null,
    yearBuilt: null,
    status: "APPROVED"
  },
  {
    title: "Apartament cu vedere spre mare in Constanta",
    description:
      "Apartament mobilat, situat aproape de plaja, potrivit pentru locuit sau inchiriere sezoniera.",
    propertyType: "APARTMENT",
    transactionType: "SALE",
    price: 132000,
    city: "Constanta",
    county: "Constanta",
    address: "Bulevardul Mamaia 210",
    latitude: 44.2085,
    longitude: 28.6412,
    surface: 64,
    rooms: 2,
    bathrooms: 1,
    floor: 7,
    yearBuilt: 2016,
    status: "APPROVED"
  },
  {
    title: "Casa pe parter in Oradea",
    description:
      "Constructie noua, eficienta energetic, cu bucatarie open-space si curte privata.",
    propertyType: "HOUSE",
    transactionType: "SALE",
    price: 198000,
    city: "Oradea",
    county: "Bihor",
    address: "Strada Ciheiului 31",
    latitude: 47.0316,
    longitude: 21.9748,
    surface: 118,
    rooms: 4,
    bathrooms: 2,
    floor: null,
    yearBuilt: 2023,
    status: "APPROVED"
  },
  {
    title: "Duplex spatios in zona Giroc",
    description:
      "Duplex cu trei dormitoare, terasa acoperita si acces facil catre Timisoara.",
    propertyType: "HOUSE",
    transactionType: "SALE",
    price: 162000,
    city: "Giroc",
    county: "Timis",
    address: "Strada Trandafirilor 9",
    latitude: 45.6941,
    longitude: 21.2367,
    surface: 106,
    rooms: 4,
    bathrooms: 2,
    floor: null,
    yearBuilt: 2021,
    status: "APPROVED"
  },
  {
    title: "Apartament nou in cartier Tractorul",
    description:
      "Anunt in curs de verificare, cu balcon generos si compartimentare practica.",
    propertyType: "APARTMENT",
    transactionType: "SALE",
    price: 109000,
    city: "Brasov",
    county: "Brasov",
    address: "Strada 13 Decembrie 115",
    latitude: 45.6669,
    longitude: 25.6084,
    surface: 61,
    rooms: 2,
    bathrooms: 1,
    floor: 5,
    yearBuilt: 2024,
    status: "PENDING"
  },
  {
    title: "Garsoniera pentru inchiriere in Militari",
    description:
      "Anunt trimis spre aprobare, aproape de statia de metrou Pacii.",
    propertyType: "STUDIO",
    transactionType: "RENT",
    price: 320,
    city: "Bucuresti",
    county: "Bucuresti",
    address: "Sector 6, Bulevardul Iuliu Maniu 188",
    latitude: 44.4342,
    longitude: 26.0134,
    surface: 32,
    rooms: 1,
    bathrooms: 1,
    floor: 8,
    yearBuilt: 2012,
    status: "PENDING"
  },
  {
    title: "Apartament cu balcon in Titan",
    description:
      "Anunt respins temporar pentru completarea fotografiilor si clarificarea detaliilor despre compartimentare.",
    propertyType: "APARTMENT",
    transactionType: "SALE",
    price: 98000,
    city: "Bucuresti",
    county: "Bucuresti",
    address: "Sector 3, Bulevardul 1 Decembrie 1918 12",
    latitude: 44.4192,
    longitude: 26.1744,
    surface: 54,
    rooms: 2,
    bathrooms: 1,
    floor: 6,
    yearBuilt: 1986,
    status: "REJECTED",
    rejectionReason: "Fotografiile sunt insuficiente, iar descrierea trebuie sa includa mai multe detalii despre compartimentare."
  }
];

async function main() {
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.pointOfInterest.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.savedSearch.deleteMany();
  await prisma.listingImage.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("User123!", 10);
  const adminPasswordHash = await bcrypt.hash("Admin123!", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Administrator Estario",
      email: "admin@example.com",
      passwordHash: adminPasswordHash,
      role: "ADMIN"
    }
  });

  const users = await Promise.all(
    demoUsers.map((user) =>
      prisma.user.create({
        data: {
          ...user,
          passwordHash
        }
      })
    )
  );

  const owners = [admin, ...users];
  const createdListings = [];
  const imageCounters = {};

  for (const [index, listing] of listings.entries()) {
    const owner = owners[index % owners.length];
    const typeIndex = imageCounters[listing.propertyType] ?? 0;
    imageCounters[listing.propertyType] = typeIndex + 1;
    const created = await prisma.listing.create({
      data: {
        ...advancedAttributesForListing(listing, index),
        ...listing,
        ownerId: owner.id,
        images: {
          create: imagesForListing(listing, typeIndex)
        }
      }
    });
    createdListings.push(created);
  }

  const firstUserListing = createdListings.find((listing) => listing.ownerId !== users[0].id && listing.status === "APPROVED");
  if (firstUserListing) {
    await prisma.favorite.create({
      data: {
        userId: users[0].id,
        listingId: firstUserListing.id
      }
    });
  }

  const messageListing = createdListings.find((listing) => listing.ownerId === users[1].id && listing.status === "APPROVED");
  if (messageListing) {
    const conversation = await prisma.conversation.create({
      data: {
        listingId: messageListing.id,
        ownerId: users[1].id,
        buyerId: users[2].id
      }
    });

    await prisma.message.create({
      data: {
        listingId: messageListing.id,
        conversationId: conversation.id,
        senderId: users[2].id,
        senderName: "Mihai Dumitrescu",
        senderEmail: users[2].email,
        message: "Buna ziua, proprietatea mai este disponibila pentru vizionare saptamana aceasta?"
      }
    });
  }

  await prisma.pointOfInterest.createMany({
    data: demoPois
  });
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

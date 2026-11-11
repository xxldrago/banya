import { PrismaClient } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

const cities = [
  {
    name: "Москва",
    slug: "moscow",
    timezone: "Europe/Moscow",
  },
  {
    name: "Санкт-Петербург",
    slug: "spb",
    timezone: "Europe/Moscow",
  },
  {
    name: "Сочи",
    slug: "sochi",
    timezone: "Europe/Moscow",
  },
];

const amenities = [
  { name: "Парковка", slug: "parking", icon: "parking" },
  { name: "Wi-Fi", slug: "wifi", icon: "wifi" },
  { name: "Бассейн", slug: "pool", icon: "pool" },
  { name: "Мангал", slug: "barbecue", icon: "grill" },
];

type VenueSeed = {
  title: string;
  slug: string;
  description: string;
  address: string;
  citySlug: string;
  lat: number;
  lng: number;
  type: "bath" | "sauna";
  minGuests: number;
  maxGuests: number;
  minDuration: number;
  priceFrom: number;
  rules: string;
  amenitySlugs: string[];
  photos: Array<{ url: string; key: string; sortOrder: number; isCover: boolean }>;
};

const venues: VenueSeed[] = [
  {
    title: "Баня у Ивана — традиционная русская баня",
    slug: "banya-u-ivana",
    description:
      "Традиционная русская баня на дровах с парением, дубовыми вениками и настоящим жаром. Уютная территория, бассейн, мангал.",
    address: "Московская обл., Истринский р-н, д. Лужки",
    citySlug: "moscow",
    lat: 55.902,
    lng: 36.867,
    type: "bath",
    minGuests: 1,
    maxGuests: 12,
    minDuration: 120,
    priceFrom: 5000,
    rules: "Не курить в парной. Веники выдаём. Дети до 12 лет только в сопровождении взрослых.",
    amenitySlugs: ["parking", "pool", "barbecue"],
    photos: [
      {
        url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200",
        key: "venues/banya-u-ivana/cover.jpg",
        sortOrder: 0,
        isCover: true,
      },
      {
        url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200",
        key: "venues/banya-u-ivana/interior.jpg",
        sortOrder: 1,
        isCover: false,
      },
    ],
  },
  {
    title: "Сауна Лофт на Арбате",
    slug: "sauna-loft-arbat",
    description:
      "Современная финская сауна в центре Москвы. Панорамные окна, дизайнерский интерьер, зона отдыха и душ с тропическим дождём.",
    address: "г. Москва, ул. Арбат, 24",
    citySlug: "moscow",
    lat: 55.752,
    lng: 37.593,
    type: "sauna",
    minGuests: 2,
    maxGuests: 8,
    minDuration: 60,
    priceFrom: 4500,
    rules: "Запрещено приносить еду. Алкоголь — по согласованию. Тапочки обязательны.",
    amenitySlugs: ["wifi", "parking"],
    photos: [
      {
        url: "https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=1200",
        key: "venues/sauna-loft-arbat/cover.jpg",
        sortOrder: 0,
        isCover: true,
      },
    ],
  },
  {
    title: "Банный комплекс «Север»",
    slug: "bannyi-kompleks-sever",
    description:
      "Просторный банный комплекс с русской парной, купелью и беседкой. Идеально для компании друзей и семейных праздников.",
    address: "г. Санкт-Петербург, Приморский пр., 72",
    citySlug: "spb",
    lat: 59.984,
    lng: 30.257,
    type: "bath",
    minGuests: 4,
    maxGuests: 16,
    minDuration: 180,
    priceFrom: 7000,
    rules: "Громкая музыка после 23:00 запрещена. Мангал — только на выделенной зоне.",
    amenitySlugs: ["parking", "wifi", "barbecue", "pool"],
    photos: [
      {
        url: "https://images.unsplash.com/photo-1515362670799-8b4fb9697ddd?w=1200",
        key: "venues/bannyi-kompleks-sever/cover.jpg",
        sortOrder: 0,
        isCover: true,
      },
      {
        url: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1200",
        key: "venues/bannyi-kompleks-sever/pool.jpg",
        sortOrder: 1,
        isCover: false,
      },
    ],
  },
  {
    title: "Финская сауна «Нева»",
    slug: "finskaya-sauna-neva",
    description:
      "Классическая финская сауна с сухим жаром, зоной релакса и видом на Неву. Подходит для 2–6 гостей.",
    address: "г. Санкт-Петербург, наб. реки Фонтанки, 15",
    citySlug: "spb",
    lat: 59.934,
    lng: 30.335,
    type: "sauna",
    minGuests: 2,
    maxGuests: 6,
    minDuration: 90,
    priceFrom: 3800,
    rules: "Только мягкая обувь. Нельзя лить воду на камни без разрешения персонала.",
    amenitySlugs: ["wifi", "parking"],
    photos: [
      {
        url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&h=800&fit=crop",
        key: "venues/finskaya-sauna-neva/cover.jpg",
        sortOrder: 0,
        isCover: true,
      },
    ],
  },
  {
    title: "Горная баня «Ахун»",
    slug: "gornaya-banya-ahun",
    description:
      "Банный комплекс у подножия горы Ахун с видом на море. Русская парная, открытый бассейн и терраса для барбекю.",
    address: "г. Сочи, Хостинский р-н, ул. Виноградная, 8",
    citySlug: "sochi",
    lat: 43.55,
    lng: 39.8,
    type: "bath",
    minGuests: 2,
    maxGuests: 10,
    minDuration: 120,
    priceFrom: 6000,
    rules: "Курение только на террасе. Бассейн — без стеклянной посуды.",
    amenitySlugs: ["pool", "barbecue", "parking", "wifi"],
    photos: [
      {
        url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200",
        key: "venues/gornaya-banya-ahun/cover.jpg",
        sortOrder: 0,
        isCover: true,
      },
      {
        url: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=1200",
        key: "venues/gornaya-banya-ahun/terrace.jpg",
        sortOrder: 1,
        isCover: false,
      },
    ],
  },
];

async function main() {
  console.log("🌱 Seeding database...");

  // --- Cities ---
  for (const city of cities) {
    await prisma.city.upsert({
      where: { slug: city.slug },
      update: {
        name: city.name,
        timezone: city.timezone,
        isActive: true,
      },
      create: {
        name: city.name,
        slug: city.slug,
        timezone: city.timezone,
        isActive: true,
      },
    });
  }
  // Deactivate any leftover cities from earlier seeds (keep only Phase-1 trio active)
  await prisma.city.updateMany({
    where: { slug: { notIn: cities.map((c) => c.slug) } },
    data: { isActive: false },
  });
  console.log(`  ✓ ${cities.length} cities`);

  // --- Amenities ---
  for (const amenity of amenities) {
    await prisma.amenity.upsert({
      where: { slug: amenity.slug },
      update: {
        name: amenity.name,
        icon: amenity.icon,
      },
      create: amenity,
    });
  }
  console.log(`  ✓ ${amenities.length} amenities`);

  // --- Partner user (argon2) ---
  const partnerHash = await argon2.hash("partner12345");
  const partnerUser = await prisma.user.upsert({
    where: { email: "partner@banya.local" },
    update: {
      passwordHash: partnerHash,
      role: "PARTNER",
      status: "active",
    },
    create: {
      email: "partner@banya.local",
      passwordHash: partnerHash,
      role: "PARTNER",
      status: "active",
    },
  });

  const partner = await prisma.partner.upsert({
    where: { userId: partnerUser.id },
    update: {
      companyName: "Баня у Ивана",
      inn: "7712345678",
      status: "active",
    },
    create: {
      userId: partnerUser.id,
      companyName: "Баня у Ивана",
      inn: "7712345678",
      status: "active",
    },
  });
  console.log(`  ✓ Partner user: ${partnerUser.email} → ${partner.companyName}`);

  // --- Optional admin + client for later auth plans ---
  const adminHash = await argon2.hash("admin12345");
  await prisma.user.upsert({
    where: { email: "admin@banya.local" },
    update: {},
    create: {
      email: "admin@banya.local",
      passwordHash: adminHash,
      role: "ADMIN",
      status: "active",
    },
  });

  const clientHash = await argon2.hash("client12345");
  await prisma.user.upsert({
    where: { email: "client@banya.local" },
    update: {},
    create: {
      email: "client@banya.local",
      passwordHash: clientHash,
      role: "CLIENT",
      status: "active",
    },
  });

  const amenityRecords = await prisma.amenity.findMany();
  const amenityBySlug = new Map(amenityRecords.map((a) => [a.slug, a]));

  // --- Venues with photos + amenities ---
  for (const v of venues) {
    const city = await prisma.city.findUnique({ where: { slug: v.citySlug } });
    if (!city) {
      throw new Error(`City not found for slug ${v.citySlug}`);
    }

    const venue = await prisma.venue.upsert({
      where: { slug: v.slug },
      update: {
        title: v.title,
        description: v.description,
        address: v.address,
        cityId: city.id,
        partnerId: partner.id,
        lat: v.lat,
        lng: v.lng,
        type: v.type,
        minGuests: v.minGuests,
        maxGuests: v.maxGuests,
        minDuration: v.minDuration,
        priceFrom: v.priceFrom,
        rules: v.rules,
        status: "PUBLISHED",
        moderationStatus: "APPROVED",
        publishedAt: new Date(),
      },
      create: {
        partnerId: partner.id,
        cityId: city.id,
        title: v.title,
        slug: v.slug,
        description: v.description,
        address: v.address,
        lat: v.lat,
        lng: v.lng,
        type: v.type,
        minGuests: v.minGuests,
        maxGuests: v.maxGuests,
        minDuration: v.minDuration,
        priceFrom: v.priceFrom,
        rules: v.rules,
        status: "PUBLISHED",
        moderationStatus: "APPROVED",
        publishedAt: new Date(),
      },
    });

    // Reset amenity links
    await prisma.venueAmenity.deleteMany({ where: { venueId: venue.id } });
    for (const slug of v.amenitySlugs) {
      const amenity = amenityBySlug.get(slug);
      if (!amenity) continue;
      await prisma.venueAmenity.create({
        data: {
          venueId: venue.id,
          amenityId: amenity.id,
        },
      });
    }

    // Reset photos
    await prisma.venuePhoto.deleteMany({ where: { venueId: venue.id } });
    for (const photo of v.photos) {
      await prisma.venuePhoto.create({
        data: {
          venueId: venue.id,
          url: photo.url,
          key: photo.key,
          sortOrder: photo.sortOrder,
          isCover: photo.isCover,
        },
      });
    }

    console.log(`  ✓ Venue: ${venue.slug}`);
  }

  // --- Phase 2: Services, Bookings, Chat ---
  const testVenues = await prisma.venue.findMany({ include: { partner: { include: { user: true } } } });
  const testClient = await prisma.user.findFirst({ where: { role: "CLIENT" } });

  for (const venue of testVenues.slice(0, 2)) {
    const services = [
      { name: "Банщик", defaultPrice: 1000 },
      { name: "Веник дубовый", defaultPrice: 300 },
      { name: "Веник березовый", defaultPrice: 300 },
      { name: "Ароматерапия", defaultPrice: 500 },
      { name: "Чайный набор", defaultPrice: 400 },
    ];

    for (const svc of services) {
      await prisma.service.upsert({
        where: { id: `${venue.id}-${svc.name}` },
        update: { defaultPrice: svc.defaultPrice },
        create: {
          id: `${venue.id}-${svc.name}`,
          venueId: venue.id,
          name: svc.name,
          defaultPrice: svc.defaultPrice,
        },
      });
    }
    console.log(`  ✓ Services for venue: ${venue.slug}`);
  }

  if (testVenues.length > 0 && testClient) {
    const venue = testVenues[0];
    const partnerUser = venue.partner?.user;

    // Create past confirmed booking
    const pastBooking = await prisma.booking.upsert({
      where: { id: "seed-past-booking" },
      update: {},
      create: {
        id: "seed-past-booking",
        venueId: venue.id,
        userId: testClient.id,
        startsAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
        endsAt: new Date(Date.now() - 46 * 60 * 60 * 1000),
        status: "CONFIRMED",
        bookingMode: "instant",
        allowBackToBack: false,
      },
    });

    // Create future confirmed booking
    await prisma.booking.upsert({
      where: { id: "seed-future-booking" },
      update: {},
      create: {
        id: "seed-future-booking",
        venueId: venue.id,
        userId: testClient.id,
        startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endsAt: new Date(Date.now() + 26 * 60 * 60 * 1000),
        status: "CONFIRMED",
        bookingMode: "instant",
        allowBackToBack: false,
      },
    });

    // Create pending booking
    await prisma.booking.upsert({
      where: { id: "seed-pending-booking" },
      update: {},
      create: {
        id: "seed-pending-booking",
        venueId: venue.id,
        userId: testClient.id,
        startsAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
        endsAt: new Date(Date.now() + 75 * 60 * 60 * 1000),
        status: "PENDING",
        bookingMode: "confirm",
        allowBackToBack: false,
      },
    });

    // Create chat for past booking
    if (partnerUser) {
      const conversation = await prisma.chatConversation.upsert({
        where: { bookingId: pastBooking.id },
        update: {},
        create: {
          bookingId: pastBooking.id,
        },
      });

      await prisma.chatParticipant.upsert({
        where: { id: "seed-participant-client" },
        update: {},
        create: {
          id: "seed-participant-client",
          conversationId: conversation.id,
          userId: testClient.id,
          role: "client",
        },
      });

      await prisma.chatParticipant.upsert({
        where: { id: "seed-participant-partner" },
        update: {},
        create: {
          id: "seed-participant-partner",
          conversationId: conversation.id,
          userId: partnerUser.id,
          role: "partner",
        },
      });

      await prisma.chatMessage.create({
        data: {
          conversationId: conversation.id,
          senderId: testClient.id,
          body: "Здравствуйте! Подскажите, нужно ли брать с собой полотенца?",
        },
      }).catch(() => {});

      await prisma.chatMessage.create({
        data: {
          conversationId: conversation.id,
          senderId: partnerUser.id,
          body: "Добрый день! Полотенца предоставляются, но можно взять свои.",
        },
      }).catch(() => {});

      console.log(`  ✓ Chat seeded for past booking`);
    }
  }

  // --- Phase 3: Reviews for the public catalog ---
  if (testClient) {
    const reviewVenues = await prisma.venue.findMany({
      take: 4,
      orderBy: { createdAt: "asc" },
    });
    const reviewSamples = [
      {
        rating: 5,
        comment:
          "Отличная баня! Пар мягкий, купель ледяная — то, что нужно после парной. Персонал внимательный, всё чисто.",
      },
      {
        rating: 5,
        comment:
          "Бронировали на день рождения, остались в восторге. Просторная комната отдыха, мангал, всё продумано до мелочей.",
      },
      {
        rating: 4,
        comment:
          "Хорошее место, удобная парковка. В выходные немного шумно от соседних компаний, но в целом рекомендую.",
      },
      {
        rating: 5,
        comment:
          "Панорамные окна и вид на город — отдельный восторг. Сауна прогревается быстро, температура ровная.",
      },
      {
        rating: 4,
        comment:
          "Чисто, уютно, есть всё необходимое. Немного не хватило веников, но принесли по первой просьбе.",
      },
      {
        rating: 5,
        comment:
          "Лучшая баня, в которую ходили за последний год. Обязательно вернёмся всей компанией.",
      },
    ];

    let reviewIndex = 0;
    for (const venue of reviewVenues) {
      for (let j = 0; j < 2; j++) {
        const bookingId = `seed-review-booking-${venue.id}-${j}`;
        const startsAt = new Date(
          Date.now() - (12 + reviewIndex) * 24 * 60 * 60 * 1000,
        );
        await prisma.booking.upsert({
          where: { id: bookingId },
          update: {},
          create: {
            id: bookingId,
            venueId: venue.id,
            userId: testClient.id,
            startsAt,
            endsAt: new Date(startsAt.getTime() + 3 * 60 * 60 * 1000),
            status: "CONFIRMED",
            bookingMode: "instant",
            allowBackToBack: false,
          },
        });

        const sample = reviewSamples[reviewIndex % reviewSamples.length];
        await prisma.review.upsert({
          where: { bookingId },
          update: {
            rating: sample.rating,
            comment: sample.comment,
            status: "APPROVED",
          },
          create: {
            bookingId,
            venueId: venue.id,
            userId: testClient.id,
            rating: sample.rating,
            comment: sample.comment,
            status: "APPROVED",
          },
        });
        reviewIndex++;
      }
    }
    console.log(`  ✓ Reviews seeded: ${reviewIndex}`);
  }

  console.log("✅ Seeding complete");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function hashFromString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

const locationPool = [
  { city: 'Lagos', state: 'Lagos', country: 'Nigeria', latitude: 6.5244, longitude: 3.3792 },
  { city: 'Abuja', state: 'FCT', country: 'Nigeria', latitude: 9.0765, longitude: 7.3986 },
  { city: 'Port Harcourt', state: 'Rivers', country: 'Nigeria', latitude: 4.8156, longitude: 7.0498 },
  { city: 'London', state: 'England', country: 'UK', latitude: 51.5072, longitude: -0.1276 },
  { city: 'Manchester', state: 'England', country: 'UK', latitude: 53.4808, longitude: -2.2426 },
  { city: 'Birmingham', state: 'England', country: 'UK', latitude: 52.4862, longitude: -1.8904 },
  { city: 'New York', state: 'New York', country: 'USA', latitude: 40.7128, longitude: -74.006 },
  { city: 'Austin', state: 'Texas', country: 'USA', latitude: 30.2672, longitude: -97.7431 },
  { city: 'San Francisco', state: 'California', country: 'USA', latitude: 37.7749, longitude: -122.4194 },
];

const categoryBlueprints = [
  { category: 'Food', labels: ['Fresh Basket', 'Harvest Lane', 'Urban Bite', 'Green Pantry', 'Golden Plate'] },
  { category: 'Bank', labels: ['NorthBridge Bank', 'Summit Savings', 'Crown Finance', 'Sterling Vault', 'Prime Ledger'] },
  { category: 'Insurance', labels: ['SafeCover Insurance', 'Harbor Shield', 'EverTrust Cover', 'Pulse Protect', 'Anchor Assurance'] },
  { category: 'Car Dealer', labels: ['Metro Wheels', 'Summit Auto Hub', 'Velocity Motors', 'DriveStone Auto', 'NextGear Autos'] },
  { category: 'Furniture Store', labels: ['Oakline Living', 'NestCraft Home', 'Luma Furnishings', 'Grand Timber', 'Comfort Atelier'] },
  { category: 'Jewelry Store', labels: ['Crown Jewel House', 'Aurora Gems', 'PureFacet Studio', 'LuxeStone', 'Silver Orbit'] },
  { category: 'Clothing Store', labels: ['Thread Harbor', 'Northline Apparel', 'Urban Loom', 'Style District', 'Velvet Avenue'] },
  { category: 'Electronics & Technology', labels: ['ByteSquare', 'Nova Devices', 'CircuitCore', 'Skyline Techmart', 'Pixel Forge'] },
  { category: 'Fitness and Nutrition Service', labels: ['PeakFuel Fitness', 'CorePulse Studio', 'FitHarvest', 'ProForm Nutrition', 'StrideLab'] },
  { category: 'Travel Agency', labels: ['Global Trail Co', 'BlueSky Journeys', 'RouteNest Travel', 'Vista Orbit', 'Mapline Escapes'] },
  { category: 'Healthcare Service', labels: ['CarePoint Clinic', 'VitalBridge Health', 'ClearPath Medical', 'PulseCare Center', 'Unity Health Hub'] },
  { category: 'Education Service', labels: ['BrightPath Academy', 'FutureSkill Institute', 'MeritSpring Learning', 'SkillForge Campus', 'NorthStar Tutors'] },
];

function buildGeneratedBusinesses() {
  const records = [];
  let locationCursor = 0;
  for (const blueprint of categoryBlueprints) {
    for (const label of blueprint.labels) {
      const slug = slugify(label);
      const location = locationPool[locationCursor % locationPool.length];
      locationCursor += 1;
      records.push({
        name: label,
        slug,
        category: blueprint.category,
        website: `https://${slug}.example.com`,
        description: `${label} delivers reliable ${blueprint.category.toLowerCase()} experiences with transparent service standards and responsive support.`,
        logo: `https://picsum.photos/seed/logo-${slug}/320/320`,
        banner: `https://picsum.photos/seed/banner-${slug}/1200/320`,
        city: location.city,
        state: location.state,
        country: location.country,
        latitude: location.latitude,
        longitude: location.longitude,
        verified: hashFromString(slug) % 3 === 0,
      });
    }
  }
  return records;
}

async function upsertUsers() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const businessPassword = await bcrypt.hash('business123', 10);
  const userPassword = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  const businessOwner = await prisma.user.upsert({
    where: { email: 'business@example.com' },
    update: {},
    create: {
      email: 'business@example.com',
      name: 'Business Owner',
      password: businessPassword,
      role: 'BUSINESS',
    },
  });

  const sampleUsers = [];
  for (let i = 1; i <= 24; i += 1) {
    const user = await prisma.user.upsert({
      where: { email: `customer${i}@example.com` },
      update: {},
      create: {
        email: `customer${i}@example.com`,
        name: `Customer ${i}`,
        password: userPassword,
        role: 'USER',
      },
    });
    sampleUsers.push(user);
  }

  await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      email: 'john@example.com',
      name: 'John Doe',
      password: userPassword,
      role: 'USER',
    },
  });

  await prisma.user.upsert({
    where: { email: 'jane@example.com' },
    update: {},
    create: {
      email: 'jane@example.com',
      name: 'Jane Smith',
      password: userPassword,
      role: 'USER',
    },
  });

  return { admin, businessOwner, sampleUsers };
}

async function upsertCoreBusinesses(businessOwnerId) {
  const core = [
    {
      name: 'Acme Corporation',
      slug: 'acme-corporation',
      website: 'https://acme.example.com',
      category: 'Electronics & Technology',
      city: 'San Francisco',
      state: 'California',
      country: 'USA',
      latitude: 37.7749,
      longitude: -122.4194,
      description: 'Leading provider of innovative technology solutions for businesses worldwide.',
      logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=400',
      banner: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1400',
      verified: true,
      claimedById: businessOwnerId,
    },
    {
      name: 'Global Services Inc',
      slug: 'global-services',
      website: 'https://globalservices.example.com',
      category: 'Insurance',
      city: 'London',
      state: 'England',
      country: 'UK',
      latitude: 51.5072,
      longitude: -0.1276,
      description: 'Professional consulting and managed services for modern enterprises.',
      logo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400',
      banner: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=1400',
      verified: true,
    },
    {
      name: 'Fresh Foods Market',
      slug: 'fresh-foods',
      website: 'https://freshfoods.example.com',
      category: 'Food',
      city: 'Austin',
      state: 'Texas',
      country: 'USA',
      latitude: 30.2672,
      longitude: -97.7431,
      description: 'Your neighborhood grocery store with the freshest produce and quality products.',
      logo: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400',
      banner: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1400',
      verified: true,
    },
  ];

  const inserted = [];
  for (const business of core) {
    const record = await prisma.business.upsert({
      where: { slug: business.slug },
      update: business,
      create: business,
    });
    inserted.push(record);
  }
  return inserted;
}

async function upsertGeneratedBusinesses() {
  const generated = buildGeneratedBusinesses();
  const inserted = [];
  for (const business of generated) {
    const record = await prisma.business.upsert({
      where: { slug: business.slug },
      update: business,
      create: business,
    });
    inserted.push(record);
  }
  return inserted;
}

async function seedReviews(allBusinesses, users) {
  let createdCount = 0;

  for (let businessIndex = 0; businessIndex < allBusinesses.length; businessIndex += 1) {
    const business = allBusinesses[businessIndex];
    const score = hashFromString(business.slug);
    const reviewCount = score % 5; // 0..4 reviews

    for (let i = 0; i < reviewCount; i += 1) {
      const reviewer = users[(businessIndex + i) % users.length];
      const rating = ((score + i) % 5) + 1;
      const title = [
        'Great overall experience',
        'Solid service and support',
        'Good value for money',
        'Needs improvement in response time',
        'Highly recommend this company',
      ][(score + i) % 5];
      const content = `${business.name} in ${business.city} delivered a ${rating >= 4 ? 'strong' : 'mixed'} experience. The team was ${rating >= 4 ? 'professional and responsive' : 'helpful but inconsistent'} and the overall service matched our expectations.`;
      const id = `${business.slug}-review-${i + 1}`;

      await prisma.review.upsert({
        where: { id },
        update: {
          rating,
          title,
          content,
          status: 'APPROVED',
        },
        create: {
          id,
          businessId: business.id,
          userId: reviewer.id,
          rating,
          title,
          content,
          status: 'APPROVED',
        },
      });
      createdCount += 1;
    }
  }

  return createdCount;
}

async function main() {
  console.log('Seeding started...');

  const { businessOwner, sampleUsers } = await upsertUsers();
  const coreBusinesses = await upsertCoreBusinesses(businessOwner.id);
  const generatedBusinesses = await upsertGeneratedBusinesses();
  const allBusinesses = [...coreBusinesses, ...generatedBusinesses];
  const reviewCount = await seedReviews(allBusinesses, sampleUsers);

  console.log(`Users ready: ${sampleUsers.length + 4}`);
  console.log(`Businesses ready: ${allBusinesses.length}`);
  console.log(`Approved reviews ready: ${reviewCount}`);
  console.log('Seeding completed.');
}

main()
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

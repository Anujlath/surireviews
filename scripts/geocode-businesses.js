const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const TARGET_COUNTRY_CODES = new Set(['NG', 'GB', 'US']);
const TARGET_COUNTRY_ALIASES = {
  NG: ['nigeria', 'ng'],
  GB: ['united kingdom', 'uk', 'great britain', 'england', 'gb'],
  US: ['united states', 'united states of america', 'usa', 'us'],
};

function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function countryToCode(countryValue) {
  const normalized = normalize(countryValue);
  for (const [code, aliases] of Object.entries(TARGET_COUNTRY_ALIASES)) {
    if (aliases.includes(normalized)) return code;
  }
  return null;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function geocodeAddress(address, apiKey) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Geocoding HTTP ${response.status}`);
  }
  return response.json();
}

function extractCountryCode(result) {
  const countryComponent = result?.address_components?.find((item) => item.types?.includes('country'));
  return countryComponent?.short_name || null;
}

async function main() {
  loadEnvFile();

  const apiKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error('Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (or GOOGLE_MAPS_API_KEY) to .env');
  }

  const businesses = await prisma.business.findMany({
    where: {
      OR: [{ latitude: null }, { longitude: null }],
    },
    select: {
      id: true,
      name: true,
      city: true,
      state: true,
      country: true,
      latitude: true,
      longitude: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  let scanned = 0;
  let targeted = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const business of businesses) {
    scanned += 1;
    const countryCode = countryToCode(business.country);
    if (!countryCode || !TARGET_COUNTRY_CODES.has(countryCode)) {
      skipped += 1;
      continue;
    }
    targeted += 1;

    const locationParts = [business.city, business.state, business.country].filter(Boolean);
    const address = locationParts.length > 0 ? locationParts.join(', ') : `${business.name}, ${business.country || ''}`.trim();

    try {
      const geocode = await geocodeAddress(address, apiKey);
      if (geocode.status !== 'OK' || !geocode.results?.length) {
        failed += 1;
        console.log(`[skip] ${business.name}: geocode status ${geocode.status}`);
        await delay(150);
        continue;
      }

      const topResult = geocode.results[0];
      const resultCountryCode = extractCountryCode(topResult);
      if (!resultCountryCode || resultCountryCode !== countryCode) {
        failed += 1;
        console.log(`[skip] ${business.name}: country mismatch (${resultCountryCode || 'unknown'} != ${countryCode})`);
        await delay(150);
        continue;
      }

      const lat = topResult.geometry?.location?.lat;
      const lng = topResult.geometry?.location?.lng;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        failed += 1;
        console.log(`[skip] ${business.name}: invalid lat/lng`);
        await delay(150);
        continue;
      }

      await prisma.business.update({
        where: { id: business.id },
        data: { latitude: lat, longitude: lng },
      });
      updated += 1;
      console.log(`[ok] ${business.name}: ${lat}, ${lng}`);
      await delay(150);
    } catch (error) {
      failed += 1;
      console.log(`[error] ${business.name}: ${error.message}`);
      await delay(250);
    }
  }

  console.log('\nGeocode summary');
  console.log(`scanned: ${scanned}`);
  console.log(`targeted (NG/GB/US): ${targeted}`);
  console.log(`updated: ${updated}`);
  console.log(`skipped: ${skipped}`);
  console.log(`failed: ${failed}`);
}

main()
  .catch((error) => {
    console.error('Geocoding failed:', error.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

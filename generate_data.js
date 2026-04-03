const fs = require('fs');
const path = require('path');

// Years: 2021-2033
const years = [2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033];

// Geographies - Africa with sub-regions and countries
const regions = {
  "Africa": ["North Africa", "Central Africa", "Southern Africa", "East Africa"]
};

const subRegionCountries = {
  "North Africa": ["Egypt", "Morocco", "Rest of North Africa"],
  "Central Africa": ["Democratic Republic of Congo", "Cameroon", "Rest of Central Africa"],
  "Southern Africa": ["South Africa", "Zambia", "Rest of Southern Africa"],
  "East Africa": ["Kenya", "Tanzania", "Rest of East Africa"]
};

// New segment definitions for Degreaser market
const segmentTypes = {
  "By Product Type": {
    "Alkaline Degreasers": 0.20,
    "Solvent / Hydrocarbon-Based Degreasers": 0.22,
    "Water-Based Degreasers": 0.18,
    "Oil Dispersants / Spill Treatment Cleaners": 0.10,
    "Workshop / Hand Degreasers": 0.12,
    "Specialty Industrial Degreasers": 0.08,
    "Bio-Based / Green Degreasers": 0.06,
    "Others": 0.04
  },
  "By Cleaning Strength": {
    "Light-duty degreasers": 0.30,
    "Medium-duty degreasers": 0.42,
    "Heavy-duty degreasers": 0.28
  },
  "By Physical Form": {
    "Liquid degreasers": 0.38,
    "Gel degreasers": 0.12,
    "Aerosol / spray degreasers": 0.22,
    "Foam-based degreasers": 0.15,
    "Powder concentrates": 0.13
  },
  "By Application Method": {
    "Manual / Wipe-on / Scrub Application": 0.18,
    "Spray Application": 0.25,
    "Immersion/Soaking": 0.18,
    "Pressure Washing": 0.17,
    "Ultrasonic Cleaning": 0.10,
    "Foam Application": 0.12
  },
  "By End-Use Industry": {
    "Automotive & Workshops": 0.22,
    "Manufacturing/Metalworking": 0.20,
    "Food Processing": 0.15,
    "Hospitality, Institutional & Facility Cleaning": 0.14,
    "Marine / Transport / Logistics": 0.10,
    "Oil & Gas / Heavy Industry": 0.11,
    "Others (Electronics, etc.)": 0.08
  },
  "By Distribution Channel": {
    "Direct sales": 0.40,
    "Indirect Sales (via distributors)": 0.38,
    "Online / e-commerce platforms": 0.22
  }
};

// Regional base values (USD Million) for 2021 - total market per region
// Africa Degreaser market ~$850M in 2021, growing ~8% CAGR
const regionBaseValues = {
  "Africa": 850
};

// Sub-region share within Africa
const subRegionShares = {
  "Africa": { "North Africa": 0.35, "Central Africa": 0.15, "Southern Africa": 0.30, "East Africa": 0.20 }
};

// Country share within sub-region
const countryShares = {
  "North Africa": { "Egypt": 0.45, "Morocco": 0.30, "Rest of North Africa": 0.25 },
  "Central Africa": { "Democratic Republic of Congo": 0.40, "Cameroon": 0.35, "Rest of Central Africa": 0.25 },
  "Southern Africa": { "South Africa": 0.55, "Zambia": 0.20, "Rest of Southern Africa": 0.25 },
  "East Africa": { "Kenya": 0.45, "Tanzania": 0.30, "Rest of East Africa": 0.25 }
};

// Growth rates (CAGR) per sub-region
const regionGrowthRates = {
  "Africa": 0.082,
  "North Africa": 0.078,
  "Central Africa": 0.095,
  "Southern Africa": 0.080,
  "East Africa": 0.092
};

// Segment-specific growth multipliers (relative to regional base CAGR)
const segmentGrowthMultipliers = {
  "By Product Type": {
    "Alkaline Degreasers": 0.95,
    "Solvent / Hydrocarbon-Based Degreasers": 0.88,
    "Water-Based Degreasers": 1.12,
    "Oil Dispersants / Spill Treatment Cleaners": 1.08,
    "Workshop / Hand Degreasers": 1.05,
    "Specialty Industrial Degreasers": 1.15,
    "Bio-Based / Green Degreasers": 1.35,
    "Others": 1.00
  },
  "By Cleaning Strength": {
    "Light-duty degreasers": 0.92,
    "Medium-duty degreasers": 1.02,
    "Heavy-duty degreasers": 1.08
  },
  "By Physical Form": {
    "Liquid degreasers": 0.95,
    "Gel degreasers": 1.10,
    "Aerosol / spray degreasers": 1.08,
    "Foam-based degreasers": 1.15,
    "Powder concentrates": 0.90
  },
  "By Application Method": {
    "Manual / Wipe-on / Scrub Application": 0.90,
    "Spray Application": 1.05,
    "Immersion/Soaking": 0.95,
    "Pressure Washing": 1.02,
    "Ultrasonic Cleaning": 1.18,
    "Foam Application": 1.08
  },
  "By End-Use Industry": {
    "Automotive & Workshops": 1.05,
    "Manufacturing/Metalworking": 1.08,
    "Food Processing": 1.12,
    "Hospitality, Institutional & Facility Cleaning": 1.10,
    "Marine / Transport / Logistics": 0.95,
    "Oil & Gas / Heavy Industry": 1.06,
    "Others (Electronics, etc.)": 1.02
  },
  "By Distribution Channel": {
    "Direct sales": 0.95,
    "Indirect Sales (via distributors)": 0.98,
    "Online / e-commerce platforms": 1.25
  }
};

// Volume multiplier: units (Tons) per USD Million
const volumePerMillionUSD = 120;

// Seeded pseudo-random for reproducibility
let seed = 42;
function seededRandom() {
  seed = (seed * 16807 + 0) % 2147483647;
  return (seed - 1) / 2147483646;
}

function addNoise(value, noiseLevel = 0.03) {
  return value * (1 + (seededRandom() - 0.5) * 2 * noiseLevel);
}

function roundTo1(val) {
  return Math.round(val * 10) / 10;
}

function roundToInt(val) {
  return Math.round(val);
}

function generateTimeSeries(baseValue, growthRate, roundFn) {
  const series = {};
  for (let i = 0; i < years.length; i++) {
    const year = years[i];
    const rawValue = baseValue * Math.pow(1 + growthRate, i);
    series[year] = roundFn(addNoise(rawValue));
  }
  return series;
}

function generateData(isVolume) {
  const data = {};
  const roundFn = isVolume ? roundToInt : roundTo1;
  const multiplier = isVolume ? volumePerMillionUSD : 1;

  // Generate data for Africa (top level)
  for (const [regionName, subRegions] of Object.entries(regions)) {
    const regionBase = regionBaseValues[regionName] * multiplier;
    const regionGrowth = regionGrowthRates[regionName];

    // Africa-level data with all segment types
    data[regionName] = {};
    for (const [segType, segments] of Object.entries(segmentTypes)) {
      data[regionName][segType] = {};
      for (const [segName, share] of Object.entries(segments)) {
        const segGrowth = regionGrowth * segmentGrowthMultipliers[segType][segName];
        const segBase = regionBase * share;
        data[regionName][segType][segName] = generateTimeSeries(segBase, segGrowth, roundFn);
      }
    }

    // Add "By Country" at Africa level (sub-regions as "countries")
    data[regionName]["By Country"] = {};
    for (const subRegion of subRegions) {
      const srShare = subRegionShares[regionName][subRegion];
      const srGrowthVariation = 1 + (seededRandom() - 0.5) * 0.06;
      const srBase = regionBase * srShare;
      const srGrowth = regionGrowth * srGrowthVariation;
      data[regionName]["By Country"][subRegion] = generateTimeSeries(srBase, srGrowth, roundFn);
    }

    // Sub-region level data (North Africa, Central Africa, etc.)
    for (const subRegion of subRegions) {
      const srShare = subRegionShares[regionName][subRegion];
      const srBase = regionBase * srShare;
      const srGrowth = regionGrowthRates[subRegion] || regionGrowth;

      data[subRegion] = {};
      for (const [segType, segments] of Object.entries(segmentTypes)) {
        data[subRegion][segType] = {};
        for (const [segName, share] of Object.entries(segments)) {
          const segGrowth = srGrowth * segmentGrowthMultipliers[segType][segName];
          const segBase = srBase * share;
          const shareVariation = 1 + (seededRandom() - 0.5) * 0.1;
          data[subRegion][segType][segName] = generateTimeSeries(segBase * shareVariation, segGrowth, roundFn);
        }
      }

      // Add "By Country" for each sub-region
      const countries = subRegionCountries[subRegion];
      if (countries) {
        data[subRegion]["By Country"] = {};
        for (const country of countries) {
          const cShare = countryShares[subRegion][country];
          const cGrowthVariation = 1 + (seededRandom() - 0.5) * 0.06;
          const cBase = srBase * cShare;
          const cGrowth = srGrowth * cGrowthVariation;
          data[subRegion]["By Country"][country] = generateTimeSeries(cBase, cGrowth, roundFn);
        }

        // Country-level data
        for (const country of countries) {
          const cShare = countryShares[subRegion][country];
          const cBase = srBase * cShare;
          const cGrowthVariation = 1 + (seededRandom() - 0.5) * 0.04;
          const cGrowth = srGrowth * cGrowthVariation;

          data[country] = {};
          for (const [segType, segments] of Object.entries(segmentTypes)) {
            data[country][segType] = {};
            for (const [segName, share] of Object.entries(segments)) {
              const segGrowth = cGrowth * segmentGrowthMultipliers[segType][segName];
              const segBase = cBase * share;
              const shareVariation = 1 + (seededRandom() - 0.5) * 0.1;
              data[country][segType][segName] = generateTimeSeries(segBase * shareVariation, segGrowth, roundFn);
            }
          }
        }
      }
    }
  }

  return data;
}

// Generate both datasets
seed = 42;
const valueData = generateData(false);
seed = 7777;
const volumeData = generateData(true);

// Write files
const outDir = path.join(__dirname, 'public', 'data');
fs.writeFileSync(path.join(outDir, 'value.json'), JSON.stringify(valueData, null, 2));
fs.writeFileSync(path.join(outDir, 'volume.json'), JSON.stringify(volumeData, null, 2));

console.log('Generated value.json and volume.json successfully');
console.log('Value geographies:', Object.keys(valueData));
console.log('Volume geographies:', Object.keys(volumeData));
console.log('Segment types:', Object.keys(valueData['Africa']));

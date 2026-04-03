const fs = require('fs');
const path = require('path');

// Years: 2021-2033
const years = [2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033];

// Geographies - Africa only with sub-regions
const regions = {
  "Africa": ["North Africa", "South Africa", "Central Africa"]
};

// New segment definitions for Degreaser market
const segmentTypes = {
  "By Product Type": {
    "Solvent-Based Degreasers": 0.28,
    "Water-Based Degreasers": 0.24,
    "Bio-Based / Green Degreasers": 0.12,
    "Specialty Degreasers": 0.10,
    "Alkaline Degreasers": 0.12,
    "Acid-Based Degreasers": 0.08,
    "Others (Enzymatic degreasers, etc.)": 0.06
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
    "Spray Application": 0.30,
    "Immersion/Soaking": 0.22,
    "Pressure Washing": 0.20,
    "Ultrasonic Cleaning": 0.13,
    "Foam Application": 0.15
  },
  "By End-Use Industry": {
    "Automotive": 0.28,
    "Manufacturing/Metalworking": 0.25,
    "Food Processing": 0.18,
    "Aerospace": 0.10,
    "Marine": 0.08,
    "Others (Electronics, Oil & Gas, etc.)": 0.11
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
const countryShares = {
  "Africa": { "North Africa": 0.45, "South Africa": 0.30, "Central Africa": 0.25 }
};

// Growth rates (CAGR) per region
const regionGrowthRates = {
  "Africa": 0.082
};

// Segment-specific growth multipliers (relative to regional base CAGR)
const segmentGrowthMultipliers = {
  "By Product Type": {
    "Solvent-Based Degreasers": 0.88,
    "Water-Based Degreasers": 1.12,
    "Bio-Based / Green Degreasers": 1.35,
    "Specialty Degreasers": 1.15,
    "Alkaline Degreasers": 0.95,
    "Acid-Based Degreasers": 0.90,
    "Others (Enzymatic degreasers, etc.)": 1.20
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
    "Spray Application": 1.05,
    "Immersion/Soaking": 0.95,
    "Pressure Washing": 1.02,
    "Ultrasonic Cleaning": 1.18,
    "Foam Application": 1.08
  },
  "By End-Use Industry": {
    "Automotive": 1.05,
    "Manufacturing/Metalworking": 1.08,
    "Food Processing": 1.12,
    "Aerospace": 1.15,
    "Marine": 0.92,
    "Others (Electronics, Oil & Gas, etc.)": 1.10
  },
  "By Distribution Channel": {
    "Direct sales": 0.95,
    "Indirect Sales (via distributors)": 0.98,
    "Online / e-commerce platforms": 1.25
  }
};

// Volume multiplier: units (Kilotons) per USD Million
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

  // Generate data for each region and sub-region
  for (const [regionName, subRegions] of Object.entries(regions)) {
    const regionBase = regionBaseValues[regionName] * multiplier;
    const regionGrowth = regionGrowthRates[regionName];

    // Region-level data
    data[regionName] = {};
    for (const [segType, segments] of Object.entries(segmentTypes)) {
      data[regionName][segType] = {};
      for (const [segName, share] of Object.entries(segments)) {
        const segGrowth = regionGrowth * segmentGrowthMultipliers[segType][segName];
        const segBase = regionBase * share;
        data[regionName][segType][segName] = generateTimeSeries(segBase, segGrowth, roundFn);
      }
    }

    // Add "By Country" for each region
    data[regionName]["By Country"] = {};
    for (const subRegion of subRegions) {
      const cShare = countryShares[regionName][subRegion];
      const subRegionGrowthVariation = 1 + (seededRandom() - 0.5) * 0.06;
      const subRegionBase = regionBase * cShare;
      const subRegionGrowth = regionGrowth * subRegionGrowthVariation;
      data[regionName]["By Country"][subRegion] = generateTimeSeries(subRegionBase, subRegionGrowth, roundFn);
    }

    // Sub-region-level data
    for (const subRegion of subRegions) {
      const cShare = countryShares[regionName][subRegion];
      const subRegionBase = regionBase * cShare;
      const subRegionGrowthVariation = 1 + (seededRandom() - 0.5) * 0.04;
      const subRegionGrowth = regionGrowth * subRegionGrowthVariation;

      data[subRegion] = {};
      for (const [segType, segments] of Object.entries(segmentTypes)) {
        data[subRegion][segType] = {};
        for (const [segName, share] of Object.entries(segments)) {
          const segGrowth = subRegionGrowth * segmentGrowthMultipliers[segType][segName];
          const segBase = subRegionBase * share;
          const shareVariation = 1 + (seededRandom() - 0.5) * 0.1;
          data[subRegion][segType][segName] = generateTimeSeries(segBase * shareVariation, segGrowth, roundFn);
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
console.log('Value geographies:', Object.keys(valueData).length);
console.log('Volume geographies:', Object.keys(volumeData).length);
console.log('Segment types:', Object.keys(valueData['Africa']));
console.log('Sample - Africa, By Product Type:', JSON.stringify(valueData['Africa']['By Product Type'], null, 2));

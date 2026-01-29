import type { SystemSizingInput, SystemSizingResult } from "@/types";

// Portugal-optimized solar constants
const SOLAR_YIELD_KWH_PER_KWP = 1500; // kWh/kWp/year (Portugal average)
const DC_AC_RATIO = 1.2; // DC oversizing ratio
const DEFAULT_SHADING_FACTOR = 0.85; // 15% loss due to shading
const DEFAULT_PANEL_WATTAGE = 550; // Standard modern panel wattage
const SELF_CONSUMPTION_RATIO = 0.3; // 30% for evening consumption (battery sizing)

/**
 * Calculate recommended solar system size based on inputs
 */
export function calculateSystemSize(input: SystemSizingInput): SystemSizingResult {
  const shadingFactor = input.shadingFactor ?? DEFAULT_SHADING_FACTOR;

  // Max inverter based on contracted power (90% of contracted kVA)
  const maxInverterKw = input.contractedPowerKva * 0.9;

  // System size needed to cover consumption
  const idealKwp = input.annualConsumptionKwh / SOLAR_YIELD_KWH_PER_KWP;

  // Adjust for shading losses
  const adjustedKwp = idealKwp / shadingFactor;

  // Limit by inverter capacity (DC can be up to DC_AC_RATIO times AC)
  const maxKwpByInverter = maxInverterKw * DC_AC_RATIO;

  // Final recommended system size
  const recommendedKwp = Math.min(adjustedKwp, maxKwpByInverter);

  // Panel count (using standard panel wattage)
  const panelWattage = DEFAULT_PANEL_WATTAGE;
  const numberOfPanels = Math.ceil((recommendedKwp * 1000) / panelWattage);

  // Recalculate actual kWp based on panel count
  const actualKwp = (numberOfPanels * panelWattage) / 1000;

  // Cable sizing based on distance and power
  const cableSizeDC = calculateDCCableSize(actualKwp, input.cableDistanceM);
  const cableSizeAC = calculateACCableSize(maxInverterKw);

  // Cable lengths (DC = 2x distance for positive and negative, plus margin)
  // AC = distance to distribution board plus margin
  const cableLengthDC = Math.ceil(input.cableDistanceM * 2.2); // 10% margin
  const cableLengthAC = Math.ceil(input.cableDistanceM * 1.1); // 10% margin

  // Battery sizing (if requested)
  let batteryKwh: number | undefined;
  if (input.includeBattery) {
    // Size battery for evening consumption (30% of daily average)
    const dailyConsumptionKwh = input.annualConsumptionKwh / 365;
    const eveningConsumptionKwh = dailyConsumptionKwh * SELF_CONSUMPTION_RATIO;
    // Round up to standard battery sizes (5, 10, 15 kWh)
    batteryKwh = Math.ceil(eveningConsumptionKwh / 5) * 5;
    batteryKwh = Math.max(5, Math.min(batteryKwh, 20)); // Clamp between 5-20 kWh
  }

  // Estimated annual production
  const estimatedAnnualProductionKwh = actualKwp * SOLAR_YIELD_KWH_PER_KWP * shadingFactor;

  return {
    recommendedKwp: Math.round(actualKwp * 100) / 100,
    maxInverterKw: Math.round(maxInverterKw * 100) / 100,
    numberOfPanels,
    panelWattage,
    cableSizeDC,
    cableSizeAC,
    cableLengthDC,
    cableLengthAC,
    batteryKwh,
    estimatedAnnualProductionKwh: Math.round(estimatedAnnualProductionKwh),
  };
}

/**
 * Calculate DC cable size based on system power and distance
 * Returns cable cross-section in mm²
 */
function calculateDCCableSize(systemKwp: number, distanceM: number): number {
  // Simplified cable sizing based on typical voltage drop requirements
  // For more precise sizing, consider actual string voltage and current

  if (systemKwp <= 3 && distanceM <= 15) return 4;
  if (systemKwp <= 6 && distanceM <= 20) return 4;
  if (systemKwp <= 6 && distanceM <= 30) return 6;
  if (systemKwp <= 10 && distanceM <= 20) return 6;
  if (systemKwp <= 10 && distanceM <= 40) return 10;
  if (systemKwp <= 15 && distanceM <= 30) return 10;
  return 16; // Default for larger systems or longer distances
}

/**
 * Calculate AC cable size based on inverter power
 * Returns cable cross-section in mm²
 */
function calculateACCableSize(inverterKw: number): number {
  // Simplified AC cable sizing for single-phase installations
  // Based on typical current carrying capacity

  if (inverterKw <= 3) return 2.5;
  if (inverterKw <= 5) return 4;
  if (inverterKw <= 8) return 6;
  if (inverterKw <= 12) return 10;
  return 16;
}

/**
 * Get common contracted power values for Portugal
 */
export function getContractedPowerOptions(): { value: number; label: string }[] {
  return [
    { value: 3.45, label: "3.45 kVA" },
    { value: 6.9, label: "6.9 kVA" },
    { value: 10.35, label: "10.35 kVA" },
    { value: 13.8, label: "13.8 kVA" },
    { value: 20.7, label: "20.7 kVA" },
    { value: 27.6, label: "27.6 kVA" },
    { value: 34.5, label: "34.5 kVA" },
    { value: 41.4, label: "41.4 kVA" },
  ];
}

/**
 * Estimate annual savings based on system production
 */
export function estimateAnnualSavings(
  annualProductionKwh: number,
  electricityRatePerKwh: number = 0.16 // Default Portugal rate
): number {
  // Assume 70% self-consumption, 30% fed to grid at lower rate
  const selfConsumptionRate = 0.7;
  const gridFeedRate = 0.06; // Feed-in tariff

  const selfConsumptionSavings =
    annualProductionKwh * selfConsumptionRate * electricityRatePerKwh;
  const gridFeedIncome =
    annualProductionKwh * (1 - selfConsumptionRate) * gridFeedRate;

  return Math.round(selfConsumptionSavings + gridFeedIncome);
}

/**
 * Estimate payback period in years
 */
export function estimatePaybackYears(
  totalInvestment: number,
  annualSavings: number
): number {
  if (annualSavings <= 0) return Infinity;
  return Math.round((totalInvestment / annualSavings) * 10) / 10;
}

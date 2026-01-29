import type {
  Product,
  SystemSizingResult,
  ProductSelectionResult,
  SelectedProduct,
  RoofType,
  ProductCategorySelection,
  SolarPanelSpecs,
  InverterSpecs,
  BatterySpecs,
  MountingSpecs,
} from "@/types";

const DEFAULT_CATEGORIES: ProductCategorySelection = {
  panels: true,
  inverter: true,
  battery: true,
  mounting: true,
  dcCable: true,
  acCable: true,
  labor: true,
};

/**
 * Auto-select products from catalog based on calculated system requirements
 */
export function selectProducts(
  sizingResult: SystemSizingResult,
  products: Product[],
  roofType: RoofType = "tile",
  categorySelection: ProductCategorySelection = DEFAULT_CATEGORIES
): ProductSelectionResult {
  const selectedProducts: SelectedProduct[] = [];
  const warnings: string[] = [];

  // Filter active products by category
  const panels = products.filter((p) => p.category === "solar_panel" && p.isActive);
  const inverters = products.filter((p) => p.category === "inverter" && p.isActive);
  const batteries = products.filter((p) => p.category === "battery" && p.isActive);
  const mounting = products.filter((p) => p.category === "mounting" && p.isActive);
  const accessories = products.filter((p) => p.category === "accessory" && p.isActive);
  const labor = products.filter((p) => p.category === "labor" && p.isActive);

  // 1. Select solar panels
  if (categorySelection.panels) {
    const selectedPanel = selectPanel(panels, sizingResult.panelWattage);
    if (selectedPanel) {
      selectedProducts.push({
        productId: selectedPanel.id,
        product: selectedPanel,
        quantity: sizingResult.numberOfPanels,
        section: "equipment",
      });
    } else {
      warnings.push("No suitable solar panel found in catalog");
    }
  }

  // 2. Select inverter
  if (categorySelection.inverter) {
    const selectedInverter = selectInverter(inverters, sizingResult.maxInverterKw);
    if (selectedInverter) {
      selectedProducts.push({
        productId: selectedInverter.id,
        product: selectedInverter,
        quantity: 1,
        section: "equipment",
      });
    } else {
      warnings.push("No suitable inverter found in catalog");
    }
  }

  // 3. Select battery (if needed and enabled)
  if (categorySelection.battery && sizingResult.batteryKwh) {
    const selectedBattery = selectBattery(batteries, sizingResult.batteryKwh);
    if (selectedBattery) {
      const batterySpecs = selectedBattery.specs as BatterySpecs;
      const batteryCount = Math.ceil(
        sizingResult.batteryKwh / (batterySpecs.capacityKwh || sizingResult.batteryKwh)
      );
      selectedProducts.push({
        productId: selectedBattery.id,
        product: selectedBattery,
        quantity: batteryCount,
        section: "equipment",
      });
    } else {
      warnings.push("No suitable battery found in catalog");
    }
  }

  // 4. Select mounting system
  if (categorySelection.mounting) {
    const selectedMounting = selectMounting(mounting, roofType);
    if (selectedMounting) {
      selectedProducts.push({
        productId: selectedMounting.id,
        product: selectedMounting,
        quantity: sizingResult.numberOfPanels,
        section: "equipment",
      });
    } else {
      warnings.push(`No mounting system found for ${roofType} roof type`);
    }
  }

  // 5. Select DC cable
  if (categorySelection.dcCable) {
    const dcCable = selectCable(accessories, "DC", sizingResult.cableSizeDC);
    if (dcCable) {
      selectedProducts.push({
        productId: dcCable.id,
        product: dcCable,
        quantity: sizingResult.cableLengthDC,
        section: "accessories",
      });
    } else {
      warnings.push(`No ${sizingResult.cableSizeDC}mm² DC cable found in catalog`);
    }
  }

  // 6. Select AC cable
  if (categorySelection.acCable) {
    const acCable = selectCable(accessories, "AC", sizingResult.cableSizeAC);
    if (acCable) {
      selectedProducts.push({
        productId: acCable.id,
        product: acCable,
        quantity: sizingResult.cableLengthAC,
        section: "accessories",
      });
    } else {
      warnings.push(`No ${sizingResult.cableSizeAC}mm² AC cable found in catalog`);
    }
  }

  // 7. Select labor/installation
  if (categorySelection.labor) {
    const installationLabor = selectLabor(labor, sizingResult.numberOfPanels);
    if (installationLabor) {
      // Calculate labor quantity based on labor unit type
      const laborQuantity = calculateLaborQuantity(
        installationLabor,
        sizingResult.numberOfPanels,
        sizingResult.recommendedKwp
      );
      selectedProducts.push({
        productId: installationLabor.id,
        product: installationLabor,
        quantity: laborQuantity,
        section: "installation",
      });
    } else {
      warnings.push("No installation labor found in catalog");
    }
  }

  return { selectedProducts, warnings };
}

/**
 * Select best matching solar panel
 */
function selectPanel(panels: Product[], targetWattage: number): Product | null {
  if (panels.length === 0) return null;

  // Sort by wattage difference from target, prefer higher wattage
  const sorted = [...panels].sort((a, b) => {
    const aSpecs = a.specs as SolarPanelSpecs;
    const bSpecs = b.specs as SolarPanelSpecs;
    const aDiff = Math.abs((aSpecs.wattage || 0) - targetWattage);
    const bDiff = Math.abs((bSpecs.wattage || 0) - targetWattage);

    // If similar difference, prefer higher wattage
    if (Math.abs(aDiff - bDiff) < 50) {
      return (bSpecs.wattage || 0) - (aSpecs.wattage || 0);
    }
    return aDiff - bDiff;
  });

  return sorted[0];
}

/**
 * Select best matching inverter
 */
function selectInverter(inverters: Product[], targetKw: number): Product | null {
  if (inverters.length === 0) return null;

  // Filter inverters that can handle the power
  const suitable = inverters.filter((inv) => {
    const specs = inv.specs as InverterSpecs;
    return specs.powerRating && specs.powerRating >= targetKw * 0.9; // Allow 10% under
  });

  if (suitable.length === 0) {
    // No suitable inverter, return the largest available
    return [...inverters].sort((a, b) => {
      const aSpecs = a.specs as InverterSpecs;
      const bSpecs = b.specs as InverterSpecs;
      return (bSpecs.powerRating || 0) - (aSpecs.powerRating || 0);
    })[0];
  }

  // Return smallest suitable inverter (most cost-effective)
  return suitable.sort((a, b) => {
    const aSpecs = a.specs as InverterSpecs;
    const bSpecs = b.specs as InverterSpecs;
    return (aSpecs.powerRating || 0) - (bSpecs.powerRating || 0);
  })[0];
}

/**
 * Select best matching battery
 */
function selectBattery(batteries: Product[], targetKwh: number): Product | null {
  if (batteries.length === 0) return null;

  // Find battery closest to target capacity
  const sorted = [...batteries].sort((a, b) => {
    const aSpecs = a.specs as BatterySpecs;
    const bSpecs = b.specs as BatterySpecs;
    const aDiff = Math.abs((aSpecs.capacityKwh || 0) - targetKwh);
    const bDiff = Math.abs((bSpecs.capacityKwh || 0) - targetKwh);
    return aDiff - bDiff;
  });

  return sorted[0];
}

/**
 * Select mounting system for roof type
 */
function selectMounting(mounting: Product[], roofType: RoofType): Product | null {
  if (mounting.length === 0) return null;

  // Find mounting matching roof type
  const matching = mounting.filter((m) => {
    const specs = m.specs as MountingSpecs;
    return specs.roofType === roofType;
  });

  if (matching.length > 0) {
    // Return cheapest matching option
    return matching.sort((a, b) => a.unitPrice - b.unitPrice)[0];
  }

  // No exact match, return first available
  return mounting[0];
}

/**
 * Select cable by type and size
 */
function selectCable(
  accessories: Product[],
  type: "DC" | "AC",
  sizeMm: number
): Product | null {
  // Search for cable matching type and size in name/description
  const cable = accessories.find((a) => {
    const nameUpper = a.name.toUpperCase();
    const descUpper = (a.description || "").toUpperCase();
    const searchText = `${nameUpper} ${descUpper}`;

    const hasType =
      searchText.includes(type) ||
      (type === "DC" && searchText.includes("SOLAR")) ||
      (type === "AC" && searchText.includes("MAIN"));
    const hasSize =
      searchText.includes(`${sizeMm}MM`) ||
      searchText.includes(`${sizeMm} MM`) ||
      searchText.includes(`${sizeMm}MM²`) ||
      searchText.includes(`${sizeMm} MM²`);

    return hasType && hasSize;
  });

  if (cable) return cable;

  // Fallback: find any cable with matching size
  return (
    accessories.find((a) => {
      const searchText = `${a.name} ${a.description || ""}`.toUpperCase();
      return (
        searchText.includes("CABLE") &&
        (searchText.includes(`${sizeMm}MM`) || searchText.includes(`${sizeMm} MM`))
      );
    }) || null
  );
}

/**
 * Select installation labor
 */
function selectLabor(labor: Product[], _panelCount: number): Product | null {
  if (labor.length === 0) return null;

  // Prefer per-panel or per-kW labor items for scalability
  const perPanel = labor.find((l) => {
    const nameUpper = l.name.toUpperCase();
    return (
      nameUpper.includes("INSTALL") &&
      (l.unit.toLowerCase().includes("panel") || l.unit.toLowerCase().includes("un"))
    );
  });

  if (perPanel) return perPanel;

  // Fallback to any installation labor
  return (
    labor.find((l) => l.name.toUpperCase().includes("INSTALL")) || labor[0]
  );
}

/**
 * Calculate labor quantity based on labor type
 */
function calculateLaborQuantity(
  labor: Product,
  panelCount: number,
  systemKwp: number
): number {
  const unit = labor.unit.toLowerCase();

  if (unit.includes("panel") || unit.includes("un")) {
    return panelCount;
  }

  if (unit.includes("kw")) {
    return Math.ceil(systemKwp);
  }

  if (unit.includes("day")) {
    // Estimate: ~8 panels per day for residential
    return Math.ceil(panelCount / 8);
  }

  if (unit.includes("hour")) {
    // Estimate: ~1 hour per panel including setup
    return Math.ceil(panelCount * 1.2);
  }

  // Fixed price - quantity of 1
  return 1;
}

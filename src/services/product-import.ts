import type { Product, ProductCategory } from "@/types";
import { getProducts, createProduct, getCategoryLabel } from "./products";

export { getProducts, getCategoryLabel };

// CSV column headers matching product fields
export const CSV_HEADERS = [
  "name",
  "sku",
  "description",
  "category",
  "unitPrice",
  "unit",
  "taxRate",
  "manufacturer",
  "model",
] as const;

export const VALID_CATEGORIES: ProductCategory[] = [
  "solar_panel",
  "inverter",
  "battery",
  "mounting",
  "labor",
  "accessory",
  "other",
];

export interface ImportRow {
  rowNumber: number;
  data: Record<string, string>;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidatedProduct {
  rowNumber: number;
  original: Record<string, string>;
  product: Omit<Product, "id" | "createdAt" | "updatedAt" | "orgId">;
  errors: ValidationError[];
  isDuplicate: boolean;
  duplicateOf?: string; // SKU of existing product
}

export interface ImportResult {
  validProducts: ValidatedProduct[];
  invalidProducts: ValidatedProduct[];
  totalRows: number;
}

/**
 * Generate CSV template content
 */
export function generateCsvTemplate(): string {
  const headers = CSV_HEADERS.join(",");
  const exampleRows = [
    "JA Solar 550W,JASOLAR-550,High-efficiency monocrystalline panel,solar_panel,180.00,un,23,JA Solar,JAM72S30-550/MR",
    "Huawei SUN2000-6KTL,HW-SUN2000-6KTL,6kW hybrid inverter,inverter,1200.00,un,23,Huawei,SUN2000-6KTL-M1",
    "DC Solar Cable 6mm,CABLE-DC-6MM,6mm² DC solar cable,accessory,2.50,m,23,,",
    "Installation Labor,LABOR-INSTALL,Standard installation per panel,labor,25.00,un,23,,",
  ];

  return [headers, ...exampleRows].join("\n");
}

/**
 * Generate Excel-compatible CSV template with BOM for proper UTF-8 encoding
 */
export function generateCsvTemplateBlob(): Blob {
  const content = generateCsvTemplate();
  // Add BOM for Excel UTF-8 compatibility
  const bom = "\uFEFF";
  return new Blob([bom + content], { type: "text/csv;charset=utf-8" });
}

/**
 * Parse CSV content into rows
 */
export function parseCsv(content: string): ImportRow[] {
  const lines = content.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase());
  const rows: ImportRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const data: Record<string, string> = {};

    headers.forEach((header, index) => {
      data[header] = values[index]?.trim() || "";
    });

    rows.push({ rowNumber: i + 1, data });
  }

  return rows;
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);

  return result;
}

/**
 * Validate imported rows against existing products
 */
export async function validateImport(
  orgId: string,
  rows: ImportRow[]
): Promise<ImportResult> {
  // Get existing products to check for duplicates
  const existingProducts = await getProducts(orgId);
  const existingSkus = new Map(existingProducts.map((p) => [p.sku.toLowerCase(), p.sku]));

  const validProducts: ValidatedProduct[] = [];
  const invalidProducts: ValidatedProduct[] = [];

  // Track SKUs in current import to detect duplicates within file
  const importSkus = new Map<string, number>();

  for (const row of rows) {
    const errors: ValidationError[] = [];
    const { data } = row;

    // Validate required fields
    if (!data.name?.trim()) {
      errors.push({ field: "name", message: "Name is required" });
    }

    if (!data.sku?.trim()) {
      errors.push({ field: "sku", message: "SKU is required" });
    }

    if (!data.category?.trim()) {
      errors.push({ field: "category", message: "Category is required" });
    } else if (!VALID_CATEGORIES.includes(data.category as ProductCategory)) {
      errors.push({
        field: "category",
        message: `Invalid category. Valid values: ${VALID_CATEGORIES.join(", ")}`,
      });
    }

    if (!data.unitprice?.trim()) {
      errors.push({ field: "unitPrice", message: "Unit price is required" });
    } else {
      const price = parseFloat(data.unitprice);
      if (isNaN(price) || price < 0) {
        errors.push({ field: "unitPrice", message: "Unit price must be a positive number" });
      }
    }

    if (!data.unit?.trim()) {
      errors.push({ field: "unit", message: "Unit is required" });
    }

    if (!data.taxrate?.trim()) {
      errors.push({ field: "taxRate", message: "Tax rate is required" });
    } else {
      const taxRate = parseFloat(data.taxrate);
      if (isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
        errors.push({ field: "taxRate", message: "Tax rate must be between 0 and 100" });
      }
    }

    // Check for duplicate SKU in database
    const skuLower = data.sku?.toLowerCase() || "";
    let isDuplicate = false;
    let duplicateOf: string | undefined;

    if (skuLower && existingSkus.has(skuLower)) {
      isDuplicate = true;
      duplicateOf = existingSkus.get(skuLower);
      errors.push({
        field: "sku",
        message: `SKU already exists in database: ${duplicateOf}`,
      });
    }

    // Check for duplicate SKU within import file
    if (skuLower && importSkus.has(skuLower)) {
      errors.push({
        field: "sku",
        message: `Duplicate SKU in import file (first occurrence: row ${importSkus.get(skuLower)})`,
      });
    } else if (skuLower) {
      importSkus.set(skuLower, row.rowNumber);
    }

    // Build product object (use null instead of undefined for Firestore compatibility)
    const product: Omit<Product, "id" | "createdAt" | "updatedAt" | "orgId"> = {
      name: data.name?.trim() || "",
      sku: data.sku?.trim() || "",
      description: data.description?.trim() || null,
      category: (data.category?.trim() as ProductCategory) || "other",
      unitPrice: parseFloat(data.unitprice) || 0,
      unit: data.unit?.trim() || "un",
      taxRate: parseFloat(data.taxrate) || 0,
      isActive: true,
      manufacturer: data.manufacturer?.trim() || null,
      model: data.model?.trim() || null,
      specs: {},
    };

    const validated: ValidatedProduct = {
      rowNumber: row.rowNumber,
      original: data,
      product,
      errors,
      isDuplicate,
      duplicateOf,
    };

    if (errors.length === 0) {
      validProducts.push(validated);
    } else {
      invalidProducts.push(validated);
    }
  }

  return {
    validProducts,
    invalidProducts,
    totalRows: rows.length,
  };
}

/**
 * Re-validate a single product after editing
 */
export function revalidateProduct(
  product: ValidatedProduct,
  existingSkus: Set<string>,
  importSkus: Map<string, number>
): ValidatedProduct {
  const errors: ValidationError[] = [];
  const { product: p, rowNumber } = product;

  if (!p.name?.trim()) {
    errors.push({ field: "name", message: "Name is required" });
  }

  if (!p.sku?.trim()) {
    errors.push({ field: "sku", message: "SKU is required" });
  }

  if (!p.category) {
    errors.push({ field: "category", message: "Category is required" });
  } else if (!VALID_CATEGORIES.includes(p.category)) {
    errors.push({
      field: "category",
      message: `Invalid category. Valid values: ${VALID_CATEGORIES.join(", ")}`,
    });
  }

  if (p.unitPrice < 0) {
    errors.push({ field: "unitPrice", message: "Unit price must be a positive number" });
  }

  if (!p.unit?.trim()) {
    errors.push({ field: "unit", message: "Unit is required" });
  }

  if (p.taxRate < 0 || p.taxRate > 100) {
    errors.push({ field: "taxRate", message: "Tax rate must be between 0 and 100" });
  }

  const skuLower = p.sku?.toLowerCase() || "";
  let isDuplicate = false;

  if (skuLower && existingSkus.has(skuLower)) {
    isDuplicate = true;
    errors.push({ field: "sku", message: "SKU already exists in database" });
  }

  // Check import duplicates (excluding self)
  const existingRow = importSkus.get(skuLower);
  if (skuLower && existingRow && existingRow !== rowNumber) {
    errors.push({
      field: "sku",
      message: `Duplicate SKU in import file (row ${existingRow})`,
    });
  }

  return {
    ...product,
    errors,
    isDuplicate,
  };
}

/**
 * Import validated products into the database
 */
export async function importProducts(
  orgId: string,
  products: ValidatedProduct[]
): Promise<{ success: number; failed: number; errors: string[] }> {
  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const { product, rowNumber } of products) {
    try {
      await createProduct(orgId, product);
      success++;
    } catch (error) {
      failed++;
      errors.push(`Row ${rowNumber}: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  return { success, failed, errors };
}

/**
 * Read file content as text
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

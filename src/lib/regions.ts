import type { Region, TaxRate } from "@/types";

export const PORTUGAL_REGION: Region = {
  id: "PT",
  code: "PT",
  name: "Portugal",
  currency: "EUR",
  currencySymbol: "€",
  locale: "pt-PT",
  dateFormat: "dd/MM/yyyy",
  taxRates: [
    {
      code: "IVA_STANDARD",
      name: "IVA Normal",
      rate: 23,
      description: "Taxa normal de IVA",
    },
    {
      code: "IVA_INTERMEDIATE",
      name: "IVA Intermédio",
      rate: 13,
      description: "Taxa intermédia de IVA",
    },
    {
      code: "IVA_REDUCED",
      name: "IVA Reduzido",
      rate: 6,
      description: "Taxa reduzida de IVA",
    },
    {
      code: "IVA_EXEMPT",
      name: "Isento",
      rate: 0,
      description: "Isento de IVA",
    },
  ],
  defaultTaxRateCode: "IVA_STANDARD",
  createdAt: null as any,
  updatedAt: null as any,
};

export const SPAIN_REGION: Region = {
  id: "ES",
  code: "ES",
  name: "España",
  currency: "EUR",
  currencySymbol: "€",
  locale: "es-ES",
  dateFormat: "dd/MM/yyyy",
  taxRates: [
    {
      code: "IVA_GENERAL",
      name: "IVA General",
      rate: 21,
      description: "Tipo general de IVA",
    },
    {
      code: "IVA_REDUCED",
      name: "IVA Reducido",
      rate: 10,
      description: "Tipo reducido de IVA",
    },
    {
      code: "IVA_SUPER_REDUCED",
      name: "IVA Superreducido",
      rate: 4,
      description: "Tipo superreducido de IVA",
    },
  ],
  defaultTaxRateCode: "IVA_GENERAL",
  createdAt: null as any,
  updatedAt: null as any,
};

export const REGIONS: Record<string, Region> = {
  PT: PORTUGAL_REGION,
  ES: SPAIN_REGION,
};

export function getRegion(code: string): Region | undefined {
  return REGIONS[code];
}

export function getDefaultTaxRate(regionCode: string): number {
  const region = getRegion(regionCode);
  if (!region) return 23; // Default to Portuguese IVA

  const defaultRate = region.taxRates.find(
    (r) => r.code === region.defaultTaxRateCode
  );
  return defaultRate?.rate ?? 23;
}

export function getTaxRates(regionCode: string): TaxRate[] {
  const region = getRegion(regionCode);
  return region?.taxRates ?? PORTUGAL_REGION.taxRates;
}

export function formatCurrencyForRegion(
  amount: number,
  regionCode: string = "PT"
): string {
  const region = getRegion(regionCode) ?? PORTUGAL_REGION;
  return new Intl.NumberFormat(region.locale, {
    style: "currency",
    currency: region.currency,
  }).format(amount);
}

export function formatDateForRegion(
  date: Date | string,
  regionCode: string = "PT"
): string {
  const region = getRegion(regionCode) ?? PORTUGAL_REGION;
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(region.locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function formatNumberForRegion(
  value: number,
  regionCode: string = "PT",
  decimals: number = 2
): string {
  const region = getRegion(regionCode) ?? PORTUGAL_REGION;
  return new Intl.NumberFormat(region.locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

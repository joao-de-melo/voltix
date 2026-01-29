import { useState, useEffect } from "react";
import {
  Settings2,
  Zap,
  Cable,
  Battery,
  Sun,
  Cpu,
  Wrench,
  Package,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { getContractedPowerOptions } from "@/services/system-sizing";
import type {
  SystemSizingInput,
  RoofType,
  EnergyProfile,
  Site,
  ProductCategorySelection,
} from "@/types";

interface StepRequirementsProps {
  sizingInput: SystemSizingInput;
  onInputChange: (updates: Partial<SystemSizingInput>) => void;
  categorySelection: ProductCategorySelection;
  onCategoryChange: (updates: Partial<ProductCategorySelection>) => void;
  energyProfile: EnergyProfile | null;
  selectedSite: Site | null;
}

const ROOF_TYPE_OPTIONS: { value: RoofType; label: string }[] = [
  { value: "tile", label: "Tile Roof" },
  { value: "flat", label: "Flat Roof" },
  { value: "metal", label: "Metal Roof" },
  { value: "ground", label: "Ground Mount" },
];

type ConsumptionPeriod = "daily" | "weekly" | "monthly" | "annually";

const PERIOD_OPTIONS: { value: ConsumptionPeriod; label: string; multiplier: number }[] = [
  { value: "daily", label: "Daily", multiplier: 365 },
  { value: "weekly", label: "Weekly", multiplier: 52 },
  { value: "monthly", label: "Monthly", multiplier: 12 },
  { value: "annually", label: "Annually", multiplier: 1 },
];

const PERIOD_LABELS: Record<ConsumptionPeriod, string> = {
  daily: "kWh/day",
  weekly: "kWh/week",
  monthly: "kWh/month",
  annually: "kWh/year",
};

// Convert annual consumption to period value
function annualToPeriod(annualKwh: number, period: ConsumptionPeriod): number {
  const option = PERIOD_OPTIONS.find((p) => p.value === period);
  if (!option || annualKwh <= 0) return 0;
  return Math.round((annualKwh / option.multiplier) * 10) / 10;
}

// Convert period value to annual consumption
function periodToAnnual(value: number, period: ConsumptionPeriod): number {
  const option = PERIOD_OPTIONS.find((p) => p.value === period);
  if (!option || value <= 0) return 0;
  return Math.round(value * option.multiplier);
}

export function StepRequirements({
  sizingInput,
  onInputChange,
  categorySelection,
  onCategoryChange,
  energyProfile,
  selectedSite,
}: StepRequirementsProps) {
  const contractedPowerOptions = getContractedPowerOptions();

  // Local state for consumption input
  const [consumptionPeriod, setConsumptionPeriod] = useState<ConsumptionPeriod>("monthly");
  const [consumptionValue, setConsumptionValue] = useState<string>("");

  // Initialize consumption value from sizingInput
  useEffect(() => {
    if (sizingInput.annualConsumptionKwh > 0 && !consumptionValue) {
      const periodValue = annualToPeriod(sizingInput.annualConsumptionKwh, consumptionPeriod);
      setConsumptionValue(periodValue.toString());
    }
  }, [sizingInput.annualConsumptionKwh, consumptionPeriod, consumptionValue]);

  const handleConsumptionValueChange = (value: string) => {
    setConsumptionValue(value);
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0) {
      const annualKwh = periodToAnnual(num, consumptionPeriod);
      onInputChange({ annualConsumptionKwh: annualKwh });
    } else if (value === "") {
      onInputChange({ annualConsumptionKwh: 0 });
    }
  };

  const handlePeriodChange = (newPeriod: ConsumptionPeriod) => {
    // Convert current value to new period
    if (sizingInput.annualConsumptionKwh > 0) {
      const newValue = annualToPeriod(sizingInput.annualConsumptionKwh, newPeriod);
      setConsumptionValue(newValue.toString());
    }
    setConsumptionPeriod(newPeriod);
  };

  const handleDistanceChange = (value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0) {
      onInputChange({ cableDistanceM: num });
    }
  };

  const handleShadingChange = (value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0 && num <= 100) {
      onInputChange({ shadingFactor: num / 100 });
    }
  };

  // Get placeholder based on period
  const getPlaceholder = (): string => {
    switch (consumptionPeriod) {
      case "daily":
        return "e.g., 15";
      case "weekly":
        return "e.g., 100";
      case "monthly":
        return "e.g., 400";
      case "annually":
        return "e.g., 5000";
    }
  };

  return (
    <div className="space-y-6">
      {/* Consumption & Power */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Energy Consumption
          </CardTitle>
          <CardDescription>
            Enter the customer's electricity consumption
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="consumption">Consumption</Label>
            <div className="flex items-center gap-2">
              <Input
                id="consumption"
                type="number"
                min="0"
                step={consumptionPeriod === "daily" ? "1" : consumptionPeriod === "weekly" ? "10" : "50"}
                value={consumptionValue}
                onChange={(e) => handleConsumptionValueChange(e.target.value)}
                placeholder={getPlaceholder()}
                className="flex-1"
              />
              <Select
                value={consumptionPeriod}
                onValueChange={(v) => handlePeriodChange(v as ConsumptionPeriod)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {sizingInput.annualConsumptionKwh > 0 && consumptionPeriod !== "annually" && (
              <p className="text-sm text-muted-foreground">
                = {sizingInput.annualConsumptionKwh.toLocaleString()} kWh/year
              </p>
            )}
            {energyProfile && (
              <p className="text-sm text-muted-foreground">
                From energy profile: {energyProfile.annualConsumptionKwh.toLocaleString()} kWh/year
                {consumptionPeriod !== "annually" && (
                  <span>
                    {" "}({annualToPeriod(energyProfile.annualConsumptionKwh, consumptionPeriod)} {PERIOD_LABELS[consumptionPeriod]})
                  </span>
                )}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contracted-power">Contracted Power</Label>
            <Select
              value={sizingInput.contractedPowerKva.toString()}
              onValueChange={(v) =>
                onInputChange({ contractedPowerKva: parseFloat(v) })
              }
            >
              <SelectTrigger id="contracted-power">
                <SelectValue placeholder="Select contracted power" />
              </SelectTrigger>
              <SelectContent>
                {contractedPowerOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Limits the maximum inverter size
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Installation Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cable className="h-5 w-5" />
            Installation Details
          </CardTitle>
          <CardDescription>
            Configure installation parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="distance">Cable Distance (m)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="distance"
                type="number"
                min="0"
                max="200"
                step="1"
                value={sizingInput.cableDistanceM || ""}
                onChange={(e) => handleDistanceChange(e.target.value)}
                placeholder="e.g., 15"
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground">meters</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Distance from panels to inverter/distribution board
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="roof-type">Roof Type</Label>
            <Select
              value={sizingInput.roofType || "tile"}
              onValueChange={(v) => onInputChange({ roofType: v as RoofType })}
            >
              <SelectTrigger id="roof-type">
                <SelectValue placeholder="Select roof type" />
              </SelectTrigger>
              <SelectContent>
                {ROOF_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSite?.roofType && (
              <p className="text-sm text-muted-foreground">
                From site: {selectedSite.roofType}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="shading">Shading Factor (%)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="shading"
                type="number"
                min="0"
                max="100"
                step="5"
                value={
                  sizingInput.shadingFactor
                    ? Math.round(sizingInput.shadingFactor * 100)
                    : 85
                }
                onChange={(e) => handleShadingChange(e.target.value)}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Percentage of sunlight reaching panels (100% = no shading)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Battery Option */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Battery className="h-5 w-5" />
            Battery Storage
          </CardTitle>
          <CardDescription>
            Add battery storage for energy independence
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="battery-toggle">Include Battery</Label>
              <p className="text-sm text-muted-foreground">
                Auto-sized based on evening consumption
              </p>
            </div>
            <Switch
              id="battery-toggle"
              checked={sizingInput.includeBattery}
              onCheckedChange={(checked) =>
                onInputChange({ includeBattery: checked })
              }
            />
          </div>
          {sizingInput.includeBattery && (
            <div className="mt-4 rounded-lg border border-blue-300 bg-blue-100 p-3 dark:border-blue-700 dark:bg-blue-950">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Battery will be sized automatically based on 30% of daily
                consumption for evening use.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Categories
          </CardTitle>
          <CardDescription>
            Select which product types to include in the quote
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Equipment */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Equipment</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    id="cat-panels"
                    checked={categorySelection.panels}
                    onCheckedChange={(checked) =>
                      onCategoryChange({ panels: checked === true })
                    }
                  />
                  <Sun className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Solar Panels</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    id="cat-inverter"
                    checked={categorySelection.inverter}
                    onCheckedChange={(checked) =>
                      onCategoryChange({ inverter: checked === true })
                    }
                  />
                  <Cpu className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Inverter</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    id="cat-battery"
                    checked={categorySelection.battery}
                    disabled={!sizingInput.includeBattery}
                    onCheckedChange={(checked) =>
                      onCategoryChange({ battery: checked === true })
                    }
                  />
                  <Battery className="h-4 w-4 text-muted-foreground" />
                  <span className={`text-sm ${!sizingInput.includeBattery ? "text-muted-foreground" : ""}`}>
                    Battery {!sizingInput.includeBattery && "(enable above)"}
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    id="cat-mounting"
                    checked={categorySelection.mounting}
                    onCheckedChange={(checked) =>
                      onCategoryChange({ mounting: checked === true })
                    }
                  />
                  <Settings2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Mounting System</span>
                </label>
              </div>
            </div>

            {/* Accessories & Services */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Accessories & Services</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    id="cat-dc-cable"
                    checked={categorySelection.dcCable}
                    onCheckedChange={(checked) =>
                      onCategoryChange({ dcCable: checked === true })
                    }
                  />
                  <Cable className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">DC Cable</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    id="cat-ac-cable"
                    checked={categorySelection.acCable}
                    onCheckedChange={(checked) =>
                      onCategoryChange({ acCable: checked === true })
                    }
                  />
                  <Cable className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">AC Cable</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    id="cat-labor"
                    checked={categorySelection.labor}
                    onCheckedChange={(checked) =>
                      onCategoryChange({ labor: checked === true })
                    }
                  />
                  <Wrench className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Installation Labor</span>
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Quick Reference
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h4 className="text-sm font-medium mb-2">Typical Consumption ({consumptionPeriod})</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                {consumptionPeriod === "daily" && (
                  <>
                    <div>Small apartment: 5-8 kWh</div>
                    <div>Family home: 11-16 kWh</div>
                    <div>Large home/pool: 22-33 kWh</div>
                  </>
                )}
                {consumptionPeriod === "weekly" && (
                  <>
                    <div>Small apartment: 38-58 kWh</div>
                    <div>Family home: 77-115 kWh</div>
                    <div>Large home/pool: 154-231 kWh</div>
                  </>
                )}
                {consumptionPeriod === "monthly" && (
                  <>
                    <div>Small apartment: 165-250 kWh</div>
                    <div>Family home: 335-500 kWh</div>
                    <div>Large home/pool: 665-1,000 kWh</div>
                  </>
                )}
                {consumptionPeriod === "annually" && (
                  <>
                    <div>Small apartment: 2,000-3,000 kWh</div>
                    <div>Family home: 4,000-6,000 kWh</div>
                    <div>Large home/pool: 8,000-12,000 kWh</div>
                  </>
                )}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Common Power Contracts</h4>
              <div className="flex flex-wrap gap-1">
                {contractedPowerOptions.slice(0, 4).map((opt) => (
                  <Badge key={opt.value} variant="outline">
                    {opt.label}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

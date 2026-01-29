import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useOrganization } from "@/contexts/organization-context";
import { createProduct, updateProduct } from "@/services/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Product } from "@/types";

const productSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  sku: z.string().min(1, "SKU is required"),
  description: z.string().optional(),
  category: z.enum([
    "solar_panel",
    "inverter",
    "battery",
    "mounting",
    "labor",
    "accessory",
    "other",
  ]),
  unitPrice: z.number().min(0, "Price must be positive"),
  unit: z.string().min(1, "Unit is required"),
  taxRate: z.number().min(0).max(100),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  wattage: z.number().optional(),
  efficiency: z.number().optional(),
  warrantyYears: z.number().optional(),
  powerRating: z.number().optional(),
  mpptChannels: z.number().optional(),
  inverterType: z.enum(["string", "micro", "hybrid"]).optional(),
  capacityKwh: z.number().optional(),
  cycles: z.number().optional(),
  chemistry: z.enum(["lithium_ion", "lfp", "lead_acid"]).optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  product?: Product;
}

export function ProductForm({ product }: ProductFormProps) {
  const navigate = useNavigate();
  const { organization } = useOrganization();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || "",
      sku: product?.sku || "",
      description: product?.description || "",
      category: product?.category || "solar_panel",
      unitPrice: product?.unitPrice || 0,
      unit: product?.unit || "unit",
      taxRate: product?.taxRate ?? 23,
      manufacturer: product?.manufacturer || "",
      model: product?.model || "",
      wattage: (product?.specs as Record<string, number>)?.wattage,
      efficiency: (product?.specs as Record<string, number>)?.efficiency,
      warrantyYears: (product?.specs as Record<string, number>)?.warrantyYears,
      powerRating: (product?.specs as Record<string, number>)?.powerRating,
      mpptChannels: (product?.specs as Record<string, number>)?.mpptChannels,
      inverterType: (product?.specs as Record<string, string>)?.type as "string" | "micro" | "hybrid" | undefined,
      capacityKwh: (product?.specs as Record<string, number>)?.capacityKwh,
      cycles: (product?.specs as Record<string, number>)?.cycles,
      chemistry: (product?.specs as Record<string, string>)?.chemistry as "lithium_ion" | "lfp" | "lead_acid" | undefined,
    },
  });

  const category = form.watch("category");

  const onSubmit = async (data: ProductFormData) => {
    if (!organization?.id) return;

    setIsSubmitting(true);
    try {
      let specs: Record<string, unknown> = {};

      if (data.category === "solar_panel") {
        specs = {
          wattage: data.wattage,
          efficiency: data.efficiency,
          warrantyYears: data.warrantyYears,
        };
      } else if (data.category === "inverter") {
        specs = {
          type: data.inverterType,
          powerRating: data.powerRating,
          mpptChannels: data.mpptChannels,
          warrantyYears: data.warrantyYears,
        };
      } else if (data.category === "battery") {
        specs = {
          chemistry: data.chemistry,
          capacityKwh: data.capacityKwh,
          cycles: data.cycles,
          warrantyYears: data.warrantyYears,
        };
      }

      const productData = {
        name: data.name,
        sku: data.sku,
        description: data.description,
        category: data.category,
        unitPrice: data.unitPrice,
        unit: data.unit,
        taxRate: data.taxRate,
        manufacturer: data.manufacturer,
        model: data.model,
        isActive: true,
        specs,
      };

      if (product) {
        await updateProduct(organization.id, product.id, productData);
        toast.success("Product updated successfully");
      } else {
        await createProduct(organization.id, productData as Parameters<typeof createProduct>[1]);
        toast.success("Product created successfully");
      }

      navigate("/products");
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Failed to save product");
    } finally {
      setIsSubmitting(false);
    }
  };

  const NumberInput = ({ field, placeholder }: { field: { value: number | undefined; onChange: (v: number | undefined) => void }; placeholder?: string }) => (
    <Input
      type="number"
      step="0.01"
      placeholder={placeholder}
      value={field.value ?? ""}
      onChange={(e) => {
        const val = e.target.value;
        field.onChange(val === "" ? undefined : parseFloat(val));
      }}
    />
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input placeholder="JA Solar 550W Panel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input placeholder="JAS-550-MONO" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Product description..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="manufacturer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Manufacturer</FormLabel>
                    <FormControl>
                      <Input placeholder="JA Solar" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model</FormLabel>
                    <FormControl>
                      <Input placeholder="JAM72D30-550/MB" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="solar_panel">Solar Panels</SelectItem>
                      <SelectItem value="inverter">Inverters</SelectItem>
                      <SelectItem value="battery">Batteries</SelectItem>
                      <SelectItem value="mounting">Mounting Systems</SelectItem>
                      <SelectItem value="labor">Labor & Services</SelectItem>
                      <SelectItem value="accessory">Accessories</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="unitPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Price (EUR)</FormLabel>
                    <FormControl>
                      <NumberInput field={field} placeholder="0.00" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="unit">Unit</SelectItem>
                        <SelectItem value="kW">kW</SelectItem>
                        <SelectItem value="kWh">kWh</SelectItem>
                        <SelectItem value="m2">m2</SelectItem>
                        <SelectItem value="hour">Hour</SelectItem>
                        <SelectItem value="day">Day</SelectItem>
                        <SelectItem value="fixed">Fixed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="taxRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax Rate (%)</FormLabel>
                    <FormControl>
                      <NumberInput field={field} placeholder="23" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {category === "solar_panel" && (
          <Card>
            <CardHeader>
              <CardTitle>Solar Panel Specifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="wattage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wattage (W)</FormLabel>
                      <FormControl>
                        <NumberInput field={field} placeholder="550" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="efficiency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Efficiency (%)</FormLabel>
                      <FormControl>
                        <NumberInput field={field} placeholder="21.5" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="warrantyYears"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Warranty (years)</FormLabel>
                      <FormControl>
                        <NumberInput field={field} placeholder="25" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {category === "inverter" && (
          <Card>
            <CardHeader>
              <CardTitle>Inverter Specifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="inverterType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="string">String</SelectItem>
                          <SelectItem value="micro">Micro</SelectItem>
                          <SelectItem value="hybrid">Hybrid</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="powerRating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Power Rating (kW)</FormLabel>
                      <FormControl>
                        <NumberInput field={field} placeholder="5.0" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mpptChannels"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>MPPT Channels</FormLabel>
                      <FormControl>
                        <NumberInput field={field} placeholder="2" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="warrantyYears"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Warranty (years)</FormLabel>
                    <FormControl>
                      <NumberInput field={field} placeholder="10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        {category === "battery" && (
          <Card>
            <CardHeader>
              <CardTitle>Battery Specifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="chemistry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chemistry</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select chemistry" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="lithium_ion">Lithium Ion</SelectItem>
                          <SelectItem value="lfp">LFP (LiFePO4)</SelectItem>
                          <SelectItem value="lead_acid">Lead Acid</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="capacityKwh"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacity (kWh)</FormLabel>
                      <FormControl>
                        <NumberInput field={field} placeholder="10.0" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cycles"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cycles</FormLabel>
                      <FormControl>
                        <NumberInput field={field} placeholder="6000" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="warrantyYears"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Warranty (years)</FormLabel>
                    <FormControl>
                      <NumberInput field={field} placeholder="10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate("/products")}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : product ? "Update Product" : "Create Product"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

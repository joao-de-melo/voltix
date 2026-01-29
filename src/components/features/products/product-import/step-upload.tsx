import { useCallback, useState } from "react";
import { Upload, Download, FileSpreadsheet, AlertCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { generateCsvTemplateBlob } from "@/services/product-import";

interface StepUploadProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
  error: string | null;
}

export function StepUpload({ onFileSelect, isProcessing, error }: StepUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDownloadTemplate = () => {
    const blob = generateCsvTemplateBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "product-import-template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && (file.name.endsWith(".csv") || file.name.endsWith(".xlsx"))) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  return (
    <div className="space-y-6">
      {/* Template Download */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Download Template
          </CardTitle>
          <CardDescription>
            Start by downloading the CSV template with the correct column format
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Product Import Template</p>
              <p className="text-sm text-muted-foreground">
                CSV file with example products and all required columns
              </p>
            </div>
            <Button variant="outline" onClick={handleDownloadTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Download CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload File
          </CardTitle>
          <CardDescription>
            Upload your CSV file with product data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50"
            } ${isProcessing ? "opacity-50 pointer-events-none" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".csv"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isProcessing}
            />
            <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-1">
              {isProcessing ? "Processing..." : "Drop your file here"}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              Supported format: CSV
            </p>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-300 bg-red-100 p-4 dark:border-red-700 dark:bg-red-950">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                <p className="text-sm font-medium text-red-900 dark:text-red-100">
                  {error}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Download the CSV template above</li>
            <li>Fill in your product data following the column format</li>
            <li>
              Required columns: <code className="text-xs bg-muted px-1 py-0.5 rounded">name</code>,{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">sku</code>,{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">category</code>,{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">unitPrice</code>,{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">unit</code>,{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">taxRate</code>
            </li>
            <li>
              Valid categories:{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">solar_panel</code>,{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">inverter</code>,{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">battery</code>,{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">mounting</code>,{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">labor</code>,{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">accessory</code>,{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">other</code>
            </li>
            <li>Upload your completed CSV file</li>
            <li>Review and fix any validation errors</li>
            <li>Import valid products</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

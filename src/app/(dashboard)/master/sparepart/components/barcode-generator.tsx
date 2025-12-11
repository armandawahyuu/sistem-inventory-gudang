"use client";

import { useRef } from "react";
import Barcode from "react-barcode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Printer } from "lucide-react";

interface BarcodeGeneratorProps {
    code: string;
    name: string;
}

export function BarcodeGenerator({ code, name }: BarcodeGeneratorProps) {
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        if (!printRef.current) return;

        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        printWindow.document.write(`
      <html>
        <head>
          <title>Print Barcode - ${code}</title>
          <style>
            @media print {
              @page { margin: 0; }
              body { margin: 1cm; }
            }
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            .label {
              text-align: center;
              border: 1px solid #ddd;
              padding: 16px;
              max-width: 300px;
            }
            .name {
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 8px;
            }
            .code {
              font-size: 12px;
              color: #666;
              margin-top: 8px;
            }
          </style>
        </head>
        <body>
          <div class="label">
            ${printRef.current.innerHTML}
          </div>
        </body>
      </html>
    `);

        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>Barcode</span>
                    <Button onClick={handlePrint} size="sm">
                        <Printer className="mr-2 h-4 w-4" />
                        Print Label
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div ref={printRef} className="flex flex-col items-center gap-2">
                    <p className="text-sm font-semibold text-center">{name}</p>
                    <Barcode value={code} width={2} height={60} fontSize={12} />
                    <p className="text-xs text-slate-500">{code}</p>
                </div>
            </CardContent>
        </Card>
    );
}

"use client";

import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import Barcode from "react-barcode";
import Link from "next/link";

interface Sparepart {
    id: string;
    code: string;
    name: string;
    category: { name: string };
}

export default function PrintBarcodePage() {
    const [spareparts, setSpareparts] = useState<Sparepart[]>([]);
    const [selected, setSelected] = useState<string[]>([]);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetchSpareparts();
    }, []);

    const fetchSpareparts = async () => {
        try {
            const response = await fetch("/api/master/sparepart?limit=100");
            const result = await response.json();
            if (response.ok) {
                setSpareparts(result.data);
            }
        } catch (error) {
            console.error("Error fetching spareparts:", error);
        }
    };

    const toggleSelect = (id: string) => {
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const handlePrint = () => {
        window.print();
    };

    const filteredSpareparts = spareparts.filter(
        (sp) =>
            sp.code.toLowerCase().includes(search.toLowerCase()) ||
            sp.name.toLowerCase().includes(search.toLowerCase())
    );

    const selectedSpareparts = spareparts.filter((sp) => selected.includes(sp.id));

    return (
        <div className="space-y-6">
            <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area,
          .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
          .barcode-label {
            page-break-inside: avoid;
            break-inside: avoid;
            margin-bottom: 1cm;
          }
        }
      `}</style>

            {/* Header - No Print */}
            <div className="no-print flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Print Barcode</h1>
                    <p className="text-slate-600 mt-1">
                        Pilih sparepart untuk print label barcode
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href="/master/sparepart">
                        <Button variant="outline">Kembali</Button>
                    </Link>
                    <Button onClick={handlePrint} disabled={selected.length === 0}>
                        Print {selected.length > 0 && `(${selected.length})`}
                    </Button>
                </div>
            </div>

            {/* Selection Area - No Print */}
            <div className="no-print grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Pilih Sparepart</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Input
                            placeholder="Cari kode atau nama..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="mb-4"
                        />
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {filteredSpareparts.map((sp) => (
                                <div
                                    key={sp.id}
                                    className="flex items-center space-x-2 p-2 border rounded hover:bg-slate-50 cursor-pointer"
                                    onClick={() => toggleSelect(sp.id)}
                                >
                                    <Checkbox
                                        checked={selected.includes(sp.id)}
                                        onCheckedChange={() => toggleSelect(sp.id)}
                                    />
                                    <div className="flex-1">
                                        <p className="font-mono text-sm">{sp.code}</p>
                                        <p className="text-sm text-slate-600">{sp.name}</p>
                                    </div>
                                    {selected.includes(sp.id) && (
                                        <Check className="h-4 w-4 text-green-600" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Preview ({selected.length} item)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                            {selectedSpareparts.map((sp) => (
                                <div key={sp.id} className="border rounded p-4 text-center">
                                    <p className="text-sm font-semibold mb-2">{sp.name}</p>
                                    <Barcode value={sp.code} width={1.5} height={40} fontSize={10} />
                                    <p className="text-xs text-slate-500 mt-1">{sp.code}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Print Area */}
            <div className="print-area hidden print:block">
                <div className="grid grid-cols-2 gap-8" style={{ padding: "1cm" }}>
                    {selectedSpareparts.map((sp) => (
                        <div key={sp.id} className="barcode-label border-2 border-black p-4 text-center">
                            <p className="text-base font-bold mb-3">{sp.name}</p>
                            <div className="flex justify-center">
                                <Barcode value={sp.code} width={2} height={60} fontSize={12} />
                            </div>
                            <p className="text-sm mt-2">{sp.code}</p>
                            <p className="text-xs text-gray-600">{sp.category.name}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

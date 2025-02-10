"use client";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { MachineryType, JCBSubtype, SLMSubtype, JCBPartType } from "@prisma/client";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";
import { addMachinery } from "./actions";

interface AddMachineryPageProps {
  params: {
    id: string;
  };
}

const machineryTypeLabels: Record<MachineryType, string> = {
  JCB: "JCB",
  SLM: "SLM",
};

const jcbSubtypeLabels: Record<JCBSubtype, string> = {
  BACKHOE: "Backhoe",
  PROCLAIM_81: "Proclaim 81",
  PROCLAIM_140: "Proclaim 140",
  PROCLAIM_210: "Proclaim 210",
};

const jcbPartTypeLabels: Record<JCBPartType, string> = {
  BUCKET: "Bucket",
  BRAKES: "Brakes",
};

const slmSubtypeLabels: Record<SLMSubtype, string> = {
  SLM_4_3: "SLM 4.3",
  SLM_2_2: "SLM 2.2",
  SLM_2_1: "SLM 2.1",
  MANUAL_MIXER: "Manual Mixer",
};

export default function AddMachineryPage({ params }: AddMachineryPageProps) {
  const [selectedType, setSelectedType] = useState<MachineryType | null>(null);
  const [selectedJCBSubtype, setSelectedJCBSubtype] = useState<JCBSubtype | null>(null);

  return (
    <div className="p-4 sm:p-8">
      <Card className="bg-white/[0.34] border-0 shadow-none max-w-2xl mx-auto">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold">
            Add Machinery Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={addMachinery} className="space-y-6">
            <input type="hidden" name="projectId" value={params.id} />

            <div className="space-y-2">
              <Label htmlFor="type">Machinery Type</Label>
              <Select
                name="type"
                required
                onValueChange={(value) => {
                  setSelectedType(value as MachineryType);
                  setSelectedJCBSubtype(null);
                }}
              >
                <SelectTrigger className="bg-white/[0.15]">
                  <SelectValue placeholder="Select machinery type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(machineryTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedType === "JCB" && (
              <div className="space-y-2">
                <Label htmlFor="jcbSubtype">JCB Model</Label>
                <Select
                  name="jcbSubtype"
                  required
                  onValueChange={(value) => setSelectedJCBSubtype(value as JCBSubtype)}
                >
                  <SelectTrigger className="bg-white/[0.15]">
                    <SelectValue placeholder="Select JCB model" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(jcbSubtypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedType === "JCB" && selectedJCBSubtype && (
              <div className="space-y-2">
                <Label htmlFor="jcbPartType">Part Type</Label>
                <Select name="jcbPartType" required>
                  <SelectTrigger className="bg-white/[0.15]">
                    <SelectValue placeholder="Select part type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(jcbPartTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedType === "SLM" && (
              <div className="space-y-2">
                <Label htmlFor="slmSubtype">SLM Model</Label>
                <Select name="slmSubtype" required>
                  <SelectTrigger className="bg-white/[0.15]">
                    <SelectValue placeholder="Select SLM model" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(slmSubtypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="hoursUsed">Hours Used</Label>
              <Input
                id="hoursUsed"
                name="hoursUsed"
                type="number"
                step="0.5"
                required
                className="bg-white/[0.15]"
                placeholder="Enter hours used"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hourlyRate">Hourly Rate</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  ₹
                </span>
                <Input
                  id="hourlyRate"
                  name="hourlyRate"
                  type="number"
                  step="0.01"
                  required
                  className="bg-white/[0.15] pl-7"
                  placeholder="Enter hourly rate"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-white/[0.15]"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    <input
                      type="date"
                      name="date"
                      required
                      className="bg-transparent border-none outline-none w-full"
                    />
                  </Button>
                </PopoverTrigger>
              </Popover>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#060606] text-white hover:bg-white hover:text-[#E65F2B] transition-colors"
            >
              Add Machinery Usage
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

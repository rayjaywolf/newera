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
import { MaterialType } from "@prisma/client";
import { generateMaterialId } from "@/lib/id-generators";

interface AddMaterialPageProps {
  params: {
    id: string;
  };
}

const materialTypeLabels: Record<MaterialType, string> = {
  STEEL: "Steel",
  CEMENT: "Cement",
  SAND: "Sand",
  GRIT_10MM: "Grit (10mm)",
  GRIT_20MM: "Grit (20mm)",
  GRIT_40MM: "Grit (40mm)",
  BRICK: "Brick",
  STONE: "Stone",
  WATER: "Water",
};

async function addMaterial(formData: FormData) {
  "use server";

  const projectId = formData.get("projectId") as string;
  const type = formData.get("type") as MaterialType;
  const volume = parseFloat(formData.get("volume") as string);
  const cost = parseFloat(formData.get("cost") as string);

  await prisma.materialUsage.create({
    data: {
      id: generateMaterialId(type),
      type,
      volume,
      cost,
      projectId,
      date: new Date(),
    },
  });

  redirect(`/projects/${projectId}/materials`);
}

export default function AddMaterialPage({ params }: AddMaterialPageProps) {
  return (
    <div className="p-4 sm:p-8">
      <Card className="bg-white/[0.34] border-0 shadow-none max-w-2xl mx-auto">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold">Add Material</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={addMaterial} className="space-y-6">
            <input type="hidden" name="projectId" value={params.id} />

            <div className="space-y-2">
              <Label htmlFor="type">Material Type</Label>
              <Select name="type" required>
                <SelectTrigger className="bg-white/[0.15]">
                  <SelectValue placeholder="Select material type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(materialTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="volume">Volume</Label>
              <Input
                id="volume"
                name="volume"
                type="number"
                step="0.01"
                required
                className="bg-white/[0.15]"
                placeholder="Enter volume"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost">Cost</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  ₹
                </span>
                <Input
                  id="cost"
                  name="cost"
                  type="number"
                  step="0.01"
                  required
                  className="bg-white/[0.15] pl-7"
                  placeholder="Enter cost"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#060606] text-white hover:bg-white hover:text-[#E65F2B] transition-colors"
            >
              Add Material
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

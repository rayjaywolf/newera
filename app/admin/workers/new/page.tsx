"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { UploadPhotoDialog } from "@/components/workers/upload-photo-dialog";

export default function NewAdminWorkerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    dailyIncome: "",
    phoneNumber: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/admin/workers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to create worker");

      const worker = await response.json();
      toast.success("Worker created successfully");
      router.push("/admin/workers");
    } catch (error) {
      console.error("Error creating worker:", error);
      toast.error("Failed to create worker");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-8">
      <Card className="max-w-2xl mx-auto bg-white/[0.34] border-0 shadow-none">
        <CardHeader>
          <CardTitle>Add New Admin Worker</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Worker Type</Label>
              <Select
                required
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select worker type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ENGINEER">Engineer</SelectItem>
                  <SelectItem value="DRIVER">Driver</SelectItem>
                  <SelectItem value="MACHINERY_OPERATOR">
                    Machinery Operator
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dailyIncome">Daily Income (₹)</Label>
              <Input
                id="dailyIncome"
                type="number"
                required
                value={formData.dailyIncome}
                onChange={(e) =>
                  setFormData({ ...formData, dailyIncome: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) =>
                  setFormData({ ...formData, phoneNumber: e.target.value })
                }
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white hover:bg-white hover:text-[#E65F2B] transition-colors"
            >
              {loading ? "Creating..." : "Create Worker"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

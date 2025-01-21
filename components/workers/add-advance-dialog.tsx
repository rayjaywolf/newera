"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface AddAdvanceDialogProps {
  workerId: string;
  projectId: string;
  onAdvanceAdded: () => void;
}

export function AddAdvanceDialog({
  workerId,
  projectId,
  onAdvanceAdded,
}: AddAdvanceDialogProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/workers/${workerId}/advances`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          amount: parseFloat(amount),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add advance");
      }

      toast.success("Advance added successfully");

      setOpen(false);
      setAmount("");
      onAdvanceAdded();
    } catch (error) {
      toast.error("Failed to add advance");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="bg-black text-white font-semibold hover:bg-white hover:text-[#E65F2B] transition-colors"
          size="sm"
        >
          <Plus className="h-4 w-4 mr" />
          Add Advance
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-[#EBDFD7] border-0">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Add Advance
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              Add a new advance payment for the worker
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-left font-medium">
                Amount (₹)
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-black text-white font-semibold hover:bg-white hover:text-[#E65F2B] transition-colors"
            >
              {isSubmitting ? "Adding..." : "Add Advance"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

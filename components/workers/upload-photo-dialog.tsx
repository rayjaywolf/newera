"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

interface UploadPhotoDialogProps {
  workerId: string;
  projectId: string;
  workerName: string;
  onPhotoUploaded: () => void;
  trigger?: React.ReactNode;
}

export function UploadPhotoDialog({
  workerId,
  projectId,
  workerName,
  onPhotoUploaded,
  trigger
}: UploadPhotoDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUpload = async () => {
    if (!photoFile) return;

    setLoading(true);
    try {
      // 1. Upload to Vercel Blob
      const filename = `${projectId}/${Date.now()}-${photoFile.name}`;
      const response = await fetch(
        `/api/uploadImage?filename=${encodeURIComponent(filename)}&id=${projectId}&type=worker`,
        {
          method: "POST",
          body: photoFile,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to upload photo");
      }

      const { url } = await response.json();

      // 2. Index face in AWS Rekognition
      const faceFormData = new FormData();
      faceFormData.append("photo", photoFile);
      faceFormData.append("workerId", workerId);

      const faceResponse = await fetch("/api/workers/index-face", {
        method: "POST",
        body: faceFormData,
      });

      if (!faceResponse.ok) {
        console.error("Failed to index face:", await faceResponse.text());
        throw new Error("Failed to process face recognition");
      }

      const { faceId } = await faceResponse.json();

      // 3. Update worker with photo URL and faceId
      const updateResponse = await fetch(`/api/workers/${workerId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ photoUrl: url, faceId }),
      });

      if (!updateResponse.ok) {
        throw new Error("Failed to update worker");
      }

      toast.success("Profile photo uploaded successfully");
      onPhotoUploaded();
      setOpen(false);
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error("Failed to upload profile photo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Avatar className="h-20 w-20 cursor-pointer hover:opacity-80 transition-opacity">
            <AvatarFallback className="bg-black/[0.08] text-gray-500 text-2xl">
              {getInitials(workerName)}
            </AvatarFallback>
          </Avatar>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Profile Photo</DialogTitle>
          <DialogDescription>
            Upload a clear photo of the worker's face for attendance tracking.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="flex justify-center">
            {previewUrl ? (
              <Avatar className="h-32 w-32">
                <AvatarImage src={previewUrl} alt="Preview" />
                <AvatarFallback className="bg-black/[0.08] text-gray-500 text-3xl">
                  {getInitials(workerName)}
                </AvatarFallback>
              </Avatar>
            ) : (
              <Avatar className="h-32 w-32">
                <AvatarFallback className="bg-black/[0.08] text-gray-500 text-3xl">
                  {getInitials(workerName)}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
          <div className="space-y-2">
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            <p className="text-sm text-muted-foreground text-center">
              Supported formats: JPG, PNG. Max size: 5MB
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-black/20 hover:border-black transition-colors"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!photoFile || loading}
              className="bg-black text-white hover:bg-white hover:text-[#E65F2B] transition-colors"
            >
              {loading ? "Uploading..." : "Upload Photo"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 
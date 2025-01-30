"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { ImagePlus, Upload, Maximize2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageViewer } from "@/components/gallery/image-viewer";
import { ImageCardSkeleton } from "@/components/gallery/image-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProjectImage {
  id: string;
  url: string;
  filename: string;
  createdAt: string;
}

interface GroupedImages {
  [key: string]: ProjectImage[];
}

export default function GalleryPage() {
  const [images, setImages] = useState<ProjectImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [imageToDelete, setImageToDelete] = useState<ProjectImage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { id } = useParams();
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchImages();
    }
  }, [id]);

  const fetchImages = async () => {
    try {
      const response = await fetch(`/api/projects/${id}/images`);
      if (!response.ok) {
        throw new Error(`Failed to fetch images: ${response.statusText}`);
      }
      const data = await response.json();
      setImages(data);
    } catch (error) {
      console.error("Error fetching images:", error);
      toast({
        title: "Error",
        description: "Failed to fetch images",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setIsUploading(true);
    const file = e.target.files[0];
    const filename = `${id}/${Date.now()}-${file.name}`;

    try {
      const response = await fetch(
        `/api/uploadImage?filename=${encodeURIComponent(filename)}&id=${id}`,
        {
          method: "POST",
          body: file,
        }
      );

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      setImages((prev) => [data.image, ...prev]);

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (imageId: string) => {
    try {
      const response = await fetch(`/api/projects/${id}/images/${imageId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete image");
      }

      setImages((prev) => prev.filter((img) => img.id !== imageId));
      toast({
        title: "Success",
        description: "Image deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting image:", error);
      toast({
        title: "Error",
        description: "Failed to delete image",
        variant: "destructive",
      });
      throw error;
    }
  };

  const confirmDelete = async () => {
    if (!imageToDelete || isDeleting) return;

    setIsDeleting(true);
    try {
      await handleDelete(imageToDelete.id);
      setImageToDelete(null);
    } catch (error) {
      // Error already handled in handleDelete
    } finally {
      setIsDeleting(false);
    }
  };

  const groupImagesByDate = (images: ProjectImage[]): GroupedImages => {
    return images.reduce((groups: GroupedImages, image) => {
      const date = new Date(image.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(image);
      return groups;
    }, {});
  };

  const findImageIndexInAllImages = (image: ProjectImage): number => {
    return images.findIndex((img) => img.id === image.id);
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-8">
        <Card className="bg-white/[0.34] border-0 shadow-none">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded bg-black/[0.08]" />
                  <Skeleton className="h-7 w-32 bg-black/[0.08]" />
                </div>
                <Skeleton className="h-4 w-48 bg-black/[0.08]" />
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-[300px] bg-black/[0.08]" />
                <Skeleton className="h-10 w-32 bg-black/[0.08]" />
              </div>
            </div>
          </CardHeader>
        </Card>

        {[...Array(2)].map((_, groupIndex) => (
          <Card
            key={groupIndex}
            className="bg-white/[0.34] border-0 shadow-none"
          >
            <CardHeader className="pb-4">
              <Skeleton className="h-6 w-48 bg-black/[0.08]" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, index) => (
                  <ImageCardSkeleton key={index} />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const groupedImages = groupImagesByDate(images);

  return (
    <div className="p-8 space-y-8">
      <AlertDialog
        open={imageToDelete !== null}
        onOpenChange={(open) => !open && setImageToDelete(null)}
      >
        <AlertDialogContent className="bg-[#EBDFD7]">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              image.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="bg-white/[0.34] border-0 shadow-none">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <ImagePlus className="h-5 w-5 text-[#E65F2B]" />
                Project Gallery
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                Upload and manage project images
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                disabled={isUploading}
                className="max-w-[300px] bg-white/[0.15] border-[rgba(0,0,0,0.08)]"
                id="image-upload"
              />
              <Button
                onClick={() => document.getElementById("image-upload")?.click()}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md bg-[#060606] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-white hover:text-[#E65F2B] transition-colors",
                  isUploading && "opacity-50 cursor-not-allowed"
                )}
                disabled={isUploading}
              >
                <Upload className="h-4 w-4" />
                {isUploading ? "Uploading..." : "Upload Image"}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {Object.entries(groupedImages).map(([date, dateImages]) => (
        <Card key={date} className="bg-white/[0.34] border-0 shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-medium text-gray-700">
              {date}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dateImages.map((image) => (
                <div
                  key={image.id}
                  className="group relative rounded-lg overflow-hidden bg-white/[0.15] border border-[rgba(0,0,0,0.08)] hover:bg-white/[0.25] transition-colors"
                >
                  <div
                    className="relative aspect-video cursor-pointer"
                    onClick={() =>
                      setSelectedImage(findImageIndexInAllImages(image))
                    }
                  >
                    <Image
                      src={image.url}
                      alt={image.filename}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <Maximize2 className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <div className="p-3 flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-700 truncate">
                        {image.filename}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(image.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImageToDelete(image);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {images.length === 0 && (
        <Card className="bg-white/[0.34] border-0 shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ImagePlus className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">No images uploaded yet</p>
            <p className="text-gray-400 text-sm mt-1">
              Upload images to get started
            </p>
          </CardContent>
        </Card>
      )}

      {selectedImage !== null && (
        <ImageViewer
          images={images}
          currentImage={selectedImage}
          isOpen={selectedImage !== null}
          onClose={() => setSelectedImage(null)}
          onNavigate={setSelectedImage}
          onDelete={handleDelete}
          projectId={id as string}
        />
      )}
    </div>
  );
}

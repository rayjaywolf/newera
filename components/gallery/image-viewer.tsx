import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Download,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
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
import { useToast } from "@/components/ui/use-toast";

interface ImageViewerProps {
  images: Array<{
    id: string;
    url: string;
    filename: string;
    createdAt: string;
  }>;
  currentImage: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onDelete: (imageId: string) => Promise<void>;
  projectId: string;
}

export function ImageViewer({
  images,
  currentImage,
  isOpen,
  onClose,
  onNavigate,
  onDelete,
  projectId,
}: ImageViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
  }, [currentImage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' && currentImage > 0) {
      onNavigate(currentImage - 1);
    } else if (e.key === 'ArrowRight' && currentImage < images.length - 1) {
      onNavigate(currentImage + 1);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(images[currentImage].url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = images[currentImage].filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;

    setIsDeleting(true);
    try {
      await onDelete(images[currentImage].id);
      setShowDeleteDialog(false);
      
      // If it's the last image, close the viewer
      if (images.length === 1) {
        onClose();
      } else if (currentImage === images.length - 1) {
        // If it's the last image in the array, go to previous image
        onNavigate(currentImage - 1);
      }
      // Otherwise, the parent will update the images array and the current image will change automatically
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete image",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the image.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className="max-w-[95vw] h-[90vh] p-0 bg-black/95 border-none"
          onKeyDown={handleKeyDown}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/80 to-transparent z-40 flex items-center justify-between px-4">
              <div className="flex items-center gap-2 text-white/90">
                <ImageIcon className="h-5 w-5" />
                <span className="text-sm font-medium">
                  {currentImage + 1} of {images.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-[#E65F2B] hover:text-white transition-colors"
                  onClick={handleDownload}
                >
                  <Download className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-red-600 hover:text-white transition-colors"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-[#E65F2B] hover:text-white transition-colors"
                  onClick={onClose}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Navigation buttons */}
            {currentImage > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-[#E65F2B] hover:text-white transition-colors w-12 h-12 z-50"
                onClick={() => onNavigate(currentImage - 1)}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
            )}
            {currentImage < images.length - 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-[#E65F2B] hover:text-white transition-colors w-12 h-12 z-50"
                onClick={() => onNavigate(currentImage + 1)}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            )}

            {/* Image */}
            <div className="relative w-full h-full flex items-center justify-center p-8">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-[#E65F2B] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <div className="relative w-full h-full">
                <Image
                  src={images[currentImage].url}
                  alt={images[currentImage].filename}
                  fill
                  className={cn(
                    'object-contain transition-opacity duration-300',
                    isLoading ? 'opacity-0' : 'opacity-100'
                  )}
                  onLoadingComplete={() => setIsLoading(false)}
                  sizes="95vw"
                  priority
                />
              </div>
            </div>

            {/* Bottom info bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent z-40 p-4">
              <div className="flex flex-col items-center text-white/90">
                <p className="text-sm font-medium truncate max-w-[80%]">
                  {images[currentImage].filename}
                </p>
                <p className="text-xs mt-1 text-white/70">
                  Added {new Date(images[currentImage].createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

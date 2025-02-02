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
import {
  ImagePlus,
  Upload,
  Maximize2,
  Trash2,
  Users,
  UserCheck,
  UserX,
  UsersIcon,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageViewer } from "@/components/gallery/image-viewer";
import { ImageCardSkeleton } from "@/components/gallery/image-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProjectImage {
  id: string;
  url: string;
  filename: string;
  type: string;
  createdAt: string;
}

interface AttendanceRecord {
  id: string;
  photoUrl: string;
  confidence: number;
  date: string;
  createdAt: string;
  worker: {
    id: string;
    name: string;
  };
}

interface GroupedImages {
  [key: string]: ProjectImage[];
}

interface GroupedAttendance {
  [key: string]: AttendanceRecord[];
}

interface WorkerDetail {
  id: string;
  name: string;
  confidence?: number;
}

interface AttendanceStats {
  totalWorkers: number;
  workersPresent: number;
  verifiedWorkers: number;
  unverifiedWorkers: number;
  absentWorkers: number;
  workerDetails: {
    all: WorkerDetail[];
    present: WorkerDetail[];
    verified: WorkerDetail[];
    unverified: WorkerDetail[];
    absent: WorkerDetail[];
  };
  lastUpdated: string;
}

const TooltipWorkerList = ({
  title,
  workers,
}: {
  title: string;
  workers: WorkerDetail[];
}) => (
  <div className="bg-white rounded-lg border shadow-lg p-3 max-w-[250px] max-h-[300px] overflow-y-auto">
    <p className="font-medium text-gray-900 mb-2 border-b pb-2">{title}</p>
    <ul className="space-y-1">
      {workers?.map((worker) => (
        <li
          key={worker.id}
          className="text-sm text-gray-700 py-1 px-2 rounded hover:bg-gray-50"
        >
          {worker.name}
          {worker.confidence !== undefined && (
            <span className="ml-2 text-xs text-blue-600 font-medium">
              {worker.confidence.toFixed(2)}%
            </span>
          )}
        </li>
      ))}
    </ul>
  </div>
);

const StatsTooltip = ({
  title,
  workers,
}: {
  title: string;
  workers: WorkerDetail[];
}) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-4 w-4 p-0 hover:bg-transparent"
        >
          <HelpCircle className="h-4 w-4 text-gray-400" />
        </Button>
      </TooltipTrigger>
      <TooltipContent
        side="right"
        sideOffset={5}
        className="p-0 bg-transparent border-none"
      >
        <TooltipWorkerList title={title} workers={workers} />
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export default function GalleryPage() {
  const [activeTab, setActiveTab] = useState("gallery");
  const [images, setImages] = useState<ProjectImage[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [imageToDelete, setImageToDelete] = useState<ProjectImage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [attendanceStats, setAttendanceStats] =
    useState<AttendanceStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const { id } = useParams();
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchImages();
      fetchAttendanceRecords();
      fetchAttendanceStats();
    }
  }, [id]);

  const fetchImages = async () => {
    try {
      const response = await fetch(`/api/projects/${id}/images?type=gallery`);
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

  const fetchAttendanceRecords = async () => {
    try {
      const response = await fetch(`/api/projects/${id}/attendance/photos`);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch attendance records: ${response.statusText}`
        );
      }
      const data = await response.json();
      setAttendanceRecords(data);
    } catch (error) {
      console.error("Error fetching attendance records:", error);
      toast({
        title: "Error",
        description: "Failed to fetch attendance records",
        variant: "destructive",
      });
    }
  };

  const fetchAttendanceStats = async () => {
    try {
      const response = await fetch(`/api/projects/${id}/attendance/stats`);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch attendance stats: ${response.statusText}`
        );
      }
      const data = await response.json();
      setAttendanceStats(data);
    } catch (error) {
      console.error("Error fetching attendance stats:", error);
      toast({
        title: "Error",
        description: "Failed to fetch attendance statistics",
        variant: "destructive",
      });
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setIsUploading(true);
    const files = Array.from(e.target.files);
    const uploadPromises = files.map(async (file) => {
      const filename = `${id}/${Date.now()}-${file.name}`;

      try {
        const response = await fetch(
          `/api/uploadImage?filename=${encodeURIComponent(
            filename
          )}&id=${id}&type=gallery`,
          {
            method: "POST",
            body: file,
          }
        );

        if (!response.ok) {
          throw new Error(`Upload failed for ${file.name}`);
        }

        const data = await response.json();
        return data.image;
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        toast({
          title: "Upload Error",
          description: `Failed to upload ${file.name}`,
          variant: "destructive",
        });
        return null;
      }
    });

    try {
      const uploadedImages = await Promise.all(uploadPromises);
      const successfulUploads = uploadedImages.filter(
        (img): img is ProjectImage => img !== null
      );

      if (successfulUploads.length > 0) {
        setImages((prev) => [...successfulUploads, ...prev]);
        toast({
          title: "Success",
          description: `Successfully uploaded ${
            successfulUploads.length
          } image${successfulUploads.length === 1 ? "" : "s"}`,
        });
      }
    } catch (error) {
      console.error("Error in batch upload:", error);
      toast({
        title: "Error",
        description: "Some uploads failed",
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

  const groupAttendanceByDate = (
    records: AttendanceRecord[]
  ): GroupedAttendance => {
    return records.reduce((groups: GroupedAttendance, record) => {
      const date = new Date(record.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(record);
      return groups;
    }, {});
  };

  const findImageIndexInAllImages = (image: ProjectImage): number => {
    return images.findIndex((img) => img.id === image.id);
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-8 space-y-8">
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
  const groupedAttendance = groupAttendanceByDate(attendanceRecords);

  return (
    <div className="p-4 sm:p-8 space-y-8">
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

      <Tabs
        defaultValue="gallery"
        className="w-full"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        {}
        <div className="flex justify-center mb-4">
          <TabsList className="flex p-1 bg-black/10 rounded-lg w-fit">
            <TabsTrigger
              value="gallery"
              className={cn(
                "rounded-md transition-colors hover:bg-black hover:text-white data-[state=active]:shadow-none",
                "data-[state=active]:bg-white data-[state=active]:text-primary-accent"
              )}
            >
              <span className="flex items-center gap-2">
                <ImagePlus className="h-4 w-4" />
                Gallery
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="workers"
              className={cn(
                "rounded-md transition-colors hover:bg-black hover:text-white data-[state=active]:shadow-none",
                "data-[state=active]:bg-white data-[state=active]:text-primary-accent"
              )}
            >
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Workers
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        <Card className="bg-white/[0.34] border-0 shadow-none">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  {activeTab === "gallery" ? (
                    <ImagePlus className="h-5 w-5 text-[#E65F2B]" />
                  ) : (
                    <Users className="h-5 w-5 text-[#E65F2B]" />
                  )}
                  {activeTab === "gallery"
                    ? "Project Gallery"
                    : "Worker Photos"}
                </CardTitle>
                <CardDescription className="text-sm mt-1">
                  {activeTab === "gallery"
                    ? "Upload and manage project images"
                    : "View worker attendance photos"}
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                {activeTab === "gallery" && (
                  <>
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleUpload}
                      disabled={isUploading}
                      className="max-w-full sm:max-w-[500px]"
                    />
                    <Button disabled={isUploading}>
                      {isUploading ? (
                        <>
                          <Upload className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <ImagePlus className="mr-2 h-4 w-4" />
                          Upload Images
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        <TabsContent value="gallery" className="mt-6">
          {Object.entries(groupedImages).map(([date, dateImages]) => (
            <Card
              key={date}
              className="bg-white/[0.34] border-0 shadow-none mb-6"
            >
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
                          onClick={() => setImageToDelete(image)}
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
        </TabsContent>

        <TabsContent value="workers" className="mt-6">
          <Card className="bg-white/[0.34] border-0 shadow-none mb-8">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="flex items-center gap-3 rounded-lg bg-white/[0.15] p-4 border border-[rgba(0,0,0,0.08)] hover:bg-white/[0.25] transition-colors">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100">
                    <UsersIcon className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-500">
                        Total Workers
                      </p>
                      <StatsTooltip
                        title="All Workers"
                        workers={attendanceStats?.workerDetails.all || []}
                      />
                    </div>
                    <p className="text-2xl font-semibold mt-1">
                      {isLoadingStats ? (
                        <div className="h-8 w-16 animate-pulse bg-gray-200 rounded" />
                      ) : (
                        attendanceStats?.totalWorkers || 0
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Assigned to project
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg bg-white/[0.15] p-4 border border-[rgba(0,0,0,0.08)] hover:bg-white/[0.25] transition-colors">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-50">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-500">
                        Present Today
                      </p>
                      <StatsTooltip
                        title="Present Workers"
                        workers={attendanceStats?.workerDetails.present || []}
                      />
                    </div>
                    <p className="text-2xl font-semibold mt-1">
                      {isLoadingStats ? (
                        <div className="h-8 w-16 animate-pulse bg-gray-200 rounded" />
                      ) : (
                        attendanceStats?.workersPresent || 0
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {attendanceStats &&
                        `${Math.round(
                          (attendanceStats.workersPresent /
                            attendanceStats.totalWorkers) *
                            100
                        )}% rate`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg bg-white/[0.15] p-4 border border-[rgba(0,0,0,0.08)] hover:bg-white/[0.25] transition-colors">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-50">
                    <UserCheck className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-500">
                        Verified
                      </p>
                      <StatsTooltip
                        title="Verified Workers"
                        workers={attendanceStats?.workerDetails.verified || []}
                      />
                    </div>
                    <p className="text-2xl font-semibold mt-1">
                      {isLoadingStats ? (
                        <div className="h-8 w-16 animate-pulse bg-gray-200 rounded" />
                      ) : (
                        attendanceStats?.verifiedWorkers || 0
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {attendanceStats &&
                        attendanceStats.workersPresent > 0 &&
                        `${Math.round(
                          (attendanceStats.verifiedWorkers /
                            attendanceStats.workersPresent) *
                            100
                        )}% verification rate`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg bg-white/[0.15] p-4 border border-[rgba(0,0,0,0.08)] hover:bg-white/[0.25] transition-colors">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-50">
                    <UserX className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-500">
                        Unverified
                      </p>
                      <StatsTooltip
                        title="Unverified Workers"
                        workers={
                          attendanceStats?.workerDetails.unverified || []
                        }
                      />
                    </div>
                    <p className="text-2xl font-semibold mt-1">
                      {isLoadingStats ? (
                        <div className="h-8 w-16 animate-pulse bg-gray-200 rounded" />
                      ) : (
                        attendanceStats?.unverifiedWorkers || 0
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Need verification
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg bg-white/[0.15] p-4 border border-[rgba(0,0,0,0.08)] hover:bg-white/[0.25] transition-colors">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-50">
                    <Users className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-500">
                        Absent
                      </p>
                      <StatsTooltip
                        title="Absent Workers"
                        workers={attendanceStats?.workerDetails.absent || []}
                      />
                    </div>
                    <p className="text-2xl font-semibold mt-1">
                      {isLoadingStats ? (
                        <div className="h-8 w-16 animate-pulse bg-gray-200 rounded" />
                      ) : (
                        attendanceStats?.absentWorkers || 0
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {attendanceStats &&
                        `${Math.round(
                          (attendanceStats.absentWorkers /
                            attendanceStats.totalWorkers) *
                            100
                        )}% absence rate`}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {Object.entries(groupedAttendance).map(([date, records]) => (
            <Card
              key={date}
              className="bg-white/[0.34] border-0 shadow-none mb-6"
            >
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-medium text-gray-700">
                  {date}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {records.map((record) => (
                    <div
                      key={record.id}
                      className="group relative rounded-lg overflow-hidden bg-white/[0.15] border border-[rgba(0,0,0,0.08)] hover:bg-white/[0.25] transition-colors"
                    >
                      <div className="relative aspect-video">
                        <Image
                          src={record.photoUrl}
                          alt={record.worker.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </div>
                      <div className="p-3 space-y-2">
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-medium text-gray-700">
                            {record.worker.name}
                          </p>
                          <div className="px-2 py-1 rounded bg-green-100 text-green-800 text-xs">
                            {record.confidence > 99.99
                              ? "100%"
                              : `${record.confidence.toFixed(2)}%`}{" "}
                            Match
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">
                          {new Date(record.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {selectedImage !== null && (
        <ImageViewer
          images={images}
          currentImage={selectedImage || 0}
          isOpen={selectedImage !== null}
          onClose={() => setSelectedImage(null)}
          onNavigate={(index: number) => setSelectedImage(index)}
          onDelete={handleDelete}
          projectId={id as string}
        />
      )}
    </div>
  );
}

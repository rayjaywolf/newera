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
  photoUrl: string | null;
  workerInPhoto: string | null;
  workerOutPhoto: string | null;
  confidence: number | null;
  inConfidence: number | null;
  outConfidence: number | null;
  date: string;
  createdAt: string;
  isPartiallyMarked: boolean;
  worker: {
    id: string;
    name: string;
  };
}

interface GroupedImages {
  [key: string]: ProjectImage[];
}

interface GroupedWorkerPhotos {
  [workerId: string]: {
    name: string;
    checkIn: {
      photo: string | null;
      confidence: number | null;
      time: string | null;
    };
    checkOut: {
      photo: string | null;
      confidence: number | null;
      time: string | null;
    };
  };
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
  partiallyVerifiedWorkers: number;
  workerDetails: {
    all: WorkerDetail[];
    present: WorkerDetail[];
    verified: WorkerDetail[];
    unverified: WorkerDetail[];
    absent: WorkerDetail[];
    partiallyVerified: WorkerDetail[];
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
  const [selectedWorkerImage, setSelectedWorkerImage] = useState<number | null>(
    null
  );

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
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const response = await fetch(
        `/api/projects/${id}/attendance/stats?timeZone=${encodeURIComponent(
          timeZone
        )}`
      );
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

  const findWorkerPhotoIndexInAllRecords = (
    record: AttendanceRecord
  ): number => {
    return attendanceRecords.findIndex((rec) => rec.id === record.id);
  };

  const groupAttendanceByWorker = (
    records: AttendanceRecord[]
  ): GroupedWorkerPhotos => {
    const grouped: GroupedWorkerPhotos = {};

    records.forEach((record) => {
      // Create or update worker entry
      if (!grouped[record.worker.id]) {
        grouped[record.worker.id] = {
          name: record.worker.name,
          checkIn: {
            photo: null,
            confidence: null,
            time: null,
          },
          checkOut: {
            photo: null,
            confidence: null,
            time: null,
          },
        };
      }

      // Update check-in photo if available
      if (record.workerInPhoto) {
        grouped[record.worker.id].checkIn = {
          photo: record.workerInPhoto,
          confidence: record.inConfidence,
          time: record.createdAt,
        };
      }

      // Update check-out photo if available
      if (record.workerOutPhoto) {
        grouped[record.worker.id].checkOut = {
          photo: record.workerOutPhoto,
          confidence: record.outConfidence,
          time: record.createdAt,
        };
      }
    });

    return grouped;
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-8 space-y-8">
        {/* Tabs Skeleton */}
        <div className="flex justify-center mb-4">
          <div className="flex p-1 bg-black/10 rounded-lg w-fit gap-1">
            <Skeleton className="h-9 w-28 bg-white" />
            <Skeleton className="h-9 w-28 bg-black/[0.08]" />
          </div>
        </div>

        {/* Header Card Skeleton */}
        <Card className="bg-white/[0.34] border-0 shadow-none">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded bg-black/[0.08]" />
                  <Skeleton className="h-7 w-32 bg-black/[0.08]" />
                </div>
                <Skeleton className="h-4 w-48 bg-black/[0.08]" />
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
                <Skeleton className="h-10 w-full sm:w-[500px] bg-black/[0.08]" />
                <Skeleton className="h-10 w-full sm:w-32 bg-black/[0.08]" />
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Stats Card Skeleton */}
        <Card className="bg-white/[0.34] border-0 shadow-none">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg bg-white/[0.15] p-4 border border-[rgba(0,0,0,0.08)]"
                >
                  <Skeleton className="h-10 w-10 rounded-full bg-black/[0.08]" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24 bg-black/[0.08]" />
                    <Skeleton className="h-8 w-16 bg-black/[0.08]" />
                    <Skeleton className="h-3 w-20 bg-black/[0.08]" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Image Grid Skeleton */}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {/* Total Workers */}
                <Card className="bg-white/[0.34] border-0 shadow-none">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-gray-500">
                        Total Workers
                      </CardTitle>
                      <StatsTooltip
                        title="All Workers"
                        workers={attendanceStats?.workerDetails.all || []}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <UsersIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-2xl font-bold">
                        {attendanceStats?.totalWorkers || 0}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Present Workers */}
                <Card className="bg-white/[0.34] border-0 shadow-none">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-gray-500">
                        Present Today
                      </CardTitle>
                      <StatsTooltip
                        title="Present Workers"
                        workers={attendanceStats?.workerDetails.present || []}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <UserCheck className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-2xl font-bold">
                        {attendanceStats?.workersPresent || 0}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Partially Verified Workers */}
                <Card className="bg-white/[0.34] border-0 shadow-none">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-gray-500">
                        Partially Verified
                      </CardTitle>
                      <StatsTooltip
                        title="Partially Verified Workers"
                        workers={
                          attendanceStats?.workerDetails.partiallyVerified || []
                        }
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <UserCheck className="h-4 w-4 text-yellow-500 mr-2" />
                      <span className="text-2xl font-bold">
                        {attendanceStats?.partiallyVerifiedWorkers || 0}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Verified Workers */}
                <Card className="bg-white/[0.34] border-0 shadow-none">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-gray-500">
                        Fully Verified
                      </CardTitle>
                      <StatsTooltip
                        title="Verified Workers"
                        workers={attendanceStats?.workerDetails.verified || []}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <UserCheck className="h-4 w-4 text-blue-500 mr-2" />
                      <span className="text-2xl font-bold">
                        {attendanceStats?.verifiedWorkers || 0}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Absent Workers */}
                <Card className="bg-white/[0.34] border-0 shadow-none">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-gray-500">
                        Absent Today
                      </CardTitle>
                      <StatsTooltip
                        title="Absent Workers"
                        workers={attendanceStats?.workerDetails.absent || []}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <UserX className="h-4 w-4 text-red-500 mr-2" />
                      <span className="text-2xl font-bold">
                        {attendanceStats?.absentWorkers || 0}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <TabsContent value="workers" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(groupAttendanceByWorker(attendanceRecords)).map(
                ([workerId, data]) => (
                  <Card key={workerId} className="overflow-hidden">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">{data.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Check-in Photo */}
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center justify-between">
                          Check-in Photo
                          {data.checkIn.confidence && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                              {data.checkIn.confidence > 99.99
                                ? "100%"
                                : `${data.checkIn.confidence.toFixed(2)}%`}
                            </span>
                          )}
                        </h4>
                        {data.checkIn.photo ? (
                          <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
                            <Image
                              src={data.checkIn.photo}
                              alt={`${data.name} check-in`}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="aspect-[4/3] rounded-lg bg-gray-100 flex items-center justify-center">
                            <p className="text-sm text-gray-500">
                              No check-in photo
                            </p>
                          </div>
                        )}
                        {data.checkIn.time && (
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(data.checkIn.time).toLocaleTimeString()}
                          </p>
                        )}
                      </div>

                      {/* Check-out Photo */}
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center justify-between">
                          Check-out Photo
                          {data.checkOut.confidence && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                              {data.checkOut.confidence > 99.99
                                ? "100%"
                                : `${data.checkOut.confidence.toFixed(2)}%`}
                            </span>
                          )}
                        </h4>
                        {data.checkOut.photo ? (
                          <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
                            <Image
                              src={data.checkOut.photo}
                              alt={`${data.name} check-out`}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="aspect-[4/3] rounded-lg bg-gray-100 flex items-center justify-center">
                            <p className="text-sm text-gray-500">
                              No check-out photo
                            </p>
                          </div>
                        )}
                        {data.checkOut.time && (
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(data.checkOut.time).toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          </TabsContent>
        </TabsContent>
      </Tabs>

      {selectedWorkerImage !== null && (
        <ImageViewer
          images={attendanceRecords.map((record) => ({
            id: record.id,
            url: record.workerInPhoto || record.workerOutPhoto || "",
            filename: `${record.worker.name} - ${
              record.workerInPhoto ? "Check In" : "Check Out"
            }`,
            createdAt: record.createdAt,
          }))}
          currentImage={selectedWorkerImage}
          isOpen={selectedWorkerImage !== null}
          onClose={() => setSelectedWorkerImage(null)}
          onNavigate={(index: number) => setSelectedWorkerImage(index)}
          onDelete={async () => {}} // Attendance photos cannot be deleted
          projectId={id as string}
        />
      )}

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

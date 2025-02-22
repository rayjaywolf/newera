"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Worker, WorkerType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera } from "lucide-react";
import React from "react";

// Function to generate a worker ID from name
function generateWorkerId(name: string, existingWorkers: Worker[]) {
  // Convert name to lowercase, remove spaces and special characters
  const baseId = name.toLowerCase().replace(/[^a-z0-9]/g, "");

  // Check if this base ID already exists
  const similarIds = existingWorkers
    .map((w) => w.id)
    .filter((id) => id.startsWith(baseId));

  // If no similar IDs exist, use the base ID
  if (similarIds.length === 0) {
    return baseId;
  }

  // If similar IDs exist, add a number suffix
  return `${baseId}${similarIds.length + 1}`;
}

const workerSchema = z.object({
  workerId: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  type: z.nativeEnum(WorkerType),
  incomeType: z.enum(['hourly', 'daily']),
  hourlyRate: z.string().optional(),
  dailyIncome: z.string().optional(),
  phoneNumber: z.string().optional(),
  photo: z.instanceof(File).optional(),
}).refine((data) => {
  if (data.incomeType === 'hourly' && !data.hourlyRate) {
    return false;
  }
  if (data.incomeType === 'daily' && !data.dailyIncome) {
    return false;
  }
  return true;
}, {
  message: "Please provide the required income rate",
  path: ['hourlyRate']
});

interface AddWorkerFormProps {
  projectId: string;
  existingWorkers: Worker[];
}

// Add this new component for camera capture
function CameraCapture({ onCapture }: { onCapture: (file: File) => void }) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>("");

  // Get list of available cameras
  const getCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(
        (device) => device.kind === "videoinput"
      );
      setCameras(videoDevices);
      if (videoDevices.length > 0) {
        setSelectedCamera(videoDevices[0].deviceId);
      }
    } catch (err) {
      console.error("Error getting cameras:", err);
      setError("Failed to get list of cameras");
    }
  };

  const startCamera = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setError("");
      setCapturedImage(null);
    } catch (err) {
      setError(
        "Failed to access camera. Please ensure camera permissions are granted."
      );
      console.error("Error accessing camera:", err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCapturedImage(null);
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw the video frame to the canvas
    ctx.drawImage(videoRef.current, 0, 0);

    // Set the captured image preview
    const imageDataUrl = canvas.toDataURL("image/jpeg");
    setCapturedImage(imageDataUrl);

    // Convert the canvas to a blob
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], "worker-photo.jpg", {
            type: "image/jpeg",
          });
          onCapture(file);
        }
      },
      "image/jpeg",
      0.8
    );
  };

  // Initialize camera list
  useEffect(() => {
    getCameras();
    // Listen for device changes
    navigator.mediaDevices.addEventListener("devicechange", getCameras);
    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", getCameras);
      stopCamera();
    };
  }, []);

  // Start camera when device is selected
  useEffect(() => {
    if (selectedCamera) {
      startCamera();
    }
  }, [selectedCamera]);

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-500 text-center">{error}</p>}

      {/* Camera Selection */}
      {cameras.length > 1 && !capturedImage && (
        <Select value={selectedCamera} onValueChange={setSelectedCamera}>
          <SelectTrigger className="bg-white/[0.15] border-[rgb(0,0,0,0.08)]">
            <SelectValue placeholder="Select a camera" />
          </SelectTrigger>
          <SelectContent>
            {cameras.map((camera) => (
              <SelectItem key={camera.deviceId} value={camera.deviceId}>
                {camera.label || `Camera ${camera.deviceId.slice(0, 5)}...`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Camera Preview / Captured Image */}
      <div className="relative aspect-video rounded-lg overflow-hidden bg-black/[0.15] border border-[rgba(0,0,0,0.08)]">
        {capturedImage ? (
          <img
            src={capturedImage}
            alt="Captured"
            className="w-full h-full object-contain"
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4">
        {!stream && !capturedImage ? (
          <Button
            type="button"
            onClick={startCamera}
            className="bg-black text-white hover:bg-white hover:text-[#E65F2B] transition-colors"
          >
            <Camera className="mr-2 h-4 w-4" />
            Start Camera
          </Button>
        ) : capturedImage ? (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={retakePhoto}
              className="border-black/20 hover:border-black transition-colors"
            >
              Retake Photo
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={stopCamera}
              className="border-black/20 hover:border-black transition-colors"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={capturePhoto}
              className="bg-black text-white hover:bg-white hover:text-[#E65F2B] transition-colors"
            >
              Take Photo
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default function AddWorkerForm({
  projectId,
  existingWorkers,
}: AddWorkerFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isExistingWorker, setIsExistingWorker] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [incomeType, setIncomeType] = useState<'hourly' | 'daily'>('hourly');

  const form = useForm<z.infer<typeof workerSchema>>({
    resolver: zodResolver(workerSchema),
    defaultValues: {
      name: "",
      incomeType: "hourly",
      hourlyRate: "",
      dailyIncome: "",
      phoneNumber: "",
    },
  });

  const watchIncomeType = form.watch("incomeType");

  async function onSubmit(values: z.infer<typeof workerSchema>) {
    try {
      setLoading(true);

      let photoUrl: string | undefined;

      if (photoFile) {
        const filename = `${projectId}/${Date.now()}-${photoFile.name}`;
        const response = await fetch(
          `/api/uploadImage?filename=${encodeURIComponent(
            filename
          )}&id=${projectId}&type=worker`,
          {
            method: "POST",
            body: photoFile,
          }
        );

        if (!response.ok) {
          throw new Error("Failed to upload photo");
        }

        const { url } = await response.json();
        photoUrl = url;
      }

      // Generate worker ID if it's a new worker
      const generatedId = isExistingWorker
        ? values.workerId
        : generateWorkerId(values.name, existingWorkers);

      const response = await fetch(`/api/projects/${projectId}/workers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          id: generatedId,
          hourlyRate: values.incomeType === 'hourly' ? parseFloat(values.hourlyRate || '0') : null,
          dailyIncome: values.incomeType === 'daily' ? parseFloat(values.dailyIncome || '0') : null,
          isExisting: isExistingWorker,
          photoUrl,
        }),
      });

      console.log('Request payload:', {
        ...values,
        id: generatedId,
        hourlyRate: values.incomeType === 'hourly' ? parseFloat(values.hourlyRate || '0') : null,
        dailyIncome: values.incomeType === 'daily' ? parseFloat(values.dailyIncome || '0') : null,
        isExisting: isExistingWorker,
        photoUrl,
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Failed to add worker:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error("Failed to add worker");
      }

      const responseData = await response.json();
      console.log('Response data:', responseData);

      const { id: newWorkerId } = responseData;

      // Index the worker's face if photo was uploaded
      if (photoFile && newWorkerId) {
        const faceFormData = new FormData();
        faceFormData.append("photo", photoFile);
        faceFormData.append("workerId", newWorkerId);

        const faceResponse = await fetch("/api/workers/index-face", {
          method: "POST",
          body: faceFormData,
        });

        if (!faceResponse.ok) {
          console.error("Failed to index face:", await faceResponse.text());
          toast.error("Worker added but face indexing failed");
          return;
        }

        const { faceId } = await faceResponse.json();

        // Update worker with faceId
        const updateResponse = await fetch(`/api/workers/${newWorkerId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ faceId }),
        });

        if (!updateResponse.ok) {
          console.error("Failed to update worker with faceId");
          toast.error("Worker added but face ID update failed");
          return;
        }
      }

      toast.success("Worker added successfully");
      router.push(`/projects/${projectId}`);
      router.refresh();
    } catch (error) {
      toast.error("Failed to add worker");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="inline-flex p-1 bg-black/10 rounded-lg">
          <Button
            type="button"
            variant="ghost"
            className={cn(
              "rounded-md transition-colors hover:bg-black hover:text-white",
              isExistingWorker && "bg-white text-primary-accent"
            )}
            onClick={() => setIsExistingWorker(true)}
          >
            Existing Worker
          </Button>
          <Button
            type="button"
            variant="ghost"
            className={cn(
              "rounded-md transition-colors hover:bg-black hover:text-white",
              !isExistingWorker && "bg-white text-primary-accent"
            )}
            onClick={() => setIsExistingWorker(false)}
          >
            New Worker
          </Button>
        </div>

        {isExistingWorker ? (
          <FormField
            control={form.control}
            name="workerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">
                  Select Worker
                </FormLabel>
                <Select onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="bg-white/[0.15] border-[rgb(0,0,0,0.08)]">
                      <SelectValue placeholder="Select a worker" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {existingWorkers.map((worker) => (
                      <SelectItem key={worker.id} value={worker.id}>
                        {worker.name} -{" "}
                        {worker.type.toLowerCase().replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter worker name"
                      className="bg-white/[0.15] border-[rgb(0,0,0,0.08)]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Type</FormLabel>
                  <Select onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="bg-white/[0.15] border-[rgb(0,0,0,0.08)]">
                        <SelectValue placeholder="Select worker type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(WorkerType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.toLowerCase().replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="incomeType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Income Type</FormLabel>
                  <div className="flex gap-4">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="hourly"
                        value="hourly"
                        checked={field.value === 'hourly'}
                        onChange={(e) => {
                          field.onChange('hourly');
                          setIncomeType('hourly');
                        }}
                        className="mr-2"
                      />
                      <label htmlFor="hourly">Hourly Rate</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="daily"
                        value="daily"
                        checked={field.value === 'daily'}
                        onChange={(e) => {
                          field.onChange('daily');
                          setIncomeType('daily');
                        }}
                        className="mr-2"
                      />
                      <label htmlFor="daily">Daily Income</label>
                    </div>
                  </div>
                </FormItem>
              )}
            />
            {watchIncomeType === 'hourly' && (
              <FormField
                control={form.control}
                name="hourlyRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Hourly Rate</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        className="bg-white/[0.15] border-[rgb(0,0,0,0.08)]"
                        placeholder="Enter hourly rate"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {watchIncomeType === 'daily' && (
              <FormField
                control={form.control}
                name="dailyIncome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Daily Income</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        className="bg-white/[0.15] border-[rgb(0,0,0,0.08)]"
                        placeholder="Enter daily income"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Phone Number (Optional)
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="bg-white/[0.15] border-[rgb(0,0,0,0.08)]"
                      placeholder="Enter phone number"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem>
              <FormLabel>Reference Photo (Optional)</FormLabel>
              <FormControl>
                <Tabs defaultValue="upload" className="w-full">
                  <TabsList className="flex p-1 bg-black/10 rounded-lg mb-4 w-fit">
                    <TabsTrigger
                      value="upload"
                      className={cn(
                        "rounded-md transition-colors hover:bg-black hover:text-white data-[state=active]:shadow-none",
                        "data-[state=active]:bg-white data-[state=active]:text-primary-accent"
                      )}
                    >
                      Upload File
                    </TabsTrigger>
                    <TabsTrigger
                      value="camera"
                      className={cn(
                        "rounded-md transition-colors hover:bg-black hover:text-white data-[state=active]:shadow-none",
                        "data-[state=active]:bg-white data-[state=active]:text-primary-accent"
                      )}
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      Use Camera
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="upload">
                    <Input
                      type="file"
                      accept="image/*"
                      className="w-[30%]"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setPhotoFile(file);
                        }
                      }}
                    />
                  </TabsContent>

                  <TabsContent value="camera">
                    <CameraCapture onCapture={(file) => setPhotoFile(file)} />
                  </TabsContent>
                </Tabs>
              </FormControl>
              <FormMessage />
            </FormItem>
          </>
        )}
        <Button
          type="submit"
          disabled={loading}
          size="lg"
          variant="ghost"
          className="bg-black text-white font-semibold hover:bg-white hover:text-primary-accent transition-colors"
        >
          {loading ? "Adding..." : "Add Worker"}
        </Button>
      </form>
    </Form>
  );
}

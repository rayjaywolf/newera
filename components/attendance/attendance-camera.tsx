"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AttendanceCameraProps {
  projectId: string;
  onSuccess: (attendance: any) => void;
}

interface VideoDevice {
  deviceId: string;
  label: string;
}

export function AttendanceCamera({
  projectId,
  onSuccess,
}: AttendanceCameraProps) {
  const webcamRef = useRef<Webcam>(null);
  const [capturing, setCapturing] = useState(false);
  const [devices, setDevices] = useState<VideoDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");

  const handleDevices = useCallback(
    (mediaDevices: MediaDeviceInfo[]) => {
      const videoDevices = mediaDevices
        .filter(({ kind }) => kind === "videoinput")
        .map(({ deviceId, label }) => ({
          deviceId,
          label: label || `Camera ${devices.length + 1}`,
        }));
      setDevices(videoDevices);
      if (videoDevices.length > 0 && !selectedDevice) {
        setSelectedDevice(videoDevices[0].deviceId);
      }
    },
    [devices.length, selectedDevice]
  );

  useEffect(() => {
    navigator.mediaDevices
      .enumerateDevices()
      .then(handleDevices)
      .catch((error) => {
        console.error("Error getting devices:", error);
        toast.error("Failed to get camera devices");
      });
  }, [handleDevices]);

  const captureAndVerify = useCallback(async () => {
    if (!webcamRef.current) return;
    setCapturing(true);

    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        throw new Error("Failed to capture photo");
      }

      const response = await fetch(imageSrc);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append("photo", blob);
      formData.append("projectId", projectId);

      const attendanceResponse = await fetch("/api/attendance/verify", {
        method: "POST",
        body: formData,
      });

      const data = await attendanceResponse.json();

      if (!attendanceResponse.ok) {
        if (attendanceResponse.status === 409 && data.alreadyPresent) {
          toast.warning(
            `${data.attendance.worker.name} is already marked present for today`
          );
          onSuccess(data.attendance);
          return;
        }
        throw new Error(data.error || "Failed to verify attendance");
      }

      toast.success(`Face recognized: ${data.attendance.worker.name}`);
      setTimeout(() => {
        toast.success("Attendance marked successfully!");
      }, 500);
      onSuccess(data.attendance);
    } catch (error) {
      console.error("Error saving attendance:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save attendance"
      );
    } finally {
      setCapturing(false);
    }
  }, [projectId, onSuccess]);

  return (
    <div className="flex flex-col items-center gap-4">
      {devices.length > 1 && (
        <div className="w-full max-w-xs">
          <Select value={selectedDevice} onValueChange={setSelectedDevice}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select camera" />
            </SelectTrigger>
            <SelectContent>
              {devices.map(({ deviceId, label }) => (
                <SelectItem key={deviceId} value={deviceId}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        className="rounded-lg border"
        videoConstraints={{
          deviceId: selectedDevice,
          width: 1280,
          height: 720,
        }}
      />
      <Button
        onClick={captureAndVerify}
        disabled={capturing}
        className="bg-black text-white font-semibold hover:bg-white hover:text-primary-accent transition-colors"
      >
        {capturing ? "Processing..." : "Capture & Verify"}
      </Button>
    </div>
  );
}

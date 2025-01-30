import { useCallback, useRef, useState } from "react";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface AttendanceCameraProps {
  projectId: string;
  onSuccess: (attendance: any) => void;
}

export function AttendanceCamera({ projectId, onSuccess }: AttendanceCameraProps) {
  const webcamRef = useRef<Webcam>(null);
  const [capturing, setCapturing] = useState(false);

  const captureAndVerify = useCallback(async () => {
    if (!webcamRef.current) return;
    setCapturing(true);

    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        throw new Error("Failed to capture photo");
      }

      // Convert base64 to blob
      const response = await fetch(imageSrc);
      const blob = await response.blob();

      // Create form data
      const formData = new FormData();
      formData.append("photo", blob);
      formData.append("projectId", projectId);

      // Send to API
      const attendanceResponse = await fetch("/api/attendance/verify", {
        method: "POST",
        body: formData,
      });

      const data = await attendanceResponse.json();

      if (!attendanceResponse.ok) {
        if (attendanceResponse.status === 409 && data.alreadyPresent) {
          toast.warning(`${data.attendance.worker.name} is already marked present for today`);
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
      toast.error(error instanceof Error ? error.message : "Failed to save attendance");
    } finally {
      setCapturing(false);
    }
  }, [projectId, onSuccess]);

  return (
    <div className="flex flex-col items-center gap-4">
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        className="rounded-lg border"
      />
      <Button 
        onClick={captureAndVerify} 
        disabled={capturing}
      >
        {capturing ? "Processing..." : "Capture & Verify"}
      </Button>
    </div>
  );
}

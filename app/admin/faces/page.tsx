"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface Face {
  FaceId: string;
  ExternalImageId?: string;
  Confidence: number;
  worker: {
    id: string;
    name: string;
    photoUrl: string;
  } | null;
}

export default function FacesPage() {
  const [faces, setFaces] = useState<Face[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchFaces();
  }, []);

  const fetchFaces = async () => {
    try {
      const response = await fetch("/api/admin/faces", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch faces");
      }
      const data = await response.json();
      setFaces(data);
    } catch (error) {
      console.error("Error fetching faces:", error);
      toast.error("Failed to fetch faces");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (faceId: string) => {
    try {
      setDeleting(faceId);
      const response = await fetch("/api/workers/delete-face", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ faceId }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete face");
      }

      // Remove the deleted face from the local state immediately
      setFaces(faces.filter((face) => face.FaceId !== faceId));
      toast.success("Face deleted successfully");

      // Refetch to ensure consistency
      await fetchFaces();
    } catch (error) {
      console.error("Error deleting face:", error);
      toast.error("Failed to delete face");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-[200px] mb-4" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Face Recognition Database</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Face ID</TableHead>
            <TableHead>Photo</TableHead>
            <TableHead>Worker Name</TableHead>
            <TableHead>Confidence</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {faces.map((face) => (
            <TableRow key={face.FaceId}>
              <TableCell className="font-mono">{face.FaceId}</TableCell>
              <TableCell>
                {face.worker?.photoUrl && (
                  <div className="relative h-12 w-12">
                    <Image
                      src={face.worker.photoUrl}
                      alt={face.worker.name || "Worker photo"}
                      fill
                      className="object-cover rounded-full"
                    />
                  </div>
                )}
              </TableCell>
              <TableCell>
                {face.worker ? face.worker.name : "No worker linked"}
              </TableCell>
              <TableCell>{face.Confidence?.toFixed(2)}%</TableCell>
              <TableCell>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(face.FaceId)}
                  disabled={deleting === face.FaceId}
                >
                  {deleting === face.FaceId ? "Deleting..." : "Delete"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {faces.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-4">
                No faces found in the database
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

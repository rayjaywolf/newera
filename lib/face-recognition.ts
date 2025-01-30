import {
  CompareFacesCommand,
  SearchFacesByImageCommand,
  IndexFacesCommand,
  DeleteFacesCommand,
  CreateCollectionCommand,
  ListCollectionsCommand,
  ListFacesCommand,
} from "@aws-sdk/client-rekognition";
import { rekognitionClient } from "./aws-config";
import { prisma } from "./prisma";

const COLLECTION_ID = "workers-faces";
const SIMILARITY_THRESHOLD = 95;

export async function ensureCollection() {
  try {
    const collections = await rekognitionClient.send(new ListCollectionsCommand({}));
    if (!collections.CollectionIds?.includes(COLLECTION_ID)) {
      await rekognitionClient.send(new CreateCollectionCommand({
        CollectionId: COLLECTION_ID,
      }));
    }
  } catch (error) {
    console.error("Error ensuring collection exists:", error);
    throw error;
  }
}

export async function indexWorkerFace(imageBytes: Buffer, workerId: string) {
  try {
    const response = await rekognitionClient.send(new IndexFacesCommand({
      CollectionId: COLLECTION_ID,
      Image: { Bytes: imageBytes },
      ExternalImageId: workerId,
      DetectionAttributes: ["ALL"],
    }));

    if (!response.FaceRecords || response.FaceRecords.length === 0) {
      throw new Error("No face detected in the image");
    }

    return response.FaceRecords[0].Face?.FaceId;
  } catch (error) {
    console.error("Error indexing face:", error);
    throw error;
  }
}

export async function deleteFaceFromCollection(faceId: string) {
  try {
    await rekognitionClient.send(new DeleteFacesCommand({
      CollectionId: COLLECTION_ID,
      FaceIds: [faceId],
    }));
  } catch (error) {
    console.error("Error deleting face:", error);
    throw error;
  }
}

export async function searchFaceForAttendance(imageBytes: Buffer) {
  try {
    const response = await rekognitionClient.send(new SearchFacesByImageCommand({
      CollectionId: COLLECTION_ID,
      Image: { Bytes: imageBytes },
      MaxFaces: 1,
      FaceMatchThreshold: SIMILARITY_THRESHOLD,
    }));

    if (!response.FaceMatches || response.FaceMatches.length === 0) {
      return { matched: false, workerId: null, confidence: 0 };
    }

    const match = response.FaceMatches[0];
    const externalImageId = match.Face?.ExternalImageId;

    if (!externalImageId) {
      return { matched: false, workerId: null, confidence: 0 };
    }

    // Try to find the worker by their ID first
    let worker = await prisma.worker.findUnique({
      where: { id: externalImageId }
    });

    // If not found, try to find by faceId
    if (!worker) {
      worker = await prisma.worker.findFirst({
        where: { faceId: match.Face?.FaceId }
      });
    }

    // If still not found, log the issue and return no match
    if (!worker) {
      console.error("Face matched but worker not found:", {
        externalImageId,
        faceId: match.Face?.FaceId,
        similarity: match.Similarity
      });
      return { matched: false, workerId: null, confidence: 0 };
    }

    return {
      matched: true,
      workerId: worker.id,
      confidence: match.Similarity || 0,
    };
  } catch (error) {
    console.error("Error searching face:", error);
    throw error;
  }
}

export async function compareFaces(sourceImageBytes: Buffer, targetImageBytes: Buffer) {
  try {
    const response = await rekognitionClient.send(new CompareFacesCommand({
      SourceImage: { Bytes: sourceImageBytes },
      TargetImage: { Bytes: targetImageBytes },
      SimilarityThreshold: SIMILARITY_THRESHOLD,
    }));

    if (!response.FaceMatches || response.FaceMatches.length === 0) {
      return { matched: false, confidence: 0 };
    }

    return {
      matched: true,
      confidence: response.FaceMatches[0].Similarity || 0,
    };
  } catch (error) {
    console.error("Error comparing faces:", error);
    throw error;
  }
}

export async function listAllFaces() {
  try {
    const response = await rekognitionClient.send(new ListFacesCommand({
      CollectionId: COLLECTION_ID,
      MaxResults: 1000, // Adjust if needed
    }));

    return response.Faces || [];
  } catch (error) {
    console.error("Error listing faces:", error);
    throw error;
  }
}

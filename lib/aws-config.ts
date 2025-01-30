import { RekognitionClient } from "@aws-sdk/client-rekognition";
import { fromEnv } from "@aws-sdk/credential-providers";

export const rekognitionClient = new RekognitionClient({
  region: process.env.AWS_REGION!,
  credentials: fromEnv(),
});

"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MachineryType, JCBSubtype, SLMSubtype, JCBPartType } from "@prisma/client";
import { generateMachineryId } from "@/lib/id-generators";

export async function addMachinery(formData: FormData) {
  const projectId = formData.get("projectId") as string;
  const type = formData.get("type") as MachineryType;
  const jcbSubtype =
    type === "JCB" ? (formData.get("jcbSubtype") as JCBSubtype) : null;
  const jcbPartType =
    type === "JCB" ? (formData.get("jcbPartType") as JCBPartType) : null;
  const slmSubtype =
    type === "SLM" ? (formData.get("slmSubtype") as SLMSubtype) : null;
  const hoursUsed = parseFloat(formData.get("hoursUsed") as string);
  const hourlyRate = parseFloat(formData.get("hourlyRate") as string);
  const date = new Date(formData.get("date") as string);
  const totalCost = hoursUsed * hourlyRate;

  await prisma.machineryUsage.create({
    data: {
      id: generateMachineryId(type, jcbSubtype, slmSubtype),
      type,
      jcbSubtype,
      jcbPartType,
      slmSubtype,
      hoursUsed,
      hourlyRate,
      date,
      totalCost,
      projectId,
    },
  });

  redirect(`/projects/${projectId}/machinery`);
}

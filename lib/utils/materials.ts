import { MaterialType } from "@prisma/client";

export function getMaterialUnit(type: MaterialType): string {
  switch (type) {
    case "STEEL":
    case "CEMENT":
      return "kg";
    case "SAND":
    case "GRIT_10MM":
    case "GRIT_20MM":
    case "GRIT_40MM":
    case "STONE":
      return "cubic feet";
    case "BRICK":
      return "numbers";
    case "WATER":
      return "litres";
    default:
      return "";
  }
}

import { MaterialType, MachineryType, JCBSubtype, SLMSubtype } from "@prisma/client";

/**
 * Generates a short, readable ID for materials
 * Format: MAT_{TYPE}_{TIMESTAMP}
 * Example: MAT_CEMENT_1A2B
 */
export function generateMaterialId(type: MaterialType) {
    const timestamp = Date.now().toString(36).slice(-4);
    return `MAT_${type}_${timestamp}`.toUpperCase();
}

/**
 * Generates a short, readable ID for machinery
 * Format: MACH_{TYPE}_{SUBTYPE}_{TIMESTAMP}
 * Example: MACH_JCB_BACKHOE_1A2B
 */
export function generateMachineryId(
    type: MachineryType,
    jcbSubtype?: JCBSubtype | null,
    slmSubtype?: SLMSubtype | null
) {
    const timestamp = Date.now().toString(36).slice(-4);
    const subtype = type === "JCB" ? jcbSubtype : slmSubtype;
    return `MACH_${type}${subtype ? `_${subtype}` : ""}_${timestamp}`.toUpperCase();
} 
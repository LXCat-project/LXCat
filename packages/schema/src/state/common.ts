import { z, ZodEffects, ZodTypeAny } from "zod";

/**
 * Array used for the conversion of the electron orbital angular momentum
 * quantum l to its alphabetic representation.
 */
export const electronicOrbital = ["s", "p", "d", "f", "g", "h"] as const;

export function parseCharge(charge: number): string {
  if (charge == 0) return "";
  if (charge == 1) return "^+";
  if (charge == -1) return "^-";

  const sign = charge > 1 ? "+" : "-";
  return `^${Math.abs(charge)}${sign}`;
}

export function parseChargeLatex(charge: number): string {
  if (charge == 0) return "";
  if (charge == 1) return "^+";
  if (charge == -1) return "^-";

  const sign = charge > 1 ? "+" : "-";
  return `^{${Math.abs(charge)}${sign}}`;
}

export const makeComponent = <ComponentSchema extends ZodTypeAny>(
  schema: ComponentSchema,
  summary: (object: z.infer<ComponentSchema>) => string,
  latex: (object: z.infer<ComponentSchema>) => string,
): ZodEffects<
  ComponentSchema,
  z.output<ComponentSchema> & { summary: () => string; latex: () => string }
> =>
  schema.transform((object) => ({
    ...object,
    summary: () => summary(object),
    latex: () => latex(object),
  }));

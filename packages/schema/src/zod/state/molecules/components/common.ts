import { z } from "zod";

export const MolecularParity = z.object({ parity: z.enum(["g", "u"]) });

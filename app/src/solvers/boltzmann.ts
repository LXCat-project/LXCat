import { z } from "zod";

export const BoltzmannOutput = z.object({
  energy: z.array(z.number().min(0)),
  eedf: z.array(z.number().min(0)),
});

export type BoltzmannOutput = z.infer<typeof BoltzmannOutput>;

export interface BoltzmannSolver<
  BoltzmannInput extends z.ZodTypeAny,
  BoltzmannOutput extends z.ZodTypeAny,
> {
  inputSchema: BoltzmannInput;
  outputSchema: BoltzmannOutput;

  solve(
    input: z.infer<BoltzmannInput>,
  ): Promise<z.infer<BoltzmannOutput> | string>;
}

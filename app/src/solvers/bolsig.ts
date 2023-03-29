import { z } from "zod";
import { BoltzmannOutput, BoltzmannSolver } from "./boltzmann";

export const BolsigInput = z.object({
  crossSections: z.array(z.object({ id: z.number().int() })),
  composition: z.record(z.string().min(1), z.number().min(0).max(1.0)),
  config: z.object({
    maxEnergy: z.number().min(0),
    gasTemperature: z.number().min(0),
    gridSize: z.number().int().min(1).max(1000),
    plasmaDensity: z.number().min(0),
    reducedField: z.number().min(0),
    ionizationDegree: z.number().min(0),
  }),
});

export const BolsigOutput = BoltzmannOutput;

export type BolsigInput = z.infer<typeof BolsigInput>;
export type BolsigOutput = z.infer<typeof BoltzmannOutput>;

export class Bolsig
  implements BoltzmannSolver<typeof BolsigInput, typeof BolsigOutput>
{
  constructor(
    public inputSchema: typeof BolsigInput,
    public outputSchema: typeof BolsigOutput,
    private host: string,
  ) {}

  async solve(input: BolsigInput): Promise<BolsigOutput | string> {
    const response = await fetch(this.host, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      return response.text();
    }

    let json: any;

    try {
      json = await response.json();
    } catch (error) {
      if (error instanceof Error) {
        return error.message;
      } else {
        return error as string;
      }
    }

    const output = await this.outputSchema.safeParseAsync(json);

    if (!output.success) {
      return JSON.stringify(output.error.format());
    }

    return output.data;
  }
}

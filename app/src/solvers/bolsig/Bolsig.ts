import { BoltzmannSolver } from "../boltzmann";
import { BolsigInput, BolsigOutput } from "./io";

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

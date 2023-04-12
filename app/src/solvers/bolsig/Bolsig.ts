import { Result } from "true-myth";
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

  async solve(input: BolsigInput): Promise<Result<BolsigOutput, Error>> {
    let json: any;

    try {
      const response = await fetch(this.host, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        return Result.err(new Error(await response.text()));
      }

      json = await response.json();
    } catch (error) {
      if (error instanceof Error) {
        return Result.err(error);
      } else {
        return Result.err(new Error(error as string));
      }
    }

    const output = await this.outputSchema.safeParseAsync(json);

    if (!output.success) {
      return Result.err(new Error(JSON.stringify(output.error.format())));
    }

    return Result.ok(output.data);
  }
}

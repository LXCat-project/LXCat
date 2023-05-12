// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Result } from "true-myth";
import { z } from "zod";

export interface BoltzmannSolver<
  BoltzmannInput extends z.ZodTypeAny,
  BoltzmannOutput extends z.ZodTypeAny,
> {
  inputSchema: BoltzmannInput;
  outputSchema: BoltzmannOutput;

  solve(
    input: z.infer<BoltzmannInput>,
  ):
    | Promise<Result<z.infer<BoltzmannOutput>, Error>>
    | Promise<
      Result<Array<Promise<Result<z.infer<BoltzmannOutput>, Error>>>, Error>
    >;
}

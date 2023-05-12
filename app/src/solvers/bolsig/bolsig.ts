// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Result } from "true-myth";
import { AsyncWebSocket } from "../../shared/websocket";
import { BoltzmannSolver } from "../boltzmann";
import { BolsigInput, BolsigOutput } from "./io";
import { CountPacket, DataPacket } from "./networking";

export class Bolsig
  implements BoltzmannSolver<typeof BolsigInput, typeof BolsigOutput>
{
  constructor(
    public inputSchema: typeof BolsigInput,
    public outputSchema: typeof BolsigOutput,
    private host: string,
  ) {}

  async solve(
    input: BolsigInput,
  ): Promise<Result<Array<Promise<Result<BolsigOutput, Error>>>, Error>> {
    const socket = new AsyncWebSocket(this.host);
    socket.send(JSON.stringify({ type: "input", data: input }));
    const countPacketResult = await socket.recv();

    if (countPacketResult.isErr) {
      return Result.err(countPacketResult.error);
    }

    const countPacket = CountPacket.safeParse(
      JSON.parse(countPacketResult.value),
    );

    if (!countPacket.success) {
      return Result.err(countPacket.error);
    }

    return Result.ok(
      Array.from(
        { length: countPacket.data.data },
        () =>
          socket.recv().then((result) => {
            if (result.isErr) {
              return Result.err(result.error);
            }

            const dataPacket = DataPacket.safeParse(JSON.parse(result.value));

            if (!dataPacket.success) {
              return Result.err(dataPacket.error);
            }

            return Result.ok(dataPacket.data.data);
          }),
      ),
    );
  }
}

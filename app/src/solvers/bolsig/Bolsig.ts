import { Result, Unit } from "true-myth";
import { BoltzmannSolver } from "../boltzmann";
import { BolsigInput, BolsigOutput } from "./io";

class AsyncWebSocket {
  private promiseQueue: Array<(data: Result<any, Error>) => void> = [];
  private dataQueue: Array<any> = [];
  private socket: WebSocket;
  private connectGuard: Promise<void> | void;

  connected(): boolean {
    return this.socket.readyState === WebSocket.OPEN;
  }

  async send(data: string): Promise<Result<Unit, Error>> {
    await this.connectGuard;

    if (!this.connected()) {
      return Result.err(
        new Error("Cannot send message, web socket is closed."),
      );
    }

    this.socket.send(data);
    return Result.ok();
  }

  async recv(): Promise<Result<any, Error>> {
    if (this.dataQueue.length > 0) {
      return Result.ok(this.dataQueue.shift());
    }

    await this.connectGuard;

    if (!this.connected()) {
      return Result.err(
        new Error("Cannot receive message, web socket is closed."),
      );
    }

    return new Promise(resolve => this.promiseQueue.push(resolve));
  }

  constructor(url: string | URL) {
    this.socket = new WebSocket(url);

    this.connectGuard = new Promise(resolve => {
      this.socket.onopen = () => resolve();
    });

    this.socket.onmessage = (event) => {
      const resolve = this.promiseQueue.shift();

      if (resolve !== undefined) {
        resolve(Result.ok(event.data));
        return;
      }

      this.dataQueue.push(event.data);
    };
  }

  destructor() {
    this.socket.close();
  }
}

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
    // FIXME: Set host via env variable.
    const socket = new AsyncWebSocket("ws://localhost:3001/ws");
    socket.send(JSON.stringify({ type: "input", data: input }));
    const countPacketResult = await socket.recv();

    if (countPacketResult.isErr) {
      return Result.err(countPacketResult.error);
    }

    // TODO: Use zod to parse the incoming packets.
    const countPacket = JSON.parse(countPacketResult.value);

    return Result.ok(
      Array.from(
        { length: countPacket.data },
        () =>
          socket.recv().then((result) => {
            if (result.isErr) {
              return Result.err(result.error);
            }

            // TODO: Use zod to parse the incoming packets.
            const packet = JSON.parse(result.value);

            console.log(packet);
            return Result.ok(packet.data);
          }),
      ),
    );
  }
}

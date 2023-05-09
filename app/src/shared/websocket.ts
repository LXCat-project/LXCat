import { Result, Unit } from "true-myth";

export class AsyncWebSocket {
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

  // NOTE: This is not a "real" destructor, you have to call it manually.
  destructor() {
    console.log("Dropping socket");
    this.socket.close();
  }
}

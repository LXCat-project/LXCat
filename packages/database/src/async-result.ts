import { Result } from "true-myth";
import { err, ok } from "true-myth/result";

export class AsyncResult<Ok, Err> implements PromiseLike<Result<Ok, Err>> {
  constructor(private readonly promise: Promise<Result<Ok, Err>>) {}

  static liftResult<Ok, Err>(result: Result<Ok, Err>): AsyncResult<Ok, Err> {
    return new AsyncResult(Promise.resolve(result));
  }

  static fromThrowing<Ok, Err>(
    fn: () => Promise<Ok>,
    onErr: (err: unknown) => Promise<Err>,
  ): AsyncResult<Ok, Err> {
    return new AsyncResult((
      async (): Promise<Result<Ok, Err>> => {
        try {
          const result = await fn();
          return ok(result);
        } catch (error) {
          return err(await onErr(error));
        }
      }
    )());
  }

  andThen<NextOk, NextErr>(
    fn: (value: Ok) => PromiseLike<Result<NextOk, Err | NextErr>>,
  ): AsyncResult<NextOk, Err | NextErr> {
    return new AsyncResult(this.promise.then(async (result) => {
      if (result.isErr) {
        return result.cast();
      }

      return fn(result.value);
    }));
  }

  then<TResult1 = Result<Ok, Err>, TResult2 = never>(
    onfulfilled?:
      | ((value: Result<Ok, Err>) => TResult1 | PromiseLike<TResult1>)
      | null
      | undefined,
    onrejected?:
      | ((reason: any) => TResult2 | PromiseLike<TResult2>)
      | null
      | undefined,
  ): PromiseLike<TResult1 | TResult2> {
    return this.promise.then(onfulfilled, onrejected);
  }
}

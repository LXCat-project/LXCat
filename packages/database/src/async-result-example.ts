import { AsyncResult } from "./result.js";

const throwingFunction = async (arg: number): Promise<number> => {
  if (arg < 5) throw new Error(`Supplied number ${arg} is too low.`);
  return arg;
};

const safeFunction = (arg: number) =>
  AsyncResult.fromThrowing(
    () => throwingFunction(arg),
    async (error) => error as Error,
  );

const bad = await safeFunction(4);

if (bad.isErr) {
  console.log(bad.error);
}

const good = await safeFunction(6);

if (good.isOk) {
  console.log(good.value);
}

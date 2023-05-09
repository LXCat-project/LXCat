import { z } from "zod";
import { BolsigOutput } from "./io";

const Packet = <BodyType extends z.ZodTypeAny>(type: string, data: BodyType) =>
  z.object({ type: z.literal(type), data });

export const CountPacket = Packet("numdata", z.number().int().positive());
export const DataPacket = Packet("data", BolsigOutput);
export const ErrorPacket = Packet("error", z.string());
export const ClosePacket = z.object({ type: z.literal("close") });

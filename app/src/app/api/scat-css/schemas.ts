import { z } from "zod";

const stateFilterSchema = z.object(
  {
    particle: z.record(
      z.string(),
      z.object({
        charge: z.record(
          z.number(),
          z.object({
            electronic: z.record(
              z.string(),
              z.object({
                vibrational: z.record(
                  z.string(),
                  z.object({
                    rotational: z.array(z.string()),
                  }),
                ),
              }),
            ),
          }),
        ),
      }),
    ),
  },
);

export const querySchema = z.object({
  query: z.object({
    contributor: z.string(),
    tag: z.string(),
    offset: z.string().optional(),
    count: z.string().optional(),
  }),
  body: z.object({
    state: stateFilterSchema,
  }).optional(),
});

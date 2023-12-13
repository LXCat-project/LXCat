import { Reversible } from "@lxcat/database/item/picker";
import { z } from "zod";
import { reactionTemplateSchema } from "../schemas.openapi";

// FIXME: This is a magic value, maybe use PAGE_SIZE?
export const page_size = 100;

export const querySchema = z.object({
  query: z.object({
    offset: z.number().optional().describe(
      `Page number of first result, 1 page is ${page_size} entries long.`,
    ),
  }),
  body: z.object({
    reactions: z.array(reactionTemplateSchema).openapi({
      example: [
        {
          consumes: [
            {
              particle: "example1",
              electronic: "example2",
              vibrational: "example3",
              rotational: "example4",
            },
          ],
          produces: [
            {
              particle: "example1",
              electronic: "example2",
              vibrational: "example3",
              rotational: "example4",
            },
          ],
          reversible: Reversible.True,
          typeTags: ["Elastic", "Effective"],
          set: ["set1", "set2"],
        },
      ],
    }),
  }),
});

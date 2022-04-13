import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";

/*
 Test if typescript definition of CrossSection in concept can be converted to Zod

https://github.com/fabien0102/ts-to-zod could not handle generics so use JSON schema so looking for other possibilities.

Use https://stefanterdell.github.io/json-schema-to-zod-react/ to convert JSON schema
(schema/out/json/input/LXCatInput.schema.json) to zod

Actions performed after conversion
1. replace number enum with union of literal numbers

TODO chop CrossSectionInput into smaller pieces

*/

export const CrossSectionInput = z
  .object({
    complete: z.boolean(),
    contributor: z.string(),
    name: z.string(),
    description: z.string(),
    references: z.record(
      z.union([
        z
          .object({
            id: z.string(),
            type: z.enum([
              "article",
              "article-journal",
              "article-magazine",
              "article-newspaper",
              "bill",
              "book",
              "broadcast",
              "chapter",
              "dataset",
              "entry",
              "entry-dictionary",
              "entry-encyclopedia",
              "figure",
              "graphic",
              "interview",
              "legal_case",
              "legislation",
              "manuscript",
              "map",
              "motion_picture",
              "musical_score",
              "pamphlet",
              "paper-conference",
              "patent",
              "personal_communication",
              "post",
              "post-weblog",
              "report",
              "review",
              "review-book",
              "song",
              "speech",
              "thesis",
              "treaty",
              "webpage",
            ]),
            DOI: z.string().optional(),
            ISBN: z.string().optional(),
            ISSN: z.string().optional(),
            PMCID: z.string().optional(),
            PMID: z.string().optional(),
            URL: z.string().optional(),
            abstract: z.string().optional(),
            annote: z.string().optional(),
            archive: z.string().optional(),
            "archive-place": z.string().optional(),
            archive_location: z.string().optional(),
            authority: z.string().optional(),
            "call-number": z.string().optional(),
            "citation-label": z.string().optional(),
            "citation-number": z.string().optional(),
            "collection-title": z.string().optional(),
            "container-title": z.string().optional(),
            "container-title-short": z.string().optional(),
            dimensions: z.string().optional(),
            event: z.string().optional(),
            "event-place": z.string().optional(),
            "first-reference-note-number": z.string().optional(),
            genre: z.string().optional(),
            journalAbbreviation: z.string().optional(),
            jurisdiction: z.string().optional(),
            keyword: z.string().optional(),
            language: z.string().optional(),
            locator: z.string().optional(),
            medium: z.string().optional(),
            note: z.string().optional(),
            number: z.string().optional(),
            "original-publisher": z.string().optional(),
            "original-publisher-place": z.string().optional(),
            "original-title": z.string().optional(),
            page: z.string().optional(),
            "page-first": z.string().optional(),
            publisher: z.string().optional(),
            "publisher-place": z.string().optional(),
            references: z.string().optional(),
            "reviewed-title": z.string().optional(),
            scale: z.string().optional(),
            section: z.string().optional(),
            shortTitle: z.string().optional(),
            source: z.string().optional(),
            status: z.string().optional(),
            title: z.string().optional(),
            "title-short": z.string().optional(),
            version: z.string().optional(),
            "year-suffix": z.string().optional(),
            author: z
              .array(
                z.union([
                  z
                    .object({
                      family: z.string(),
                      given: z.string().optional(),
                      suffix: z.string().optional(),
                      "non-dropping-particle": z.string().optional(),
                      "dropping-particle": z.string().optional(),
                      literal: z.string().optional(),
                      sequence: z.enum(["first", "additional"]).optional(),
                    })
                    .strict(),
                  z
                    .object({
                      family: z.string().optional(),
                      given: z.string().optional(),
                      suffix: z.string().optional(),
                      "non-dropping-particle": z.string().optional(),
                      "dropping-particle": z.string().optional(),
                      literal: z.string(),
                      sequence: z.enum(["first", "additional"]).optional(),
                    })
                    .strict(),
                ])
              )
              .optional(),
            "collection-editor": z
              .array(
                z.union([
                  z
                    .object({
                      family: z.string(),
                      given: z.string().optional(),
                      suffix: z.string().optional(),
                      "non-dropping-particle": z.string().optional(),
                      "dropping-particle": z.string().optional(),
                      literal: z.string().optional(),
                      sequence: z.enum(["first", "additional"]).optional(),
                    })
                    .strict(),
                  z
                    .object({
                      family: z.string().optional(),
                      given: z.string().optional(),
                      suffix: z.string().optional(),
                      "non-dropping-particle": z.string().optional(),
                      "dropping-particle": z.string().optional(),
                      literal: z.string(),
                      sequence: z.enum(["first", "additional"]).optional(),
                    })
                    .strict(),
                ])
              )
              .optional(),
            composer: z
              .array(
                z.union([
                  z
                    .object({
                      family: z.string(),
                      given: z.string().optional(),
                      suffix: z.string().optional(),
                      "non-dropping-particle": z.string().optional(),
                      "dropping-particle": z.string().optional(),
                      literal: z.string().optional(),
                      sequence: z.enum(["first", "additional"]).optional(),
                    })
                    .strict(),
                  z
                    .object({
                      family: z.string().optional(),
                      given: z.string().optional(),
                      suffix: z.string().optional(),
                      "non-dropping-particle": z.string().optional(),
                      "dropping-particle": z.string().optional(),
                      literal: z.string(),
                      sequence: z.enum(["first", "additional"]).optional(),
                    })
                    .strict(),
                ])
              )
              .optional(),
            "container-author": z
              .array(
                z.union([
                  z
                    .object({
                      family: z.string(),
                      given: z.string().optional(),
                      suffix: z.string().optional(),
                      "non-dropping-particle": z.string().optional(),
                      "dropping-particle": z.string().optional(),
                      literal: z.string().optional(),
                      sequence: z.enum(["first", "additional"]).optional(),
                    })
                    .strict(),
                  z
                    .object({
                      family: z.string().optional(),
                      given: z.string().optional(),
                      suffix: z.string().optional(),
                      "non-dropping-particle": z.string().optional(),
                      "dropping-particle": z.string().optional(),
                      literal: z.string(),
                      sequence: z.enum(["first", "additional"]).optional(),
                    })
                    .strict(),
                ])
              )
              .optional(),
            director: z
              .array(
                z.union([
                  z
                    .object({
                      family: z.string(),
                      given: z.string().optional(),
                      suffix: z.string().optional(),
                      "non-dropping-particle": z.string().optional(),
                      "dropping-particle": z.string().optional(),
                      literal: z.string().optional(),
                      sequence: z.enum(["first", "additional"]).optional(),
                    })
                    .strict(),
                  z
                    .object({
                      family: z.string().optional(),
                      given: z.string().optional(),
                      suffix: z.string().optional(),
                      "non-dropping-particle": z.string().optional(),
                      "dropping-particle": z.string().optional(),
                      literal: z.string(),
                      sequence: z.enum(["first", "additional"]).optional(),
                    })
                    .strict(),
                ])
              )
              .optional(),
            editor: z
              .array(
                z.union([
                  z
                    .object({
                      family: z.string(),
                      given: z.string().optional(),
                      suffix: z.string().optional(),
                      "non-dropping-particle": z.string().optional(),
                      "dropping-particle": z.string().optional(),
                      literal: z.string().optional(),
                      sequence: z.enum(["first", "additional"]).optional(),
                    })
                    .strict(),
                  z
                    .object({
                      family: z.string().optional(),
                      given: z.string().optional(),
                      suffix: z.string().optional(),
                      "non-dropping-particle": z.string().optional(),
                      "dropping-particle": z.string().optional(),
                      literal: z.string(),
                      sequence: z.enum(["first", "additional"]).optional(),
                    })
                    .strict(),
                ])
              )
              .optional(),
            "editorial-director": z
              .array(
                z.union([
                  z
                    .object({
                      family: z.string(),
                      given: z.string().optional(),
                      suffix: z.string().optional(),
                      "non-dropping-particle": z.string().optional(),
                      "dropping-particle": z.string().optional(),
                      literal: z.string().optional(),
                      sequence: z.enum(["first", "additional"]).optional(),
                    })
                    .strict(),
                  z
                    .object({
                      family: z.string().optional(),
                      given: z.string().optional(),
                      suffix: z.string().optional(),
                      "non-dropping-particle": z.string().optional(),
                      "dropping-particle": z.string().optional(),
                      literal: z.string(),
                      sequence: z.enum(["first", "additional"]).optional(),
                    })
                    .strict(),
                ])
              )
              .optional(),
            illustrator: z
              .array(
                z.union([
                  z
                    .object({
                      family: z.string(),
                      given: z.string().optional(),
                      suffix: z.string().optional(),
                      "non-dropping-particle": z.string().optional(),
                      "dropping-particle": z.string().optional(),
                      literal: z.string().optional(),
                      sequence: z.enum(["first", "additional"]).optional(),
                    })
                    .strict(),
                  z
                    .object({
                      family: z.string().optional(),
                      given: z.string().optional(),
                      suffix: z.string().optional(),
                      "non-dropping-particle": z.string().optional(),
                      "dropping-particle": z.string().optional(),
                      literal: z.string(),
                      sequence: z.enum(["first", "additional"]).optional(),
                    })
                    .strict(),
                ])
              )
              .optional(),
            interviewer: z
              .array(
                z.union([
                  z
                    .object({
                      family: z.string(),
                      given: z.string().optional(),
                      suffix: z.string().optional(),
                      "non-dropping-particle": z.string().optional(),
                      "dropping-particle": z.string().optional(),
                      literal: z.string().optional(),
                      sequence: z.enum(["first", "additional"]).optional(),
                    })
                    .strict(),
                  z
                    .object({
                      family: z.string().optional(),
                      given: z.string().optional(),
                      suffix: z.string().optional(),
                      "non-dropping-particle": z.string().optional(),
                      "dropping-particle": z.string().optional(),
                      literal: z.string(),
                      sequence: z.enum(["first", "additional"]).optional(),
                    })
                    .strict(),
                ])
              )
              .optional(),
            "original-author": z
              .array(
                z.union([
                  z
                    .object({
                      family: z.string(),
                      given: z.string().optional(),
                      suffix: z.string().optional(),
                      "non-dropping-particle": z.string().optional(),
                      "dropping-particle": z.string().optional(),
                      literal: z.string().optional(),
                      sequence: z.enum(["first", "additional"]).optional(),
                    })
                    .strict(),
                  z
                    .object({
                      family: z.string().optional(),
                      given: z.string().optional(),
                      suffix: z.string().optional(),
                      "non-dropping-particle": z.string().optional(),
                      "dropping-particle": z.string().optional(),
                      literal: z.string(),
                      sequence: z.enum(["first", "additional"]).optional(),
                    })
                    .strict(),
                ])
              )
              .optional(),
            recipient: z
              .array(
                z.union([
                  z
                    .object({
                      family: z.string(),
                      given: z.string().optional(),
                      suffix: z.string().optional(),
                      "non-dropping-particle": z.string().optional(),
                      "dropping-particle": z.string().optional(),
                      literal: z.string().optional(),
                      sequence: z.enum(["first", "additional"]).optional(),
                    })
                    .strict(),
                  z
                    .object({
                      family: z.string().optional(),
                      given: z.string().optional(),
                      suffix: z.string().optional(),
                      "non-dropping-particle": z.string().optional(),
                      "dropping-particle": z.string().optional(),
                      literal: z.string(),
                      sequence: z.enum(["first", "additional"]).optional(),
                    })
                    .strict(),
                ])
              )
              .optional(),
            "reviewed-author": z
              .array(
                z.union([
                  z
                    .object({
                      family: z.string(),
                      given: z.string().optional(),
                      suffix: z.string().optional(),
                      "non-dropping-particle": z.string().optional(),
                      "dropping-particle": z.string().optional(),
                      literal: z.string().optional(),
                      sequence: z.enum(["first", "additional"]).optional(),
                    })
                    .strict(),
                  z
                    .object({
                      family: z.string().optional(),
                      given: z.string().optional(),
                      suffix: z.string().optional(),
                      "non-dropping-particle": z.string().optional(),
                      "dropping-particle": z.string().optional(),
                      literal: z.string(),
                      sequence: z.enum(["first", "additional"]).optional(),
                    })
                    .strict(),
                ])
              )
              .optional(),
            translator: z
              .array(
                z.union([
                  z
                    .object({
                      family: z.string(),
                      given: z.string().optional(),
                      suffix: z.string().optional(),
                      "non-dropping-particle": z.string().optional(),
                      "dropping-particle": z.string().optional(),
                      literal: z.string().optional(),
                      sequence: z.enum(["first", "additional"]).optional(),
                    })
                    .strict(),
                  z
                    .object({
                      family: z.string().optional(),
                      given: z.string().optional(),
                      suffix: z.string().optional(),
                      "non-dropping-particle": z.string().optional(),
                      "dropping-particle": z.string().optional(),
                      literal: z.string(),
                      sequence: z.enum(["first", "additional"]).optional(),
                    })
                    .strict(),
                ])
              )
              .optional(),
            "chapter-number": z.union([z.string(), z.number()]).optional(),
            "collection-number": z.union([z.string(), z.number()]).optional(),
            edition: z.union([z.string(), z.number()]).optional(),
            issue: z.union([z.string(), z.number()]).optional(),
            "number-of-pages": z.union([z.string(), z.number()]).optional(),
            "number-of-volumes": z.union([z.string(), z.number()]).optional(),
            volume: z.union([z.string(), z.number()]).optional(),
            accessed: z
              .union([
                z
                  .object({
                    "date-parts": z
                      .array(
                        z
                          .array(z.union([z.string(), z.number()]))
                          .min(1)
                          .max(3)
                      )
                      .min(1)
                      .max(2),
                    season: z
                      .union([
                        z.literal(1),
                        z.literal(2),
                        z.literal(3),
                        z.literal(4),
                        z.string(),
                      ])
                      .optional(),
                    circa: z.boolean().optional(),
                    raw: z.string().optional(),
                    literal: z.string().optional(),
                  })
                  .strict(),
                z
                  .object({
                    "date-parts": z
                      .array(
                        z
                          .array(z.union([z.string(), z.number()]))
                          .min(1)
                          .max(3)
                      )
                      .min(1)
                      .max(2)
                      .optional(),
                    season: z
                      .union([
                        z.literal(1),
                        z.literal(2),
                        z.literal(3),
                        z.literal(4),
                        z.string(),
                      ])
                      .optional(),
                    circa: z.boolean().optional(),
                    raw: z.string(),
                    literal: z.string().optional(),
                  })
                  .strict(),
                z
                  .object({
                    "date-parts": z
                      .array(
                        z
                          .array(z.union([z.string(), z.number()]))
                          .min(1)
                          .max(3)
                      )
                      .min(1)
                      .max(2)
                      .optional(),
                    season: z
                      .union([
                        z.literal(1),
                        z.literal(2),
                        z.literal(3),
                        z.literal(4),
                        z.string(),
                      ])
                      .optional(),
                    circa: z.boolean().optional(),
                    raw: z.string().optional(),
                    literal: z.string(),
                  })
                  .strict(),
              ])
              .optional(),
            container: z
              .union([
                z
                  .object({
                    "date-parts": z
                      .array(
                        z
                          .array(z.union([z.string(), z.number()]))
                          .min(1)
                          .max(3)
                      )
                      .min(1)
                      .max(2),
                    season: z
                      .union([
                        z.literal(1),
                        z.literal(2),
                        z.literal(3),
                        z.literal(4),
                        z.string(),
                      ])
                      .optional(),
                    circa: z.boolean().optional(),
                    raw: z.string().optional(),
                    literal: z.string().optional(),
                  })
                  .strict(),
                z
                  .object({
                    "date-parts": z
                      .array(
                        z
                          .array(z.union([z.string(), z.number()]))
                          .min(1)
                          .max(3)
                      )
                      .min(1)
                      .max(2)
                      .optional(),
                    season: z
                      .union([
                        z.literal(1),
                        z.literal(2),
                        z.literal(3),
                        z.literal(4),
                        z.string(),
                      ])
                      .optional(),
                    circa: z.boolean().optional(),
                    raw: z.string(),
                    literal: z.string().optional(),
                  })
                  .strict(),
                z
                  .object({
                    "date-parts": z
                      .array(
                        z
                          .array(z.union([z.string(), z.number()]))
                          .min(1)
                          .max(3)
                      )
                      .min(1)
                      .max(2)
                      .optional(),
                    season: z
                      .union([
                        z.literal(1),
                        z.literal(2),
                        z.literal(3),
                        z.literal(4),
                        z.string(),
                      ])
                      .optional(),
                    circa: z.boolean().optional(),
                    raw: z.string().optional(),
                    literal: z.string(),
                  })
                  .strict(),
              ])
              .optional(),
            "event-date": z
              .union([
                z
                  .object({
                    "date-parts": z
                      .array(
                        z
                          .array(z.union([z.string(), z.number()]))
                          .min(1)
                          .max(3)
                      )
                      .min(1)
                      .max(2),
                    season: z
                      .union([
                        z.literal(1),
                        z.literal(2),
                        z.literal(3),
                        z.literal(4),
                        z.string(),
                      ])
                      .optional(),
                    circa: z.boolean().optional(),
                    raw: z.string().optional(),
                    literal: z.string().optional(),
                  })
                  .strict(),
                z
                  .object({
                    "date-parts": z
                      .array(
                        z
                          .array(z.union([z.string(), z.number()]))
                          .min(1)
                          .max(3)
                      )
                      .min(1)
                      .max(2)
                      .optional(),
                    season: z
                      .union([
                        z.literal(1),
                        z.literal(2),
                        z.literal(3),
                        z.literal(4),
                        z.string(),
                      ])
                      .optional(),
                    circa: z.boolean().optional(),
                    raw: z.string(),
                    literal: z.string().optional(),
                  })
                  .strict(),
                z
                  .object({
                    "date-parts": z
                      .array(
                        z
                          .array(z.union([z.string(), z.number()]))
                          .min(1)
                          .max(3)
                      )
                      .min(1)
                      .max(2)
                      .optional(),
                    season: z
                      .union([
                        z.literal(1),
                        z.literal(2),
                        z.literal(3),
                        z.literal(4),
                        z.string(),
                      ])
                      .optional(),
                    circa: z.boolean().optional(),
                    raw: z.string().optional(),
                    literal: z.string(),
                  })
                  .strict(),
              ])
              .optional(),
            issued: z
              .union([
                z
                  .object({
                    "date-parts": z
                      .array(
                        z
                          .array(z.union([z.string(), z.number()]))
                          .min(1)
                          .max(3)
                      )
                      .min(1)
                      .max(2),
                    season: z
                      .union([
                        z.literal(1),
                        z.literal(2),
                        z.literal(3),
                        z.literal(4),
                        z.string(),
                      ])
                      .optional(),
                    circa: z.boolean().optional(),
                    raw: z.string().optional(),
                    literal: z.string().optional(),
                  })
                  .strict(),
                z
                  .object({
                    "date-parts": z
                      .array(
                        z
                          .array(z.union([z.string(), z.number()]))
                          .min(1)
                          .max(3)
                      )
                      .min(1)
                      .max(2)
                      .optional(),
                    season: z
                      .union([
                        z.literal(1),
                        z.literal(2),
                        z.literal(3),
                        z.literal(4),
                        z.string(),
                      ])
                      .optional(),
                    circa: z.boolean().optional(),
                    raw: z.string(),
                    literal: z.string().optional(),
                  })
                  .strict(),
                z
                  .object({
                    "date-parts": z
                      .array(
                        z
                          .array(z.union([z.string(), z.number()]))
                          .min(1)
                          .max(3)
                      )
                      .min(1)
                      .max(2)
                      .optional(),
                    season: z
                      .union([
                        z.literal(1),
                        z.literal(2),
                        z.literal(3),
                        z.literal(4),
                        z.string(),
                      ])
                      .optional(),
                    circa: z.boolean().optional(),
                    raw: z.string().optional(),
                    literal: z.string(),
                  })
                  .strict(),
              ])
              .optional(),
            "original-date": z
              .union([
                z
                  .object({
                    "date-parts": z
                      .array(
                        z
                          .array(z.union([z.string(), z.number()]))
                          .min(1)
                          .max(3)
                      )
                      .min(1)
                      .max(2),
                    season: z
                      .union([
                        z.literal(1),
                        z.literal(2),
                        z.literal(3),
                        z.literal(4),
                        z.string(),
                      ])
                      .optional(),
                    circa: z.boolean().optional(),
                    raw: z.string().optional(),
                    literal: z.string().optional(),
                  })
                  .strict(),
                z
                  .object({
                    "date-parts": z
                      .array(
                        z
                          .array(z.union([z.string(), z.number()]))
                          .min(1)
                          .max(3)
                      )
                      .min(1)
                      .max(2)
                      .optional(),
                    season: z
                      .union([
                        z.literal(1),
                        z.literal(2),
                        z.literal(3),
                        z.literal(4),
                        z.string(),
                      ])
                      .optional(),
                    circa: z.boolean().optional(),
                    raw: z.string(),
                    literal: z.string().optional(),
                  })
                  .strict(),
                z
                  .object({
                    "date-parts": z
                      .array(
                        z
                          .array(z.union([z.string(), z.number()]))
                          .min(1)
                          .max(3)
                      )
                      .min(1)
                      .max(2)
                      .optional(),
                    season: z
                      .union([
                        z.literal(1),
                        z.literal(2),
                        z.literal(3),
                        z.literal(4),
                        z.string(),
                      ])
                      .optional(),
                    circa: z.boolean().optional(),
                    raw: z.string().optional(),
                    literal: z.string(),
                  })
                  .strict(),
              ])
              .optional(),
            submitted: z
              .union([
                z
                  .object({
                    "date-parts": z
                      .array(
                        z
                          .array(z.union([z.string(), z.number()]))
                          .min(1)
                          .max(3)
                      )
                      .min(1)
                      .max(2),
                    season: z
                      .union([
                        z.literal(1),
                        z.literal(2),
                        z.literal(3),
                        z.literal(4),
                        z.string(),
                      ])
                      .optional(),
                    circa: z.boolean().optional(),
                    raw: z.string().optional(),
                    literal: z.string().optional(),
                  })
                  .strict(),
                z
                  .object({
                    "date-parts": z
                      .array(
                        z
                          .array(z.union([z.string(), z.number()]))
                          .min(1)
                          .max(3)
                      )
                      .min(1)
                      .max(2)
                      .optional(),
                    season: z
                      .union([
                        z.literal(1),
                        z.literal(2),
                        z.literal(3),
                        z.literal(4),
                        z.string(),
                      ])
                      .optional(),
                    circa: z.boolean().optional(),
                    raw: z.string(),
                    literal: z.string().optional(),
                  })
                  .strict(),
                z
                  .object({
                    "date-parts": z
                      .array(
                        z
                          .array(z.union([z.string(), z.number()]))
                          .min(1)
                          .max(3)
                      )
                      .min(1)
                      .max(2)
                      .optional(),
                    season: z
                      .union([
                        z.literal(1),
                        z.literal(2),
                        z.literal(3),
                        z.literal(4),
                        z.string(),
                      ])
                      .optional(),
                    circa: z.boolean().optional(),
                    raw: z.string().optional(),
                    literal: z.string(),
                  })
                  .strict(),
              ])
              .optional(),
          })
          .strict(),
        z.string(),
      ])
    ),
    states: z.record(
      z.union([
        z
          .object({
            electronic: z
              .array(
                z.union([
                  z.object({ e: z.string() }).strict(),
                  z
                    .object({
                      scheme: z.literal("LS"),
                      config: z.array(
                        z
                          .object({
                            n: z.number(),
                            l: z.number(),
                            occupance: z.number(),
                          })
                          .strict()
                      ),
                      term: z
                        .object({
                          J: z.number(),
                          L: z.number(),
                          S: z.number(),
                          // convertor produced
                          // P: z.enum([-1, 1]),
                          P: z.union([z.literal(-1), z.literal(1)]),
                        })
                        .strict(),
                    })
                    .strict(),
                ])
              )
              .min(1),
            type: z.literal("AtomLS"),
            particle: z.string(),
            charge: z.number(),
          })
          .strict(),
        z
          .object({
            electronic: z
              .array(
                z.union([
                  z.object({ e: z.string() }).strict(),
                  z
                    .object({
                      scheme: z.literal("J1L2"),
                      config: z
                        .object({
                          core: z
                            .object({
                              scheme: z.literal("LS"),
                              config: z.array(
                                z
                                  .object({
                                    n: z.number(),
                                    l: z.number(),
                                    occupance: z.number(),
                                  })
                                  .strict()
                              ),
                              term: z
                                .object({
                                  J: z.number(),
                                  L: z.number(),
                                  S: z.number(),
                                  // convertor produced
                                  // P: z.enum([-1, 1]),
                                  P: z.union([z.literal(-1), z.literal(1)]),
                                })
                                .strict(),
                            })
                            .strict(),
                          excited: z
                            .object({
                              scheme: z.literal("LS"),
                              config: z.array(
                                z
                                  .object({
                                    n: z.number(),
                                    l: z.number(),
                                    occupance: z.number(),
                                  })
                                  .strict()
                              ),
                              term: z
                                .object({
                                  L: z.number(),
                                  S: z.number(),
                                  // convertor produced
                                  // P: z.enum([-1, 1]),
                                  P: z.union([z.literal(-1), z.literal(1)]),
                                })
                                .strict(),
                            })
                            .strict(),
                        })
                        .strict(),
                      term: z
                        .object({
                          J: z.number(),
                          K: z.number(),
                          S: z.number(),
                          P: z.number(),
                        })
                        .strict(),
                    })
                    .strict(),
                ])
              )
              .min(1),
            type: z.literal("AtomJ1L2"),
            particle: z.string(),
            charge: z.number(),
          })
          .strict(),
        z
          .object({
            electronic: z
              .array(
                z.union([
                  z.object({ e: z.string() }).strict(),
                  z
                    .object({
                      scheme: z.literal("LS1"),
                      config: z
                        .object({
                          core: z
                            .object({
                              scheme: z.literal("LS"),
                              config: z.array(
                                z
                                  .object({
                                    n: z.number(),
                                    l: z.number(),
                                    occupance: z.number(),
                                  })
                                  .strict()
                              ),
                              term: z
                                .object({
                                  L: z.number(),
                                  S: z.number(),
                                  // convertor produced
                                  // P: z.enum([-1, 1]),
                                  P: z.union([z.literal(-1), z.literal(1)]),
                                })
                                .strict(),
                            })
                            .strict(),
                          excited: z
                            .object({
                              scheme: z.literal("LS"),
                              config: z.array(
                                z
                                  .object({
                                    n: z.number(),
                                    l: z.number(),
                                    occupance: z.number(),
                                  })
                                  .strict()
                              ),
                              term: z
                                .object({
                                  L: z.number(),
                                  S: z.number(),
                                  // convertor produced
                                  // P: z.enum([-1, 1]),
                                  P: z.union([z.literal(-1), z.literal(1)]),
                                })
                                .strict(),
                            })
                            .strict(),
                        })
                        .strict(),
                      term: z
                        .object({
                          J: z.number(),
                          L: z.number(),
                          K: z.number(),
                          S: z.number(),
                          // convertor produced
                          // P: z.enum([-1, 1]),
                          P: z.union([z.literal(-1), z.literal(1)]),
                        })
                        .strict(),
                    })
                    .strict(),
                ])
              )
              .min(1),
            type: z.literal("AtomLS1"),
            particle: z.string(),
            charge: z.number(),
          })
          .strict(),
        z
          .object({
            electronic: z
              .array(
                z.union([
                  z.object({ e: z.string() }).strict(),
                  z
                    .object({
                      vibrational: z
                        .array(
                          z.union([
                            z.object({ v: z.string() }).strict(),
                            z
                              .object({
                                rotational: z
                                  .array(
                                    z.union([
                                      z.object({ J: z.string() }).strict(),
                                      z.object({ J: z.number() }).strict(),
                                    ])
                                  )
                                  .min(1)
                                  .optional(),
                                v: z.number(),
                              })
                              .strict(),
                          ])
                        )
                        .min(1)
                        .optional(),
                      parity: z.enum(["g", "u"]),
                      e: z.string(),
                      Lambda: z.number(),
                      S: z.number(),
                      reflection: z.enum(["-", "+"]).optional(),
                    })
                    .strict(),
                ])
              )
              .min(1),
            type: z.literal("HomonuclearDiatom"),
            particle: z.string(),
            charge: z.number(),
          })
          .strict(),
        z
          .object({
            electronic: z
              .array(
                z.union([
                  z.object({ e: z.string() }).strict(),
                  z
                    .object({
                      vibrational: z
                        .array(
                          z.union([
                            z.object({ v: z.string() }).strict(),
                            z
                              .object({
                                rotational: z
                                  .array(
                                    z.union([
                                      z.object({ J: z.string() }).strict(),
                                      z.object({ J: z.number() }).strict(),
                                    ])
                                  )
                                  .min(1)
                                  .optional(),
                                v: z.number(),
                              })
                              .strict(),
                          ])
                        )
                        .min(1)
                        .optional(),
                      e: z.string(),
                      Lambda: z.number(),
                      S: z.number(),
                      reflection: z.enum(["-", "+"]).optional(),
                    })
                    .strict(),
                ])
              )
              .min(1),
            type: z.literal("HeteronuclearDiatom"),
            particle: z.string(),
            charge: z.number(),
          })
          .strict(),
        z
          .object({
            electronic: z
              .array(
                z.union([
                  z.object({ e: z.string() }).strict(),
                  z
                    .object({
                      vibrational: z
                        .array(
                          z.union([
                            z.object({ v: z.string() }).strict(),
                            z
                              .object({
                                rotational: z
                                  .array(
                                    z.union([
                                      z.object({ J: z.string() }).strict(),
                                      z.object({ J: z.number() }).strict(),
                                    ])
                                  )
                                  .min(1)
                                  .optional(),
                                v: z.array(z.number()),
                              })
                              .strict(),
                          ])
                        )
                        .min(1)
                        .optional(),
                      parity: z.enum(["g", "u"]),
                      e: z.string(),
                      Lambda: z.number(),
                      S: z.number(),
                      reflection: z.enum(["-", "+"]).optional(),
                    })
                    .strict(),
                ])
              )
              .min(1),
            type: z.literal("LinearTriatomInversionCenter"),
            particle: z.string(),
            charge: z.number(),
          })
          .strict(),
        z.object({ particle: z.string(), charge: z.number() }).strict(),
      ])
    ),
    processes: z.array(
      z
        .object({
          type: z.literal("LUT"),
          labels: z.array(z.string()).min(2).max(2),
          units: z.array(z.string()).min(2).max(2),
          data: z.array(z.array(z.number()).min(2).max(2)),
          reaction: z
            .object({
              lhs: z.array(
                z.object({ count: z.number(), state: z.string() }).strict()
              ),
              rhs: z.array(
                z.object({ count: z.number(), state: z.string() }).strict()
              ),
              reversible: z.boolean(),
              type_tags: z.array(
                z.enum([
                  "Elastic",
                  "Effective",
                  "Electronic",
                  "Vibrational",
                  "Rotational",
                  "Attachment",
                  "Ionization",
                ])
              ),
            })
            .strict(),
          parameters: z
            .object({
              mass_ratio: z.number().optional(),
              statistical_weight_ratio: z.number().optional(),
            })
            .strict()
            .optional(),
          reference: z.array(z.string()).optional(),
          threshold: z.number(),
        })
        .strict()
    ),
  })
  .strict();

export type CrossSectionInput = z.infer<typeof CrossSectionInput>

export const CrossSectionInputAsJsonSchema = zodToJsonSchema(CrossSectionInput)

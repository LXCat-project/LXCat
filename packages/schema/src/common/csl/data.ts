// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { z } from "zod";
import { CSLDateVariable } from "./date-variable";
import { CSLNameVariable } from "./name-variable";

export const CSLData = z
  .object({
    type: z.enum([
      "article",
      "article-journal",
      "article-magazine",
      "article-newspaper",
      "bill",
      "book",
      "broadcast",
      "chapter",
      "classic",
      "collection",
      "dataset",
      "document",
      "entry",
      "entry-dictionary",
      "entry-encyclopedia",
      "event",
      "figure",
      "graphic",
      "hearing",
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
      "performance",
      "periodical",
      "personal_communication",
      "post",
      "post-weblog",
      "regulation",
      "report",
      "review",
      "review-book",
      "software",
      "song",
      "speech",
      "standard",
      "thesis",
      "treaty",
      "webpage",
    ]),
    id: z.union([z.string(), z.number()]),
    "citation-key": z.string().optional(),
    categories: z.array(z.string()).optional(),
    language: z.string().optional(),
    journalAbbreviation: z.string().optional(),
    shortTitle: z.string().optional(),
    author: z.array(CSLNameVariable).optional(),
    chair: z.array(CSLNameVariable).optional(),
    "collection-editor": z.array(CSLNameVariable).optional(),
    compiler: z.array(CSLNameVariable).optional(),
    composer: z.array(CSLNameVariable).optional(),
    "container-author": z.array(CSLNameVariable).optional(),
    contributor: z.array(CSLNameVariable).optional(),
    curator: z.array(CSLNameVariable).optional(),
    director: z.array(CSLNameVariable).optional(),
    editor: z.array(CSLNameVariable).optional(),
    "editorial-director": z.array(CSLNameVariable).optional(),
    "executive-producer": z.array(CSLNameVariable).optional(),
    guest: z.array(CSLNameVariable).optional(),
    host: z.array(CSLNameVariable).optional(),
    interviewer: z.array(CSLNameVariable).optional(),
    illustrator: z.array(CSLNameVariable).optional(),
    narrator: z.array(CSLNameVariable).optional(),
    organizer: z.array(CSLNameVariable).optional(),
    "original-author": z.array(CSLNameVariable).optional(),
    performer: z.array(CSLNameVariable).optional(),
    producer: z.array(CSLNameVariable).optional(),
    recipient: z.array(CSLNameVariable).optional(),
    "reviewed-author": z.array(CSLNameVariable).optional(),
    "script-writer": z.array(CSLNameVariable).optional(),
    "series-creator": z.array(CSLNameVariable).optional(),
    translator: z.array(CSLNameVariable).optional(),
    accessed: CSLDateVariable.optional(),
    "available-date": CSLDateVariable.optional(),
    "event-date": CSLDateVariable.optional(),
    issued: CSLDateVariable.optional(),
    "original-date": CSLDateVariable.optional(),
    submitted: CSLDateVariable.optional(),
    abstract: z.string().optional(),
    annote: z.string().optional(),
    archive: z.string().optional(),
    archive_collection: z.string().optional(),
    archive_location: z.string().optional(),
    "archive-place": z.string().optional(),
    authority: z.string().optional(),
    "call-number": z.string().optional(),
    "chapter-number": z.union([z.string(), z.number()]).optional(),
    "citation-number": z.union([z.string(), z.number()]).optional(),
    "citation-label": z.string().optional(),
    "collection-number": z.union([z.string(), z.number()]).optional(),
    "collection-title": z.string().optional(),
    "container-title": z.string().optional(),
    "container-title-short": z.string().optional(),
    dimensions: z.string().optional(),
    division: z.string().optional(),
    DOI: z.string().optional(),
    edition: z.union([z.string(), z.number()]).optional(),
    event: z
      .string()
      .describe(
        "[Deprecated - use 'event-title' instead. Will be removed in 1.1]",
      )
      .optional(),
    "event-title": z.string().optional(),
    "event-place": z.string().optional(),
    "first-reference-note-number": z
      .union([z.string(), z.number()])
      .optional(),
    genre: z.string().optional(),
    ISBN: z.string().optional(),
    ISSN: z.string().optional(),
    issue: z.union([z.string(), z.number()]).optional(),
    jurisdiction: z.string().optional(),
    keyword: z.string().optional(),
    locator: z.union([z.string(), z.number()]).optional(),
    medium: z.string().optional(),
    note: z.string().optional(),
    number: z.union([z.string(), z.number()]).optional(),
    "number-of-pages": z.union([z.string(), z.number()]).optional(),
    "number-of-volumes": z.union([z.string(), z.number()]).optional(),
    "original-publisher": z.string().optional(),
    "original-publisher-place": z.string().optional(),
    "original-title": z.string().optional(),
    page: z.union([z.string(), z.number()]).optional(),
    "page-first": z.union([z.string(), z.number()]).optional(),
    part: z.union([z.string(), z.number()]).optional(),
    "part-title": z.string().optional(),
    PMCID: z.string().optional(),
    PMID: z.string().optional(),
    printing: z.union([z.string(), z.number()]).optional(),
    publisher: z.string().optional(),
    "publisher-place": z.string().optional(),
    references: z.string().optional(),
    "reviewed-genre": z.string().optional(),
    "reviewed-title": z.string().optional(),
    scale: z.string().optional(),
    section: z.string().optional(),
    source: z.string().optional(),
    status: z.string().optional(),
    supplement: z.union([z.string(), z.number()]).optional(),
    title: z.string().optional(),
    "title-short": z.string().optional(),
    URL: z.string().optional(),
    version: z.string().optional(),
    volume: z.union([z.string(), z.number()]).optional(),
    "volume-title": z.string().optional(),
    "volume-title-short": z.string().optional(),
    "year-suffix": z.string().optional(),
    custom: z
      .record(z.any())
      .describe(
        "Used to store additional information that does not have a designated CSL JSON field. The custom field is preferred over the note field for storing custom data, particularly for storing key-value pairs, as the note field is used for user annotations in annotated bibliography styles.",
      )
      .optional(),
  })
  .describe("Zod schema for CSL input data");
export type CSLData = z.infer<typeof CSLData>;
import { NextApiResponse } from "next";
import nc from "next-connect";
import {
  AuthRequest,
  hasDeveloperRole,
  hasSessionOrAPIToken,
} from "../../../../auth/middleware";
import { byIdJSON } from "@lxcat/database/dist/css/queries/public";
import {Cite} from '@citation-js/core'
import '@citation-js/plugin-bibtex'

const handler = nc<AuthRequest, NextApiResponse>()
  .use(hasSessionOrAPIToken)
  .use(hasDeveloperRole)
  .get(async (req, res) => {
    const { id } = req.query;
    if (typeof id === "string") {
      const data = await byIdJSON(id);
      if (data) {
        const references = Object.fromEntries(
          Object.entries(data.references).map(([key, reference]) => {
            const bib = new Cite(reference, {
              forceType: "@csl/object",
            }).format("bibliography", {
              format: "text",
              template: "apa",
            });
            if (typeof bib === "string") {
              return [key, bib];
            }
            return [key, Object.values(bib).pop()];
          })
        );
        const { convertDocument } = await import("@lxcat/converter");
        res.setHeader("Content-Type", "text/plain");
        res.setHeader(
          "Content-Disposition",
          `attachment;filename="${data.name}.txt"`
        );
        res.send(convertDocument({ ...data, references }));
      } else {
        res.status(404).end("Not found");
      }
    }
  });

export default handler;

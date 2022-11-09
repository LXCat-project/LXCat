import { NextApiResponse } from "next";
import nc from "next-connect";
import {
  AuthRequest,
  hasDeveloperOrDownloadRole,
  hasSessionOrAPIToken,
} from "../../../../auth/middleware";
import { byIdJSON } from "@lxcat/database/dist/css/queries/public";
import { Cite } from "@citation-js/core";
import "@citation-js/plugin-bibtex";
import { applyCORS } from "../../../../shared/cors";
import { reference2bibliography } from "../../../../shared/cite";

const handler = nc<AuthRequest, NextApiResponse>()
  .use(applyCORS)
  .use(hasSessionOrAPIToken)
  .use(hasDeveloperOrDownloadRole)
  .get(async (req, res) => {
    const { id, refstyle = "csl" } = req.query;
    if (typeof id === "string") {
      const data = await byIdJSON(id);

      if (data === undefined) {
        res.status(404).end("Not found");
        return;
      }

      if (refstyle === "csl") {
      } else if (refstyle === "bibtex") {
        (data as any).references = Object.fromEntries(
          Object.entries(data.references).map(([key, value]) => {
            const cite = new Cite(value);
            return [key, cite.format("bibtex")];
          })
        );
      } else if (refstyle === "apa") {
        (data as any).references = Object.fromEntries(
          Object.entries(data.references).map(([key, value]) => {
            const bib = reference2bibliography(value);
            return [key, bib];
          })
        );
      } else {
        res.send(
          `Incorrect reference style found: ${refstyle}. Expected csl or apa or bibtex.`
        );
      }
      res.json(data);
    }
  });

export default handler;

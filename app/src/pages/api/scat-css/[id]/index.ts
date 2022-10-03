import { NextApiResponse } from "next";
import nc from "next-connect";
import {
  AuthRequest,
  hasDeveloperRole,
  hasSessionOrAPIToken,
} from "../../../../auth/middleware";
import { byIdJSON } from "@lxcat/database/dist/css/queries/public";
import Cite from "citation-js";

const handler = nc<AuthRequest, NextApiResponse>()
  .use(hasSessionOrAPIToken)
  .use(hasDeveloperRole)
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
            const cite = new Cite(value);
            return [key, cite.format("bibliography")];
          })
        );
      } else {
        res.send(
          `Incorrect reference style found: ${refstyle}. Expected csl or bibtex.`
        );
      }
      res.json(data);
    }
  });

export default handler;

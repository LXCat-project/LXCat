import { NextApiResponse } from "next";
import nc from "next-connect";
import {
  AuthRequest,
  hasDeveloperRole,
  hasSessionOrAPIToken,
} from "../../../../auth/middleware";
import { byIdJSON } from "@lxcat/database/dist/css/queries/public";
import { Dict } from "@lxcat/schema/dist/core/util";
import Cite from "citation-js";

const handler = nc<AuthRequest, NextApiResponse>()
  .use(hasSessionOrAPIToken)
  .use(hasDeveloperRole)
  .get(async (req, res) => {
    const { id } = req.query;
    if (typeof id === "string") {
      const data = await byIdJSON(id);
      if (data) {
        const references = Object.entries(data.references).reduce(
          (map: Dict<string>, [key, reference]) => ({
            ...map,
            [key]: new Cite(reference).format("bibliography").slice(0, -1),
          }),
          {}
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

import { NextApiRequest, NextApiResponse } from "next";
import nc from "next-connect";
import CrossSectionSetInputAsJsonSchema from "@lxcat/schema/dist/schemas/CrossSectionSet.schema.json";

// Route to host JSON schema of CrossSectionSet
const handler = nc<NextApiRequest, NextApiResponse>().get(async (_req, res) => {
  res.json(CrossSectionSetInputAsJsonSchema);
});

export default handler;

import { NextApiRequest, NextApiResponse } from "next";
import nc from "next-connect";
import CrossSectionInputAsJsonSchema from "../../../generated/input/CrossSection.schema.json"

const handler = nc<NextApiRequest, NextApiResponse>()
    .get(async (_req, res) => {
        res.json(CrossSectionInputAsJsonSchema)
    })

export default handler
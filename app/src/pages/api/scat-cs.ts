import { NextApiRequest, NextApiResponse } from "next";
import nc from "next-connect";
import { search, validFacets } from "../../ScatteringCrossSection/db";

const handler = nc<NextApiRequest, NextApiResponse>()
    .post(async (req, res) => {
        const selected = JSON.parse(req.body)
        const data = await search(selected)
        const facets = await validFacets(selected)
        res.json({
            data,
            validFacets: facets
        })
    })

export default handler
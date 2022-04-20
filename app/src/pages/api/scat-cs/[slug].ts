import { NextApiResponse } from "next";
import nc from "next-connect";
import { AuthRequest, hasSessionOrAPIToken } from "../../../auth/middleware";
// import { byId } from "../../../ScatteringCrossSection/db";


const handler = nc<AuthRequest, NextApiResponse>()
    .use(hasSessionOrAPIToken)
    .get(async (req, res) => {
        const {slug} = req.query
        // TODO implement db methods
        // const data = await byId(Number(slug))
        const data = {slug}
        res.json(data)
    })

export default handler
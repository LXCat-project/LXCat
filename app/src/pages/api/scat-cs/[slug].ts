import { NextApiResponse } from "next";
import nc from "next-connect";
import { AuthRequest, hasSessionOrAPIToken } from "../../../auth/middleware";
import { byId } from "../../../ScatteringCrossSection/db";


const handler = nc<AuthRequest, NextApiResponse>()
    .use(hasSessionOrAPIToken)
    .get(async (req, res) => {
        console.log(req.user)
        const {slug} = req.query
        const data = await byId(Number(slug))
        res.json(data)
    })

export default handler
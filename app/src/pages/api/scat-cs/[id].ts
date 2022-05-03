import { NextApiResponse } from "next";
import nc from "next-connect";
import { AuthRequest, hasAuthorRole, hasSessionOrAPIToken } from "../../../auth/middleware";
import { byId } from "../../../ScatteringCrossSection/queries";


const handler = nc<AuthRequest, NextApiResponse>()
    .use(hasSessionOrAPIToken)
    .use(hasAuthorRole)
    .get(async (req, res) => {
        const {id} = req.query
        if (typeof id === 'string') {
            const data = await byId(id)
            res.json(data)
        }
        // TODO else case string[]
    })

export default handler
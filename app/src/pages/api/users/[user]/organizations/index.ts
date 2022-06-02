import { NextApiResponse } from "next";
import nc from "next-connect";
import { AuthRequest, hasAdminRole, hasSession } from "../../../../../auth/middleware";
import { makeMemberless } from "../../../../../auth/queries";


const handler = nc<AuthRequest, NextApiResponse>()
    .use(hasSession)
    .use(hasAdminRole)
    .delete(async (req, res) => {
        const {user: userKey } = req.query
        if (typeof userKey === 'string') {
            await makeMemberless(userKey)
            res.status(204).send('')
        }
    })

export default handler
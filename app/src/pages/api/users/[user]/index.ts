// TODO switch from fast-jwt to jose as jose is already used by next-auth
import { NextApiResponse } from "next";
import nc from "next-connect";
import { dropUser } from "../../../../auth/db";
import { AuthRequest, hasAdminRole, hasSession } from "../../../../auth/middleware";


const handler = nc<AuthRequest, NextApiResponse>()
    .use(hasSession)
    .use(hasAdminRole)
    .delete(async (req, res) => {
        const {user: userId } = req.query
        if (typeof userId === 'string') {
            await dropUser(userId)
        }
    })

export default handler
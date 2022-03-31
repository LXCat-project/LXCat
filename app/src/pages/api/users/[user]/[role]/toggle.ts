// TODO switch from fast-jwt to jose as jose is already used by next-auth
import { NextApiResponse } from "next";
import nc from "next-connect";
import { toggleRole } from "../../../../../auth/db";
import { AuthRequest, hasAdminRole, hasSession } from "../../../../../auth/middleware";
import { Role } from "../../../../../auth/schema";


const handler = nc<AuthRequest, NextApiResponse>()
    .use(hasSession)
    .use(hasAdminRole)
    .post(async (req, res) => {
        const {user: userId, role } = req.query
        if (typeof userId === 'string') {
            const user = await toggleRole(userId, Role.parse(role))
            return res.json(user)
        }
    })

export default handler
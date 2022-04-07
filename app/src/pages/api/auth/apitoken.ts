// TODO switch from fast-jwt to jose as jose is already used by next-auth
import { createSigner } from "fast-jwt";
import { NextApiResponse } from "next";
import nc from "next-connect";
import { AuthRequest, hasDeveloperRole, hasSession } from "../../../auth/middleware";

const signer = createSigner({ key: async () => process.env.NEXTAUTH_SECRET })

const handler = nc<AuthRequest, NextApiResponse>()
    .use(hasSession)
    .use(hasDeveloperRole)
    .get(async (req, res) => {
        const user = req.user
        if (!user || 'iat' in user) {
            throw Error('How did you get here?')
        }
        const apiToken = await signer({
            // TODO use _key from db instead of user supplied info like email
            email: user.email,
            roles: user.roles
        })
        res.json(apiToken)
    })

export default handler
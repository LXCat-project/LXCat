// TODO switch from fast-jwt to jose as jose is already used by next-auth
import { createSigner } from "fast-jwt";
import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import nc from "next-connect";
import { AuthRequest, hasSession } from "../../../auth/middleware";

const signer = createSigner({ key: async () => process.env.NEXTAUTH_SECRET })

const handler = nc<AuthRequest, NextApiResponse>()
    .use(hasSession)
    .get(async (req, res) => {
        const apiToken = await signer({
            // TODO use _key from db instead of user supplied info like email
            email: req.user?.email
        })
        res.json(apiToken)
    })

export default handler
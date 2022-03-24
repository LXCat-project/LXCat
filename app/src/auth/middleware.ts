import { Session } from "next-auth";
import { getSession } from "next-auth/react";
import { createVerifier } from "fast-jwt";
import { NextApiRequest, NextApiResponse } from "next";
import { RequestHandler } from "next-connect";

const secret = process.env.NEXTAUTH_SECRET
const verifier = createVerifier({ key: async () => secret })


interface JwtPayload {
    email: string
    iat: number
}

export interface AuthRequest extends NextApiRequest {
    user?: Session["user"] | JwtPayload
}

/**
 * Middleware to check if request contains an authenticated session or valid jwt.
 * Sets `user` property in `req` or returns 401.
 */
export const hasSessionOrJwt: RequestHandler<AuthRequest, NextApiResponse> = async (req, res, next) => {
    const session = await getSession({ req })
    if (session?.user) {
        req.user = session.user
        next()
    }
    if (req.headers.authorization?.split(' ')[0] === 'Bearer') {
        const token1 = req.headers.authorization.split(' ')[1]
        const session1: JwtPayload = await verifier(token1)
        req.user = session1
        next()
    }
    res.status(401)
        .setHeader('WWW-Authenticate', 'Bearer, OAuth')
        .end('Not authorized.')
}

/**
 * Middleware to check if request contains an authenticated session.
 * Sets `user` property in `req` or returns 401.
 */
 export const hasSession: RequestHandler<AuthRequest, NextApiResponse> = async (req, res, next) => {
    const session = await getSession({ req })
    if (session?.user) {
        req.user = session.user
        next()
    }
    res.status(401)
        .setHeader('WWW-Authenticate', 'OAuth')
        .end('Not authorized.')
}
import { Session } from "next-auth";
import { getSession } from "next-auth/react";
import { createVerifier } from "fast-jwt";
import { NextApiRequest, NextApiResponse } from "next";
import { RequestHandler } from "next-connect";
import { Role } from "./schema";


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
 * Middleware to check if request contains an authenticated session or valid API token.
 * Sets `user` property in `req` or returns 401.
 */
export const hasSessionOrAPIToken: RequestHandler<AuthRequest, NextApiResponse> = async (req, res, next) => {
    const session = await getSession({ req })
    if (session?.user) {
        req.user = session.user
        next()
        return
    }
    if (req.headers.authorization?.split(' ')[0] === 'Bearer') {
        const token1 = req.headers.authorization.split(' ')[1]
        const session1: JwtPayload = await verifier(token1)
        req.user = session1
        next()
        return
    }
    res.status(401)
        .setHeader('WWW-Authenticate', 'Bearer, OAuth')
        .end('Unauthorized')
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
        return
    }
    res.status(401)
        .setHeader('WWW-Authenticate', 'OAuth')
        .end('Unauthorized')
}

/**
 * Middleware to check if user has admin role.
 * Returns 403 when user does not have admin role.
 */
export const hasAdminRole: RequestHandler<AuthRequest, NextApiResponse> = async (req, res, next) => {
    if (req.user) {
        if ('roles' in req.user && req.user.roles!.includes(Role.enum.admin)) {
            next()
        } else {
            res.status(403)
                .end('Forbidden')
        }
    } else {
        res.status(401)
            .setHeader('WWW-Authenticate', 'OAuth')
            .end('Unauthorized')
    }
}

/**
 * Middleware to check if user has developer role.
 * Returns 403 when user does not have developer role.
 */
 export const hasDeveloperRole: RequestHandler<AuthRequest, NextApiResponse> = async (req, res, next) => {
    if (req.user) {
        if ('roles' in req.user && req.user.roles!.includes(Role.enum.developer)) {
            next()
        } else {
            res.status(403)
                .end('Forbidden')
        }
    } else {
        res.status(401)
            .setHeader('WWW-Authenticate', 'OAuth')
            .end('Unauthorized')
    }
}
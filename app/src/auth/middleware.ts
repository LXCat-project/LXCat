// SPDX-FileCopyrightText: LXCat developer team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
  Session,
  unstable_getServerSession as getServerSession,
} from "next-auth";
import {
  GetServerSidePropsContext,
  NextApiRequest,
  NextApiResponse,
  PreviewData,
} from "next";
import { RequestHandler } from "next-connect";
import { Role } from "@lxcat/database/dist/auth/schema";
import { decode } from "next-auth/jwt";
import { options } from "./options";
import { ParsedUrlQuery } from "querystring";
import { DOWNLOAD_COOKIE_NAME } from "../shared/download";

interface JwtPayload {
  email: string;
  roles: Role[];
}

export interface AuthRequest extends NextApiRequest {
  user: Session["user"] | JwtPayload;
}

/**
 * API Middleware to check if request contains an authenticated session, a valid download token in cookie or valid API token.
 * Sets `user` property in `req` or returns 401.
 */
export const hasSessionOrAPIToken: RequestHandler<
  AuthRequest,
  NextApiResponse
> = async (req, res, next) => {
  const session = await getServerSession(req, res, options);
  if (session?.user) {
    req.user = session.user;
    next();
    return;
  }
  if (DOWNLOAD_COOKIE_NAME in req.cookies) {
    const secret = process.env.NEXTAUTH_SECRET!;
    const token = req.cookies[DOWNLOAD_COOKIE_NAME];
    const session2 = await decode({ token, secret });
    if (session2 !== null) {
      req.user = {
        roles: session2.roles as Role[],
        email: session2.email as string,
      };
      next();
      return;
    }
  }
  if (req.headers.authorization?.split(" ")[0] === "Bearer") {
    const token = req.headers.authorization.split(" ")[1];
    const secret = process.env.NEXTAUTH_SECRET!;
    const session1 = await decode({ token, secret });
    if (session1 !== null) {
      req.user = {
        roles: session1.roles as Role[],
        email: session1.email as string,
      };
      next();
      return;
    }
  }
  res
    .status(401)
    .setHeader("WWW-Authenticate", "Bearer, OAuth")
    .end("Unauthorized");
};

/**
 * API Middleware to check if request contains an authenticated session.
 * Sets `user` property in `req` or returns 401.
 */
export const hasSession: RequestHandler<AuthRequest, NextApiResponse> = async (
  req,
  res,
  next
) => {
  const session = await getServerSession(req, res, options);
  if (session?.user) {
    req.user = session.user;
    next();
    return;
  }
  res.status(401).setHeader("WWW-Authenticate", "OAuth").end("Unauthorized");
};

/**
 * API Middleware to check if user has admin role.
 * Returns 403 when user does not have admin role.
 */
export const hasAdminRole: RequestHandler<
  AuthRequest,
  NextApiResponse
> = async (req, res, next) => {
  if (req.user) {
    if ("roles" in req.user && req.user.roles!.includes(Role.enum.admin)) {
      next();
    } else {
      res.status(403).end("Forbidden");
    }
  } else {
    res.status(401).setHeader("WWW-Authenticate", "OAuth").end("Unauthorized");
  }
};

/**
 * API Middleware to check if user has developer role.
 * Returns 403 when user does not have developer role.
 */
export const hasDeveloperRole: RequestHandler<
  AuthRequest,
  NextApiResponse
> = async (req, res, next) => {
  if (req.user) {
    if ("roles" in req.user && req.user.roles!.includes(Role.enum.developer)) {
      next();
    } else {
      res.status(403).end("Forbidden");
    }
  } else {
    res.status(401).setHeader("WWW-Authenticate", "OAuth").end("Unauthorized");
  }
};

/**
 * API Middleware to check if user has developer or download role.
 * Returns 403 when user does not have developer or download role.
 */
export const hasDeveloperOrDownloadRole: RequestHandler<
  AuthRequest,
  NextApiResponse
> = async (req, res, next) => {
  if (req.user) {
    if (
      "roles" in req.user &&
      (req.user.roles!.includes(Role.enum.developer) ||
        req.user.roles!.includes(Role.enum.download))
    ) {
      next();
    } else {
      res.status(403).end("Forbidden");
    }
  } else {
    res.status(401).setHeader("WWW-Authenticate", "OAuth").end("Unauthorized");
  }
};

/**
 * API Middleware to check if user has author role.
 * Returns 403 when user does not have author role.
 */
export const hasAuthorRole: RequestHandler<
  AuthRequest,
  NextApiResponse
> = async (req, res, next) => {
  if (req.user) {
    if ("roles" in req.user && req.user.roles!.includes(Role.enum.author)) {
      next();
    } else {
      res.status(403).end("Forbidden");
    }
  } else {
    res.status(401).setHeader("WWW-Authenticate", "OAuth").end("Unauthorized");
  }
};

export const mustBeAdmin = async (
  context: GetServerSidePropsContext<ParsedUrlQuery, PreviewData>
) => {
  const session = await getServerSession(context.req, context.res, options);
  if (!session?.user) {
    context.res.statusCode = 401;
    context.res.setHeader("WWW-Authenticate", "OAuth");
    throw Error("Unauthorized");
  }
  if (session!.user!.roles!.includes(Role.enum.admin)) {
    return session.user;
  }

  context.res.statusCode = 403;
  throw Error("Forbidden");
};

export const mustBeAuthor = async (
  context: GetServerSidePropsContext<ParsedUrlQuery, PreviewData>
) => {
  const session = await getServerSession(context.req, context.res, options);
  if (!session?.user) {
    context.res.statusCode = 401;
    context.res.setHeader("WWW-Authenticate", "OAuth");
    throw Error("Unauthorized");
  }
  if (session!.user!.roles!.includes(Role.enum.author)) {
    return session.user;
  }

  context.res.statusCode = 403;
  throw Error("Forbidden");
};

// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Role } from "@lxcat/database/dist/auth/schema";
import {
  GetServerSidePropsContext,
  NextApiRequest,
  NextApiResponse,
  PreviewData,
} from "next";
import { getServerSession, Session } from "next-auth";
import { decode } from "next-auth/jwt";
import { RequestHandler } from "next-connect/dist/types/node";
import { Nextable } from "next-connect/dist/types/types";
import { ParsedUrlQuery } from "querystring";
import { DOWNLOAD_COOKIE_NAME } from "../shared/download";
import { options } from "./options";

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
export const hasSessionOrAPIToken: Nextable<
  RequestHandler<
    AuthRequest,
    NextApiResponse
  >
> = async (req, res, next) => {
  const session = await getServerSession(req, res, options);
  if (session?.user) {
    req.user = session.user;
    await next();
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
      await next();
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
      await next();
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
export const hasSession: Nextable<
  RequestHandler<AuthRequest, NextApiResponse>
> = async (
  req,
  res,
  next,
) => {
  const session = await getServerSession(req, res, options);
  if (session?.user) {
    req.user = session.user;
    await next();
    return;
  }
  res.status(401).setHeader("WWW-Authenticate", "OAuth").end("Unauthorized");
};

/**
 * API Middleware to check if user has admin role.
 * Returns 403 when user does not have admin role.
 */
export const hasAdminRole: Nextable<
  RequestHandler<
    AuthRequest,
    NextApiResponse
  >
> = async (req, res, next) => {
  if (req.user) {
    if ("roles" in req.user && req.user.roles!.includes(Role.enum.admin)) {
      await next();
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
export const hasDeveloperRole: Nextable<
  RequestHandler<
    AuthRequest,
    NextApiResponse
  >
> = async (req, res, next) => {
  if (req.user) {
    if ("roles" in req.user && req.user.roles!.includes(Role.enum.developer)) {
      await next();
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
export const hasDeveloperOrDownloadRole: Nextable<
  RequestHandler<
    AuthRequest,
    NextApiResponse
  >
> = async (req, res, next) => {
  if (req.user) {
    if (
      "roles" in req.user
      && (req.user.roles!.includes(Role.enum.developer)
        || req.user.roles!.includes(Role.enum.download))
    ) {
      await next();
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
export const hasAuthorRole: Nextable<
  RequestHandler<
    AuthRequest,
    NextApiResponse
  >
> = async (req, res, next) => {
  if (req.user) {
    if (
      req.user.roles !== undefined && req.user.roles!.includes(Role.enum.author)
    ) {
      await next();
    } else {
      res.status(403).end("Forbidden");
    }
  } else {
    res.status(401).setHeader("WWW-Authenticate", "OAuth").end("Unauthorized");
  }
};

/**
 * API Middleware to check if user has publisher role.
 * Returns 403 when user does not have publisher role.
 */
export const hasPublisherRole: Nextable<
  RequestHandler<
    AuthRequest,
    NextApiResponse
  >
> = async (req, res, next) => {
  if (req.user) {
    if (
      req.user.roles !== undefined
      && req.user.roles.includes(Role.enum.publisher)
    ) {
      await next();
    } else {
      res.status(403).end("Forbidden");
    }
  } else {
    res.status(401).setHeader("WWW-Authenticate", "OAuth").end("Unauthorized");
  }
};

export const mustBeAdmin = async (
  context: GetServerSidePropsContext<ParsedUrlQuery, PreviewData>,
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
  context: GetServerSidePropsContext<ParsedUrlQuery, PreviewData>,
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

export const mustBePublisher = async (
  context: GetServerSidePropsContext<ParsedUrlQuery, PreviewData>,
) => {
  const session = await getServerSession(context.req, context.res, options);
  if (!session?.user) {
    context.res.statusCode = 401;
    context.res.setHeader("WWW-Authenticate", "OAuth");
    throw Error("Unauthorized");
  }
  if (session!.user!.roles!.includes(Role.enum.publisher)) {
    return session.user;
  }

  context.res.statusCode = 403;
  throw Error("Forbidden");
};

// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Role } from "@lxcat/database/auth";
import {
  GetServerSidePropsContext,
  NextApiRequest,
  NextApiResponse,
  PreviewData,
} from "next";
import { getServerSession, Session } from "next-auth";
import { decode } from "next-auth/jwt";
import { NextHandler } from "next-connect";
import { ParsedUrlQuery } from "querystring";
import { DOWNLOAD_COOKIE_NAME } from "../shared/download";
import { options } from "./options";
import { NextRequest, NextResponse } from "next/server";

const unauthorized_response = new NextResponse
  (
    "Unauthorized", 
    {
      status: 401,
      headers: [["WWW-Authenticate", "Bearer, OAuth"]]
  })

const forbidden_response = new NextResponse 
  (
    "Forbidden",
    {
      status: 403,
    }
  )

interface JwtPayload {
  email: string;
  roles: Role[];
}

export interface AuthRequest extends NextRequest {
  user: Session["user"] | JwtPayload;
}

/**
 * API Middleware to check if request contains an authenticated session, a valid download token in cookie or valid API token.
 * Sets `user` property in `req` or returns 401.
 */
export const hasSessionOrAPIToken = async (
  req: AuthRequest,
  ctx: unknown,
  next: NextHandler,
) => {
  const session = await getServerSession(options);
  if (session?.user) {
    req.user = session.user;
    return await next();
  }
  if (DOWNLOAD_COOKIE_NAME in req.cookies) {
    const secret = process.env.NEXTAUTH_SECRET!;
    const token = req.cookies.get(DOWNLOAD_COOKIE_NAME)?.value;
    const session2 = await decode({ token, secret });
    if (session2 !== null) {
      req.user = {
        roles: session2.roles as Role[],
        email: session2.email as string,
      };
      return await next();
    }
  }
  let auth_header = req.headers.get('authorization')?.split(" ")
  if (auth_header && auth_header[0] === "Bearer") {
    const token = auth_header[1];
    const secret = process.env.NEXTAUTH_SECRET!;
    const session1 = await decode({ token, secret });
    if (session1 !== null) {
      req.user = {
        roles: session1.roles as Role[],
        email: session1.email as string,
      };
      return await next();
    }
  }
  return unauthorized_response.clone();
}

/**
 * API Middleware to check if request contains an authenticated session.
 * Sets `user` property in `req` or returns 401.
 */
export const hasSession = async (
  req: AuthRequest,
  ctx: unknown,
  next: NextHandler,
) => {
  const session = await getServerSession(options);
  if (session?.user) {
    req.user = session.user;
    return await next();
  }
  return unauthorized_response.clone();
};

/**
 * API Middleware to check if user has admin role.
 * Returns 403 when user does not have admin role.
 */
export const hasAdminRole = async (
  req: AuthRequest,
  ctx: unknown,
  next: NextHandler,
) => {
  if (req.user) {
    if ("roles" in req.user && req.user.roles!.includes(Role.enum.admin)) {
      return await next();
    } else {
      return forbidden_response.clone();
    }
  } else {
    return unauthorized_response.clone();
  }
};

/**
 * API Middleware to check if user has developer role.
 * Returns 403 when user does not have developer role.
 */
export const hasDeveloperRole = async (
  req: AuthRequest,
  ctx: unknown,
  next: NextHandler,
) => {
  if (req.user) {
    if ("roles" in req.user && req.user.roles!.includes(Role.enum.developer)) {
      return await next();
    } else {
      return forbidden_response.clone();
    }
  } else {
    return unauthorized_response.clone();
  }
};

/**
 * API Middleware to check if user has developer or download role.
 * Returns 403 when user does not have developer or download role.
 */
export const hasDeveloperOrDownloadRole = async (
  req: AuthRequest,
  ctx: unknown,
  next: NextHandler,
) => {
  if (req.user) {
    if (
      "roles" in req.user
      && (req.user.roles!.includes(Role.enum.developer)
        || req.user.roles!.includes(Role.enum.download))
    ) {
      return await next();
    } else {
      return forbidden_response.clone();
    }
  } else {
    return unauthorized_response.clone();
  }
};

/**
 * API Middleware to check if user has author role.
 * Returns 403 when user does not have author role.
 */
export const hasAuthorRole = async (
  req: AuthRequest,
  ctx: unknown,
  next: NextHandler,
) => {
  if (req.user) {
    if (
      req.user.roles !== undefined && req.user.roles!.includes(Role.enum.author)
    ) {
      return await next();
    } else {
      return forbidden_response.clone();
    }
  } else {
    return unauthorized_response.clone();
  }
};

/**
 * API Middleware to check if user has publisher role.
 * Returns 403 when user does not have publisher role.
 */
export const hasPublisherRole = async (
  req: AuthRequest,
  res: NextApiResponse,
  next: NextHandler,
) => {
  if (req.user) {
    if (
      req.user.roles !== undefined
      && req.user.roles.includes(Role.enum.publisher)
    ) {
      return await next();
    } else {
      return forbidden_response.clone();
    }
  } else {
    return unauthorized_response.clone();
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

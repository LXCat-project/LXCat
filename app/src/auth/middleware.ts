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
import { NextRequest, NextResponse } from "next/server";
import { ParsedUrlQuery } from "querystring";
import { DOWNLOAD_COOKIE_NAME } from "../shared/download";
import { options } from "./options";

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

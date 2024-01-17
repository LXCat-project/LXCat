// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { NextResponse } from "next/server";

const response = (
  { body, json }: { body?: BodyInit; json?: any },
  respInit: ResponseInit,
  defaultBody: string,
) => {
  if (json) return NextResponse.json(json, respInit);
  const respBody = body ? body : defaultBody;
  return new NextResponse(respBody, respInit);
};

export const badRequestResponse = (
  { body, json }: { body?: BodyInit; json?: any } = {},
) => {
  return response({ body, json }, { status: 400 }, "Bad Request");
};

export const unauthorizedResponse = (
  { body, json }: { body?: BodyInit; json?: any } = {},
) => {
  return response({ body, json }, {
    status: 401,
    headers: [["WWW-Authenticate", "Bearer, OAuth"]],
  }, "Unauthorized");
};

export const forbiddenResponse = (
  { body, json }: { body?: BodyInit; json?: any } = {},
) => {
  return response({ body, json }, { status: 403 }, "Forbidden");
};

export const notFoundResponse = (
  { body, json }: { body?: BodyInit; json?: any } = {},
) => {
  return response({ body, json }, { status: 404 }, "Not Found");
};

export const internalServerErrorResponse = (
  { body, json }: { body?: BodyInit; json?: any } = {},
) => {
  return response({ body, json }, { status: 500 }, "Internal Server Error");
};

export const okResponse = (body: BodyInit) => {
  return new NextResponse(body, { status: 200 });
};

export const okJsonResponse = (body: any) => {
  return NextResponse.json(body, { status: 200 });
};

export const createdResponse = (
  { body, json }: { body?: BodyInit; json?: any } = {},
) => {
  return response({ body, json }, { status: 201 }, "Created");
};

export const noContentResponse = () => {
  return new NextResponse(null, { status: 204 });
};

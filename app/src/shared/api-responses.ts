import { NextResponse } from "next/server";

const response = (
  { body, json }: { body?: BodyInit; json?: any },
  resp_init: ResponseInit,
  default_body: string,
) => {
  if (json) return NextResponse.json(json, resp_init);
  const res_body = body ? body : default_body;
  return new NextResponse(res_body, resp_init);
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
  return new NextResponse("", { status: 204 });
};

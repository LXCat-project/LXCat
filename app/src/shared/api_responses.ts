import { NextResponse } from "next/server";

export const badRequestResponse = () => {
  return new NextResponse("Bad Request", { status: 400 });
};

export const unauthorizedResponse = () => {
  return new NextResponse(
    "Unauthorized",
    {
      status: 401,
      headers: [["WWW-Authenticate", "Bearer, OAuth"]],
    },
  );
};

export const forbiddenResponse = () => {
  return new NextResponse("Forbidden", { status: 403 });
};

export const notFoundResponse = () => {
  return new NextResponse("Not Found", { status: 404 });
};

export const okResponse = (body: BodyInit) => {
  return new NextResponse(body, { status: 200 });
};

export const okJsonResponse = (body: any) => {
  return NextResponse.json(body, { status: 200 });
};

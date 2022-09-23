import { NextApiRequest, NextApiResponse } from "next";
import { RequestHandler } from "next-connect";
import NextCors from "nextjs-cors";

export const applyCORS: RequestHandler<
  NextApiRequest,
  NextApiResponse
> = async (req, res, next) => {
  await NextCors(req, res, {
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
    origin: "*",
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  });

  next();
};

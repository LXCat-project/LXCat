import { NextApiResponse } from "next";
import nc from "next-connect";
import {
  AuthRequest,
  hasAuthorRole,
  hasSessionOrAPIToken,
} from "../../../auth/middleware";
import { insert_input_set } from "@lxcat/database/dist/css/queries";
import { validator } from "@lxcat/schema/dist/css/validate";

const handler = nc<AuthRequest, NextApiResponse>()
  .use(hasSessionOrAPIToken)
  .use(hasAuthorRole)
  .post(async (req, res) => {
    try {
      const body = JSON.parse(req.body);
      if (validator.validate(body)) {
        // Add to CrossSectionSet with status=='draft' and version=='1'
        const id = await insert_input_set(body, "draft");
        res.json({ id });
      } else {
        const errors = validator.errors;
        res.statusCode = 500;
        res.json({ errors });
      }
    } catch (error) {
      console.error(error);
      res.statusCode = 500;
      res.json({
        errors: [
          {
            keyword: "",
            dataPath: "",
            schemaPath: "",
            params: {},
            message: `${error}`,
          },
        ],
      });
    }
  });

export default handler;

import { NextApiResponse } from "next";
import nc from "next-connect";
import {
  AuthRequest,
  hasAuthorRole,
  hasSessionOrAPIToken,
} from "../../../auth/middleware";
import { insert_input_set } from "../../../ScatteringCrossSectionSet/queries";
import { validate } from "../../../ScatteringCrossSectionSet/validate";

const handler = nc<AuthRequest, NextApiResponse>()
  .use(hasSessionOrAPIToken)
  .use(hasAuthorRole)
  .post(async (req, res) => {
    try {
      const body = JSON.parse(req.body);
      if (validate(body)) {
        // Add to CrossSectionSet with status=='draft' and version=='1'
        const id = await insert_input_set(body, "draft");
        res.json({ id });
      } else {
        const errors = validate.errors;
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

import { NextApiResponse } from "next";
import nc from "next-connect";
import { AuthRequest, hasSessionOrAPIToken } from "../../../auth/middleware";
import { insert_input_set } from "../../../ScatteringCrossSection/queries";
import { validate } from "../../../ScatteringCrossSection/validate";


const handler = nc<AuthRequest, NextApiResponse>()
    .use(hasSessionOrAPIToken)
    .post(async (req, res) => {
        try {
            const body = JSON.parse(req.body)
            if (validate(body)) {
                const id = await insert_input_set(body)
                res.json({id})
            } else {
                const errors = validate.errors
                res.statusCode = 500
                res.json({errors})
            }
        } catch (error) {
            console.error(error)
            res.statusCode = 500
            res.json({errors: [{
                keyword: "",
                dataPath: "",
                schemaPath: "",
                params: {},
                message: `${error}`
            }]})
        }
    })

export default handler
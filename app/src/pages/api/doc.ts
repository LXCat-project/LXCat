import { createRouter } from 'next-connect';
import { NextApiRequest, NextApiResponse } from 'next';
import { generateOpenAPI } from '../../docs/openapi';

const handler = createRouter<NextApiRequest, NextApiResponse>()
  .get (async (_, res) => {
    res.json(generateOpenAPI())
  }
).handler();

export default handler;

// const swaggerHandler = withSwagger({
//   definition: {
//     openapi: '3.0.0',
//     info: {
//       title: 'NextJS Swagger',
//       version: '0.1.0',
//     },
//   },
//   apiFolder: 'src/pages/api',
// });
// export default swaggerHandler();

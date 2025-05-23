// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import z, { ZodObject, ZodOptional, ZodType } from "zod";
import { speciesSchema } from "./app/api/schemas.openapi";
import { mapObject } from "./shared/utils";

export type ResponseConfig = {
  description: string;
  required?: boolean;
  content?: {
    [mime: string]: {
      schema: z.core.JSONSchema.BaseSchema | ZodType;
    };
  };
};
export type BodyConfig = {
  description?: string;
  required?: boolean;
  content: {
    [mime: string]: {
      schema: z.core.JSONSchema.BaseSchema | ZodType;
    };
  };
};
export type RouteConfig = {
  method: "get" | "post" | "delete";
  path: string;
  tags: string[];
  description: string;
  request?: {
    body?: {
      content: {
        [mime: string]: { schema: ZodType | z.core.JSONSchema.BaseSchema };
      };
    };
    params?: ZodObject;
    query?: ZodObject;
  };
  responses: { [statusCode: string]: ResponseConfig };
};

export type OpenAPIConfig = {
  info: {
    title: string;
    version: string;
    description?: string;
  };
  tags?: string[];
  servers: { url: string }[];
};

const makeParameter = (
  type: "query" | "path",
  key: string,
  schema: ZodType,
  registry: z.core.$ZodRegistry<z.core.JSONSchemaMeta>,
) => ({
  schema: z.toJSONSchema(schema, {
    external: {
      registry: registry,
      uri: (id: string) => `#/components/schemas/${id}`,
      defs: {},
    },
  }),
  required: !(schema instanceof ZodOptional),
  name: key,
  in: type,
});

export class OpenapiGenerator {
  routes: RouteConfig[] = [];

  constructor() {}

  registerRoute(route: RouteConfig) {
    this.routes.push(route);
  }

  generate(
    config: OpenAPIConfig,
    registry: z.core.$ZodRegistry<z.core.JSONSchemaMeta> = z.globalRegistry,
  ) {
    const schemas = z.toJSONSchema(registry, {
      uri: (id) => `#/components/schemas/${id}`,
    });

    const paths: Record<string, any> = {};

    for (const route of this.routes) {
      const responses = mapObject(route.responses, ([path, config]) => {
        if (config.content) {
          config.content = mapObject(config.content, ([mime, { schema }]) => {
            if (schema instanceof ZodType) {
              return [mime, {
                schema: z.toJSONSchema(schema, {
                  external: {
                    registry: registry,
                    uri: (id: string) => `#/components/schemas/${id}`,
                    defs: {},
                  },
                }),
              }];
            }

            return [mime, { schema }];
          });
        }

        return [path, config];
      });

      const parameters = [];
      let requestBody = undefined;

      if (route.request) {
        if (route.request.query) {
          for (
            const [key, value] of Object.entries(route.request.query.shape)
          ) {
            parameters.push(makeParameter("query", key, value, registry));
          }
        }
        if (route.request.params) {
          for (
            const [key, value] of Object.entries(route.request.params.shape)
          ) {
            parameters.push(makeParameter("path", key, value, registry));
          }
        }
        if (route.request.body) {
          requestBody = {
            content: mapObject(
              route.request.body.content,
              ([mime, { schema }]) => {
                if (schema instanceof ZodType) {
                  return [mime, {
                    schema: z.toJSONSchema(schema, {
                      external: {
                        registry: registry,
                        uri: (id: string) => `#/components/schemas/${id}`,
                        defs: {},
                      },
                    }),
                  }];
                }

                return [mime, { schema }];
              },
            ),
          };
        }
      }

      if (!(route.path in paths)) {
        paths[route.path] = {};
      }

      const path: any = {
        description: route.description,
        tags: route.tags,
        responses,
      };

      if (requestBody) {
        path.requestBody = requestBody;
      }
      if (parameters.length > 0) {
        path.parameters = parameters;
      }

      paths[route.path][route.method] = path;
    }

    return { openapi: "3.1.0", ...config, components: schemas, paths };
  }
}

export const openapiGenerator = new OpenapiGenerator();

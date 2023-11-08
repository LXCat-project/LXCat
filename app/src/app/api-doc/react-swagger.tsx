"use client";

import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

function ReactSwagger() {
  const url = `${process.env.NEXT_PUBLIC_URL}/api/doc/`;
  return <SwaggerUI url={url} />;
}

export default ReactSwagger;

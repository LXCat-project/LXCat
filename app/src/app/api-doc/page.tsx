import { generateOpenAPI } from "../../docs/openapi";
import ReactSwagger from "./react-swagger";

export default async function IndexPage() {
  const spec = generateOpenAPI();
  return (
    <section className="container">
      <ReactSwagger spec={spec} />
    </section>
  );
}

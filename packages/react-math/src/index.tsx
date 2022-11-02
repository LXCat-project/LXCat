import katex from "katex";

export interface MathProps {
  latex: string;
}

// FIXME: Handle errors (see e.g. react-katex).
export const Math = ({ latex }: MathProps) => {
  const html = katex.renderToString(latex);
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
};

import katex from "katex";

export interface MathProps {
  latex: string;
  color?: string;
}

// FIXME: Handle errors (see e.g. react-katex).
export const Math = ({ latex, color }: MathProps) => {
  const html = katex.renderToString(`\\textcolor{${color ?? "black"}}{${latex}}`);
  return (
    <div dangerouslySetInnerHTML={{ __html: html }} />
  );
};

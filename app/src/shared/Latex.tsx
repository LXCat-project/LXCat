import "katex/dist/katex.min.css";
import { Math, MathProps } from "@lxcat/react-math/dist";

export type LatexProps = { children: string } & Omit<MathProps, "latex">;

export const Latex = ({ children, ...props }: LatexProps) => (
  <Math latex={children} {...props} />
);

import "katex/dist/katex.min.css";

// @ts-ignore
import { InlineMath } from "react-katex";

export interface LatexProps {
  children: string;
}

export const Latex = ({ children }: LatexProps) => (
  <InlineMath>{children}</InlineMath>
);

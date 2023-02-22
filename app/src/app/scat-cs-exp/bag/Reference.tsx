"use client";

import Link from "next/link"
import "katex/dist/katex.min.css";
import Latex from "react-latex-next"
import { FormattedReference } from "./types"

export const Reference = ({ children: { ref, url } }: { children: FormattedReference }) => (
  url ? <Link href={url}><Latex>{ref}</Latex></Link> : <Latex>{ref}</Latex>
)

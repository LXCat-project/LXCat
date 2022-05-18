declare module 'remark-mermaid-dataurl' {
    export default function remarkMermaid(settings?: void | Options | undefined): void
    export type Options ={
        // Options to pass to mermaid-cli
        mermaidCli?: any
    }
}

declare module 'mermaid'

import {
  buildSections,
  collectSourceMarkdown,
  writeOutputFile,
} from "./utils.ts";

export function generateAgentsMd(): void {
  const files = collectSourceMarkdown();

  if (files.length === 0) {
    console.warn(
      "警告: .ai-context/rules/ または .ai-context/workflows/ にマークダウンファイルが見つかりません。",
    );
    return;
  }

  console.log("Generating AGENTS.md...");

  const content = buildSections(
    files,
    "SupaAdmin — Agent Instructions",
    "Rules and workflows for AI coding agents. Edit `.ai-context/` and run `pnpm ai-context:generate`.",
  );

  writeOutputFile("AGENTS.md", content);
}

import {
  buildSections,
  collectSourceMarkdown,
  writeOutputFile,
} from "./utils.ts";

export function generateClaudeMd(): void {
  const files = collectSourceMarkdown();

  if (files.length === 0) {
    console.warn(
      "警告: .ai-context/rules/ または .ai-context/workflows/ にマークダウンファイルが見つかりません。",
    );
    return;
  }

  console.log("Generating CLAUDE.md...");

  const content = buildSections(
    files,
    "SupaAdmin — Claude Code",
    "Repository rules and workflows for Claude Code. Edit `.ai-context/` and run `pnpm ai-context:generate`.",
  );

  writeOutputFile("CLAUDE.md", content);
}

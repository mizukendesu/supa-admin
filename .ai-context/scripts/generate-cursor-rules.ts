import {
  collectSourceMarkdown,
  GENERATED_HEADER,
  writeOutputFile,
} from "./utils.ts";

const OUTPUT_DIR = ".cursor/rules";

function toMdcFileName(sourceName: string): string {
  return sourceName.replace(/\.md$/, ".mdc");
}

function buildMdcContent(
  frontmatter: Record<string, string>,
  body: string,
): string {
  const lines = [GENERATED_HEADER, "---"];

  for (const [key, value] of Object.entries(frontmatter)) {
    lines.push(`${key}: ${value}`);
  }

  lines.push("---", "", body.trimStart(), "");
  return lines.join("\n");
}

export function generateCursorRules(): void {
  const files = collectSourceMarkdown();

  if (files.length === 0) {
    console.warn(
      "警告: .ai-context/rules/ または .ai-context/workflows/ にマークダウンファイルが見つかりません。",
    );
    return;
  }

  console.log("Generating Cursor rules...");

  for (const file of files) {
    const outName = toMdcFileName(file.fileName);
    const outPath = `${OUTPUT_DIR}/${outName}`;
    const content = buildMdcContent(file.frontmatter, file.body);
    writeOutputFile(outPath, content);
  }
}

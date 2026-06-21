import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

export const CWD = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

export const RULES_DIRS = [
  join(CWD, ".ai-context", "rules"),
  join(CWD, ".ai-context", "workflows"),
];

export const SKILLS_SOURCE_DIR = join(CWD, ".ai-context", "skills");

export const GENERATED_HEADER =
  "<!-- AUTO-GENERATED from .ai-context/ — do not edit -->\n";

export const SKILL_WARNING = (
  skillName: string,
) => `> **Generated file.** 編集する場合は \`.ai-context/skills/${skillName}/SKILL.md\` を編集してください。
> 変更は \`pnpm ai-context:generate\` で反映されます。

`;

export interface ParsedMarkdown {
  relativePath: string;
  fileName: string;
  frontmatter: Record<string, string>;
  body: string;
}

export interface FrontmatterResult {
  frontmatter: Record<string, string>;
  body: string;
}

/** Parse YAML-like frontmatter (simple key: value lines). */
export function parseFrontmatter(content: string): FrontmatterResult {
  if (!content.startsWith("---\n")) {
    return { frontmatter: {}, body: content };
  }

  const end = content.indexOf("\n---\n", 4);
  if (end === -1) {
    return { frontmatter: {}, body: content };
  }

  const raw = content.slice(4, end);
  const body = content.slice(end + 5);
  const frontmatter: Record<string, string> = {};

  for (const line of raw.split("\n")) {
    const match = line.match(/^([\w-]+):\s*(.*)$/);
    if (match) {
      frontmatter[match[1]!] = match[2]!.trim();
    }
  }

  return { frontmatter, body };
}

function collectMarkdownFiles(
  dir: string,
  relativePath: string,
): ParsedMarkdown[] {
  if (!existsSync(dir)) {
    return [];
  }

  const results: ParsedMarkdown[] = [];

  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      results.push(
        ...collectMarkdownFiles(fullPath, join(relativePath, entry)),
      );
      continue;
    }

    if (!entry.endsWith(".md")) {
      continue;
    }

    const content = readFileSync(fullPath, "utf8");
    const { frontmatter, body } = parseFrontmatter(content);

    results.push({
      relativePath,
      fileName: entry,
      frontmatter,
      body,
    });
  }

  return results;
}

/** Collect all .md files from rules and workflows directories. */
export function collectSourceMarkdown(): ParsedMarkdown[] {
  const files: ParsedMarkdown[] = [];

  for (const dir of RULES_DIRS) {
    const relativePath = relative(join(CWD, ".ai-context"), dir);
    files.push(...collectMarkdownFiles(dir, relativePath));
  }

  return files.sort((a, b) => {
    const pathA = join(a.relativePath, a.fileName);
    const pathB = join(b.relativePath, b.fileName);
    return pathA.localeCompare(pathB);
  });
}

export function writeOutputFile(relativePath: string, content: string): void {
  const fullPath = join(CWD, relativePath);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, content, "utf8");
  console.log(`  wrote ${relativePath}`);
}

/** Build AGENTS.md / CLAUDE.md sections from source files. */
export function buildSections(
  files: ParsedMarkdown[],
  title: string,
  intro: string,
): string {
  const lines: string[] = [GENERATED_HEADER, `# ${title}`, "", intro, ""];

  for (const file of files) {
    const heading = basename(file.fileName, ".md")
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    lines.push(`## ${heading}`, "");
    lines.push(
      `Source: [.ai-context/${file.relativePath}/${file.fileName}](.ai-context/${file.relativePath}/${file.fileName})`,
      "",
    );
    lines.push(file.body.trim(), "", "---", "");
  }

  lines.push(
    "## Project skills",
    "",
    "Skills live in `.ai-context/skills/` and are copied to agent-specific directories.",
    "Run `pnpm ai-context:generate` after editing.",
    "",
    "External recommendations: [.ai-context/extras/recommended-skills.md](.ai-context/extras/recommended-skills.md)",
    "",
  );

  return lines.join("\n");
}

export function listSkillNames(): string[] {
  if (!existsSync(SKILLS_SOURCE_DIR)) {
    return [];
  }

  return readdirSync(SKILLS_SOURCE_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

export function readSkillFile(skillName: string, fileName: string): string {
  return readFileSync(join(SKILLS_SOURCE_DIR, skillName, fileName), "utf8");
}

export function copySkillTree(skillName: string, targetBase: string): void {
  const sourceDir = join(SKILLS_SOURCE_DIR, skillName);
  const targetDir = join(CWD, targetBase, skillName);

  mkdirSync(targetDir, { recursive: true });

  for (const entry of readdirSync(sourceDir)) {
    const sourcePath = join(sourceDir, entry);
    if (!statSync(sourcePath).isFile()) {
      continue;
    }

    let content = readFileSync(sourcePath, "utf8");

    if (entry === "SKILL.md") {
      const { body } = parseFrontmatter(content);
      content = SKILL_WARNING(skillName) + body.trimStart();
    }

    writeFileSync(join(targetDir, entry), content, "utf8");
  }
}

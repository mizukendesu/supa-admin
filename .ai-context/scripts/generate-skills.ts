import { copySkillTree, listSkillNames } from "./utils.ts";

const TARGETS = [".cursor/skills", ".claude/skills", ".agents/skills"] as const;

/**
 * Copy .ai-context/skills to all agent skill directories.
 */
export function generateSkills(): void {
  const skillNames = listSkillNames();

  if (skillNames.length === 0) {
    console.warn("警告: .ai-context/skills/ にスキルが見つかりません。");
    return;
  }

  console.log("Generating agent skills...");

  for (const target of TARGETS) {
    for (const skillName of skillNames) {
      copySkillTree(skillName, target);
      console.log(`  wrote ${target}/${skillName}/`);
    }
  }
}

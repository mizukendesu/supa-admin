import { generateAgentsMd } from "./generate-agents-md.ts";
import { generateClaudeMd } from "./generate-claude-md.ts";
import { generateCursorRules } from "./generate-cursor-rules.ts";
import { generateSkills } from "./generate-skills.ts";

console.log("ai-context:generate\n");

generateCursorRules();
generateSkills();
generateClaudeMd();
generateAgentsMd();

console.log("\nDone.");

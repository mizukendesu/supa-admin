import { execSync } from "node:child_process";
import { supabaseCmd } from "./lib/supabase-cli";

execSync(supabaseCmd("db reset"), { stdio: "inherit" });

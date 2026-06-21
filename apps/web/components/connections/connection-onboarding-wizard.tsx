"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { useTranslations } from "next-intl";
import { TargetSetupPanel } from "@/components/connections/target-setup-panel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { orpcBrowser } from "@/lib/orpc/client.browser";

type OnboardingSteps = {
  bootstrap: boolean;
  schemaSynced: boolean;
  rolesConfigured: boolean;
  usersProvisioned: boolean;
};

type ConnectionOnboardingWizardProps = {
  connectionId: string;
  connectionName: string;
  steps: OnboardingSteps;
  showBootstrap: boolean;
};

function StepRow({
  done,
  label,
  action,
}: {
  done: boolean;
  label: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      {done ? (
        <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
      ) : (
        <Circle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
      )}
      <div className="flex-1 space-y-2">
        <p className={done ? "text-muted-foreground line-through" : ""}>
          {label}
        </p>
        {!done && action}
      </div>
    </div>
  );
}

export function ConnectionOnboardingWizard({
  connectionId,
  connectionName,
  steps,
  showBootstrap,
}: ConnectionOnboardingWizardProps) {
  const t = useTranslations("connections.onboarding");

  async function syncSchema() {
    await orpcBrowser.connections.schemaSync({ id: connectionId });
    window.location.reload();
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("description", { name: connectionName })}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("checklist")}</CardTitle>
          <CardDescription>{t("checklistHint")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          <StepRow
            done={steps.bootstrap}
            label={t("stepBootstrap")}
            action={
              showBootstrap ? (
                <TargetSetupPanel connectionId={connectionId} />
              ) : undefined
            }
          />
          <StepRow
            done={steps.schemaSynced}
            label={t("stepSchema")}
            action={
              <Button size="sm" variant="outline" onClick={() => syncSchema()}>
                {t("syncSchema")}
              </Button>
            }
          />
          <StepRow
            done={steps.rolesConfigured}
            label={t("stepRoles")}
            action={
              <Button
                size="sm"
                variant="outline"
                render={<Link href="/roles" />}
              >
                {t("openRoles")}
              </Button>
            }
          />
          <StepRow
            done={steps.usersProvisioned}
            label={t("stepProvision")}
            action={
              <Button
                size="sm"
                variant="outline"
                render={<Link href="/users" />}
              >
                {t("openUsers")}
              </Button>
            }
          />
          <StepRow
            done={steps.bootstrap && steps.rolesConfigured}
            label={t("stepConnect")}
            action={
              steps.bootstrap ? (
                <Button
                  size="sm"
                  variant="outline"
                  render={<Link href={`/${connectionId}/connect`} />}
                >
                  {t("openConnect")}
                </Button>
              ) : undefined
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}

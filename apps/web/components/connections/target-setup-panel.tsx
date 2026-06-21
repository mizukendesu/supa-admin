"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/routing";
import { orpcBrowser } from "@/lib/orpc/client.browser";

type TargetSetupPanelProps = {
  connectionId: string;
};

export function TargetSetupPanel({ connectionId }: TargetSetupPanelProps) {
  const t = useTranslations();
  const router = useRouter();
  const [setupSql, setSetupSql] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadSetupSql();
  }, [connectionId]);

  async function loadSetupSql() {
    setLoading(true);
    try {
      const data = await orpcBrowser.connections.bootstrap.probe({
        id: connectionId,
      });
      if (data.status === "ready") {
        router.push(`/${connectionId}`);
        return;
      }
      setSetupSql(data.setupSql ?? "");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  async function verifySetup() {
    setLoading(true);
    try {
      await orpcBrowser.connections.bootstrap.verify({ id: connectionId });
      toast.success(t("connections.bootstrap.verified"));
      router.push(`/${connectionId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t("connections.bootstrap.securityNote")}
      </p>
      <Textarea
        value={setupSql}
        readOnly
        placeholder={loading ? t("common.loading") : undefined}
        className="font-mono text-xs min-h-[300px]"
      />
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => void loadSetupSql()}
          disabled={loading}
        >
          {t("connections.bootstrap.reloadSql")}
        </Button>
        <Button
          variant="outline"
          onClick={() => navigator.clipboard.writeText(setupSql)}
          disabled={!setupSql}
        >
          {t("rls.copySql")}
        </Button>
        <Button onClick={() => void verifySetup()} disabled={loading}>
          {t("connections.bootstrap.verify")}
        </Button>
      </div>
    </div>
  );
}

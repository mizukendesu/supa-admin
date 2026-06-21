"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { orpcBrowser } from "@/lib/orpc/client.browser";

type TargetSetupDialogProps = {
  connectionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified?: () => void;
};

export function TargetSetupDialog({
  connectionId,
  open,
  onOpenChange,
  onVerified,
}: TargetSetupDialogProps) {
  const t = useTranslations();
  const [setupSql, setSetupSql] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadSetupSql() {
    setLoading(true);
    try {
      const data = await orpcBrowser.connections.bootstrap.probe({
        id: connectionId,
      });
      if (data.status === "ready") {
        toast.success(t("connections.bootstrap.alreadyReady"));
        onVerified?.();
        onOpenChange(false);
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
      onVerified?.();
      onOpenChange(false);
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (next && !setupSql) void loadSetupSql();
      }}
    >
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{t("connections.bootstrap.title")}</DialogTitle>
          <DialogDescription>
            {t("connections.bootstrap.description")}
          </DialogDescription>
        </DialogHeader>
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
      </DialogContent>
    </Dialog>
  );
}

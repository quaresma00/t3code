import { scopeThreadRef, scopedThreadKey } from "@t3tools/client-runtime/environment";
import type { EnvironmentThreadShell } from "@t3tools/client-runtime/state/models";
import type { ScopedThreadRef } from "@t3tools/contracts";
import { msg, useGT, useMessages } from "gt-react";
import {
  ArrowRightIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  CircleHelpIcon,
  HourglassIcon,
  ListChecksIcon,
  MessageCircleIcon,
  ShieldQuestionIcon,
  WorkflowIcon,
} from "lucide-react";
import { useState } from "react";

import { cn } from "~/lib/utils";
import { useUiStateStore } from "../../uiStateStore";
import { Popover, PopoverPopup, PopoverTitle, PopoverTrigger } from "../ui/popover";
import { SidebarMenuButton } from "../ui/sidebar";
import { Toggle, ToggleGroup } from "../ui/toggle-group";
import {
  threadActivityGroups,
  collectThreadActivity,
  type ThreadActivityGroup,
} from "./threadActivity";

const groupCopy = {
  attention: { label: msg("Needs you"), empty: msg("No threads need your attention.") },
  running: {
    label: msg("Running", { $context: "thread activity filter" }),
    empty: msg("No threads are running."),
  },
  unread: {
    label: msg("Unread", { $context: "thread activity filter" }),
    empty: msg("No unread results."),
  },
};

const reasons = {
  approval: {
    label: msg("Approval", { $context: "thread status: needs approval" }),
    icon: ShieldQuestionIcon,
    tone: "text-warning-foreground",
  },
  input: {
    label: msg("Input", { $context: "thread status: needs user input" }),
    icon: CircleHelpIcon,
    tone: "text-indigo-600 dark:text-indigo-300",
  },
  plan: {
    label: msg("Plan ready"),
    icon: WorkflowIcon,
    tone: "text-indigo-600 dark:text-indigo-300",
  },
  request: {
    label: msg("Request", { $context: "thread status: guest request" }),
    icon: MessageCircleIcon,
    tone: "text-guest-foreground",
  },
  limited: {
    label: msg("Limited", { $context: "thread status: usage limited" }),
    icon: CircleAlertIcon,
    tone: "text-warning-foreground",
  },
  failed: {
    label: msg("Failed", { $context: "thread status" }),
    icon: CircleAlertIcon,
    tone: "text-error-foreground",
  },
  running: {
    label: msg("Working", { $context: "thread status" }),
    icon: HourglassIcon,
    tone: "text-info-foreground",
  },
  unread: {
    label: msg("Done", { $context: "thread status" }),
    icon: CircleCheckIcon,
    tone: "text-success-foreground",
  },
};

export function SidebarThreadActivity({
  threads,
  delegatedUnderParent,
  now,
  projectNames,
  isMobile,
  onOpenThread,
}: {
  readonly threads: readonly EnvironmentThreadShell[];
  readonly delegatedUnderParent: ReadonlySet<string>;
  readonly now: string;
  readonly projectNames: ReadonlyMap<string, string>;
  readonly isMobile: boolean;
  readonly onOpenThread: (ref: ScopedThreadRef) => void;
}) {
  const gt = useGT();
  const resolve = useMessages();
  const title = gt("Thread activity");
  const localVisits = useUiStateStore((state) => state.threadLastVisitedAtById);
  const activity = collectThreadActivity({ threads, delegatedUnderParent, localVisits, now });
  const [open, setOpen] = useState(false);
  const [group, setGroup] = useState<ThreadActivityGroup>("attention");
  const attentionCount = activity.attention.length;
  const items = activity[group];

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          setGroup(
            attentionCount > 0
              ? "attention"
              : activity.unread.length > 0
                ? "unread"
                : activity.running.length > 0
                  ? "running"
                  : "attention",
          );
        }
        setOpen(nextOpen);
      }}
    >
      <PopoverTrigger
        render={<SidebarMenuButton type="button" />}
        aria-description={
          attentionCount > 0
            ? gt(
                "{count, plural, one {{count} thread needs attention} other {{count} threads need attention}}",
                { count: attentionCount },
              )
            : undefined
        }
      >
        <ListChecksIcon className="size-4 shrink-0 text-(--sidebar-icon-color)" aria-hidden />
        <span className="flex-1 truncate">{title}</span>
        {attentionCount > 0 ? (
          <span
            className="rounded-full bg-warning/12 px-1.5 text-2xs font-semibold text-warning-foreground tabular-nums"
            aria-hidden
          >
            {attentionCount}
          </span>
        ) : null}
      </PopoverTrigger>
      <PopoverPopup
        width="lg"
        padding="compact"
        side={isMobile ? "bottom" : "right"}
        align="start"
        sideOffset={8}
        collisionAvoidance={{ side: "flip", align: "shift" }}
        className="max-w-[calc(100vw-1rem)]"
      >
        <div>
          <div className="mb-2.5 flex items-baseline justify-between gap-2 px-1 pt-1">
            <PopoverTitle>{title}</PopoverTitle>
            <span className="text-2xs text-muted-foreground">{gt("All projects")}</span>
          </div>
          <ToggleGroup
            aria-label={gt("Thread activity filters")}
            className="grid w-full grid-cols-3"
            value={[group]}
            onValueChange={(values) => {
              const nextGroup = threadActivityGroups.find((item) => item === values[0]);
              if (nextGroup !== undefined) setGroup(nextGroup);
            }}
          >
            {threadActivityGroups.map((item) => (
              <Toggle key={item} value={item} className="min-w-0">
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="truncate">{resolve(groupCopy[item].label)}</span>
                  <span className="text-2xs tabular-nums">{activity[item].length}</span>
                </span>
              </Toggle>
            ))}
          </ToggleGroup>
          {items.length === 0 ? (
            <p role="status" className="px-2 py-5 text-center text-xs text-muted-foreground">
              {resolve(groupCopy[group].empty)}
            </p>
          ) : (
            <ul
              aria-label={resolve(groupCopy[group].label)}
              className="mt-2 max-h-[min(20rem,55dvh)] space-y-0.5 overflow-y-auto overscroll-contain"
            >
              {items.map(({ thread, reason }) => {
                const ref = scopeThreadRef(thread.environmentId, thread.id);
                const project = projectNames.get(thread.environmentId + ":" + thread.projectId);
                const { label, icon: Icon, tone } = reasons[reason];
                return (
                  <li key={scopedThreadKey(ref)}>
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        onOpenThread(ref);
                      }}
                      className="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-left hover:bg-accent focus-visible:bg-accent focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring"
                    >
                      <Icon aria-hidden className={cn("size-4 shrink-0", tone)} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-medium">{thread.title}</span>
                        {project ? (
                          <span className="block truncate text-2xs text-muted-foreground">
                            {project}
                          </span>
                        ) : null}
                      </span>
                      <span className={cn("max-w-1/3 shrink-0 truncate text-2xs", tone)}>
                        {resolve(label)}
                      </span>
                      <ArrowRightIcon
                        aria-hidden
                        className="size-3 shrink-0 text-muted-foreground"
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverPopup>
    </Popover>
  );
}

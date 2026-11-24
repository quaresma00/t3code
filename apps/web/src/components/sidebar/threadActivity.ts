import { scopeThreadRef, scopedThreadKey } from "@t3tools/client-runtime/environment";
import type { EnvironmentThreadShell } from "@t3tools/client-runtime/state/models";
import { isThreadWorking } from "@t3tools/client-runtime/state/thread-inbox";
import { effectiveSnoozed } from "@t3tools/client-runtime/state/thread-settled";

import {
  filterSidebarV2VisibleThreads,
  hasUnseenCompletion,
  resolveSidebarRowStatus,
  resolveThreadLastVisitedAt,
} from "../Sidebar.logic";

export const threadActivityGroups = ["attention", "running", "unread"] as const;
export type ThreadActivityGroup = (typeof threadActivityGroups)[number];

type ActivityReason =
  | "approval"
  | "input"
  | "plan"
  | "request"
  | "limited"
  | "failed"
  | "running"
  | "unread";

interface ThreadActivityItem {
  readonly thread: EnvironmentThreadShell;
  readonly reason: ActivityReason;
}

export type ThreadActivity = Record<ThreadActivityGroup, readonly ThreadActivityItem[]>;

const statusGroup: Record<ActivityReason, ThreadActivityGroup> = {
  approval: "attention",
  input: "attention",
  plan: "attention",
  request: "attention",
  limited: "attention",
  failed: "attention",
  running: "running",
  unread: "unread",
};

function activityReason(
  thread: EnvironmentThreadShell,
  lastVisitedAt: string | undefined,
): ActivityReason | null {
  const visitedThread = { ...thread, lastVisitedAt };
  const status = resolveSidebarRowStatus(visitedThread);
  switch (status) {
    case "approval":
    case "input":
    case "request":
    case "limited":
    case "failed":
      return status;
  }

  const working = isThreadWorking(thread);
  if (thread.interactionMode === "plan" && thread.hasActionableProposedPlan && !working) {
    return "plan";
  }
  if (
    status === "preparing" ||
    status === "working" ||
    (status === "waiting" && thread.runtime?.status === "running")
  ) {
    return "running";
  }
  return status === "ready" && hasUnseenCompletion(visitedThread) ? "unread" : null;
}

function isWaitingForDecision(item: ThreadActivityItem): boolean {
  return item.reason !== "failed" && item.reason !== "limited";
}

export function collectThreadActivity(input: {
  readonly threads: readonly EnvironmentThreadShell[];
  readonly delegatedUnderParent: ReadonlySet<string>;
  readonly localVisits: Readonly<Record<string, string | undefined>>;
  readonly now: string;
}): ThreadActivity {
  const groups: Record<ThreadActivityGroup, ThreadActivityItem[]> = {
    attention: [],
    running: [],
    unread: [],
  };
  for (const thread of filterSidebarV2VisibleThreads(
    input.threads,
    null,
    input.delegatedUnderParent,
  )) {
    if (
      thread.deletedAt !== null ||
      thread.settledOverride === "settled" ||
      effectiveSnoozed(thread, { now: input.now })
    ) {
      continue;
    }
    const key = scopedThreadKey(scopeThreadRef(thread.environmentId, thread.id));
    const reason = activityReason(
      thread,
      resolveThreadLastVisitedAt(thread.lastVisitedAt, input.localVisits[key]),
    );
    if (reason !== null) groups[statusGroup[reason]].push({ thread, reason });
  }

  const newestFirst = (a: ThreadActivityItem, b: ThreadActivityItem) =>
    b.thread.updatedAt.localeCompare(a.thread.updatedAt);
  groups.attention.sort(
    (a, b) =>
      Number(isWaitingForDecision(b)) - Number(isWaitingForDecision(a)) || newestFirst(a, b),
  );
  groups.running.sort(newestFirst);
  groups.unread.sort(newestFirst);
  return groups;
}

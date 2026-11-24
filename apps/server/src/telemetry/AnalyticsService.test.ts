import { expect, it } from "@effect/vitest";
import * as ConfigProvider from "effect/ConfigProvider";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { AnalyticsService, layer } from "./AnalyticsService.ts";

it.effect("never queues product events even when the old telemetry variables enable it", () =>
  Effect.gen(function* () {
    const analytics = yield* AnalyticsService;
    expect(yield* analytics.record("server.boot.heartbeat", { projectCount: 3 })).toBe(false);
    expect(yield* analytics.record("agent.feedback", { conversation: "private" })).toBe(false);
    yield* analytics.flush;
  }).pipe(
    Effect.provide(
      Layer.merge(
        layer,
        ConfigProvider.layer(
          ConfigProvider.fromEnvRecord({
            T3CODE_TELEMETRY_ENABLED: "true",
            T3CODE_POSTHOG_HOST: "https://telemetry.example",
          }),
        ),
      ),
    ),
  ),
);

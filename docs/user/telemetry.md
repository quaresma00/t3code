# Privacy and diagnostics in this fork

This fork runs on the local machine. The desktop app and a local browser can connect to the
server over loopback. Built-in remote access, T3 Connect, public preview tunnels, and webhook
tasks are disabled. A managed policy can restrict local access further.

The fork does not send product analytics, account or device identifiers for analytics, agent
feedback, Axiom relay traces, or mobile crash reports. Earlier telemetry environment variables
and saved preferences cannot restore those features. Existing local projects and threads can
still be used. Provider sign-in and requests still go to the coding providers you choose.

Built-in T3 Code updates and Expo over-the-air updates are disabled so they cannot replace this
fork with an upstream build.

## Export diagnostics to your own receiver

To send traces, metrics, or logs to an OpenTelemetry receiver, open
**Settings > Maintenance > Diagnostics**, select an environment, and enter each signal's OTLP HTTP
endpoint under **OpenTelemetry export** (for example `http://localhost:4318/v1/traces`). Save, then
restart that environment's server. The receiver must be reachable from the server's machine.
**Test** sends an empty export from the server to check an endpoint before or after you save it;
saved endpoints are checked when the section opens. Checks send authentication headers only to
the signal's currently running endpoint and do not follow redirects. To check a new endpoint
that requires authentication, save it and restart the server first.

`T3CODE_OTLP_*_URL` and standard `OTEL_EXPORTER_OTLP_*` environment variables override the saved
settings. An overridden signal shows **Set by environment** and names the variable that set it, and its
**Test** checks the running endpoint instead of the field. For endpoints saved here or set with `T3CODE_OTLP_*_URL`, set `T3CODE_OTLP_HEADERS` for
receivers that need authentication and `T3CODE_OTLP_PROTOCOL=http/protobuf` for receivers that do
not accept JSON. An endpoint set with `OTEL_EXPORTER_OTLP_*` takes its headers and protocol from
`OTEL_EXPORTER_OTLP_HEADERS` and `OTEL_EXPORTER_OTLP_PROTOCOL` instead.

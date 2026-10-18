---
name: fullstack-security-audit
description: |
  Comprehensive Master Full-Stack Architecture, Security & Production Readiness Checklist:
  Covers 110+ deduplicated engineering standards across:
  1) Security & Cryptography
  2) Authentication, Authorization & Identity
  3) Database Architecture & Concurrency
  4) Reliability, Resilience & Fault Tolerance
  5) Distributed Systems & Consistency
  6) Performance, Caching & Scaling
  7) Networking & Communication Protocols
  8) Asynchronous Architecture & Event Systems
  9) Infrastructure, DevOps & Deployments
  10) Observability, Operations & Incident Response.
---

# Master Full-Stack Architecture, Security & Production Engineering Standard

This skill is the authoritative, deduplicated engineering checklist and verification manual for modern full-stack web applications, microservices, databases, and distributed infrastructure. Use this skill when conducting architecture reviews, pre-production hardening, or auditing existing codebases.

---

## 🏛️ The 10 Engineering Pillars (Deduplicated Master Checklist)

### 1. Security & Cryptography
- [ ] **SQL Injection (SQLi) Elimination**: Parameterize all queries (`$1, $2`, `?`), ban string interpolation in raw SQL, validate dynamic column/table names against strict allowlists.
- [ ] **Cross-Site Scripting (XSS) Prevention**: Prohibit unsanitized `dangerouslySetInnerHTML`, sanitize rich text with DOMPurify, enforce strict CSP headers (`script-src` without `'unsafe-inline'`).
- [ ] **Cross-Site Request Forgery (CSRF) Defense**: Enforce `SameSite=Lax/Strict` cookies, require anti-CSRF tokens or custom headers (`X-Requested-With`) on state-changing mutations.
- [ ] **Server-Side Request Forgery (SSRF) Defense**: Validate outbound requests against domain allowlists; block private/cloud metadata IPs (`127.0.0.1`, `169.254.169.254`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`).
- [ ] **File Upload Validation**: Inspect magic bytes (not just extensions), enforce file size ceilings, sanitize paths (`../`), and serve files from isolated storage (S3/R2) with `Content-Disposition: attachment` and `X-Content-Type-Options: nosniff`.
- [ ] **Web Application Firewall (WAF) & DDoS Protection**: Front services with Cloudflare/AWS WAF for IP reputation filtering, rate-based banning, and Layer 7 anomaly detection.
- [ ] **Encryption in Transit (TLS)**: Enforce modern TLS (v1.3 preferred, v1.2 minimum), HSTS with preloading, and terminate SSL cleanly at reverse proxies.
- [ ] **Encryption at Rest**: Encrypt databases, storage buckets (AES-256), and automated backups with managed KMS keys.
- [ ] **Production Source Map Lockdown**: Disable source maps in production builds (`sourcemap: false`) to avoid revealing internal code structure.
- [ ] **Dependency Vulnerability Management**: Run regular `npm audit` / Snyk checks with zero tolerance for High/Critical CVEs; pin dependencies.

---

### 2. Authentication, Authorization & Identity
- [ ] **Broken Object & Function Level Authorization (BOLA/BFLA)**: Verify ownership/tenant authorization on every single-resource endpoint (`/api/:resource/:id`); prevent IDOR.
- [ ] **Mass-Assignment Defense**: Strip privileged fields (`role`, `permissions`, `is_admin`) on self-update user routes.
- [ ] **Secure Password Hashing**: Adaptive hashing using bcrypt (cost factor >= 10-12), Argon2id, or scrypt; verify passwords using constant-time comparison.
- [ ] **Multi-Factor Authentication (MFA / 2FA)**: Support TOTP (Authenticator apps), WebAuthn/FIDO2, or short-lived cryptographic OTPs for privileged operations.
- [ ] **OAuth & IAM**: Enforce least-privilege IAM roles; validate OAuth state and PKCE flow for third-party integrations.
- [ ] **Cryptographic JWT Secrets & JWT Rotation**: Minimum 256-bit entropy keys, fail server startup if secret is missing/default, pin algorithm (`algorithms: ['HS256']`), short access token lifespans (15m-1h) paired with secure refresh token rotation.
- [ ] **Storage Token Hygiene (No LocalStorage)**: Store sensitive tokens in `HttpOnly`, `Secure`, `SameSite` cookies or in-memory closures; never in browser `localStorage`.
- [ ] **Server-Side Permission Enforcement**: Never trust UI-hidden controls; validate RBAC/PBAC on every mutating API route.
- [ ] **Row-Level Security (RLS)**: Enforce database-level RLS policies (`ENABLE ROW LEVEL SECURITY`) or strict query-level multi-tenant isolation (`WHERE tenant_id = current_tenant`).

---

### 3. Database Architecture & Concurrency
- [ ] **Connection Pooling**: Use managed pools (`pg.Pool`, PgBouncer, HikariCP) with tuned maximum connections, idle timeouts, and connection timeouts to prevent DB socket starvation.
- [ ] **N+1 Query Elimination**: Batch relational queries via `DataLoader`, `json_agg`, or `include`/`select` joins to avoid synchronous round-trip latency.
- [ ] **Database Indexing**: Add B-tree indexes for foreign keys, compound indexes for common filter/sort tuples (`status + created_at`), and partial indexes for active workloads.
- [ ] **Query Optimization & EXPLAIN ANALYZE**: Profile slow queries; eliminate sequential scans on high-cardinality tables.
- [ ] **Database Migrations & Schema Versioning**: Non-destructive forward-compatible migrations (expand-then-contract pattern), tracked in a versioned migrations table.
- [ ] **Read Replicas**: Direct analytical and read-heavy queries to read replicas; route mutative writes to the primary database.
- [ ] **Sharding & Partitioning**: Partition massive time-series or multi-tenant tables by date range or hash keys.
- [ ] **Optimistic Locking**: Use version counters (`version_id`) on records to detect and reject concurrent overwrites without blocking locks.
- [ ] **Pessimistic Locking**: Use `SELECT ... FOR UPDATE` within transactions when updating financial balances or finite inventory.
- [ ] **Distributed Locks**: Use Redis (Redlock) or database advisory locks for coordination across distributed instances.
- [ ] **Race Conditions & Deadlock Prevention**: Enforce consistent lock acquisition order across tables and short transaction lifecycles.

---

### 4. Reliability, Resilience & Fault Tolerance
- [ ] **Idempotency Keys**: Accept unique idempotency tokens (`Idempotency-Key: UUID`) on state-changing financial, payment, and order endpoints to prevent double-charging on retries.
- [ ] **Timeouts**: Define explicit request timeouts on every inbound endpoint and outbound HTTP/RPC client call (prevent hung worker threads).
- [ ] **Retries & Exponential Backoff**: Implement exponential backoff with random jitter on transient failures (500, 502, 503, 504); never retry 4xx errors.
- [ ] **Circuit Breakers**: Wrap fragile external integrations in circuit breakers (e.g. cockatiel/opossum) that fail fast when downstream services degrade.
- [ ] **Dead Letter Queues (DLQ)**: Divert poison-pill messages to DLQs after max retry attempts for human triage and inspection.
- [ ] **Backpressure**: Throttle ingestion when processing pipelines are saturated to avoid memory exhaustion (stream piping, worker pool queues).
- [ ] **Failover & Redundancy**: Automatic DNS/balancer health routing to standby replicas during availability zone outages.
- [ ] **Chaos Engineering**: Proactively test fault recovery by injecting latency, terminating instances, and simulating DB network partitions.
- [ ] **Error Budgets & SLOs**: Quantify target availability (e.g. 99.9% uptime); pace feature rollouts against consumed error budget.

---

### 5. Distributed Systems & Data Consistency
- [ ] **CAP Theorem Tradeoffs**: Consciously architect for Availability + Partition tolerance (AP) or Consistency + Partition tolerance (CP) per subsystem.
- [ ] **Eventual Consistency**: Design asynchronous distributed workflows to achieve reconciliation over time via idempotent event handlers.
- [ ] **Distributed Transactions & Saga Pattern**: Use choreography or orchestration sagas with compensating transactions rather than fragile 2-phase commit (2PC).
- [ ] **Leader Election**: Coordinate single-writer background tasks using Raft, Paxos, or ZooKeeper/etcd/Redis lease locks.
- [ ] **Replication & Clock Skew**: Account for replication lag; synchronize system clocks via NTP to prevent timestamp skew bugs in distributed ordering.
- [ ] **Network Partition Handling**: Guard against split-brain scenarios with quorum checks (N/2 + 1) in clustering algorithms.

---

### 6. Performance, Caching & Scaling
- [ ] **Multi-Tier Caching Strategies**:
  - *Client*: HTTP `Cache-Control`, ETag, SWR / React Query.
  - *Gateway / CDN*: Cloudflare edge caching for static assets and public APIs.
  - *Application*: In-memory cache (Redis / node-cache) for hot read queries.
- [ ] **Cache Invalidation**: Implement deterministic invalidation keys and TTL limits; avoid stale cache reads on mutating actions.
- [ ] **Reverse Proxies & Load Balancing**: Distribute traffic using Nginx, HAProxy, or cloud ALBs with round-robin or least-connections algorithms.
- [ ] **API Gateways**: Centralize rate limiting, request validation, authentication token verification, and routing at the edge.
- [ ] **Horizontal & Vertical Scaling**: Configure stateless worker nodes capable of auto-scaling horizontally based on CPU/memory/request queues.
- [ ] **Cold Starts & Serverless Limits**: Minimize serverless bundle sizes, optimize package imports, and configure provisioned concurrency for latency-critical Lambdas.
- [ ] **Cost Optimization**: Right-size cluster compute nodes, set auto-scaling minimums, and eliminate zombie storage snapshots/orphaned disks.
- [ ] **Latency & Throughput (P99 & Tail Latency)**: Continuously monitor P95/P99 latency metrics; optimize outlier requests and long-tail query executions.

---

### 7. Networking & Communication Protocols
- [ ] **Strict CORS Configuration**: Allowlist only exact origin domains; never use open wildcards (`*`, `*.pages.dev`, `*.workers.dev`) when credentials are true.
- [ ] **Webhook Signature Verification**: Verify HMAC SHA-256 signatures (`Stripe-Signature`, etc.) against raw request bodies using `crypto.timingSafeEqual`.
- [ ] **WebSockets & Real-Time Transport**: Use WebSockets (Socket.io) with authentication handshakes, heartbeat pings, and reconnection backoff.
- [ ] **Server-Sent Events (SSE) & Long Polling**: Select lightweight SSE for uni-directional streaming (live feeds, LLM token streaming); fallback to long polling only if SSE is unsupported.
- [ ] **gRPC & HTTP/2 / HTTP/3**: Utilize multiplexed HTTP/2 or gRPC Protobufs for high-throughput internal microservice-to-microservice RPCs.
- [ ] **TCP vs UDP & DNS Management**: Tune TCP keep-alive, socket timeouts, and manage DNS TTLs to facilitate rapid IP failover during incidents.

---

### 8. Asynchronous Processing & Event-Driven Systems
- [ ] **Message Queues & Pub/Sub**: Decouple intensive background tasks (emails, reports, video encoding) using RabbitMQ, BullMQ, Kafka, or SQS.
- [ ] **Event-Driven Architecture**: Emit domain events (e.g. `InvoicePaid`, `UserInvited`) to trigger decoupled downstream consumers.
- [ ] **Cron Jobs & Scheduled Tasks**: Schedule recurring workflows with distributed deduplication locks to prevent multiple worker nodes from running the same job simultaneously.

---

### 9. Infrastructure, DevOps & Deployments
- [ ] **Containerization (Docker)**: Multi-stage builds (`Dockerfile.prod`) generating minimal, unprivileged container images without dev dependencies or root users.
- [ ] **Container Orchestration (Kubernetes & Helm)**: Define resource limits (`requests` and `limits`), horizontal pod autoscalers (HPA), and Helm charts for environmental parity.
- [ ] **Health Checks (Liveness & Readiness Probes)**: Expose `/health/live` (process alive) and `/health/ready` (database and cache reachable) endpoints.
- [ ] **CI/CD & Build Caching**: Automated test, lint, and security scan pipelines with package cache reuse to keep build times under 5 minutes.
- [ ] **Infrastructure as Code (IaC & Terraform)**: Declare all cloud infrastructure (VPCs, databases, subnets, S3 buckets) in version-controlled Terraform modules.
- [ ] **Feature Flags**: Decouple deployment from release using LaunchDarkly or PostHog; toggle features dynamically without redeploying code.
- [ ] **Deployment Strategies**: Utilize Blue-Green, Canary, or Rolling Deployments with automated metric-based rollbacks on error-rate spikes.
- [ ] **Disaster Recovery & Automated Backups**: Daily automated encrypted backups with tested point-in-time recovery (PITR) and documented RTO/RPO targets.

---

### 10. Observability, Operations & Incident Response
- [ ] **Structured Logging & Redaction**: Emit machine-parseable JSON logs (`requestId`, `timestamp`, `method`, `status`, `duration`); sanitize passwords, tokens, and PII.
- [ ] **Distributed Tracing & APM**: Propagate trace IDs (`traceparent` / W3C Trace Context) across services via OpenTelemetry to visualize end-to-end request latency.
- [ ] **Metrics & Actionable Alerts**: Track Core Web Vitals, RED metrics (Rate, Errors, Duration), and USE metrics (Utilization, Saturation, Errors); route alerts to PagerDuty.
- [ ] **Production Incident Management, On-Call & Postmortems**: Defined escalation policies, runbooks for common alerts, and blameless postmortems documenting root cause and preventative action items.
- [ ] **Memory Leaks & Garbage Collection**: Profile heap allocations to catch uncleaned event listeners, uncleared timers, or detached DOM nodes.
- [ ] **Thread Safety & Runtime Concurrency**: Ensure shared singletons and caches in multi-threaded runtimes are thread-safe and re-entrant.
- [ ] **API Versioning & Semantic Versioning**: Follow SemVer (`vMAJOR.MINOR.PATCH`); maintain backwards-compatible API contracts (`/api/v1`) before deprecating old endpoints.

---

## 🛠️ Step-by-Step Audit Execution Protocol

1. **Phase 1: Security & Identity Audit**: Verify SQLi, XSS, CSRF, BOLA/BFLA, password verification, MFA, JWT hygiene, and CORS.
2. **Phase 2: Database & Concurrency Review**: Review connection pools, N+1 queries, transaction locks, and migrations.
3. **Phase 3: Reliability & Performance Scan**: Check idempotency, circuit breakers, rate limits, timeouts, and multi-tier caching.
4. **Phase 4: Infrastructure & DevOps Inspection**: Inspect Dockerfiles, health probes, CI/CD pipelines, and secret management.
5. **Phase 5: Observability & Operational Readiness**: Review structured logging, metric alarms, PII scrubbing, and SLO tracking.

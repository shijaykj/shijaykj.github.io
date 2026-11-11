/* Portfolio content rendered into the interactive sections.
   Everything here is taken from, or generalised from, the CV.
   No client figures are published. */

export const JOURNEY = [
  {
    id: 'requirements', title: 'Requirements',
    lead: 'Pin down what "fast enough" means, for whom, and under what load, before a single script is written.',
    actions: ['Agree SLAs and non-functional requirements with stakeholders', 'Identify business-critical transactions', 'Capture peak volumes and growth expectations'],
    outputs: ['NFR & SLA matrix', 'Scope and success criteria'],
    viz: 'sla',
  },
  {
    id: 'workload', title: 'Workload analysis',
    lead: 'Turn production behaviour into a workload model: the transaction mix, arrival rates, concurrency and think times that real users create.',
    actions: ['Analyse usage patterns and peak-hour volumes', 'Derive concurrency with Little\'s Law', 'Define transaction mix and pacing'],
    outputs: ['Workload model', 'Volume & data requirements'],
    viz: 'mix',
  },
  {
    id: 'design', title: 'Test design',
    lead: 'Choose the right test for each question. A baseline answers a different question from a stress or endurance test.',
    actions: ['Plan baseline, load, stress, endurance and capacity scenarios', 'Prepare realistic, varied test data', 'Check environment parity and the monitoring plan'],
    outputs: ['Performance test plan', 'Scenario & data design'],
    viz: 'scenarios',
  },
  {
    id: 'load', title: 'Load generation',
    lead: 'Build robust, maintainable scripts and drive controlled load, ramping users the way production does.',
    actions: ['Script in JMeter, NeoLoad or LoadRunner with correlation and parameterisation', 'Execute at scale with BlazeMeter / Performance Center', 'Control ramp-up, steady state and pacing'],
    outputs: ['Reusable script suite', 'Executed test runs'],
    viz: 'ramp',
  },
  {
    id: 'monitoring', title: 'Monitoring',
    lead: 'Watch the whole stack while the load runs. Response times explain what users feel; resource metrics explain why.',
    actions: ['Track application and infrastructure metrics in Dynatrace and Grafana', 'Collect Windows PerfMon counters and logs', 'Correlate transactions with resource utilisation'],
    outputs: ['Live dashboards', 'Correlated metric timelines'],
    viz: 'monitor',
  },
  {
    id: 'bottleneck', title: 'Bottleneck analysis',
    lead: 'Find the resource that saturates first: where queues form, latency bends upward and throughput stops scaling.',
    actions: ['Break response time down by tier and transaction', 'Spot saturation in CPU, memory, threads, pools or I/O', 'Drive root-cause analysis with development teams'],
    outputs: ['Evidence-backed findings', 'Performance defects'],
    viz: 'knee',
  },
  {
    id: 'optimisation', title: 'Optimisation',
    lead: 'Work with the owning teams on fixes, then re-run the same workload to prove the improvement rather than assume it.',
    actions: ['Prioritise fixes by user impact', 'Re-test under identical conditions', 'Confirm no new regressions were introduced'],
    outputs: ['Validated fixes', 'Before / after comparison'],
    viz: 'improve',
  },
  {
    id: 'results', title: 'Results',
    lead: 'Translate measurements into a clear release decision that engineers and managers can both act on.',
    actions: ['Compare every build against the agreed baseline', 'Report SLA compliance, trends and risks', 'Give a go / no-go recommendation'],
    outputs: ['Baseline comparison report', 'Release certification'],
    viz: 'report',
  },
];

export const ARCH = {
  users: {
    kicker: 'Entry point', title: 'Users',
    body: 'Everything starts with how real people use the product: which journeys they take, how often, from where and with what pauses between actions.',
    metrics: ['Concurrent users', 'Arrival rate', 'Think time', 'Journey mix'],
    risks: ['Unrealistic workload models that test the wrong thing', 'Peak and seasonal patterns ignored'],
    tools: 'Analytics & logs → workload model',
  },
  loadgen: {
    kicker: 'Load generation', title: 'Load generator',
    body: 'Scripts replay those journeys at scale. They have to behave like browsers and clients do, otherwise the results describe the tool rather than the system.',
    metrics: ['Virtual users', 'Hits/s', 'Pacing accuracy', 'Injector CPU'],
    risks: ['Missing correlation of dynamic values', 'Overloaded injectors skewing results', 'Cached or static test data'],
    tools: 'JMeter · NeoLoad · LoadRunner · BlazeMeter',
  },
  web: {
    kicker: 'Edge tier', title: 'Web server',
    body: 'Terminates connections and serves static content. It is often the first place where connection limits and misconfigured keep-alive or compression show up.',
    metrics: ['Requests/s', 'Active connections', 'HTTP error codes', 'Bytes transferred'],
    risks: ['Connection or worker limits', 'Missing compression and caching', 'TLS handshake overhead'],
    tools: 'Chrome DevTools · Fiddler · HTTPWatch',
  },
  app: {
    kicker: 'Application tier', title: 'Application server',
    body: 'Where business logic runs. I break response time down per transaction and look at thread pools, memory behaviour and calls to downstream services.',
    metrics: ['Response time per transaction', 'Thread pool usage', 'CPU & memory', 'GC pauses'],
    risks: ['Thread or connection pool exhaustion', 'Memory growth in endurance runs', 'Chatty calls to downstream services'],
    tools: 'Dynatrace · Grafana · PerfMon',
  },
  db: {
    kicker: 'Data tier', title: 'Database',
    body: 'The most common place for a system to queue. Slow queries, missing indexes and lock contention can stay invisible at low load and dominate at peak.',
    metrics: ['Query time', 'Locks & waits', 'Connection pool', 'Disk I/O'],
    risks: ['Missing or unused indexes', 'Lock contention under concurrency', 'Undersized connection pools'],
    tools: 'SQL · Dynatrace · PerfMon',
  },
  monitoring: {
    kicker: 'Observability', title: 'Monitoring',
    body: 'Runs alongside every tier during a test. Correlating response times with resource metrics and logs on one timeline is how a symptom becomes a root cause.',
    metrics: ['Per-tier utilisation', 'Error & exception rates', 'Saturation signals', 'Log events'],
    risks: ['Blind spots in a tier nobody instrumented', 'Metrics at too coarse a granularity'],
    tools: 'Dynatrace · Grafana · Windows PerfMon',
  },
};

export const PHASES = [
  { id: 'all', label: 'All' },
  { id: 'plan', label: 'Plan' },
  { id: 'script', label: 'Script' },
  { id: 'execute', label: 'Execute' },
  { id: 'monitor', label: 'Monitor' },
  { id: 'analyse', label: 'Analyse' },
  { id: 'report', label: 'Report' },
];

export const TOOLS = [
  { name: 'JMeter', cat: 'Load testing', phases: ['script', 'execute', 'analyse'], where: 'Esko (current) · Infosys',
    how: 'My core load-testing platform. I build and maintain scripts for key business workflows with correlation, parameterisation and realistic pacing, and run baseline, load, stress and endurance tests.' },
  { name: 'BlazeMeter', cat: 'Load testing', phases: ['execute', 'analyse', 'report'], where: 'Esko (current) · Infosys',
    how: 'Executes JMeter tests at scale from the cloud, so I can generate higher, distributed load and compare runs over time.' },
  { name: 'NeoLoad', cat: 'Load testing', phases: ['script', 'execute', 'analyse'], where: 'Infosys · Certified professional',
    how: 'Developed, enhanced and reviewed performance scripts for enterprise insurance and banking applications. NeoLoad Professional certified.' },
  { name: 'LoadRunner / PC', cat: 'Load testing', phases: ['script', 'execute', 'analyse'], where: 'Infosys',
    how: 'HP LoadRunner and Performance Center scripting and execution, including TruClient, for enterprise client engagements.' },
  { name: 'Grafana k6', cat: 'Load testing', phases: ['script', 'execute'], where: 'Esko · Proof of concept',
    how: 'Ran a POC evaluating k6 scripting, workload execution and metrics analysis as a code-first option alongside JMeter.' },
  { name: 'Dynatrace', cat: 'APM', phases: ['monitor', 'analyse'], where: 'Esko (current) · Infosys',
    how: 'Traces slow transactions through the application tier and correlates them with infrastructure behaviour during test runs.' },
  { name: 'Grafana', cat: 'Observability', phases: ['monitor', 'analyse', 'report'], where: 'Esko (current) · Infosys',
    how: 'Dashboards that put response times and resource utilisation on the same timeline, which is where bottlenecks reveal themselves.' },
  { name: 'Windows PerfMon', cat: 'Observability', phases: ['monitor', 'analyse'], where: 'Esko (current)',
    how: 'Server-side counters for CPU, memory, disk and process behaviour, used to pinpoint resource utilisation issues.' },
  { name: 'Chrome DevTools', cat: 'Diagnostics', phases: ['plan', 'script', 'analyse'], where: 'Esko (current)',
    how: 'Inspects real browser traffic to understand requests before scripting them, and analyses client-side timings.' },
  { name: 'Fiddler', cat: 'Diagnostics', phases: ['plan', 'script'], where: 'Infosys',
    how: 'Captures and inspects HTTP/HTTPS traffic to identify dynamic values for correlation and debug protocol-level issues.' },
  { name: 'HTTPWatch', cat: 'Diagnostics', phases: ['plan', 'script'], where: 'Infosys',
    how: 'Browser-level HTTP capture used during script design and request analysis.' },
  { name: 'SQL', cat: 'Data', phases: ['plan', 'analyse'], where: 'Infosys',
    how: 'Prepares and validates test data, and investigates database-side behaviour during bottleneck analysis.' },
  { name: 'AWS', cat: 'Cloud', phases: ['plan', 'execute'], where: 'Esko (current) · Certified Cloud Practitioner',
    how: 'Cloud fundamentals for understanding where and how the system under test runs. AWS Certified Cloud Practitioner.' },
  { name: 'JIRA / HP ALM', cat: 'Delivery', phases: ['plan', 'report'], where: 'Infosys',
    how: 'Raising and tracking performance defects through to resolution and re-validation.' },
  { name: 'Confluence & GitHub', cat: 'Delivery', phases: ['plan', 'report'], where: 'Esko (current)',
    how: 'Test strategies, plans and reports in Confluence, with performance scripts version-controlled in GitHub.' },
  { name: 'Excel reporting', cat: 'Reporting', phases: ['analyse', 'report'], where: 'Infosys',
    how: 'Baseline comparison reports that summarise SLA compliance and build-to-build changes for stakeholders.' },
];

export const CASES = [
  {
    tag: 'Application performance', title: 'Enterprise workflow performance',
    summary: 'Keeping business-critical workflows within SLA at peak concurrency, release after release.',
    steps: {
      challenge: 'An enterprise application with complex, long-running business workflows had to hold its SLAs at realistic peak concurrency for every new release.',
      investigation: 'Modelled the critical workflows from usage patterns, built JMeter scripts with correlation and varied test data, then ran baseline, load and endurance tests.',
      bottleneck: 'Endurance runs surface what short tests miss: response times that drift upward and resource usage that grows steadily over hours.',
      improvement: 'Shared timing and resource evidence with development, then re-validated each fix under the identical workload.',
      outcome: 'Release decisions grounded in measured SLA compliance against an agreed baseline rather than gut feel.',
    },
    tags: ['JMeter', 'BlazeMeter', 'Workload model', 'Endurance', 'SLA'],
  },
  {
    tag: 'Observability', title: 'From response time to root cause',
    summary: 'Correlating slow transactions with application and infrastructure metrics to isolate the real constraint.',
    steps: {
      challenge: 'Slow transactions under load, with no obvious cause and several teams each suspecting a different tier.',
      investigation: 'Put response times, CPU, memory, JVM behaviour, logs and infrastructure counters on one timeline in Dynatrace, Grafana and PerfMon.',
      bottleneck: 'The typical pattern: one resource saturates first, queues build behind it, and every downstream metric looks like a symptom.',
      improvement: 'Narrowed the investigation to the saturated tier and worked with its owners on a targeted fix instead of broad tuning.',
      outcome: 'Faster, evidence-based root cause analysis and less time spent chasing symptoms across teams.',
    },
    tags: ['Dynatrace', 'Grafana', 'PerfMon', 'Logs', 'RCA'],
  },
  {
    tag: 'Release certification', title: 'Build-to-build performance comparison',
    summary: 'Controlled, repeatable tests that make regressions visible before they reach production.',
    steps: {
      challenge: 'Frequent releases meant performance regressions could slip through unnoticed between builds.',
      investigation: 'Ran controlled tests with the same workload, data and environment for each build, comparing results against established baselines.',
      bottleneck: 'Small regressions in individual transactions are easy to miss in aggregate numbers but add up release after release.',
      improvement: 'Reported transaction-level deltas, raised performance defects and tracked them through to re-validation.',
      outcome: 'A clear, repeatable go / no-go signal for every release, with both regressions and improvements quantified.',
    },
    tags: ['Benchmarking', 'Regression', 'Baselines', 'Reporting'],
  },
];

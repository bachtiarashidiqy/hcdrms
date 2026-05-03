import { faker, fakerID_ID } from "@faker-js/faker";
import { nanoid } from "nanoid";
import type { DB } from "@/lib/store";
import type {
  User,
  Request,
  DataSource,
  KBArticle,
  ClarificationMessage,
  Deliverable,
  ApprovalStep,
  EffortLog,
  AuditLog,
  Notification,
  Attachment,
  DeliverableSource,
  RequestPeriod,
} from "@/types/domain";
import {
  ROLES,
  PERTAMINA_ENTITIES,
  FUNCTIONS,
  REQUEST_CATEGORIES,
  REQUEST_STATUSES,
  SENSITIVITY_LEVELS,
  PRIORITIES,
  GRANULARITY,
  OUTPUT_FORMATS,
  SLA_HOURS,
} from "@/lib/constants";
import { isPaused } from "@/features/workflow/lib/state-machine";

const USER_DISTRIBUTION = {
  hcis_manager: 1,
  engineer: 8,
  reviewer: 2,
  data_owner: 4,
  admin: 1,
  auditor: 1,
  requestor: 30,
  requestor_manager: 13,
};

const REQUEST_STATUS_DISTRIBUTION = {
  closed: 0.60,
  delivered: 0.05,
  pending_requestor_confirmation: 0.08,
  in_progress: 0.10,
  in_review: 0.05,
  in_clarification: 0.05,
  pending_approval: 0.04,
  assigned: 0.02,
  rejected: 0.01,
};

export function generateSeed(): DB {
  faker.seed(42);
  fakerID_ID.seed(42);

  const users = generateUsers();
  const dataSources = generateDataSources();
  const articles = generateKBArticles(users);
  const requests = generateRequests(users);
  const clarifications = generateClarifications(requests, users);
  const deliverables = generateDeliverables(requests, users, dataSources);
  const approvals = generateApprovals(requests, users);
  const efforts = generateEffortLogs(requests, users);
  const audits = generateAuditLogs(requests, users);
  const notifications = generateNotifications(users, requests);

  return {
    users,
    requests,
    clarifications,
    deliverables,
    approvals,
    efforts,
    audits,
    articles,
    dataSources,
    notifications,
  };
}

function generateUsers(): User[] {
  const users: User[] = [];

  for (const [role, count] of Object.entries(USER_DISTRIBUTION)) {
    for (let i = 0; i < count; i++) {
      const name = fakerID_ID.person.fullName();
      const entity = faker.helpers.arrayElement(PERTAMINA_ENTITIES);
      const func = faker.helpers.arrayElement(FUNCTIONS);
      const initials =
        name
          .split(" ")
          .map((w) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 2) || "U";

      users.push({
        id: nanoid(),
        name,
        email: faker.internet.email({ provider: "energinusantara.co.id" }),
        role: role as any,
        entity,
        function: func,
        department: faker.commerce.department(),
        managerId:
          role === "requestor" || role === "engineer"
            ? undefined
            : faker.helpers.maybe(() => users[Math.max(0, users.length - 10)]?.id),
        initials,
      });
    }
  }

  return users;
}

function generateDataSources(): DataSource[] {
  const dataSourceDefs = [
    {
      name: "SAP HCM PA0001",
      type: "database" as const,
      refreshFrequency: "real-time" as const,
      fields: [
        "PERNR",
        "ENAME",
        "STAT2",
        "BEGDA",
        "ENDDA",
        "DEPARTMENT",
        "POSITION",
      ],
    },
    {
      name: "Power BI HC Dashboard",
      type: "dashboard" as const,
      refreshFrequency: "daily" as const,
      fields: ["Headcount", "Tenure", "Department", "Salary Band", "Date"],
    },
    {
      name: "Shared Folder Self-Service HC",
      type: "shared_folder" as const,
      refreshFrequency: "weekly" as const,
      fields: ["Employee ID", "Name", "Cost Center", "Manager"],
    },
    {
      name: "API Internal HRIS",
      type: "api" as const,
      refreshFrequency: "daily" as const,
      fields: ["employee_id", "status", "salary", "department", "last_updated"],
    },
    {
      name: "SAP Payroll",
      type: "database" as const,
      refreshFrequency: "monthly" as const,
      fields: ["PERNR", "SALARY", "ALLOWANCE", "DEDUCTION", "PERIOD"],
    },
    {
      name: "Power BI Talent Dashboard",
      type: "dashboard" as const,
      refreshFrequency: "weekly" as const,
      fields: ["Performance Rating", "Promotion Eligible", "Retention Risk"],
    },
    {
      name: "Excel Konsolidasi Headcount",
      type: "file" as const,
      refreshFrequency: "monthly" as const,
      fields: ["Entity", "Division", "Department", "Headcount", "Month"],
    },
    {
      name: "API Learning Management",
      type: "api" as const,
      refreshFrequency: "daily" as const,
      fields: ["employee_id", "course_name", "completion_date", "score"],
    },
  ];

  return dataSourceDefs.map((def) => ({
    id: nanoid(),
    name: def.name,
    type: def.type,
    owner: `HC Team - ${faker.commerce.department()}`,
    refreshFrequency: def.refreshFrequency,
    latency: faker.helpers.maybe(
      () => `${faker.number.int({ min: 1, max: 24 })} hours`
    ),
    accessMethod: faker.helpers.arrayElement([
      "Direct DB Access",
      "VPN Required",
      "API Key",
      "Service Account",
    ]),
    contactAdmin: faker.internet.email({ provider: "energinusantara.co.id" }),
    status: faker.helpers.arrayElement(["active", "deprecated"]),
    description: faker.lorem.sentence(),
    fields: def.fields,
    knownIssues: faker.helpers.maybe(
      () => `Issue: ${faker.lorem.sentence()}`
    ),
    lastSuccessfulAccess: faker.date
      .recent({ days: 7 })
      .toISOString(),
  }));
}

function generateKBArticles(users: User[]): KBArticle[] {
  const articles: KBArticle[] = [];
  const owner = faker.helpers.arrayElement(
    users.filter((u) => u.role === "hcis_manager")
  );

  // 5 formula articles
  const formulas = [
    {
      title: "Headcount Aktif Per Entitas",
      content: "Menghitung jumlah karyawan aktif per entitas bisnis grup",
      formulaCode: `SELECT COUNT(DISTINCT pernr) as headcount_aktif FROM pa0001
        WHERE stat2 = '3' AND endda >= :cutoff_date AND begda <= :cutoff_date`,
      formulaLanguage: "sql" as const,
    },
    {
      title: "Attrition Rate (Bulanan)",
      content:
        "Formula untuk menghitung tingkat attrisi karyawan dalam periode bulanan",
      formulaCode: `SELECT
        (COUNT(CASE WHEN masxit = 0 THEN 1 END) * 100.0 / COUNT(*)) as attrition_rate
        FROM pa0001 WHERE begda <= :period_end AND endda > :period_start`,
      formulaLanguage: "sql" as const,
    },
    {
      title: "Span of Control",
      content:
        "Menghitung jumlah direct report per manager di organisasi grup",
      formulaCode: `SELECT manager_id, COUNT(*) as span_of_control
        FROM org_structure WHERE status = 'active' GROUP BY manager_id`,
      formulaLanguage: "sql" as const,
    },
    {
      title: "Average Tenure by Department",
      content: "Rata-rata masa kerja karyawan per departemen",
      formulaCode: `SELECT dept_id, DATEDIFF(year, MIN(begda), :cutoff_date) as avg_tenure
        FROM pa0001 WHERE stat2 = '3' GROUP BY dept_id`,
      formulaLanguage: "sql" as const,
    },
    {
      title: "Compensation Ratio Analysis",
      content: "Analisis perbandingan kompensasi per level dan fungsi",
      formulaCode: `SELECT level, func, AVG(salary) as avg_compensation, STDDEV(salary) as std_dev
        FROM compensation WHERE active_date = :cutoff_date GROUP BY level, func`,
      formulaLanguage: "sql" as const,
    },
  ];

  for (const formula of formulas) {
    articles.push({
      id: nanoid(),
      type: "formula",
      title: formula.title,
      content: formula.content,
      formulaCode: formula.formulaCode,
      formulaLanguage: formula.formulaLanguage,
      parameters: [
        { name: "cutoff_date", description: "Data reference date", required: true },
        {
          name: "period_start",
          description: "Start of analysis period",
          required: false,
        },
      ],
      category: faker.helpers.arrayElement(REQUEST_CATEGORIES),
      tags: ["formula", "metric", "headcount"],
      ownerId: owner.id,
      status: "published",
      version: 1,
      relatedSourceIds: [],
      relatedRequestIds: [],
      lastReviewedAt: faker.date
        .recent({ days: 30 })
        .toISOString(),
      createdAt: faker.date.recent({ days: 90 }).toISOString(),
      updatedAt: faker.date.recent({ days: 30 }).toISOString(),
      views: faker.number.int({ min: 10, max: 500 }),
    });
  }

  // 4 article articles
  const articleDefs = [
    {
      title: "Definisi Headcount Aktif",
      content:
        "Karyawan aktif adalah mereka yang memiliki status '3' di SAP HCM, tidak dalam periode notice atau pensiun",
    },
    {
      title: "Cara Hitung Attrition Rate",
      content:
        "Attrition = (Jumlah keluar dalam periode / Rata-rata headcount aktif) x 100%. Gunakan basis bulanan atau tahunan sesuai kebutuhan",
    },
    {
      title: "Panduan Request Data Sensitif",
      content:
        "Data sensitif seperti gaji, NIP, atau data pribadi memerlukan approval khusus dari Data Owner dan sesuai dengan kebijakan keamanan data grup",
    },
    {
      title: "Source-of-Truth Registry per Kategori",
      content:
        "Master data headcount bersumber dari SAP HCM PA0001. Untuk talent analytics gunakan Power BI yang sudah tersertifikasi. Jangan merge dari multiple sources tanpa validasi",
    },
  ];

  for (const def of articleDefs) {
    articles.push({
      id: nanoid(),
      type: "article",
      title: def.title,
      content: def.content,
      category: faker.helpers.arrayElement(REQUEST_CATEGORIES),
      tags: ["guide", "definition"],
      ownerId: owner.id,
      status: "published",
      version: 1,
      relatedSourceIds: [],
      relatedRequestIds: [],
      lastReviewedAt: faker.date
        .recent({ days: 30 })
        .toISOString(),
      createdAt: faker.date.recent({ days: 90 }).toISOString(),
      updatedAt: faker.date.recent({ days: 30 }).toISOString(),
      views: faker.number.int({ min: 5, max: 300 }),
    });
  }

  // 3 template articles
  const templates = [
    "Template: Headcount Request Form",
    "Template: Data Extraction Checklist",
    "Template: Delivery Sign-off",
  ];

  for (const title of templates) {
    articles.push({
      id: nanoid(),
      type: "template",
      title,
      content: `Standard template untuk memastikan kualitas dan konsistensi proses`,
      category: faker.helpers.arrayElement(REQUEST_CATEGORIES),
      tags: ["template", "process"],
      ownerId: owner.id,
      status: "published",
      version: 1,
      relatedSourceIds: [],
      relatedRequestIds: [],
      createdAt: faker.date.recent({ days: 90 }).toISOString(),
      updatedAt: faker.date.recent({ days: 30 }).toISOString(),
      views: faker.number.int({ min: 20, max: 200 }),
    });
  }

  // 3 standard_answer articles
  const answers = [
    {
      title: "Apa itu Attrition?",
      content: "Attrition adalah jumlah karyawan yang keluar dalam periode tertentu",
    },
    {
      title: "Apa cut-off SAP HCM yang umum?",
      content:
        "Cut-off standar adalah akhir bulan kalender atau sesuai periode pembayaran gaji",
    },
    {
      title: "Kapan pakai SAP vs Power BI?",
      content:
        "Gunakan SAP untuk transaksional dan detail master data. Power BI untuk analisis dan visualisasi yang sudah divalidasi",
    },
  ];

  for (const ans of answers) {
    articles.push({
      id: nanoid(),
      type: "standard_answer",
      title: ans.title,
      content: ans.content,
      tags: ["faq", "standard"],
      ownerId: owner.id,
      status: "published",
      version: 1,
      relatedSourceIds: [],
      relatedRequestIds: [],
      createdAt: faker.date.recent({ days: 90 }).toISOString(),
      updatedAt: faker.date.recent({ days: 30 }).toISOString(),
      views: faker.number.int({ min: 50, max: 400 }),
    });
  }

  return articles;
}

function generateRequests(users: User[]): Request[] {
  const requests: Request[] = [];
  const requestors = users.filter((u) => u.role === "requestor");
  const engineers = users.filter((u) => u.role === "engineer");
  const reviewers = users.filter((u) => u.role === "reviewer");
  const hcisManager = users.find((u) => u.role === "hcis_manager");

  const titles = [
    "Headcount aktif per entitas Q3 2025",
    "Attrition rate engineer level 1-3 H1 2025",
    "Compensation benchmarking middle management",
    "Organizational structure tree Nusantara Hulu",
    "Performance rating distribution by function",
    "Learning completion rate per divisi",
    "Employee tenure analysis by entry year",
    "Succession readiness untuk senior management",
    "Talent pool analysis untuk program leadership",
    "Cost per FTE analysis",
    "Headcount forecast Q4 2025 dan 2026",
    "Headcount movement in dan out Q2 2025",
    "Salary grade distribution per entity",
    "High performer retention metrics",
    "Training investment ROI analysis",
    "Organization health check dashboard",
    "Headcount breakdown by tenure band",
    "Turnover analysis by department",
    "Demographic profile snapshot",
    "Skills gap analysis HC division",
  ];

  const purposes = [
    "Untuk analisis trending headcount dan perencanaan budget tahun depan",
    "Dibutuhkan untuk evaluasi retention strategy dan HR planning",
    "Input untuk strategi kompensasi dan salary review",
    "Mendukung organizational redesign initiative",
    "Basis untuk talent development program",
    "Reporting ke top management dan board",
    "Compliance dan audit trail untuk internal audit",
    "Benchmarking dengan peer company",
    "Input untuk strategic workforce planning",
    "Validation data untuk HR system",
  ];

  let requestCounter = 1;

  // Generate 200 requests with distribution
  for (const [status, percentage] of Object.entries(REQUEST_STATUS_DISTRIBUTION)) {
    const count = Math.round(200 * percentage);
    for (let i = 0; i < count; i++) {
      const requestor = faker.helpers.arrayElement(requestors);
      const createdDate = faker.date.recent({ days: 90 });
      const priority = faker.helpers.arrayElement(PRIORITIES);
      const slaHours = SLA_HOURS[priority];

      const dueDate = new Date(
        createdDate.getTime() + slaHours * 60 * 60 * 1000
      );

      let submittedAt: string | undefined;
      let deliveredAt: string | undefined;
      let closedAt: string | undefined;
      let slaPausedAt: string | undefined;
      let assignedEngineerId: string | undefined;
      let reviewerId: string | undefined;

      if (status !== "draft" && status !== "submitted") {
        submittedAt = new Date(
          createdDate.getTime() + faker.number.int({ min: 1000, max: 60000 })
        ).toISOString();
      }

      if (
        status === "in_progress" ||
        status === "in_review" ||
        status === "pending_requestor_confirmation" ||
        status === "delivered" ||
        status === "closed"
      ) {
        assignedEngineerId = faker.helpers.arrayElement(engineers).id;
      }

      if (
        status === "in_review" ||
        status === "pending_requestor_confirmation" ||
        status === "delivered" ||
        status === "closed"
      ) {
        reviewerId = faker.helpers.arrayElement(reviewers).id;
      }

      if (status === "delivered" || status === "closed") {
        deliveredAt = new Date(
          new Date(submittedAt!).getTime() +
            faker.number.int({ min: 3600000, max: 259200000 })
        ).toISOString();
      }

      if (status === "closed") {
        closedAt = new Date(
          new Date(deliveredAt!).getTime() + faker.number.int({ min: 3600000, max: 604800000 })
        ).toISOString();
      }

      if (isPaused(status as any)) {
        slaPausedAt = new Date().toISOString();
      }

      const code = `HCDRMS-${new Date().getFullYear()}-${String(requestCounter).padStart(4, "0")}`;
      requestCounter++;

      requests.push({
        id: nanoid(),
        code,
        title: faker.helpers.arrayElement(titles),
        category: faker.helpers.arrayElement(REQUEST_CATEGORIES),
        purpose: faker.helpers.arrayElement(purposes),
        requestorId: requestor.id,
        requestorEntity: requestor.entity,
        requestorFunction: requestor.function,
        period: {
          type: faker.helpers.arrayElement(["point-in-time", "range"]),
          date: faker.helpers.maybe(() =>
            faker.date.past({ years: 1 }).toISOString().split("T")[0]
          ),
          startDate: faker.helpers.maybe(() =>
            faker.date.past({ years: 1 }).toISOString().split("T")[0]
          ),
          endDate: faker.helpers.maybe(() =>
            faker.date.recent({ days: 30 }).toISOString().split("T")[0]
          ),
        } as RequestPeriod,
        scopeEntities: faker.helpers.arrayElements(
          PERTAMINA_ENTITIES,
          faker.number.int({ min: 1, max: 3 })
        ),
        scopeOrgUnits: [
          faker.commerce.department(),
          faker.commerce.department(),
        ],
        granularity: faker.helpers.arrayElement(GRANULARITY),
        outputFormats: faker.helpers.arrayElements(
          OUTPUT_FORMATS,
          faker.number.int({ min: 1, max: 3 })
        ),
        dueDate: dueDate.toISOString(),
        priority,
        sensitivity: faker.helpers.arrayElement(SENSITIVITY_LEVELS),
        status: status as any,
        assignedEngineerId,
        reviewerId,
        slaHours,
        slaPausedAt,
        slaPausedSeconds: 0,
        submittedAt,
        deliveredAt,
        closedAt,
        createdAt: createdDate.toISOString(),
        updatedAt: faker.date.recent({ days: 5 }).toISOString(),
      });
    }
  }

  return requests;
}

function generateClarifications(requests: Request[], users: User[]): ClarificationMessage[] {
  const clarifications: ClarificationMessage[] = [];

  // Filter requests that could have clarifications
  const clarifiableRequests = requests.filter((r) =>
    ["in_clarification", "in_progress", "in_review", "closed"].includes(r.status)
  );

  const engineers = users.filter((u) => u.role === "engineer");
  const requestors = users.filter((u) => u.role === "requestor");

  for (const request of clarifiableRequests) {
    const messageCount = faker.number.int({ min: 2, max: 5 });

    for (let i = 0; i < messageCount; i++) {
      const isFromEngineer = faker.datatype.boolean();
      const author = isFromEngineer
        ? request.assignedEngineerId
          ? engineers.find((e) => e.id === request.assignedEngineerId)
          : faker.helpers.arrayElement(engineers)
        : requestors.find((r) => r.id === request.requestorId);

      const clarificationMessages = [
        "Bisa clarify scope untuk entitas yang mana saja?",
        "Apakah data ini termasuk yang sudah pensiun atau hanya aktif?",
        "Butuh format khusus untuk output Excel-nya?",
        "Data sensitive ini butuh approval special atau bisa langsung dikirim?",
        "Periode yang diminta apakah cut-off akhir bulan atau point in time?",
        "Dari mana sumber data ini? SAP atau Power BI?",
        "Timeline untuk deliver data ini kapan butuhnya?",
        "Untuk level detail seperti apa yang dibutuhkan? Summary atau individual level?",
      ];

      clarifications.push({
        id: nanoid(),
        requestId: request.id,
        authorId: author!.id,
        content: faker.helpers.arrayElement(clarificationMessages),
        mentions: [],
        createdAt: faker.date.recent({ days: 30 }).toISOString(),
      });
    }
  }

  return clarifications;
}

function generateDeliverables(
  requests: Request[],
  users: User[],
  dataSources: DataSource[]
): Deliverable[] {
  const deliverables: Deliverable[] = [];

  // Requests that should have deliverables
  const deliverableRequests = requests.filter((r) =>
    [
      "in_review",
      "pending_requestor_confirmation",
      "delivered",
      "closed",
    ].includes(r.status)
  );

  const engineers = users.filter((u) => u.role === "engineer");
  const reviewers = users.filter((u) => u.role === "reviewer");

  for (const request of deliverableRequests) {
    const engineer = request.assignedEngineerId
      ? engineers.find((e) => e.id === request.assignedEngineerId)
      : faker.helpers.arrayElement(engineers);

    const sources: DeliverableSource[] = faker.helpers
      .arrayElements(dataSources, faker.number.int({ min: 1, max: 3 }))
      .map((ds) => ({
        dataSourceId: ds.id,
        cutOffDate: faker.date
          .recent({ days: 30 })
          .toISOString()
          .split("T")[0],
        refreshFrequency: ds.refreshFrequency,
        formulaReference: faker.helpers.maybe(() => "HC_ACTIVE_COUNT"),
        notes: faker.helpers.maybe(() => faker.lorem.sentence()),
      }));

    const createdAt = faker.date.recent({ days: 5 }).toISOString();

    deliverables.push({
      id: nanoid(),
      requestId: request.id,
      version: 1,
      files: [
        {
          id: nanoid(),
          filename: `${request.code}-v1.xlsx`,
          size: faker.number.int({ min: 50000, max: 5000000 }),
          mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          uploadedBy: engineer!.id,
          uploadedAt: createdAt,
        },
      ],
      sources,
      extractionDate: createdAt,
      caveats: faker.helpers.maybe(
        () => "Data tidak termasuk unpaid leave dan suspended status"
      ),
      scopeIncluded: "Semua entitas grup aktif",
      scopeExcluded: "Contractors dan third-party staffing",
      reviewStatus: ["in_review", "pending_requestor_confirmation"].includes(
        request.status
      )
        ? "pending"
        : "approved",
      reviewerId: request.reviewerId,
      reviewComment: faker.helpers.maybe(() => "Sudah OK dikirim ke requestor"),
      reviewedAt: faker.helpers.maybe(() =>
        faker.date.recent({ days: 2 }).toISOString()
      ),
      createdById: engineer!.id,
      createdAt,
    });

    // Sometimes add v2
    if (request.status === "closed" && faker.datatype.boolean(0.3)) {
      deliverables.push({
        id: nanoid(),
        requestId: request.id,
        version: 2,
        files: [
          {
            id: nanoid(),
            filename: `${request.code}-v2.xlsx`,
            size: faker.number.int({ min: 50000, max: 5000000 }),
            mimeType:
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            uploadedBy: engineer!.id,
            uploadedAt: faker.date
              .recent({ days: 2 })
              .toISOString(),
          },
        ],
        sources,
        extractionDate: faker.date.recent({ days: 2 }).toISOString(),
        caveats: "Perbaikan per feedback requestor",
        scopeIncluded: "Semua entitas grup aktif",
        scopeExcluded: "Contractors dan third-party staffing",
        reviewStatus: "approved",
        reviewerId: request.reviewerId,
        reviewComment: "Revisi sudah OK, bisa dikirim final",
        reviewedAt: faker.date.recent({ days: 1 }).toISOString(),
        createdById: engineer!.id,
        createdAt: faker.date.recent({ days: 1 }).toISOString(),
      });
    }
  }

  return deliverables;
}

function generateApprovals(requests: Request[], users: User[]): ApprovalStep[] {
  const approvals: ApprovalStep[] = [];

  // Requests yang punya approval step
  const approvalRequests = requests.filter((r) =>
    [
      "pending_approval",
      "assigned",
      "in_progress",
      "in_review",
      "pending_requestor_confirmation",
      "delivered",
      "closed",
    ].includes(r.status)
  );

  const dataOwners = users.filter((u) => u.role === "data_owner");
  const requestorManagers = users.filter(
    (u) => u.role === "requestor_manager"
  );
  const hcisManager = users.find((u) => u.role === "hcis_manager");

  for (const request of approvalRequests) {
    const approverPool = [
      ...dataOwners,
      ...requestorManagers,
      ...(hcisManager ? [hcisManager] : []),
    ];

    const approverCount = faker.number.int({ min: 1, max: 2 });

    for (let level = 1; level <= approverCount; level++) {
      const approver = faker.helpers.arrayElement(approverPool);
      const isApproved =
        [
          "assigned",
          "in_progress",
          "in_review",
          "pending_requestor_confirmation",
          "delivered",
          "closed",
        ].includes(request.status) || faker.datatype.boolean(0.7);

      approvals.push({
        id: nanoid(),
        requestId: request.id,
        level,
        approverId: approver.id,
        approverRole: approver.role as any,
        decision: isApproved
          ? "approved"
          : faker.helpers.arrayElement(["rejected", "pending"]),
        comment: faker.helpers.maybe(() => faker.lorem.sentence()),
        decidedAt: isApproved
          ? faker.date.recent({ days: 5 }).toISOString()
          : undefined,
        createdAt: faker.date.recent({ days: 10 }).toISOString(),
      });
    }
  }

  return approvals;
}

function generateEffortLogs(requests: Request[], users: User[]): EffortLog[] {
  const efforts: EffortLog[] = [];

  // Requests dengan effort logs
  const effortRequests = requests.filter((r) =>
    ["in_progress", "in_review", "pending_requestor_confirmation", "closed"].includes(
      r.status
    )
  );

  const engineers = users.filter((u) => u.role === "engineer");
  const phases: ("clarification" | "extraction" | "processing" | "review" | "revision")[] = [
    "clarification",
    "extraction",
    "processing",
    "review",
    "revision",
  ];

  for (const request of effortRequests) {
    const logCount = faker.number.int({ min: 3, max: 10 });

    for (let i = 0; i < logCount; i++) {
      const engineer = request.assignedEngineerId
        ? engineers.find((e) => e.id === request.assignedEngineerId)
        : faker.helpers.arrayElement(engineers);

      efforts.push({
        id: nanoid(),
        requestId: request.id,
        engineerId: engineer!.id,
        hours: faker.number.float({ min: 0.5, max: 8, multipleOf: 0.5 }),
        phase: faker.helpers.arrayElement(phases),
        notes: faker.helpers.maybe(() => faker.lorem.sentence()),
        loggedAt: faker.date.recent({ days: 10 }).toISOString(),
      });
    }
  }

  return efforts;
}

function generateAuditLogs(requests: Request[], users: User[]): AuditLog[] {
  const audits: AuditLog[] = [];

  const actions = [
    "request_created",
    "status_changed",
    "deliverable_uploaded",
    "approval_granted",
    "approval_rejected",
    "clarification_sent",
    "kb_viewed",
    "user_assigned",
    "comment_added",
  ];

  // Generate ~500 audit logs
  for (let i = 0; i < 500; i++) {
    const user = faker.helpers.arrayElement(users);
    const request = faker.helpers.arrayElement(requests);

    audits.push({
      id: nanoid(),
      userId: user.id,
      action: faker.helpers.arrayElement(actions),
      targetType: faker.helpers.arrayElement(["Request", "Deliverable", "Approval"]),
      targetId: request.id,
      ip: faker.internet.ipv4(),
      userAgent: faker.helpers.maybe(() => faker.internet.userAgent()),
      timestamp: faker.date.recent({ days: 90 }).toISOString(),
    });
  }

  return audits;
}

function generateNotifications(users: User[], requests: Request[]): Notification[] {
  const notifications: Notification[] = [];

  const notificationTypes = [
    "request_submitted",
    "request_assigned",
    "status_change",
    "clarification",
    "mention",
    "sla_warning",
    "delivery",
    "closure",
  ];

  // Generate ~30 unread notifications
  for (let i = 0; i < 30; i++) {
    const user = faker.helpers.arrayElement(users);
    const request = faker.helpers.arrayElement(requests);

    notifications.push({
      id: nanoid(),
      userId: user.id,
      type: faker.helpers.arrayElement(notificationTypes) as any,
      title: `Notifikasi untuk request ${request.code}`,
      message: faker.lorem.sentence(),
      link: `/requests/${request.id}`,
      read: false,
      createdAt: faker.date.recent({ days: 7 }).toISOString(),
    });
  }

  return notifications;
}

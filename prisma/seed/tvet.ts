// ============================================================
// Seed — TVET Trades and Modules
// 5 representative trades × L3–L5 with modules each.
// ============================================================

import type { PrismaClient } from "@prisma/client";

// ------------------------------------------------------------
// Trades
// ------------------------------------------------------------

interface TradeSeed {
  code: string;
  name: string;
  description: string;
}

const TRADES: TradeSeed[] = [
  {
    code: "SW_DEV",
    name: "Software Development",
    description:
      "Design, build, and maintain software applications and web systems.",
  },
  {
    code: "ICT",
    name: "Computer Systems / ICT",
    description:
      "Computer hardware, networking, systems administration, and IT support.",
  },
  {
    code: "MASONRY",
    name: "Masonry / Building Construction",
    description:
      "Construction of buildings using bricks, blocks, concrete, and stone.",
  },
  {
    code: "TAILORING",
    name: "Tailoring / Fashion Design",
    description:
      "Garment design, cutting, sewing, and finishing techniques.",
  },
  {
    code: "CULINARY",
    name: "Culinary Arts",
    description:
      "Professional cooking, food preparation, kitchen management, and hygiene.",
  },
];

// ------------------------------------------------------------
// Modules per trade
// Codes are unique per trade (enforced by schema @@unique([tradeId, code])).
// Hours are indicative totals for the module.
// Order determines display sequence.
// ------------------------------------------------------------

interface ModuleSeed {
  code: string;
  name: string;
  description?: string;
  hours: number;
  order: number;
}

interface TradeModulesSeed {
  tradeCode: string;
  modules: ModuleSeed[];
}

const TRADE_MODULES: TradeModulesSeed[] = [
  // --------------------------------------------------------
  // Software Development
  // --------------------------------------------------------
  {
    tradeCode: "SW_DEV",
    modules: [
      { code: "SW_DEV_101", name: "Introduction to Programming", description: "Fundamentals of programming logic, variables, control flow.", hours: 60, order: 1 },
      { code: "SW_DEV_102", name: "Web Fundamentals", description: "HTML, CSS, and basic client-side scripting.", hours: 60, order: 2 },
      { code: "SW_DEV_103", name: "Programming with Python", description: "Python syntax, data structures, and functions.", hours: 80, order: 3 },
      { code: "SW_DEV_201", name: "Databases and SQL", description: "Relational database design, SQL queries, normalization.", hours: 80, order: 4 },
      { code: "SW_DEV_202", name: "Modern Web Development", description: "JavaScript, React, and REST APIs.", hours: 100, order: 5 },
      { code: "SW_DEV_203", name: "Software Engineering Practices", description: "Version control, testing, and agile teamwork.", hours: 80, order: 6 },
      { code: "SW_DEV_301", name: "Backend Development", description: "Server-side frameworks, authentication, and APIs.", hours: 100, order: 7 },
      { code: "SW_DEV_302", name: "Mobile Application Development", description: "Building cross-platform mobile apps.", hours: 80, order: 8 },
      { code: "SW_DEV_303", name: "Capstone Project", description: "Full-cycle software project with documentation.", hours: 120, order: 9 },
    ],
  },

  // --------------------------------------------------------
  // Computer Systems / ICT
  // --------------------------------------------------------
  {
    tradeCode: "ICT",
    modules: [
      { code: "ICT_101", name: "Computer Hardware Fundamentals", description: "Components, assembly, and troubleshooting.", hours: 60, order: 1 },
      { code: "ICT_102", name: "Operating Systems", description: "Windows and Linux installation and administration basics.", hours: 60, order: 2 },
      { code: "ICT_103", name: "Office Productivity Tools", description: "Word processing, spreadsheets, and presentations.", hours: 40, order: 3 },
      { code: "ICT_201", name: "Networking Fundamentals", description: "TCP/IP, LAN, WAN, and basic network devices.", hours: 80, order: 4 },
      { code: "ICT_202", name: "Systems Administration", description: "User management, services, backup, and monitoring.", hours: 80, order: 5 },
      { code: "ICT_203", name: "Technical Support and Helpdesk", description: "Diagnostics, ticketing, and user support.", hours: 60, order: 6 },
      { code: "ICT_301", name: "Cybersecurity Fundamentals", description: "Threats, defenses, and safe practices.", hours: 80, order: 7 },
      { code: "ICT_302", name: "Cloud and Virtualization", description: "Virtual machines, containers, and cloud basics.", hours: 80, order: 8 },
      { code: "ICT_303", name: "Capstone Project", description: "IT infrastructure project.", hours: 120, order: 9 },
    ],
  },

  // --------------------------------------------------------
  // Masonry / Building Construction
  // --------------------------------------------------------
  {
    tradeCode: "MASONRY",
    modules: [
      { code: "MAS_101", name: "Occupational Safety and Tools", description: "Site safety, PPE, and hand tools.", hours: 40, order: 1 },
      { code: "MAS_102", name: "Reading Construction Drawings", description: "Plans, elevations, and specifications.", hours: 60, order: 2 },
      { code: "MAS_103", name: "Materials and Mixing", description: "Cement, sand, aggregates, and mortar mixing.", hours: 60, order: 3 },
      { code: "MAS_201", name: "Brick and Block Laying", description: "Wall construction techniques and bonding.", hours: 100, order: 4 },
      { code: "MAS_202", name: "Concrete Works", description: "Formwork, reinforcement, and pouring.", hours: 80, order: 5 },
      { code: "MAS_203", name: "Plastering and Finishing", description: "Surface preparation and finishes.", hours: 80, order: 6 },
      { code: "MAS_301", name: "Structural Construction", description: "Beams, columns, slabs, and foundations.", hours: 100, order: 7 },
      { code: "MAS_302", name: "Site Supervision", description: "Planning, estimation, and quality control.", hours: 80, order: 8 },
      { code: "MAS_303", name: "Capstone Project", description: "Supervised construction project.", hours: 120, order: 9 },
    ],
  },

  // --------------------------------------------------------
  // Tailoring / Fashion Design
  // --------------------------------------------------------
  {
    tradeCode: "TAILORING",
    modules: [
      { code: "TAL_101", name: "Tools and Sewing Machine Basics", description: "Equipment, stitching, and maintenance.", hours: 40, order: 1 },
      { code: "TAL_102", name: "Textiles and Materials", description: "Fabrics, threads, and their properties.", hours: 40, order: 2 },
      { code: "TAL_103", name: "Basic Sewing Techniques", description: "Seams, hems, and fastenings.", hours: 60, order: 3 },
      { code: "TAL_201", name: "Pattern Drafting and Cutting", description: "Body measurements and pattern construction.", hours: 80, order: 4 },
      { code: "TAL_202", name: "Garment Construction", description: "Skirts, blouses, trousers, and dresses.", hours: 100, order: 5 },
      { code: "TAL_203", name: "Fashion Illustration and Design", description: "Sketching, design concepts, and colour.", hours: 60, order: 6 },
      { code: "TAL_301", name: "Advanced Garment Making", description: "Jackets, suits, and traditional wear.", hours: 100, order: 7 },
      { code: "TAL_302", name: "Business of Fashion", description: "Costing, pricing, marketing, and client relations.", hours: 60, order: 8 },
      { code: "TAL_303", name: "Capstone Project", description: "Design and produce a complete collection piece.", hours: 120, order: 9 },
    ],
  },

  // --------------------------------------------------------
  // Culinary Arts
  // --------------------------------------------------------
  {
    tradeCode: "CULINARY",
    modules: [
      { code: "CUL_101", name: "Kitchen Safety and Hygiene", description: "Food safety, sanitation, and HACCP basics.", hours: 40, order: 1 },
      { code: "CUL_102", name: "Tools and Equipment", description: "Knives, cookware, and kitchen appliances.", hours: 40, order: 2 },
      { code: "CUL_103", name: "Basic Cooking Methods", description: "Boiling, frying, roasting, baking, steaming.", hours: 60, order: 3 },
      { code: "CUL_201", name: "Ingredients and Nutrition", description: "Food groups, nutrition, and menu planning.", hours: 60, order: 4 },
      { code: "CUL_202", name: "Pastry and Baking", description: "Breads, cakes, and pastries.", hours: 80, order: 5 },
      { code: "CUL_203", name: "Rwandan and International Cuisine", description: "Traditional and international dishes.", hours: 80, order: 6 },
      { code: "CUL_301", name: "Advanced Culinary Techniques", description: "Plating, sauces, and modern cooking.", hours: 100, order: 7 },
      { code: "CUL_302", name: "Restaurant and Service Management", description: "Menu costing, service, and operations.", hours: 60, order: 8 },
      { code: "CUL_303", name: "Capstone Project", description: "Menu design and full-service delivery.", hours: 120, order: 9 },
    ],
  },
];

// ------------------------------------------------------------
// Seed function
// ------------------------------------------------------------

export async function seedTvet(prisma: PrismaClient): Promise<void> {
  console.log("🌱 Seeding TVET...");

  // 1. Upsert trades
  let tradeCount = 0;
  for (const trade of TRADES) {
    await prisma.trade.upsert({
      where: { code: trade.code },
      update: {
        name: trade.name,
        description: trade.description,
      },
      create: {
        code: trade.code,
        name: trade.name,
        description: trade.description,
      },
    });
    tradeCount++;
  }
  console.log(`  ✓ Trades upserted: ${tradeCount}`);

  // 2. Load trades into a map
  const trades = await prisma.trade.findMany();
  const tradeByCode = new Map(trades.map((t) => [t.code, t]));

  // 3. Upsert modules
  let moduleCount = 0;

  for (const group of TRADE_MODULES) {
    const trade = tradeByCode.get(group.tradeCode);
    if (!trade) {
      console.warn(`  ⚠ Trade not found: ${group.tradeCode}`);
      continue;
    }

    for (const mod of group.modules) {
      await prisma.module.upsert({
        where: {
          tradeId_code: {
            tradeId: trade.id,
            code: mod.code,
          },
        },
        update: {
          name: mod.name,
          description: mod.description ?? null,
          hours: mod.hours,
          order: mod.order,
        },
        create: {
          tradeId: trade.id,
          code: mod.code,
          name: mod.name,
          description: mod.description ?? null,
          hours: mod.hours,
          order: mod.order,
        },
      });
      moduleCount++;
    }
  }
  console.log(`  ✓ Modules upserted: ${moduleCount}`);

  console.log("  ✓ TVET ready\n");
}
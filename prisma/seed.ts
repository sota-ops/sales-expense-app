import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ── Roles ──
  const roles = await Promise.all(
    [
      { roleCode: "ADMIN", roleName: "管理者", description: "システム管理者" },
      { roleCode: "CEO", roleName: "社長", description: "社長・代表取締役" },
      { roleCode: "MANAGER", roleName: "マネージャー", description: "部門管理者" },
      { roleCode: "APPROVER_MANAGER", roleName: "承認者（上長）", description: "経費承認担当（上長）" },
      { roleCode: "APPROVER_ACCOUNTING", roleName: "承認者（経理）", description: "経費承認担当（経理）" },
      { roleCode: "GENERAL_EMPLOYEE", roleName: "一般社員", description: "一般営業社員" },
    ].map((r) =>
      prisma.role.upsert({
        where: { roleCode: r.roleCode },
        update: {},
        create: r,
      })
    )
  );

  // ── Positions ──
  const positions = await Promise.all(
    [
      { positionCode: "CEO", positionName: "社長", positionRank: 1 },
      { positionCode: "DIRECTOR", positionName: "部長", positionRank: 2 },
      { positionCode: "GENERAL", positionName: "一般", positionRank: 3 },
    ].map((p) =>
      prisma.employeePosition.upsert({
        where: { positionCode: p.positionCode },
        update: {},
        create: p,
      })
    )
  );

  // ── Departments ──
  const departments = await Promise.all(
    [
      { departmentCode: "SALES_1", departmentName: "営業1課" },
      { departmentCode: "SALES_2", departmentName: "営業2課" },
      { departmentCode: "ACCOUNTING", departmentName: "経理部" },
      { departmentCode: "MANAGEMENT", departmentName: "経営管理" },
    ].map((d) =>
      prisma.department.upsert({
        where: { departmentCode: d.departmentCode },
        update: {},
        create: d,
      })
    )
  );

  // ── Users ──
  const passwordHash = await hash("password123", 12);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      employeeCode: "EMP001",
      name: "管理者",
      email: "admin@example.com",
      passwordHash,
      departmentId: departments[3].id,
      employeePositionId: positions[0].id,
    },
  });

  const managerUser = await prisma.user.upsert({
    where: { email: "manager@example.com" },
    update: {},
    create: {
      employeeCode: "EMP002",
      name: "田中部長",
      email: "manager@example.com",
      passwordHash,
      departmentId: departments[0].id,
      employeePositionId: positions[1].id,
    },
  });

  const salesUser1 = await prisma.user.upsert({
    where: { email: "sales1@example.com" },
    update: {},
    create: {
      employeeCode: "EMP003",
      name: "佐藤太郎",
      email: "sales1@example.com",
      passwordHash,
      departmentId: departments[0].id,
      employeePositionId: positions[2].id,
      managerUserId: managerUser.id,
    },
  });

  const salesUser2 = await prisma.user.upsert({
    where: { email: "sales2@example.com" },
    update: {},
    create: {
      employeeCode: "EMP004",
      name: "鈴木花子",
      email: "sales2@example.com",
      passwordHash,
      departmentId: departments[0].id,
      employeePositionId: positions[2].id,
      managerUserId: managerUser.id,
    },
  });

  const accountingUser = await prisma.user.upsert({
    where: { email: "accounting@example.com" },
    update: {},
    create: {
      employeeCode: "EMP005",
      name: "経理担当",
      email: "accounting@example.com",
      passwordHash,
      departmentId: departments[2].id,
      employeePositionId: positions[2].id,
    },
  });

  // ── User Roles ──
  const adminRole = roles.find((r) => r.roleCode === "ADMIN")!;
  const ceoRole = roles.find((r) => r.roleCode === "CEO")!;
  const managerRole = roles.find((r) => r.roleCode === "MANAGER")!;
  const approverManagerRole = roles.find((r) => r.roleCode === "APPROVER_MANAGER")!;
  const approverAccountingRole = roles.find((r) => r.roleCode === "APPROVER_ACCOUNTING")!;
  const generalRole = roles.find((r) => r.roleCode === "GENERAL_EMPLOYEE")!;

  const userRolePairs = [
    { userId: adminUser.id, roleId: adminRole.id },
    { userId: adminUser.id, roleId: ceoRole.id },
    { userId: managerUser.id, roleId: managerRole.id },
    { userId: managerUser.id, roleId: approverManagerRole.id },
    { userId: salesUser1.id, roleId: generalRole.id },
    { userId: salesUser2.id, roleId: generalRole.id },
    { userId: accountingUser.id, roleId: approverAccountingRole.id },
  ];

  for (const pair of userRolePairs) {
    await prisma.userRole.upsert({
      where: { userId_roleId: pair },
      update: {},
      create: pair,
    });
  }

  // ── Clients ──
  const clients = await Promise.all(
    [
      {
        clientCode: "CL001",
        clientName: "株式会社ABC",
        address: "東京都千代田区丸の内1-1-1",
        latitude: 35.6812,
        longitude: 139.7671,
        phone: "03-1234-5678",
      },
      {
        clientCode: "CL002",
        clientName: "株式会社XYZ",
        address: "大阪府大阪市北区梅田2-2-2",
        latitude: 34.7024,
        longitude: 135.4959,
        phone: "06-1234-5678",
      },
      {
        clientCode: "CL003",
        clientName: "有限会社テスト商事",
        isProspect: true,
        address: "名古屋市中区栄3-3-3",
        latitude: 35.1709,
        longitude: 136.8815,
      },
    ].map((c) =>
      prisma.client.upsert({
        where: { clientCode: c.clientCode },
        update: {},
        create: c,
      })
    )
  );

  // ── Visit Destinations ──
  for (const client of clients) {
    await prisma.visitDestination.create({
      data: {
        clientId: client.id,
        destinationName: `${client.clientName} 本社`,
        address: client.address,
        latitude: client.latitude,
        longitude: client.longitude,
      },
    });
  }

  // ── Rules ──
  await prisma.travelRule.upsert({
    where: { id: "default-travel-rule" },
    update: {},
    create: {
      id: "default-travel-rule",
      effectiveFrom: new Date("2024-01-01"),
    },
  });

  await prisma.salesAllowanceRule.upsert({
    where: { id: "default-sales-allowance-rule" },
    update: {},
    create: {
      id: "default-sales-allowance-rule",
      effectiveFrom: new Date("2024-01-01"),
    },
  });

  await prisma.entertainmentAllowanceRule.upsert({
    where: { id: "default-entertainment-rule" },
    update: {},
    create: {
      id: "default-entertainment-rule",
      effectiveFrom: new Date("2024-01-01"),
    },
  });

  // ── Approval Route ──
  const defaultRoute = await prisma.approvalRoute.upsert({
    where: { id: "default-route" },
    update: {},
    create: {
      id: "default-route",
      routeName: "標準承認フロー",
      isDefault: true,
    },
  });

  await prisma.approvalRouteStep.deleteMany({
    where: { routeId: defaultRoute.id },
  });

  await prisma.approvalRouteStep.createMany({
    data: [
      {
        routeId: defaultRoute.id,
        stepOrder: 1,
        approverRole: "APPROVER_MANAGER",
        stepName: "上長承認",
      },
      {
        routeId: defaultRoute.id,
        stepOrder: 2,
        approverRole: "APPROVER_ACCOUNTING",
        stepName: "経理確認",
      },
      {
        routeId: defaultRoute.id,
        stepOrder: 3,
        approverRole: "CEO",
        stepName: "社長承認",
        isConditional: true,
        conditionType: "EXCEPTION_ONLY",
      },
    ],
  });

  console.log("✅ Seed completed successfully");
  console.log(`  Roles: ${roles.length}`);
  console.log(`  Positions: ${positions.length}`);
  console.log(`  Departments: ${departments.length}`);
  console.log(`  Users: 5 (admin/manager/sales1/sales2/accounting)`);
  console.log(`  Clients: ${clients.length}`);
  console.log("  Default rules and approval route created");
  console.log("\n📧 Login credentials (all passwords: password123):");
  console.log("  admin@example.com - 管理者/CEO");
  console.log("  manager@example.com - 田中部長");
  console.log("  sales1@example.com - 佐藤太郎");
  console.log("  sales2@example.com - 鈴木花子");
  console.log("  accounting@example.com - 経理担当");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

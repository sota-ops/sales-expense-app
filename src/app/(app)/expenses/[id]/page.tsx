import { getExpenseDetail } from "@/actions/expenses";
import { getClientsForSelect } from "@/actions/clients";
import { notFound } from "next/navigation";
import { ExpenseDetailClient } from "./expense-detail-client";

export default async function ExpenseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [expense, clients] = await Promise.all([
    getExpenseDetail(id),
    getClientsForSelect(),
  ]);

  if (!expense) {
    notFound();
  }

  return <ExpenseDetailClient expense={expense} clients={clients} />;
}

import { getExpenses } from "@/actions/expenses";
import { ExpensesClient } from "./expenses-client";

export default async function ExpensesPage() {
  const data = await getExpenses();
  return <ExpensesClient initialData={data} />;
}

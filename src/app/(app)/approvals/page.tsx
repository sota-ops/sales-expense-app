import { getPendingApprovals } from "@/actions/approvals";
import { ApprovalsClient } from "./approvals-client";

export default async function ApprovalsPage() {
  const data = await getPendingApprovals();
  return <ApprovalsClient initialData={data} />;
}

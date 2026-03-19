import { getVisits } from "@/actions/visits";
import { getClientsForSelect } from "@/actions/clients";
import { VisitsClient } from "./visits-client";

export default async function VisitsPage() {
  const [visitsData, clients] = await Promise.all([
    getVisits(),
    getClientsForSelect(),
  ]);

  return <VisitsClient initialData={visitsData} clients={clients} />;
}

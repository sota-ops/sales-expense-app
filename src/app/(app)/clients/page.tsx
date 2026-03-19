import { getClients } from "@/actions/clients";
import { ClientsClient } from "./clients-client";

export default async function ClientsPage() {
  const clients = await getClients();
  return <ClientsClient clients={clients} />;
}

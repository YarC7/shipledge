import { getDrivers } from "@/app/actions/admin"
import { DriversManager } from "@/components/admin/drivers-manager"

export default async function AdminDriversPage() {
  const drivers = await getDrivers()
  return <DriversManager drivers={drivers} />
}

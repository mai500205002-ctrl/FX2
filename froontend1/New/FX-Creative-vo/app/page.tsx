import { AppShell } from '@/components/fx/app-shell'
import { WorkspaceProvider } from '@/components/fx/workspace-provider'

export default function Page() {
  return (
    <WorkspaceProvider>
      <AppShell />
    </WorkspaceProvider>
  )
}

// SubKill — icon maps for subscription catalog names, sources, and step types.
// Display labels live in the locale dictionaries (difficulty.* / cancelLab.stepTypes).
import {
  Activity,
  Cable,
  Calculator,
  Clapperboard,
  Dumbbell,
  Globe,
  HardDrive,
  Landmark,
  Mail,
  MapPin,
  Music,
  Newspaper,
  Package,
  Phone,
  Scale,
  Server,
  Shield,
  Smartphone,
  Workflow,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { SourceType, StepType } from "@/lib/api"

const SUB_ICONS: Record<string, LucideIcon> = {
  dumbbell: Dumbbell,
  workflow: Workflow,
  cable: Cable,
  scale: Scale,
  package: Package,
  newspaper: Newspaper,
  server: Server,
  calculator: Calculator,
  shield: Shield,
  "hard-drive": HardDrive,
  clapperboard: Clapperboard,
  music: Music,
  activity: Activity,
}

export function SubscriptionIcon({ name, className }: { name: string; className?: string }) {
  const Icon = SUB_ICONS[name] ?? Package
  return <Icon className={cn("size-5", className)} />
}

export const SOURCE_META: Record<SourceType, { icon: LucideIcon }> = {
  bank: { icon: Landmark },
  email: { icon: Mail },
  appstore: { icon: Smartphone },
}

export const STEP_TYPE_META: Record<StepType, { icon: LucideIcon }> = {
  digital: { icon: Globe },
  phone: { icon: Phone },
  mail: { icon: Mail },
  in_person: { icon: MapPin },
}

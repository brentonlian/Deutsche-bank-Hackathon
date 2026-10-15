import {
  Armchair,
  BriefcaseBusiness,
  Car,
  ChartLine,
  Egg,
  Gift,
  GraduationCap,
  Hammer,
  HandHeart,
  HeartHandshake,
  HeartPulse,
  Hourglass,
  House,
  Landmark,
  MessageSquareWarning,
  PartyPopper,
  ScrollText,
  Smartphone,
  Umbrella,
  Wallet,
  type LucideIcon,
} from "lucide-react";

/** One pictogram per life event, in the spirit of transit and Olympic signage: readable without words. */
const ICONS: Record<string, LucideIcon> = {
  "first-paycheck": Wallet,
  "family-budget": House,
  "retirement-budget": Armchair,
  "where-to-save": Landmark,
  "phone-offer": Smartphone,
  car: Car,
  pension: Hourglass,
  insurance: Umbrella,
  scam: MessageSquareWarning,
  emergency: HeartPulse,
  invest: ChartLine,
  "big-life-event": PartyPopper,
  "child-education": GraduationCap,
  "family-support": HandHeart,
  "parents-care": HeartHandshake,
  "job-loss": BriefcaseBusiness,
  "nest-egg": Egg,
  "family-request": Gift,
  housing: House,
  "late-work": Hammer,
  estate: ScrollText,
};

export function StageIcon({ id, size = 24, className }: { id: string; size?: number; className?: string }) {
  const Icon = ICONS[id] ?? Landmark;
  return <Icon aria-hidden="true" size={size} strokeWidth={2.25} className={className} />;
}

import { brandIcon } from "@/lib/brand-icon";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/** Browser-tab icon. */
export default function Icon() {
  return brandIcon(64, { rounded: true });
}

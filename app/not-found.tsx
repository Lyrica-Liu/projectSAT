import { StatusPage } from "@/components/ui/status-page";

export default function NotFound() {
  return (
    <StatusPage
      eyebrow="Page not found"
      title="This page doesn't exist."
      body="The link may be old or mistyped. Your plan and progress are safe — head back and pick up where you were."
    />
  );
}

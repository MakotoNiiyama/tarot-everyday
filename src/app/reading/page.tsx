// 旧URLからの転送ページ
import { ClientRedirect } from "@/components/client-redirect";

export default function LegacyReadingPage() {
  return <ClientRedirect to="/tarot/reading" />;
}

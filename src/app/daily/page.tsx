// 旧URLからの転送ページ
import { ClientRedirect } from "@/components/client-redirect";

export default function LegacyDailyPage() {
  return <ClientRedirect to="/fortune" />;
}

// 旧URLからの転送ページ
import { ClientRedirect } from "@/components/client-redirect";

export default function LegacyQuizPage() {
  return <ClientRedirect to="/tarot/quiz" />;
}

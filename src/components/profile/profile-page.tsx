"use client";

import { PageContainer } from "@/components/page-container";
import { useBirthProfile } from "@/lib/fortune/profile-storage";
import { ProfileForm } from "./profile-form";

/** 登録済みの値を読み込んでから、フォームを初期値付きで表示する */
export function ProfilePage() {
  const { ready, profile } = useBirthProfile();
  return (
    <PageContainer wide>
      {ready ? <ProfileForm key={profile ? "edit" : "new"} initial={profile} /> : <div className="h-96" aria-busy="true" />}
    </PageContainer>
  );
}

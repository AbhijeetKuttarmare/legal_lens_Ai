interface RawUser {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  gender: string | null;
  dob: Date | null;
  occupation?: string | null;
  plan: string;
  planExpiresAt?: Date | null;
  documentCredits?: number;
  compareTrialUntil?: Date | null;
  templatesTrialUntil?: Date | null;
  exportTrialUntil?: Date | null;
  chatTrialUntil?: Date | null;
}

export function toSafeUser(user: RawUser) {
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    name: user.name,
    firstName: user.firstName,
    lastName: user.lastName,
    gender: user.gender,
    dob: user.dob,
    occupation: user.occupation ?? null,
    plan: user.plan,
    planExpiresAt: user.planExpiresAt ?? null,
    documentCredits: user.documentCredits ?? 0,
    profileComplete: Boolean(user.firstName && user.lastName && user.gender && user.dob),
    compareTrialUntil: user.compareTrialUntil ?? null,
    templatesTrialUntil: user.templatesTrialUntil ?? null,
    exportTrialUntil: user.exportTrialUntil ?? null,
    chatTrialUntil: user.chatTrialUntil ?? null,
  };
}

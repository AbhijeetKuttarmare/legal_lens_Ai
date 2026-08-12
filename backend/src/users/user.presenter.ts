interface RawUser {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  gender: string | null;
  dob: Date | null;
  plan: string;
  documentCredits?: number;
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
    plan: user.plan,
    documentCredits: user.documentCredits ?? 0,
    profileComplete: Boolean(user.firstName && user.lastName && user.gender && user.dob),
  };
}

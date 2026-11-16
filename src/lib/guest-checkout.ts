type GuestOtpAuth = {
  signInWithOtp: (credentials: {
    email: string;
    options: {
      emailRedirectTo: string;
      shouldCreateUser: true;
      data: { age_consent_accepted: true };
    };
  }) => Promise<{ error: { message: string } | null }>;
};

/**
 * Starts passwordless guest access without a separate registration form.
 * A new address gets an unconfirmed account; the emailed link verifies ownership
 * and signs the buyer in before any transaction can be assigned to that account.
 */
export async function requestGuestLoginLink(
  auth: GuestOtpAuth,
  email: string,
  origin: string,
  productPath: string,
) {
  const returnUrl = new URL(productPath, origin);
  returnUrl.search = "";
  returnUrl.searchParams.set("buy", "1");
  returnUrl.hash = "";

  const { error } = await auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: returnUrl.toString(),
      shouldCreateUser: true,
      data: { age_consent_accepted: true },
    },
  });

  if (error) throw error;
}

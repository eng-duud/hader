import { createClient } from '@/lib/supabase/client';

export interface TOTPEnrollResponse {
  id: string;
  type: 'totp';
  totp: {
    qr_code: string;
    secret: string;
    uri: string;
  };
}

/**
 * Enrolls the current authenticated user into TOTP MFA.
 * Returns the secret and QR code URI.
 */
export async function enrollTOTP(): Promise<{ data: TOTPEnrollResponse | null; error: string | null }> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'Hader Admin Authenticator',
    });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as TOTPEnrollResponse, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'MFA enrollment failed' };
  }
}

/**
 * Verifies the TOTP code to activate the factor.
 */
export async function verifyTOTP(factorId: string, code: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = createClient();
    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId,
    });

    if (challengeError) {
      return { success: false, error: challengeError.message };
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code,
    });

    if (verifyError) {
      return { success: false, error: verifyError.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Verification failed' };
  }
}

interface IAuthenticationQuery {
  id?: string;
  userId?: string;
  mfaEnabled?: boolean;
  otpSecret?: string;
  otpExpiresAt?:
    | Date
    | {
        before?: Date;
        after?: Date;
      };
  otpAttemptCount?:
    | number
    | {
        gt?: number;
        lt?: number;
      };
  lastOtpAttempt?:
    | Date
    | {
        before?: Date;
        after?: Date;
      };
  mfaRecoveryCodes?: {
    contains?: string[];
    overlaps?: string[];
  };
}

export { IAuthenticationQuery };

/**
// Find by userId (uses unique index)
const query1: IAuthenticationQuery = {
  userId: '123e4567-e89b-12d3-a456-426614174000'
};

// Find MFA-enabled users (uses partial index)
const query2: IAuthenticationQuery = {
  mfaEnabled: true
};

// Find active OTP sessions (uses active_otp_idx)
const query3: IAuthenticationQuery = {
  otpSecret: '123456',
  otpExpiresAt: { after: new Date() }
};

// Find accounts with many failed attempts (uses otp_attempts_idx)
const query4: IAuthenticationQuery = {
  otpAttemptCount: { gt: 5 }
};

// Check recovery codes (uses GIN index)
const query5: IAuthenticationQuery = {
  mfaRecoveryCodes: { contains: ['BACKUP-CODE1'] }
};
 */

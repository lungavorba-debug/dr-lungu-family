import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

// Precomputed hash used for constant-time responses when the user does not exist.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('medscreen-timing-safe-dummy', SALT_ROUNDS);

export class PasswordService {
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  async compare(password: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(password, passwordHash);
  }

  getDummyHash(): string {
    return DUMMY_PASSWORD_HASH;
  }
}

export const passwordService = new PasswordService();

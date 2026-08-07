export const USERNAME_MIN_LENGTH = 4;
export const USERNAME_MAX_LENGTH = 50;
export const PASSWORD_MIN_LENGTH = 4;
export const PASSWORD_MAX_LENGTH = 32;

const PHONE_REGEX = /^\d+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type BasicUserValidationInput = {
  username: string;
  name: string;
  phone: string;
  email: string;
};

export type RegisterValidationInput = BasicUserValidationInput & {
  password: string;
  confirm_password: string;
};

export const normalizeBasicUserInput = (input: BasicUserValidationInput): BasicUserValidationInput => ({
  username: String(input.username || '').trim(),
  name: String(input.name || '').trim(),
  phone: String(input.phone || '').trim(),
  email: String(input.email || '').trim(),
});

export const validateBasicUserInput = (input: BasicUserValidationInput): string | null => {
  const normalized = normalizeBasicUserInput(input);

  if (!normalized.username) return '请输入用户名';
  if (!normalized.name) return '请输入姓名';
  if (!normalized.phone) return '请输入手机号';
  if (!normalized.email) return '请输入邮箱';

  if (normalized.username.length < USERNAME_MIN_LENGTH || normalized.username.length > USERNAME_MAX_LENGTH) {
    return `用户名长度必须在${USERNAME_MIN_LENGTH}-${USERNAME_MAX_LENGTH}字符之间`;
  }

  if (!PHONE_REGEX.test(normalized.phone)) {
    return '手机号必须为数字格式';
  }

  if (!EMAIL_REGEX.test(normalized.email)) {
    return '邮箱格式不正确';
  }

  return null;
};

export const validateRegisterInput = (input: RegisterValidationInput): string | null => {
  const basicError = validateBasicUserInput(input);
  if (basicError) return basicError;

  const password = String(input.password || '');
  const confirmPassword = String(input.confirm_password || '');

  if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
    return `密码长度必须在${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH}字符之间`;
  }

  if (password !== confirmPassword) {
    return '两次输入的密码不一致';
  }

  return null;
};


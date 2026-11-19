export interface PasswordRule {
  labelKey: string;
  test: (password: string) => boolean;
}

const minLength: PasswordRule = { labelKey: "UI_PasswordRuleLength", test: (value) => value.length >= 8 };
const uppercase: PasswordRule = { labelKey: "UI_PasswordRuleUpper", test: (value) => /[A-Z]/.test(value) };
const lowercase: PasswordRule = { labelKey: "UI_PasswordRuleLower", test: (value) => /[a-z]/.test(value) };
const digit: PasswordRule = { labelKey: "UI_PasswordRuleDigit", test: (value) => /[0-9]/.test(value) };

export const REGISTER_PASSWORD_RULES = [minLength, uppercase, digit];
export const CHANGE_PASSWORD_RULES = [minLength, uppercase, lowercase, digit];

export function meetsPasswordRules(password: string, rules: PasswordRule[]): boolean {
  return rules.every((rule) => rule.test(password));
}

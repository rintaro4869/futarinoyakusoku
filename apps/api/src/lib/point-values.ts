export const ALLOWED_RULE_POINT_VALUES = [10, 20, 30, 40, 50] as const

export const DEFAULT_RULE_POINT_VALUE = ALLOWED_RULE_POINT_VALUES[0]

export type AllowedRulePointValue = (typeof ALLOWED_RULE_POINT_VALUES)[number]

export function isAllowedRulePointValue(value: number): value is AllowedRulePointValue {
  return ALLOWED_RULE_POINT_VALUES.includes(value as AllowedRulePointValue)
}

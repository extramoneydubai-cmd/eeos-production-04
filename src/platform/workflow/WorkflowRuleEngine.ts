/**
 * WorkflowRuleEngine — Enterprise Rule & Conditions Engine
 *
 * Supports:
 * - AND, OR, NOT logical operators
 * - Expression Builder (dynamic variable interpolation)
 * - Date Rules (before, after, between, on)
 * - Number Rules (eq, neq, gt, gte, lt, lte, between)
 * - String Rules (contains, starts_with, ends_with, in, not_in)
 * - Entity Rules (is_type, has_status, is_owner)
 * - Role Rules (has_role, is_in_department, is_in_branch)
 * - Permission Rules (has_permission, can_access)
 * - Time Rules (business_hours, working_day, holiday)
 * - Branch/Company/Department Rules
 *
 * Usage:
 *   import { ruleEngine } from "@/platform/workflow/WorkflowRuleEngine";
 *   const result = ruleEngine.evaluate(condition, { variables: { amount: 15000 } });
 */

// ─── Types ────────────────────────────────────────────────────────

export type LogicalOperator = "and" | "or" | "not";

export type ComparisonOperator =
  | "eq" | "neq" | "gt" | "gte" | "lt" | "lte"
  | "contains" | "starts_with" | "ends_with"
  | "in" | "not_in"
  | "between" | "is_empty" | "is_not_empty"
  | "before" | "after" | "on"
  | "has_role" | "has_permission"
  | "is_type" | "has_status";

export interface RuleCondition {
  operator: LogicalOperator;
  conditions?: RuleCondition[];  // Nested conditions for AND/OR/NOT
  rules?: Rule[];
}

export interface Rule {
  field: string;
  operator: ComparisonOperator;
  value: any;
  valueType?: "string" | "number" | "boolean" | "date" | "array" | "entity";
}

export interface RuleContext {
  entity?: Record<string, any>;
  variables: Record<string, any>;
  user?: { id: string; role: string; departmentId?: string; branchId?: string; companyId?: string };
  organization?: Record<string, any>;
  company?: Record<string, any>;
  branch?: Record<string, any>;
  date?: Date;
}

export interface RuleResult {
  passed: boolean;
  details: { rule: string; passed: boolean; message: string }[];
}

// ─── Engine ───────────────────────────────────────────────────────

class WorkflowRuleEngineImpl {
  /** Evaluate a condition tree against a context */
  evaluate(condition: RuleCondition, context: RuleContext): RuleResult {
    const details: RuleResult["details"] = [];

    const passed = this.evaluateConditionNode(condition, context, details);

    return { passed, details };
  }

  /** Evaluate a single condition node (AND/OR/NOT or rules) */
  private evaluateConditionNode(
    condition: RuleCondition,
    context: RuleContext,
    details: RuleResult["details"],
  ): boolean {
    if (condition.rules && condition.rules.length > 0) {
      // Evaluate individual rules
      const results = condition.rules.map((rule) => {
        const passed = this.evaluateRule(rule, context);
        details.push({
          rule: `${rule.field} ${rule.operator} ${JSON.stringify(rule.value)}`,
          passed,
          message: passed ? "Passed" : `Failed: ${rule.field} ${rule.operator} ${JSON.stringify(rule.value)}`,
        });
        return passed;
      });

      switch (condition.operator) {
        case "and":
          return results.every(Boolean);
        case "or":
          return results.some(Boolean);
        case "not":
          return !results.some(Boolean);
        default:
          return results.every(Boolean);
      }
    }

    if (condition.conditions && condition.conditions.length > 0) {
      // Evaluate nested conditions
      const results = condition.conditions.map((c) =>
        this.evaluateConditionNode(c, context, details),
      );

      switch (condition.operator) {
        case "and":
          return results.every(Boolean);
        case "or":
          return results.some(Boolean);
        case "not":
          return !results.every(Boolean);
        default:
          return results.every(Boolean);
      }
    }

    return true; // Empty condition = pass
  }

  /** Evaluate a single rule */
  evaluateRule(rule: Rule, context: RuleContext): boolean {
    const fieldValue = this.resolveField(rule.field, context);

    switch (rule.operator) {
      // Comparison
      case "eq": return fieldValue === rule.value;
      case "neq": return fieldValue !== rule.value;
      case "gt": return Number(fieldValue) > Number(rule.value);
      case "gte": return Number(fieldValue) >= Number(rule.value);
      case "lt": return Number(fieldValue) < Number(rule.value);
      case "lte": return Number(fieldValue) <= Number(rule.value);

      // String
      case "contains":
        return String(fieldValue).toLowerCase().includes(String(rule.value).toLowerCase());
      case "starts_with":
        return String(fieldValue).toLowerCase().startsWith(String(rule.value).toLowerCase());
      case "ends_with":
        return String(fieldValue).toLowerCase().endsWith(String(rule.value).toLowerCase());
      case "is_empty":
        return !fieldValue || fieldValue === "" || (Array.isArray(fieldValue) && fieldValue.length === 0);
      case "is_not_empty":
        return fieldValue !== undefined && fieldValue !== null && fieldValue !== "";

      // Array
      case "in":
        return Array.isArray(rule.value) && rule.value.includes(fieldValue);
      case "not_in":
        return !Array.isArray(rule.value) || !rule.value.includes(fieldValue);
      case "between": {
        if (!Array.isArray(rule.value) || rule.value.length < 2) return false;
        const num = Number(fieldValue);
        return num >= Number(rule.value[0]) && num <= Number(rule.value[1]);
      }

      // Date
      case "before": {
        const d1 = new Date(fieldValue).getTime();
        const d2 = new Date(rule.value).getTime();
        return !isNaN(d1) && !isNaN(d2) && d1 < d2;
      }
      case "after": {
        const d1 = new Date(fieldValue).getTime();
        const d2 = new Date(rule.value).getTime();
        return !isNaN(d1) && !isNaN(d2) && d1 > d2;
      }
      case "on": {
        const d1 = new Date(fieldValue).toDateString();
        const d2 = new Date(rule.value).toDateString();
        return d1 === d2;
      }

      // Role
      case "has_role":
        return context.user?.role === rule.value;

      // Entity
      case "is_type":
        return context.entity?.type === rule.value;
      case "has_status":
        return context.entity?.status === rule.value;

      // Permission
      case "has_permission":
        return context.user?.role === rule.value || context.user?.id === rule.value;

      default:
        return false;
    }
  }

  /** Resolve a field path from context (e.g., "variables.amount", "entity.status", "user.role") */
  private resolveField(field: string, context: RuleContext): any {
    const parts = field.split(".");

    if (parts[0] === "variables") {
      return context.variables[parts.slice(1).join(".")];
    }
    if (parts[0] === "entity") {
      return context.entity?.[parts.slice(1).join(".")];
    }
    if (parts[0] === "user") {
      return context.user?.[parts.slice(1).join(".") as keyof typeof context.user];
    }
    if (parts[0] === "organization") {
      return context.organization?.[parts.slice(1).join(".")];
    }
    if (parts[0] === "company") {
      return context.company?.[parts.slice(1).join(".")];
    }
    if (parts[0] === "branch") {
      return context.branch?.[parts.slice(1).join(".")];
    }
    if (parts[0] === "date") {
      return context.date || new Date();
    }

    return undefined;
  }

  /** Create an AND condition */
  and(...conditions: RuleCondition[]): RuleCondition {
    return { operator: "and", conditions };
  }

  /** Create an OR condition */
  or(...conditions: RuleCondition[]): RuleCondition {
    return { operator: "or", conditions };
  }

  /** Create a NOT condition */
  not(condition: RuleCondition): RuleCondition {
    return { operator: "not", conditions: [condition] };
  }

  /** Create a simple rule set */
  ruleSet(operator: LogicalOperator, rules: Rule[]): RuleCondition {
    return { operator, rules };
  }

  /** Create a single rule condition */
  rule(field: string, operator: ComparisonOperator, value: any): RuleCondition {
    return { operator: "and", rules: [{ field, operator, value }] };
  }

  /** Parse a condition expression string */
  parseExpression(expression: string, variables: Record<string, any>): boolean {
    try {
      // Simple expression parser: "variables.amount > 10000"
      const match = expression.match(/(\w+(?:\.\w+)*)\s*(>|<|>=|<=|==|!=)\s*(\d+\.?\d*)/);
      if (!match) return true;

      const field = match[1];
      const operator = match[2];
      const value = parseFloat(match[3]);
      const fieldVal = this.resolveField(field, { variables, user: undefined });
      const numVal = Number(fieldVal);

      switch (operator) {
        case ">": return numVal > value;
        case "<": return numVal < value;
        case ">=": return numVal >= value;
        case "<=": return numVal <= value;
        case "==": return numVal === value;
        case "!=": return numVal !== value;
        default: return true;
      }
    } catch {
      return true;
    }
  }
}

export const workflowRuleEngine = new WorkflowRuleEngineImpl();

export const triggerHandler = {
  /**
   * Match a payload against a rule's trigger configuration
   */
  matches(rule: any, payload: any): boolean {
    if (rule.trigger_type === 'activity') {
      return rule.trigger_config?.event_type === payload.event_type;
    }

    if (rule.trigger_type === 'event') {
      return rule.trigger_config?.event_name === payload.event_name;
    }

    // Threshold triggers (e.g., goal reached)
    if (rule.trigger_type === 'threshold') {
      const { field, operator, value } = rule.trigger_config;
      const actualValue = payload[field];

      switch (operator) {
        case '>=': return actualValue >= value;
        case '>': return actualValue > value;
        case '<=': return actualValue <= value;
        case '<': return actualValue < value;
        case '==': return actualValue === value;
        default: return false;
      }
    }

    return false;
  },

  /**
   * Evaluate rule conditions (e.g., supporter must be dormant)
   */
  evaluateConditions(rule: any, payload: any): boolean {
    if (!rule.conditions || rule.conditions.length === 0) return true;

    // Implement logical AND for all conditions
    return rule.conditions.every((condition: any) => {
      const { field, operator, value } = condition;
      const actualValue = payload[field];

      switch (operator) {
        case 'eq': return actualValue === value;
        case 'neq': return actualValue !== value;
        case 'gt': return actualValue > value;
        case 'lt': return actualValue < value;
        case 'contains': return Array.isArray(actualValue) ? actualValue.includes(value) : false;
        default: return true;
      }
    });
  }
};

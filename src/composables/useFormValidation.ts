import { computed, type Ref } from "vue"

export interface ValidationRule {
  test: (value: unknown) => boolean
  message: string
}

export interface FieldValidation {
  value: Ref<unknown>
  rules?: ValidationRule[]
  required?: boolean
}

/**
 * Composable for common form validation patterns
 */
export function useFormValidation() {
  /**
   * Validate a single field based on rules
   */
  const validateField = (validation: FieldValidation): { isValid: boolean; error?: string } => {
    const { value, rules = [], required = false } = validation

    // Check required validation
    if (required && (!value.value || (typeof value.value === "string" && !value.value.trim()))) {
      return { isValid: false, error: "This field is required" }
    }

    // Check custom rules
    for (const rule of rules) {
      if (!rule.test(value.value)) {
        return { isValid: false, error: rule.message }
      }
    }

    return { isValid: true }
  }

  /**
   * Validate multiple fields and return overall validity
   */
  const validateForm = (
    validations: FieldValidation[],
  ): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {}
    let isValid = true

    validations.forEach((validation, index) => {
      const result = validateField(validation)
      if (!result.isValid) {
        isValid = false
        errors[index.toString()] = result.error || "Invalid field"
      }
    })

    return { isValid, errors }
  }

  /**
   * Common validation rules
   */
  const rules = {
    required: (message = "This field is required"): ValidationRule => ({
      test: (value) => !!value && (typeof value !== "string" || value.trim() !== ""),
      message,
    }),

    minLength: (min: number, message?: string): ValidationRule => ({
      test: (value) => typeof value === "string" && value.length >= min,
      message: message || `Must be at least ${min} characters`,
    }),

    maxLength: (max: number, message?: string): ValidationRule => ({
      test: (value) => typeof value === "string" && value.length <= max,
      message: message || `Must be no more than ${max} characters`,
    }),

    number: (message = "Must be a valid number"): ValidationRule => ({
      test: (value) => !isNaN(Number(value)) && isFinite(Number(value)),
      message,
    }),

    positiveNumber: (message = "Must be a positive number"): ValidationRule => ({
      test: (value) => !isNaN(Number(value)) && Number(value) > 0,
      message,
    }),

    email: (message = "Must be a valid email address"): ValidationRule => ({
      test: (value) => typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      message,
    }),
  }

  /**
   * Create a reactive validity checker for a form
   */
  const createFormValidator = (validations: FieldValidation[]) => {
    return computed(() => validateForm(validations))
  }

  /**
   * Transaction-specific validation helpers
   */
  const transactionValidation = {
    isValidAmount: (amount: string): boolean => {
      const num = parseFloat(amount)
      return !isNaN(num) && num > 0
    },

    isValidTransactionForm: (form: { name: string; amount: string; category: string }): boolean => {
      return !!(
        form.name?.trim() &&
        form.category?.trim() &&
        transactionValidation.isValidAmount(form.amount)
      )
    },
  }

  return {
    validateField,
    validateForm,
    createFormValidator,
    rules,
    transactionValidation,
  }
}

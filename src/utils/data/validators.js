/**
 * Data validation utilities
 */

export const isEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const isPhone = (phone) => {
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

export const isRequired = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return Boolean(value);
};

export const minLength = (value, min) => {
  if (typeof value === 'string' || Array.isArray(value)) {
    return value.length >= min;
  }
  return false;
};

export const maxLength = (value, max) => {
  if (typeof value === 'string' || Array.isArray(value)) {
    return value.length <= max;
  }
  return false;
};

export const isNumber = (value) => {
  return !isNaN(Number(value)) && isFinite(Number(value));
};

export const isInteger = (value) => {
  return Number.isInteger(Number(value));
};

export const min = (value, minimum) => {
  return Number(value) >= minimum;
};

export const max = (value, maximum) => {
  return Number(value) <= maximum;
};

export const range = (value, minimum, maximum) => {
  const num = Number(value);
  return num >= minimum && num <= maximum;
};

export const isAlpha = (value) => {
  const alphaRegex = /^[A-Za-z]+$/;
  return alphaRegex.test(value);
};

export const isAlphaNumeric = (value) => {
  const alphaNumericRegex = /^[A-Za-z0-9]+$/;
  return alphaNumericRegex.test(value);
};

export const isDate = (value) => {
  const date = new Date(value);
  return !isNaN(date.getTime());
};

export const isFutureDate = (value) => {
  const date = new Date(value);
  return date > new Date();
};

export const isPastDate = (value) => {
  const date = new Date(value);
  return date < new Date();
};

export const isDateInRange = (value, startDate, endDate) => {
  const date = new Date(value);
  const start = new Date(startDate);
  const end = new Date(endDate);
  return date >= start && date <= end;
};

export const isJSON = (value) => {
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
};

export const matches = (value, pattern) => {
  if (pattern instanceof RegExp) {
    return pattern.test(value);
  }
  return String(value) === String(pattern);
};

export const isIn = (value, array) => {
  return Array.isArray(array) && array.includes(value);
};

export const isNotIn = (value, array) => {
  return Array.isArray(array) && !array.includes(value);
};

export const isBoolean = (value) => {
  return typeof value === 'boolean' || value === 'true' || value === 'false';
};

export const isArray = (value) => {
  return Array.isArray(value);
};

export const isObject = (value) => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};

export const isString = (value) => {
  return typeof value === 'string';
};

export const isFunction = (value) => {
  return typeof value === 'function';
};

export const isUndefined = (value) => {
  return value === undefined;
};

export const isNull = (value) => {
  return value === null;
};

export const isNullOrUndefined = (value) => {
  return value === null || value === undefined;
};

export const isEmpty = (value) => {
  if (isNullOrUndefined(value)) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

export const isNotEmpty = (value) => {
  return !isEmpty(value);
};

export const validate = (value, rules) => {
  const errors = [];
  
  for (const rule of rules) {
    const { validator, message, ...params } = rule;
    
    let isValid = false;
    
    if (typeof validator === 'function') {
      isValid = validator(value, params);
    } else if (typeof validator === 'string') {
      const validatorFn = validators[validator];
      if (validatorFn) {
        isValid = validatorFn(value, params);
      }
    }
    
    if (!isValid) {
      errors.push(message || `Validation failed for ${validator}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

const validators = {
  required: isRequired,
  email: isEmail,
  url: isUrl,
  phone: isPhone,
  minLength: (value, { min }) => minLength(value, min),
  maxLength: (value, { max }) => maxLength(value, max),
  number: isNumber,
  integer: isInteger,
  min: (value, { minimum }) => min(value, minimum),
  max: (value, { maximum }) => max(value, maximum),
  range: (value, { minimum, maximum }) => range(value, minimum, maximum),
  alpha: isAlpha,
  alphaNumeric: isAlphaNumeric,
  date: isDate,
  futureDate: isFutureDate,
  pastDate: isPastDate,
  json: isJSON,
  matches: (value, { pattern }) => matches(value, pattern),
  in: (value, { array }) => isIn(value, array),
  notIn: (value, { array }) => isNotIn(value, array)
};

export default {
  isEmail,
  isUrl,
  isPhone,
  isRequired,
  minLength,
  maxLength,
  isNumber,
  isInteger,
  min,
  max,
  range,
  isAlpha,
  isAlphaNumeric,
  isDate,
  isFutureDate,
  isPastDate,
  isDateInRange,
  isJSON,
  matches,
  isIn,
  isNotIn,
  isBoolean,
  isArray,
  isObject,
  isString,
  isFunction,
  isUndefined,
  isNull,
  isNullOrUndefined,
  isEmpty,
  isNotEmpty,
  validate,
  validators
};

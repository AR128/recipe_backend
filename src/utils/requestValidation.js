const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

export class RequestError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const rejectUnknownKeys = (object, allowedKeys) =>
  Object.keys(object).find((key) => !allowedKeys.includes(key));

const validateString = (value, field, { min = 0, max }) => {
  if (typeof value !== "string") {
    return `${field} must be a string.`;
  }
  const normalized = value.trim();
  if (normalized.length < min || normalized.length > max) {
    return `${field} must be between ${min} and ${max} characters.`;
  }
  return null;
};

const recipeFields = [
  "title",
  "description",
  "content",
  "image",
  "category",
  "tags",
  "cookTime",
  "prepTime",
  "servings",
  "ingredients",
  "steps",
];

export const validateRecipePayload = (body, { partial = false } = {}) => {
  if (!isPlainObject(body)) {
    return { error: "Request body must be a JSON object." };
  }

  const unknownKey = rejectUnknownKeys(body, recipeFields);
  if (unknownKey) return { error: `Unexpected field: ${unknownKey}.` };
  if (partial && Object.keys(body).length === 0) {
    return { error: "Provide at least one recipe field to update." };
  }

  const value = {};
  const stringLimits = {
    title: [1, 200],
    description: [1, 500],
    content: [0, 20_000],
    image: [0, 2_048],
    category: [0, 80],
    cookTime: [0, 40],
    prepTime: [0, 40],
  };

  for (const [field, [min, max]] of Object.entries(stringLimits)) {
    if (!own(body, field)) {
      if (!partial && (field === "title" || field === "description")) {
        return { error: `${field} is required.` };
      }
      continue;
    }
    const error = validateString(body[field], field, { min, max });
    if (error) return { error };
    value[field] = body[field].trim();
  }
  if (own(value, "category")) value.category ||= "General";

  if (!partial) {
    value.content ??= "";
    value.image ??= "";
    value.category ??= "General";
    value.cookTime ??= "";
    value.prepTime ??= "";
  }

  if (own(value, "image") && value.image) {
    let imageUrl;
    try {
      imageUrl = new URL(value.image);
    } catch {
      return { error: "Image must be a valid HTTPS URL or empty." };
    }
    if (
      imageUrl.protocol !== "https:" ||
      imageUrl.username ||
      imageUrl.password
    ) {
      return {
        error: "Image URLs must use HTTPS and cannot contain credentials.",
      };
    }
  }

  if (own(body, "tags")) {
    let tags = body.tags;
    if (typeof tags === "string") {
      if (tags.length > 800) {
        return { error: "Tags cannot exceed 800 characters." };
      }
      tags = tags.trim() ? tags.split(",") : [];
    }
    if (
      !Array.isArray(tags) ||
      tags.length > 20 ||
      tags.some(
        (tag) =>
          typeof tag !== "string" ||
          tag.trim().length > 40 ||
          tag.trim().length === 0
      )
    ) {
      return {
        error:
          "Tags must contain no more than 20 non-empty strings of at most 40 characters.",
      };
    }
    value.tags = tags.map((tag) => tag.trim());
  } else if (!partial) {
    value.tags = [];
  }

  if (own(body, "servings")) {
    if (
      !Number.isInteger(body.servings) ||
      body.servings < 1 ||
      body.servings > 100
    ) {
      return { error: "Servings must be a whole number between 1 and 100." };
    }
    value.servings = body.servings;
  } else if (!partial) {
    value.servings = 4;
  }

  if (own(body, "ingredients")) {
    if (!Array.isArray(body.ingredients) || body.ingredients.length > 100) {
      return {
        error: "Ingredients must be an array with no more than 100 items.",
      };
    }
    const ingredients = [];
    for (const ingredient of body.ingredients) {
      if (!isPlainObject(ingredient)) {
        return { error: "Each ingredient must be an object." };
      }
      const unexpected = rejectUnknownKeys(ingredient, ["amount", "item"]);
      if (unexpected) {
        return { error: `Unexpected ingredient field: ${unexpected}.` };
      }
      if (
        validateString(ingredient.item, "Ingredient item", { min: 1, max: 120 })
      ) {
        return {
          error:
            "Ingredient items must be strings between 1 and 120 characters.",
        };
      }
      if (
        ingredient.amount !== undefined &&
        validateString(ingredient.amount, "Ingredient amount", { max: 40 })
      ) {
        return {
          error: "Ingredient amounts must be strings of at most 40 characters.",
        };
      }
      ingredients.push({
        item: ingredient.item.trim(),
        amount: ingredient.amount?.trim() || "",
      });
    }
    value.ingredients = ingredients;
  } else if (!partial) {
    value.ingredients = [];
  }

  if (own(body, "steps")) {
    if (!Array.isArray(body.steps) || body.steps.length > 50) {
      return { error: "Steps must be an array with no more than 50 items." };
    }
    for (const step of body.steps) {
      if (validateString(step, "Step", { min: 1, max: 2_000 })) {
        return {
          error: "Each step must be a string between 1 and 2000 characters.",
        };
      }
    }
    value.steps = body.steps.map((step) => step.trim());
  } else if (!partial) {
    value.steps = [];
  }

  return { value };
};

export const queryString = (
  value,
  field,
  { max = 100, optional = true } = {}
) => {
  if (value === undefined && optional) return "";
  if (typeof value !== "string") {
    throw new RequestError(`${field} must be a single string value.`);
  }
  const normalized = value.trim();
  if ((!optional && !normalized) || normalized.length > max) {
    throw new RequestError(`${field} must not exceed ${max} characters.`);
  }
  return normalized;
};

export const parsePagination = (
  query,
  { defaultLimit = 20, maxLimit = 50, maxPage = 1_000 } = {}
) => {
  const parseInteger = (value, fallback, field, maximum) => {
    if (value === undefined) return fallback;
    if (typeof value !== "string" || !/^\d+$/.test(value)) {
      throw new RequestError(`${field} must be a positive whole number.`);
    }
    const number = Number(value);
    if (!Number.isSafeInteger(number) || number < 1 || number > maximum) {
      throw new RequestError(`${field} must be between 1 and ${maximum}.`);
    }
    return number;
  };

  const page = parseInteger(query.page, 1, "page", maxPage);
  const limit = parseInteger(query.limit, defaultLimit, "limit", maxLimit);
  return { page, limit, skip: (page - 1) * limit };
};

export const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const requireObjectBody = (body, allowedFields) => {
  if (!isPlainObject(body)) {
    return "Request body must be a JSON object.";
  }
  const unknownKey = rejectUnknownKeys(body, allowedFields);
  return unknownKey ? `Unexpected field: ${unknownKey}.` : null;
};

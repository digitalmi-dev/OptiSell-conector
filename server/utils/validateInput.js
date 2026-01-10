export function validateIntegrationInput(body) {
  const errors = [];

  if (!body.storeDomain || typeof body.storeDomain !== "string" || !body.storeDomain.trim()) {
    errors.push("storeDomain este obligatoriu și trebuie să fie un string");
  } else if (!body.storeDomain.includes(".myshopify.com")) {
    errors.push('storeDomain trebuie să conțină ".myshopify.com"');
  }

  if (!body.clientId || typeof body.clientId !== "string" || !body.clientId.trim()) {
    errors.push("clientId este obligatoriu și trebuie să fie un string");
  }

  if (!body.clientSecret || typeof body.clientSecret !== "string" || !body.clientSecret.trim()) {
    errors.push("clientSecret este obligatoriu și trebuie să fie un string");
  }

  if (body.integrationName && typeof body.integrationName !== "string") {
    errors.push("integrationName trebuie să fie un string");
  }

  return {
    valid: errors.length === 0,
    errors: errors,
  };
}

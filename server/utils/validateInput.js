export function validateIntegrationInput(body) {
  const errors = [];

  if (!body.storeDomain || typeof body.storeDomain !== "string" || !body.storeDomain.trim()) {
    errors.push("storeDomain este obligatoriu și trebuie să fie un string");
  } else if (!body.storeDomain.includes(".myshopify.com")) {
    errors.push('storeDomain trebuie să conțină ".myshopify.com"');
  }

  if (!body.adminAccessToken || typeof body.adminAccessToken !== "string" || !body.adminAccessToken.trim()) {
    errors.push("adminAccessToken este obligatoriu și trebuie să fie un string");
  } else {
    const cleanToken = body.adminAccessToken.trim();
    if (!cleanToken.startsWith("shpat_") && !cleanToken.startsWith("shpca_")) {
      errors.push('adminAccessToken trebuie să înceapă cu "shpat_" sau "shpca_"');
    }
  }

  if (body.integrationName && typeof body.integrationName !== "string") {
    errors.push("integrationName trebuie să fie un string");
  }

  return {
    valid: errors.length === 0,
    errors: errors,
  };
}

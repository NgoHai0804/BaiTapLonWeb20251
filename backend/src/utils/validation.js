// utils/validation.js
const bcrypt = require("bcrypt");

function checkData(value, lengthMin, lengthMax, allowSpecial = false) {
  if (!value || value.length < lengthMin || value.length > lengthMax) {
    return { valid: false, message: `Length must be between ${lengthMin} and ${lengthMax} characters.` };
  }
  const specialCharRegex = allowSpecial ? null : /[^a-zA-Z0-9_]/;
  if (!allowSpecial && specialCharRegex.test(value)) {
    return { valid: false, message: "Only alphanumeric and underscore allowed." };
  }
  return { valid: true };
}

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

module.exports = { checkData, hashPassword };
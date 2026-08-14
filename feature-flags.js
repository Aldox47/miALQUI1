function toBooleanFlag(value) {
  if (typeof value === 'string') {
    return ['true', '1', 'yes', 'y', 'on'].includes(value.trim().toLowerCase());
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  return Boolean(value);
}

function normalizePropertyFlags(property = {}) {
  return {
    destacada: toBooleanFlag(property.destacada ?? property.destacado ?? property.featured ?? false),
    es_nuevo: toBooleanFlag(property.es_nuevo ?? property.nuevo ?? property.is_new ?? property.esNuevo ?? false)
  };
}

if (typeof module !== 'undefined') {
  module.exports = { toBooleanFlag, normalizePropertyFlags };
}

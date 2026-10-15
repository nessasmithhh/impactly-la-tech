// Validate UUID format in URL parameters
export default function validateObjectId(paramName = 'id') {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  return (req, res, next) => {
    const id = req.params[paramName];

    if (!id) {
      return next();
    }

    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        error: `Invalid ${paramName} format. Expected a valid UUID.`
      });
    }

    next();
  };
}
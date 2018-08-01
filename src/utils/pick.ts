export const pick = (object, props) =>
  props.reduce(
    (acc, prop) => ({
      ...acc,
      ...(object.hasOwnProperty(prop) ? { [prop]: object[prop] } : {})
    }),
    {}
  );

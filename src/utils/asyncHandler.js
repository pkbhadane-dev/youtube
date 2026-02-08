export const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((error) => {
      next(error);
    });
  };
};

// asyncHandler function using try-catch block

// const asyncHandler2 = (requestHandler) => async (req, res, next) => {
//   try {
//     await fn(req, res, next);
//   } catch (error) {
//     next(error);
//   }
// };

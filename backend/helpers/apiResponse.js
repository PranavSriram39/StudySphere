const errorResponse = ({ res, message }) => {
  res.status(200).send({
    status: false,
    message,
  });
};

const successResponse = ({ res, message, data = null }) => {
  res.status(200).send({
    status: true,
    message,
    data,
  });
};

module.exports = { errorResponse, successResponse };

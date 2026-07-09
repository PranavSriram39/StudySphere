const errorResponse = ({ res, message, status = 200 }) => {
  res.status(status).send({
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

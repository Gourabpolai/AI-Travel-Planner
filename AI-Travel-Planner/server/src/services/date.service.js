const calculateTripDuration = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const difference = end.getTime() - start.getTime();

  const days = Math.ceil(difference / (1000 * 60 * 60 * 24)) + 1;

  return days;
};

module.exports = {
  calculateTripDuration,
};
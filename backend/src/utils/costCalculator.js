// total_cost = number_of_rental_days x price_per_day  (always computed on the server)
const calculateDays = (startDate, endDate) => {
    const start = new Date(`${startDate}T00:00:00Z`).getTime();
    const end = new Date(`${endDate}T00:00:00Z`).getTime();
    return Math.round((end - start) / 86400000);
};

const calculateRentalCost = (startDate, endDate, pricePerDay) => {
    const days = calculateDays(startDate, endDate);
    if (days <= 0) throw new Error('End date must be after start date.');
    return Math.round(days * Number(pricePerDay) * 100) / 100;
};

module.exports = { calculateDays, calculateRentalCost };

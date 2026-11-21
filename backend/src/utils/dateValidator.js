const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const isValidDateString = (s) => {
    if (typeof s !== 'string' || !DATE_RE.test(s)) return false;
    const d = new Date(`${s}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
};

const todayString = () => {
    const n = new Date();
    const m = String(n.getMonth() + 1).padStart(2, '0');
    const d = String(n.getDate()).padStart(2, '0');
    return `${n.getFullYear()}-${m}-${d}`;
};

// Start must be today or later, and end must be after start.
const validateRentalDates = (startDate, endDate) => {
    if (!isValidDateString(startDate) || !isValidDateString(endDate)) {
        return { isValid: false, message: 'Dates must be in YYYY-MM-DD format.' };
    }
    if (startDate < todayString()) {
        return { isValid: false, message: 'Start date cannot be in the past.' };
    }
    if (endDate <= startDate) {
        return { isValid: false, message: 'End date must be after the start date.' };
    }
    return { isValid: true };
};

module.exports = { validateRentalDates, isValidDateString, todayString };

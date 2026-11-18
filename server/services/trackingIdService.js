const Counter = require('../models/Counter');

/**
 * Atomically generates a tracking ID formatted as GRV-YYYY-000001
 * Uses MongoDB findOneAndUpdate with $inc for concurrency safety
 */
async function generateTrackingId() {
  const year = new Date().getFullYear();
  const counterId = `grievance_${year}`;

  const counter = await Counter.findOneAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  return `GRV-${year}-${String(counter.seq).padStart(6, '0')}`;
}

module.exports = {
  generateTrackingId
};

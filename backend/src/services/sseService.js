/**
 * SSE connection manager — push real-time events to connected clients
 * One connection per businessId (supports multiple via Map of arrays)
 */
const clients = new Map(); // businessId → [res, res, ...]

function addClient(businessId, res) {
  if (!clients.has(businessId)) clients.set(businessId, []);
  clients.get(businessId).push(res);

  // Clean up on disconnect
  res.on('close', () => {
    const arr = clients.get(businessId) || [];
    const idx = arr.indexOf(res);
    if (idx !== -1) arr.splice(idx, 1);
    if (arr.length === 0) clients.delete(businessId);
  });
}

function push(businessId, type, data) {
  const arr = clients.get(businessId);
  if (!arr || arr.length === 0) return;

  const payload = JSON.stringify({ type, data, ts: Date.now() });
  for (const res of arr) {
    res.write(`data: ${payload}\n\n`);
  }
}

function getClientCount(businessId) {
  return (clients.get(businessId) || []).length;
}

module.exports = { addClient, push, getClientCount };

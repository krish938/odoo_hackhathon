const {
  listKitchenTickets,
  getKitchenTicketById,
  updateTicketStatus,
  updateTicketItemStatus,
} = require('./kitchen.service');

const listTicketsController = async (req, res, next) => {
  try {
    const tickets = await listKitchenTickets(req.query);
    res.json(tickets);
  } catch (error) {
    next(error);
  }
};

const getTicketController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ticket = await getKitchenTicketById(id);
    res.json(ticket);
  } catch (error) {
    next(error);
  }
};

const updateTicketStatusController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await updateTicketStatus(id, status);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const updateTicketItemStatusController = async (req, res, next) => {
  try {
    const { id, itemId } = req.params;
    const { status } = req.body;
    const result = await updateTicketItemStatus(id, itemId, status);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listTicketsController,
  getTicketController,
  updateTicketStatusController,
  updateTicketItemStatusController,
};

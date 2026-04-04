const {
  createFloor,
  listFloors,
  getFloorById,
  updateFloor,
  deleteFloor,
} = require('./floors.service');

const createFloorController = async (req, res, next) => {
  try {
    const { name } = req.body;
    const floor = await createFloor(name);
    res.status(201).json(floor);
  } catch (error) {
    next(error);
  }
};

const listFloorsController = async (req, res, next) => {
  try {
    const floors = await listFloors();
    res.json(floors);
  } catch (error) {
    next(error);
  }
};

const getFloorController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const floor = await getFloorById(id);
    res.json(floor);
  } catch (error) {
    next(error);
  }
};

const updateFloorController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const floor = await updateFloor(id, name);
    res.json(floor);
  } catch (error) {
    next(error);
  }
};

const deleteFloorController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await deleteFloor(id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createFloorController,
  listFloorsController,
  getFloorController,
  updateFloorController,
  deleteFloorController,
};

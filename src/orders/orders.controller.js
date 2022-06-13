const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
function validateProperties(req, res, next) {
  const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
  let errorMsg;

  if (!deliverTo || deliverTo === "")
    errorMsg = "Order must include a deliverTo";
  else if (!mobileNumber || mobileNumber === "")
    errorMsg = "Order must include a mobileNumber";
  else if (!dishes) errorMsg = "Order must include a dish";
  else if (!Array.isArray(dishes) || dishes.length === 0)
    errorMsg = "Order must include at least one dish";
  else {
    for (let i = 0; i < dishes.length; i++) {
      if (
        !dishes[i].quantity ||
        dishes[i].quantity <= 0 ||
        !Number.isInteger(dishes[i].quantity)
      )
        errorMsg = `Dish ${i} must have a quantity that is an integer greater than 0`;
    }
  }

  if (errorMsg) {
    return next({
      status: 400,
      message: errorMsg,
    });
  }

  next();
}

function create(req, res) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    status: status ? status: "pending",
    dishes: dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function orderExists(req, res, next) {
  const orderId = req.params.orderId;
  res.locals.orderId = orderId;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order does not exist: ${req.params.orderId}`,
  });
}

function read(req, res) {
  res.json({ data: res.locals.order });
}

function update(req, res) {
  const { data: { id, deliverTo, mobileNumber, status, dishes } = {} } =
    req.body;
  res.locals.order = {
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    status: status,
    dishes: dishes,
  };

  if ((id && id === res.locals.orderId) || !id) {
    res.locals.order.id = res.locals.orderId;
    return res.json({ data: res.locals.order });
  } else {
    return res.status(400).json({
      error: `Order id does not match route id. Dish: ${id}, Route: ${res.locals.orderId}`,
    });
  }
}

function validateStatus(req, res, next) {
  const { data: { status } = {} } = req.body;
  let errorMsg;

  if (
    !status ||
    (status !== "pending" &&
      status !== "preparing" &&
      status !== "out-for-delivery")
  )
    errorMsg =
      "Order must have a status of pending, preparing, out-for-delivery, delivered";
  else if (status === "delivered")
    errorMsg = "A delivered order cannot be changed";

  if (errorMsg) {
    return next({
      status: 400,
      message: errorMsg,
    });
  }

  next();
}

function list(req, res) {
  res.json({ data: orders });
}

function destroy(req, res) {
  const index = orders.indexOf(res.locals.order);

  if (res.locals.order.status !== "pending") {
    return res.status(400).json({
      error: "An order cannot be deleted unless it is pending",
    });
  } else {
    orders.splice(index, 1);
    res.sendStatus(204);
  }
}

module.exports = {
  create: [validateProperties, create],
  read: [orderExists, read],
  update: [orderExists, validateProperties, validateStatus, update],
  delete: [orderExists, destroy],
  list,
};

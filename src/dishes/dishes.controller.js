const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
function validateProperties(req, res, next) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  let errorMsg;

  if (!name || name === "") errorMsg = "Dish must include a name";
  else if (!description || description === "")
    errorMsg = "Dish must include a description";
  else if (!price) errorMsg = "Dish must include a price";
  else if (price <= 0 || !Number.isInteger(price))
    errorMsg = "Dish must have a price that is an integer greater than 0";
  else if (!image_url || image_url === "")
    errorMsg = "Dish must include a image_url";

  if (errorMsg) {
    return next({
      status: 400,
      message: errorMsg,
    });
  }

  next();
}

function create(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: nextId(),
    name: name,
    description: description,
    price: price,
    image_url: image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function dishExists(req, res, next) {
  const dishId = req.params.dishId;
  res.locals.dishId = dishId;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish does not exist: ${req.params.dishId}`,
  });
}

function read(req, res) {
  res.json({ data: res.locals.dish });
}

function update(req, res) {
  const { data: { id, name, description, price, image_url } = {} } = req.body;
  res.locals.dish = {
    name: name,
    description: description,
    price: price,
    image_url: image_url,
  };

  if ((id && id === res.locals.dishId) || !id) {
    res.locals.dish.id = res.locals.dishId;
    return res.json({ data: res.locals.dish });
  } else {
    return res
      .status(400)
      .json({
        error: `Dish id does not match route id. Dish: ${id}, Route: ${res.locals.dishId}`,
      });
  }
}

function list(req, res) {
  res.json({ data: dishes });
}

module.exports = {
  create: [validateProperties, create],
  read: [dishExists, read],
  update: [dishExists, validateProperties, update],
  list,
};

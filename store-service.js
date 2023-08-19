const { Sequelize, Model, DataTypes, Op } = require('sequelize');

const sequelize = new Sequelize('jvdeycdv', 'jvdeycdv', '8Rdw1qQ2mjhC0Ok6yRqLkqqUWV-0s5qT', {
  host: 'batyr.db.elephantsql.com',
  dialect: 'postgres',
  port: 5432,
  dialectOptions: {
    ssl: { rejectUnauthorized: false }
  },
  query: { raw: true }
});

class Item extends Model { }
Item.init(
  {
    body: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    postDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    featureImage: {
      type: DataTypes.STRING,
    },
    published: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    price: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Item',
  }
);

class Category extends Model { }
Category.init(
  {
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Category',
  }
);

Item.belongsTo(Category, { foreignKey: 'category' });

const initialize = async () => {
  try {
    await sequelize.sync();
    console.log('Database synced successfully.');
  } catch (error) {
    console.error('Unable to sync the database:', error.message);
    throw new Error('Unable to sync the database.');
  }
};

const getAllItems = () => {
  return Item.findAll()
    .then((items) => {
      if (items.length === 0) {
        throw new Error('No results returned');
      }
      return items;
    })
    .catch((error) => {
      throw new Error('No results returned');
    });
};

const getItemsByCategory = (categoryId) => {
  return Item.findAll({
    where: {
      category: categoryId,
    },
  })
    .then((items) => {
      return items;
    })
    .catch((error) => {
      throw new Error('No results returned');
    });
};


// Function to get items by minimum date
const getItemsByMinDate = (minDateStr) => {
  return Item.findAll({
    where: {
      postDate: {
        [Op.gte]: new Date(minDateStr),
      },
    },
  })
    .then((items) => {
      if (items.length === 0) {
        throw new Error('No results returned');
      }
      return items;
    })
    .catch((error) => {
      throw new Error('No results returned');
    });
};

// Function to get item by ID
const getItemById = (id) => {
  return Item.findByPk(id)
    .then((item) => {
      if (!item) {
        throw new Error('No result returned');
      }
      return item;
    })
    .catch((error) => {
      throw new Error('No result returned');
    });
};

// Function to add an item
const addItem = (itemData) => {
  itemData.published = itemData.published ? true : false;
  for (const key in itemData) {
    if (itemData[key] === '') {
      itemData[key] = null;
    }
  }
  itemData.postDate = new Date();

  return Item.create(itemData)
    .then((newItem) => {
      console.log('New item added:', newItem.toJSON());
      return newItem;
    })
    .catch((error) => {
      console.error('Unable to create post:', error.message);
      throw new Error('Unable to create post.');
    });
};

// Function to get published items
const getPublishedItems = () => {
  return Item.findAll({
    where: {
      published: true,
    },
  })
    .then((publishedItems) => {
      if (publishedItems.length === 0) {
        throw new Error('No results returned');
      }
      return publishedItems;
    })
    .catch((error) => {
      throw new Error('No results returned');
    });
};

// Function to get published items by category
const getPublishedItemsByCategory = (category) => {
  return Item.findAll({
    where: {
      published: true,
      category: category,
    },
  })
    .then((publishedItems) => {
      if (publishedItems.length === 0) {
        throw new Error('No results returned');
      }
      return publishedItems;
    })
    .catch((error) => {
      throw new Error('No results returned');
    });
};

// Function to get all categories
const getCategories = () => {
  return Category.findAll()
    .then((categories) => {
      if (categories.length === 0) {
        throw new Error('No results returned');
      }
      return categories;
    })
    .catch((error) => {
      throw new Error('No results returned');
    });
};
// Function to add a new category
const addCategory = (categoryData) => {
  return new Promise((resolve, reject) => {
    const newCategoryData = { ...categoryData };

    // Set any blank values in categoryData to null
    for (const prop in newCategoryData) {
      if (newCategoryData[prop] === "") {
        newCategoryData[prop] = null;
      }
    }

    // Create the new category in the database
    sequelize
      .sync()
      .then(() => {
        Category.create(newCategoryData)
          .then((createdCategory) => {
            resolve(createdCategory);
          })
          .catch((error) => {
            reject('Unable to create category');
          });
      })
      .catch((error) => {
        reject('Unable to sync the database.');
      });
  });
};

// Function to delete a category by ID
const deleteCategoryById = (id) => {
  return new Promise((resolve, reject) => {
    Category.destroy({
      where: { id: id },
    })
      .then((rowsDeleted) => {
        if (rowsDeleted === 0) {
          reject('Category not found');
        } else {
          resolve('Category deleted successfully');
        }
      })
      .catch((error) => {
        reject('Unable to delete category');
      });
  });
};
// Function to delete a post by ID
const deletePostById = (id) => {
  return new Promise((resolve, reject) => {
    Item.destroy({
      where: { id: id },
    })
      .then((rowsDeleted) => {
        if (rowsDeleted === 0) {
          reject('Item not found');
        } else {
          resolve('Item deleted successfully');
        }
      })
      .catch((error) => {
        reject('Unable to delete item');
      });
  });
};

// Exporting the functions
module.exports = {
  initialize,
  getAllItems,
  getPublishedItems,
  getCategories,
  addItem,
  getItemsByCategory,
  getItemsByMinDate,
  getItemById,
  getPublishedItemsByCategory,
  addCategory,
  deleteCategoryById,
  deletePostById,
};

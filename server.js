/*********************************************************************************
 * WEB322 – Assignment 06
 * I declare that this assignment is my own work in accordance with Seneca Academic Policy.
 * No part of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.
 *
 * Name: Subash Paudel Chhetri
 * Student ID: 149024218
 * Date: 2023-08-18
 * Cyclic Web App URL: 
 * GitHub Repository URL: https://github.com/spyrochhetri/web322-app
 *
 ********************************************************************************/
const express = require("express");
const itemData = require('./store-service');
const multer = require("multer");
const bodyParser = require("body-parser");
const cloudinary = require('cloudinary');
const exphbs = require('express-handlebars');
const Handlebars = require('handlebars');
var clientSessions = require("client-sessions");
var authData = require("./auth-service");
const streamifier = require('streamifier');
const stripJs = require('strip-js');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const app = express();

const path = require('path');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static("public"));
app.use(express.json());

app.engine(
  "hbs",
  exphbs.engine({
    extname: "hbs",
    defaultLayout: 'main',
    helpers: {
      json: (context) => {
        return JSON.stringify(context);
      },
      safeHTML: function (content) {
        return new Handlebars.SafeString(content);
      },
    },
  })
);
app.set("view engine", ".hbs");

app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);

app.use(express.static('public'));
cloudinary.config(
  {cloud_name: 'dbrxmc8if', api_key: '556772682314434', api_secret: 'KWVheWNlJrPv06pAyNnAEGo92Qs'}
);

app.use(function (req, res, next) {
  let route = req.path.substring(1);
  app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
  app.locals.viewingCategory = req.query.category;
  next();
});

app.use(clientSessions({
  cookieName: "session",
  secret: "Subash723",
  duration: 2 * 60 * 1000,
  activeDuration: 1000 * 60
}));

app.use(function (req, res, next) {
  res.locals.session = req.session;
  next();
});

function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect('/login');
  } else {
    next();
  }
}

const HTTP_PORT = process.env.PORT || 8080;

app.get('/', (req, res) => {
  res.redirect('/shop');
});

app.get('/about', (req, res) => {
  res.render('about');
});

app.get("/shop", async (req, res) => {
  let viewData = {};

  try {
    let items = [];
    if (req.query.category) {
      items = await itemData.getPublishedItemsByCategory(req.query.category);
    } else {
      items = await itemData.getPublishedItems();
    }

    items.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));
    let post = items[0];

    viewData.items = items;
    viewData.item = post;
  } catch (err) {
    viewData.message = "No results or error occurred";
  }

  try {
    let categories = await itemData.getCategories();
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "No results or error occurred";
  }

  res.render("shop", viewData);
});

app.get('/shop/:id', async (req, res) => {
  let viewData = {};

  try {
    const itemId = req.params.id;
    viewData.item = await itemData.getItemById(itemId);
  } catch (err) {
    viewData.message = "No results or error occurred";
  }

  try {
    let categories = await itemData.getCategories();
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "No results or error occurred";
  }

  res.render('shop', { data: viewData });
});

app.get("/items", async (req, res) => {
  try {
    if (req.query.category) {
      const categoryId = parseInt(req.query.category);
      const items = await itemData.getItemsByCategory(categoryId);
      res.render("items", { items: items });
    } else {
      const items = await itemData.getAllItems();
      res.render("items", { items: items });
    }
  } catch (error) {
    res.render("items", { message: "No results or error occurred" });
  }
});

app.get("/categories", async (req, res) => {
  try {
    const categories = await itemData.getCategories();
    res.render("categories", { categories: categories });
  } catch (error) {
    res.render("categories", { message: "No results or error occurred" });
  }
});

app.get('/items/add', async (req, res) => {
  try {
    const categories = await itemData.getCategories();
    res.render('addPost', { categories: categories });
  } catch (error) {
    res.render('addPost', { categories: [] });
  }
});

app.post('/items/add', upload.single('addpost'), (req, res) => {
  const newItem = {
    title: req.body.title,
    body: req.body.body,
    postDate: new Date(),
    price: parseFloat(req.body.price),
    category: req.body.category,
    featureImage: req.file ? req.file.filename : null,
    published: req.body.published === 'true',
  };

  itemData
    .addItem(newItem)
    .then(() => {
      res.redirect('/items');
    })
    .catch((error) => {
      console.error(error);
      res.redirect('/error');
    });
});

app.get('/categories/add', (req, res) => {
  res.render('addCategory');
});

app.post('/categories/add', (req, res) => {
  const categoryData = {
    category: req.body.category
  };

  itemData
    .addCategory(categoryData)
    .then(() => {
      res.redirect('/categories');
    })
    .catch((error) => {
      console.error(error);
      res.redirect('/error');
    });
});

app.get('/categories/delete/:id', (req, res) => {
  const categoryId = parseInt(req.params.id);

  itemData
    .deleteCategoryById(categoryId)
    .then(() => {
      res.redirect('/categories');
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Unable to Remove Category / Category not found');
    });
});

app.get('/items/delete/:id', (req, res) => {
  const itemId = parseInt(req.params.id);

  itemData
    .deletePostById(itemId)
    .then(() => {
      res.redirect('/items');
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Unable to Remove Post / Post not found');
    });
});

app.get("/login", (req, res) => {
  res.render('login.hbs');
});

app.post('/login', function (req, res) {
  req.body.userAgent = req.get('User-Agent');

  authData.checkUser(req.body)
    .then(user => {
      req.session.user = {
        userName: user.userName,
        email: user.email,
        loginHistory: user.loginHistory
      };
      res.redirect('/posts');
    })
    .catch(err => {
      res.render('login', { errorMessage: err, userName: req.body.userName });
    });
});

app.get("/register", (req, res) => {
  res.render('register.hbs');
});

app.post('/register', async (req, res) => {
  try {
    await authData.registerUser(req.body);
    res.render('register', { successMessage: 'User created' });
  } catch (err) {
    res.render('register', { errorMessage: err, userName: req.body.userName });
  }
});

app.get("/logout", function (req, res) {
  req.session.reset();
  res.redirect("/");
});

app.get('/userHistory', ensureLogin, function (req, res) {
  res.render('userHistory');
});

app.get('*', (req, res) => {
  res.status(404).send('Page Not Found');
});

itemData.initialize()
  .then(() => {
    app.listen(HTTP_PORT, () => {
      console.log(`Server is running on port ${HTTP_PORT}`);
    });
  })
  .catch((error) => {
    console.error(error);
  });
const path = require('path');
const express = require('express');
const expressHbs = require('express-handlebars');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const errorController = require('./controllers/error');
const sequelize = require('./util/database');
const Product = require('./models/product');
const User = require('./models/user');
const Cart = require('./models/cart');
const CartItem = require('./models/cart-item');
const Order = require('./models/order');
const OrderItem = require('./models/order-item');

Product.belongsTo(User, { constraints: true, onDelete: 'CASCADE' });
User.hasMany(Product);
User.hasOne(Cart);
Cart.belongsToMany(Product, { through: CartItem });
Product.belongsToMany(Cart, { through: CartItem });
Order.belongsTo(User);
User.hasMany(Order);
Order.belongsToMany(Product, {through: OrderItem})

const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
    User.findByPk(1)
        .then(user => {
            req.user = user;
            next();
        })
        .catch(err => console.log(err));
})

app.use('/admin', adminRoutes);
app.use(shopRoutes);

app.use(errorController.get404Page);

sequelize
    .sync() // To create table from model if not exist
    // .sync({ force: true}) // to force recreate table
    .then(result => {
        return User.findByPk(1);
    })
    .then(user => {
        if (!user) {
            return User.create({ name: 'Natasha', email: 'natasha@mail.com' })
        }
        return user;
    })
    .then(user => {
        // console.log(user);
        return user.getCart().then(cart => {
            if (!cart) {
                return user.createCart();
            }
            return cart;
        })
    })
    .then(cart => {
        app.listen(3000);
    })
    .catch(err => console.log(err));


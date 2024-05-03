// Import necessary modules
require('dotenv').config();
const express = require('express');
const cosmos = require('@azure/cosmos');
const session = require('express-session');

//crypto module
const crypto = require('crypto');
const algorithm = 'aes-256-cbc';

const { check, validationResult } = require('express-validator');


// Initialize express app
const app = express();
app.use(express.json());

// Cosmos DB connection
const endpoint = process.env.COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY;
const { CosmosClient } = cosmos;
const client = new CosmosClient({ endpoint, key });
const database = client.database('credit_cards');
const container = database.container('credit_card_users');

const bcrypt = require('bcrypt');
const saltRounds = 10;

const key1 = Buffer.from(process.env.CRYPTO_KEY, 'utf8');
const iv = Buffer.from(process.env.CRYPTO_IV, 'utf8');


app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true } // Note: secure: true option requires an HTTPS connection
  }));

// Login endpoint
app.post('/login', async (req, res) => {

    const { username, password } = req.body;
    console.log(username);
    console.log(req.body);
    const { resources } = await container.items
        .query({ query: "SELECT * FROM c WHERE c.login.username = @username", parameters: [{ name: "@username", value: username }] })
        .fetchAll();
    if (resources.length > 0) {
        const user = resources[0];
        const match = await bcrypt.compare(password, user.login.password);
        if (match) {
            req.session.user = user;
            res.json({ success: true, message: 'Logged in successfully', id:req.session.user.id });
        } else {
            res.json({ success: false, message: 'Invalid username or password' });
        }
    } else {
        res.json({ success: false, message: 'Invalid username or password' });
    }
});

// Create account endpoint
app.post('/create_account', 
[
    check('login.username').isLength({ min: 5 }).withMessage('Username must be at least 5 chars long'),
    check('login.password').isLength({ min: 5 }).withMessage('Password must be at least 5 chars long'),
    check('login.email').isEmail().withMessage('Email is not valid'),
    check('first_name').exists().withMessage('First name is required'),
  ],
  async (req, res) => {
    const { login,  first_name, last_name, address } = req.body;
    const { username, password, email } = login;
    console.log(username);
    console.log(username.length);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { resources } = await container.items
        .query({ query: "SELECT * FROM c WHERE c.login.username = @username", parameters: [{ name: "@username", value: username }] })
        .fetchAll();
    if (resources.length > 0) {
        res.json({ success: false, message: 'Username already exists' });
    } else {
        console.log(`Password: ${password}, Salt Rounds: ${saltRounds}`);

        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const user = {
            first_name,
            last_name,
            address,
            login: {
                username:username,
                email: email,
                password: hashedPassword
            },
            cards: []
        };
        const { resource } = await container.items.create(user);
        res.json({ success: true, message: 'Account created successfully', id: resource.id });
    }
});

// Add credit card endpoint
app.post('/add_credit_card', async (req, res) => {
    let { id, card } = req.body;
    id = id ? id : req.session.id;
    const { resource } = await container.item(id).read();
    const newCard = {};
    console.log(crypto.randomBytes(32).toString)
    console.log(crypto.randomBytes(16))
    if (!card.number) {
        res.status(400).send({ error: 'Card number is required' });
      } else {
            
        // Encrypt the card number
        const cipher = crypto.createCipheriv(algorithm, key1, iv);
        let encrypted = cipher.update(card.number.toString(), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        newCard.number = encrypted;
    }
    
    // Check if a card with the same number already exists

    const cardExists = resource.cards.some(existingCard => existingCard.number === newCard.number);
    if (cardExists) {
        return res.status(400).json({ success: false, message: 'Card with this number already exists' });
    }


    if (card.expiry_month) newCard.expiry_month = card.expiry_month;
    if (card.expiry_year) newCard.expiry_year = card.expiry_year;
    if (card.institution) newCard.institution = card.institution;
    if (card.reward_type) newCard.reward_type = card.reward_type;
    if (card.reward_value) newCard.reward_value = card.reward_value;
    if (card.cardholderName) newCard.cardholderName = card.cardholderName;
    if (card.meta_data) newCard.meta_data = card.meta_data;
    
    resource.cards.push(newCard);
    await container.item(id).replace(resource);
    res.json({ success: true, message: 'Card added successfully' });
});



// Get credit cards endpoint
app.get('/get_credit_cards/:id', async (req, res) => {
    let id = req.params.id ? req.params.id : req.session.id;
    const { resource } = await container.item(id).read();
    console.log(resource);
    const decryptedCards = resource.cards.map(card => {
        if (card.number) {
            const decipher = crypto.createDecipheriv(algorithm, key1, iv);
            console.log(card.number);
            console.log(decipher);
            console.log(card.number.toString());
            let decrypted = decipher.update(card.number.toString(), 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return { ...card, number: decrypted };
        }
        return card;
    });
    res.json(decryptedCards);
});

// Remove credit card endpoint
app.delete('/remove_credit_card/:id/:cardNumber', async (req, res) => {
    let id = req.params.id ? req.params.id : req.session.id;
    let cardNumber = req.params.cardNumber;
    const { resource } = await container.item(id).read();

    // Encrypt the card number to match the one stored
    const cipher = crypto.createCipheriv(algorithm, key1, iv);
    let encrypted = cipher.update(cardNumber.toString(), 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Find the card with the given number
    const cardIndex = resource.cards.findIndex(card => card.number === encrypted);
    if (cardIndex === -1) {
        return res.status(400).json({ success: false, message: 'Card with this number does not exist' });
    }

    // Remove the card
    resource.cards.splice(cardIndex, 1);
    await container.item(id).replace(resource);
    res.json({ success: true, message: 'Card removed successfully' });
});


// Logout endpoint
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            res.json({ success: false, message: 'Error occurred during logout' });
        } else {
            res.json({ success: true, message: 'Logged out successfully' });
        }
    });
});


// Start the server
const port = process.env.PORT || 5000;
const server = app.listen(port, () => console.log(`Server running on port ${port}`));

module.exports =  { app, server };
// Import necessary modules
const express = require('express');
const cosmos = require('@azure/cosmos');
const session = require('express-session');

// Initialize express app
const app = express();
app.use(express.json());

// Cosmos DB connection
const endpoint = "https://fintech-credit-card.documents.azure.com:443/";
const key = "";
const { CosmosClient } = cosmos;
const client = new CosmosClient({ endpoint, key });
const database = client.database('credit_cards');
const container = database.container('credit_card_users');

const bcrypt = require('bcrypt');
const saltRounds = 10;

app.use(session({
    secret: 'weerer23sfg34fregsgswertgergerg',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true } // Note: secure: true option requires an HTTPS connection
  }));

// Login endpoint
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const { resources } = await container.items
        .query({ query: "SELECT * FROM c WHERE c.login.username = @username", parameters: [{ name: "@username", value: username }] })
        .fetchAll();
    if (resources.length > 0) {
        const user = resources[0];
        const match = await bcrypt.compare(password, user.login.password);
        if (match) {
            req.session.user = user;
            res.json({ success: true, message: 'Logged in successfully' });
        } else {
            res.json({ success: false, message: 'Invalid username or password' });
        }
    } else {
        res.json({ success: false, message: 'Invalid username or password' });
    }
});

// Create account endpoint
app.post('/create_account', async (req, res) => {
    console.log(req.body);
    const { login,  first_name, address } = req.body;
    const { resources } = await container.items
        .query({ query: "SELECT * FROM c WHERE c.login.username = @username", parameters: [{ name: "@username", value: login.username }] })
        .fetchAll();
    if (resources.length > 0) {
        res.json({ success: false, message: 'Username already exists' });
    } else {
        console.log(`Password: ${login.password}, Salt Rounds: ${saltRounds}`);

        const hashedPassword = await bcrypt.hash(login.password, saltRounds);
        const user = {
            first_name,
            address,
            login: {
                username:login.username,
                email: login.email,
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
    const { id, card } = req.body;
    const { resource } = await container.item(id).read();
    const newCard = {};

    if (card.number) newCard.number = card.number;
    if (card.expiry_month) newCard.expiry_month = card.expiry_month;
    if (card.expiry_year) newCard.expiry_year = card.expiry_year;
    if (card.institution) newCard.institution = card.institution;
    if (card.reward_type) newCard.reward_type = card.reward_type;
    if (card.reward_value) newCard.reward_value = card.reward_value;
    if (card.cardholderName) newCard.cardholderName = card.cardholderName;
    
    resource.cards.push(card);
    await container.item(id).replace(resource);
    res.json({ success: true, message: 'Card added successfully' });
});

// Get credit cards endpoint
app.get('/get_credit_cards/:id', async (req, res) => {
    const { id } = req.params;
    const { resource } = await container.item(id).read();
    res.json(resource.cards);
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
app.listen(port, () => console.log(`Server running on port ${port}`));
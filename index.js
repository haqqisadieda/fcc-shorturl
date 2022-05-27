require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongodb = require('mongodb');
const mongoose = require('mongoose');
const dns = require('dns');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true });

let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('Connected!');
});

const urlSchema = new mongoose.Schema({
    id: {
        type: Number,
    },
    original_url: {
        type: String,
    },
});

const urlModel = mongoose.model('url', urlSchema);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
    res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', (req, res) => {
    const urlRegex =
        /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/gm;

    dns.lookup(req.body.url.replace(urlRegex, ''), (err, address, family) => {
        if (err) {
            res.json({ error: 'invalid url' });
        } else {
            urlModel
                .find()
                .exec()
                .then((data) => {
                    new urlModel({
                        id: data.length + 1,
                        original_url: req.body.url,
                    })
                        .save()
                        .then(() => {
                            res.json({
                                original_url: req.body.url,
                                short_url: data.length + 1,
                            });
                        })
                        .catch((err) => {
                            res.json(err);
                        });
                });
        }
    });
});

app.get('/api/shorturl/:number', (req, res) => {
    urlModel
        .find({ id: req.params.number })
        .exec()
        .then((url) => {
            res.redirect(url[0]['original_url']);
        });
});

app.listen(port, function () {
    console.log(`Listening on port ${port}`);
});

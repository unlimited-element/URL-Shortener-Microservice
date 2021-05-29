require("dotenv").config();
const cors = require("cors");
const dns = require("dns");
const express = require("express");
const storage = require("./storage");
const mongoose = require("mongoose");
const port = process.env.PORT || 3000;
const app = express();
mongoose.connect(process.env.DB_URI || 'mongodb://localhost/unlimitedelement', {useNewUrlParser: true, useUnifiedTopology: true});

mongoose.connection.on('connected', () => {
console.log('Connection successful')
});

const db = storage(process.env.DB_URI);

app.use(cors());
app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
    res.sendFile(process.cwd() + "/views/index.html");
});

app.get("/api/shorturl/:id", async (req, res) => {
    const shortUrlId = req.params.id;
    const url = await db.getEntry(shortUrlId);

    if (url == null) {
        res.status(404).json({ messsage: `${shortUrlId} not found` });
        return;
    }

    res.redirect(301, url.source);
});

app.post(
    "/api/shorturl",
    express.urlencoded({ extended: true }),
    async (req, res) => {
        const urlSource = req.body.url;

        const pattern = /(^http:\/\/|https:\/\/)?([a-z0-9-\.]+)/gi;
        const url = pattern.exec(urlSource)[2];

        dns.lookup(url, { verbatim: true }, async (err, address, family) => {
            let data = { error: "invalid url" };

            if (err == null && family > 0) {
                const shortUrl = await db.addEntry(urlSource);

                data = {
                    original_url: shortUrl.source,
                    short_url: shortUrl.short,
                };
            }

            res.json(data);
        });
    }
);

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

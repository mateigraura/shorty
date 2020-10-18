const express = require("express");
const cors = require("cors");
const monk = require("monk");
const yup = require("yup");
const moment = require("moment");
const { nanoid } = require("nanoid");

require('dotenv').config();

const port = process.env.PORT || 5000;
const host = process.env.HOST || "localhost";
const connString = process.env.MONGODB_URI;

const app = express();

const db = monk(connString);
const urls = db.get("urls");
const usage = db.get("usage");
urls.createIndex({ url: 1 }, { unique: true });
usage.createIndex({ ip: 1 }, { unique: true });

const yupSchema = yup.object().shape({
    url: yup.string().url().required()
});

app.use(cors());
app.use(express.json());

const path = require("path");
const notfoundPage = path.join(__dirname, "client/public/not-found.html");
app.use(express.static(path.join(__dirname, "client/build")));

app.get("/ping", (req, res) => {
    return res.json({status: "Alive"})
})

app.get("/:slug", async (req, res) => {
    const { slug } = req.params;

    try {
        const existing = await urls.findOne({ slug });
        if (existing) {
            res.redirect(existing.url);
        } else {
            res.status(404).sendFile(notfoundPage);
        }
    } catch (err) {
        res.status(404).sendFile(notfoundPage);
    }
})

app.post("/api/shorten", async (req, res, next) => {
    let { url, ip } = req.body;

    try {
        await yupSchema.validate({ url });

        const user = await usage.findOne({ ip });

        let now = moment().toDate();

        if (user) {
            let diff = moment(now).diff(moment(user.requestedAt), "days");

            if (diff < 30 && user.count === 3) {
                return res.json({
                    status: 403,
                    message: `Monthly limit excedeed!`
                });
            } else if (diff < 30) {
                await usage.update({ ip }, { $inc: { count: 1 } });
            } else if (diff > 30) {
                await usage.update({ ip }, { $set: { count: 1, requestedAt: now } });
            }
        } else {
            await usage.insert({ ip, count: 1, requestedAt: now });
        }

        const existing = await urls.findOne({ url });
        if (existing) {
            res.json({
                status: 200,
                message: "cool",
                url: existing.url,
                slug: existing.slug
            });
        } else {
            let slug = nanoid(6).toLowerCase();

            const created = await urls.insert({ url, slug });

            res.json({
                status: 200,
                message: "cool",
                url: created.url,
                slug: created.slug
            });
        }
    } catch (err) {
        next(err);
    }
});

app.use((err, res) => {
    if (err.status) {
        res.status(err.status);
    } else {
        res.status(500);
    }
});

app.listen(port, () => {
    console.log(`Listening at http://${host}:${port}`)
});

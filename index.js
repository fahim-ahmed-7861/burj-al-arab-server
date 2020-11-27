const express = require('express')

const port = 5000
const bodyParser = require('body-parser');
const cors = require('cors');

const admin = require('firebase-admin');
const MongoClient = require('mongodb').MongoClient;

require('dotenv').config()

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kceb4.mongodb.net/burjAlArab?retryWrites=true&w=majority`;




const app = express()

app.use(cors());
app.use(bodyParser.json());




var serviceAccount = require("./configs/burj-al-arab-109-firebase-adminsdk-i7gco-3865d2ed70.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIRE_DB
});





const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const bookings = client.db("burjAlArab").collection("bookings");

    app.post('/addBooking', (req, res) => {

        const newBooking = req.body;

        bookings.insertOne(newBooking)
            .then(result => {
                res.send(result.insertedCount > 0);
            })
        console.log(newBooking);

    });

    app.get('/bookings', (req, res) => {



        const bearer = req.headers.authorization;

        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(' ')[1];
           // console.log({ idToken });

            admin
                .auth()
                .verifyIdToken(idToken)
                .then((decodedToken) => {

                    let tokenEmail = decodedToken.email;

                    if (tokenEmail == req.query.email) {
                        bookings.find({ email: req.query.email })
                            .toArray((err, documents) => {
                                res.status(200).send(documents);
                            })
                    }
                    else{
                        res.status(401).send('un authorized access');
                    }
                    // ...
                })
                .catch((error) => {
                    // Handle error
                    res.status(401).send('un authorized access');
                });

        }

        else
        {
            res.status(401).send('un authorized access');
        }

        // idToken comes from the client app

        /*bookings.find({email : req.query.email})
         .toArray((err,documents) => {
             res.send(documents);
         })*/
    })
});



app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port)
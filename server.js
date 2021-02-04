const express = require('express');
const helmet = require('helmet')
const BodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;
const port = process.env.PORT || 5000;
const CONNECTION_URL = process.env.MONGODB_URI || 'my-mongodb-srv-url';
var database, collection;

// App setup
const app = express();
app.use(helmet())
app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));

app.listen(port, () => {
    MongoClient.connect(CONNECTION_URL, { useNewUrlParser: true, useUnifiedTopology: true }, (error, client) => {
        if(error) {
            throw error;
        }
        database = client.db('my-database');
        collection = database.collection("my-collection");
        console.log("Database connected!");
    });
});

// Get all records
app.get("/records", (request, response) => {
    collection.find({}).toArray((err, result) => {
        if(err)
            return response.status(500).send(err);
        response.send(result);
    });
});

// Create new record
app.post("/records", (request, response) => {
    // Check for empty request body
    if(!request.body) {
        return response.status(400).send({
            message: "Request body can not be empty"
        });
    }
    collection.insertOne(request.body, (err, result) => {
        if(err)
            return response.status(500).send(err);
        response.send(result);
    });
});

// Read record by id
app.get("/records/:id", (request, response) => {
    collection.findOne({ "_id": new ObjectId(request.params.id) }, (err, result) => {
        if(err)
            return response.status(500).send(err);
        response.send(result);
    });
});

// Update record by id
app.put("/records/:id", (request, response) => {
    // Check for empty request body
    if(!request.body) {
        return response.status(400).send({
            message: "Request body can not be empty"
        });
    }
    // Find record and update with the request body
    collection.updateOne(
        { '_id': new ObjectId(request.params.id) },
        { '$set': request.body })
            .then(record => {
                // Check if records have been found for the given id
                if(record.result.n == 0) {
                    return response.status(404).send({
                        message: "Record not found with id " + request.params.id
                    });
                }
                response.send(record);
            }).catch(err => {
                return response.status(500).send({
                    message: "Error updating record with id " + request.params.id
                });
            });
});

// Delete record by id
app.delete("/records/:id", (request, response) => {
    collection.deleteOne({ "_id": new ObjectId(request.params.id) }, (err, result) => {
        if(err)
            return response.status(500).send(err);
        response.send(result);
    });
});
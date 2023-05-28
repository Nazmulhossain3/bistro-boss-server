const express = require('express');
const cors = require('cors');
require("dotenv").config();

const app = express();

const port = process.env.PORT || 5000

// middle ware

app.use(cors())
app.use(express.json())



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
var uri = `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@ac-onjpk5k-shard-00-00.xskcn3u.mongodb.net:27017,ac-onjpk5k-shard-00-01.xskcn3u.mongodb.net:27017,ac-onjpk5k-shard-00-02.xskcn3u.mongodb.net:27017/?ssl=true&replicaSet=atlas-g07jbs-shard-0&authSource=admin&retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const menuCollection = client.db('bistroDb').collection('menu')
    const reviewCollection = client.db('bistroDb').collection('reviews')
    const cartCollection = client.db('bistroDb').collection('carts')

    app.get('/menu', async(req,res)=> {

        const result = await menuCollection.find().toArray()
        res.send(result)
    })
   
    app.get('/reviews', async(req,res)=> {

        const result = await reviewCollection.find().toArray()
        res.send(result)
    })

   
  //  cart information 

  app.post('/carts', async(req,res)=> {
    const item = req.body 
    console.log(item) 
    const result = await cartCollection.insertOne(item)
    res.send(result)
  })

  app.get('/carts', async(req,res)=> {
    const email = req.query.email
    if(!email){
      res.send([])
    }
    const query = {email : email}
    const result = await cartCollection.find(query).toArray()
    res.send(result)
  })

  app.delete('/carts/:id', async(req,res)=>{
    const id = req.params.id 
    const query = {_id : new ObjectId(id)}
    const result = await cartCollection.deleteOne(query)
    res.send(result)
  })
   
   
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);







app.get('/', (req,res)=> {
    res.send('bistro server is running')
})


app.listen(port, ()=> {
    console.log(`bistro server is running on port : ${port}`)
})
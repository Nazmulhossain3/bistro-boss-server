const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

require("dotenv").config();

const app = express();

const port = process.env.PORT || 5000

// middle ware

app.use(cors())
app.use(express.json())


const verifyJWT = (req,res,next) => {
  const authorization = req.headers.authorization 
  if(!authorization){
    return res.status(401).send({error : true, message : 'unauthorize access'})
  }
  // bearer token
  const token = authorization.split(' ')[1];
  jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{

    if(err){
  return res.status(401).send({error : true, message : 'unauthorize access'})

}
req.decoded = decoded 
next()

  })



}



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
    const usersCollection = client.db('bistroDb').collection('users')
    const menuCollection = client.db('bistroDb').collection('menu')
    const reviewCollection = client.db('bistroDb').collection('reviews')
    const cartCollection = client.db('bistroDb').collection('carts')

    // jwt token create 
    app.post('/jwt', (req,res)=> {
      const user = req.body 
      const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{
        expiresIn : '1hr'
      })

      res.send({token})
    })
    
    
    // use related api
    app.get('/users', async(req,res)=> {
      const result = await usersCollection.find().toArray()
      res.send(result)
    })

    app.post('/users', async(req,res)=>{
      const user = req.body 
      console.log(user)

      const query = {email : user.email}
      const exitingUser = await usersCollection.findOne(query)

      if(exitingUser){
        return res.send({message : 'user already exists'})
      }
     const result = await usersCollection.insertOne(user)
      res.send(result)
    })
   
    // this is admin role 
    // security layer 
    //  email same 
    //  check admin 
    app.get('/users/admin/:email',verifyJWT, async(req,res)=>{
      
      const email = req.params.email 
      if(req.decoded.email !== email){
        res.send({admin : false})
      }


      const query = {email : email}
      const user = await usersCollection.findOne(query)
      const result = {admin : user?.role === 'admin'}
      res.send(result)

    })


    app.patch('/users/admin/:id', async(req,res)=>{
      const id = req.params.id 
      const filter = {_id : new ObjectId(id)}
      const updateDoc = {
        $set : {
          role : 'admin',
        },
      }
   
      const result = await usersCollection.updateOne(filter,updateDoc)
      res.send(result)
    })


    // menu related api
    app.get('/menu', async(req,res)=> {

        const result = await menuCollection.find().toArray()
        res.send(result)
    })
   
    // review related api
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

  app.get('/carts',verifyJWT, async(req,res)=> {
    const email = req.query.email
    if(!email){
      res.send([])
    }

    const decodedEmail = req.decoded.email
  if(email !== decodedEmail){
    return res.status(404).send({error : true, message : 'forbidden access'})

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
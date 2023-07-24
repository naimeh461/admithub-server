const express = require("express");
const cors = require('cors')
const app = express();
require('dotenv').config();
const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
app.use(cors())
app.use(express.json())
const graduate = require("./data/college.json")




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tktqebe.mongodb.net/?retryWrites=true&w=majority`;

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

    
    const university = client.db("admitHub").collection("universities");
    const userCollection = client.db("admitHub").collection("users");
    const reviewsCollection = client.db("admitHub").collection("reviews");

    app.get("/university", async (req, res) => {
      const search = req.query.search;
      const query = {college_name: { $regex: search , $options: 'i' }}
      const result = await university.find(query).project({college_name:1, college_image:1 }).toArray();
      res.send(result)
    })


    app.get("/universitydetails", async (req, res) => {
      const result = await university.find().limit(3).project({college_name:1, college_image:1 , admission_data:1 ,events:1 ,research_history:1 ,sports: 1}).toArray();
      res.send(result)
    })

    app.get("/alluniversitydetails", async (req, res) => {
      const result = await university.find().project({college_name:1, college_image:1 , admission_data:1 ,events:1 ,research_history:1 ,sports: 1}).toArray();
      res.send(result)
    })

    app.get("/reviews", async (req, res) => {
      const result = await reviewsCollection.find().toArray();
      res.send(result)
    })


    app.get("/admission", async (req, res) => {
      const result = await university.find().project({college_name:1, college_image:1 }).toArray();
      res.send(result)
    })

    app.get("/admissiondata/:id", async (req, res) => {
      const id= req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await university.findOne(query);
      res.send(result)
    })

    app.get("/research", async (req, res) => {
      const result = await university.find().project({college_name:1, college_image:1 , research_works:1}).toArray();
      res.send(result)
    })

    app.get("/universityDetails/:id",async(req,res)=>{
      const id= req.params.id;
      const query = {_id: new ObjectId(id)}
      const result =await university.findOne(query);
      res.send(result)
  })
  
  app.post("/users", async (req, res) => {
    const user = req.body;
    const query = { email: user.email }
    const existingUsers = await userCollection.findOne(query);
    if (existingUsers) {
      return res.send
    }
    const result = await userCollection.insertOne(user)
    res.send(result)

  })


  app.get("/addedclass/:email",  async (req, res) => {
    const email = req.params.email
    const query = { email: email }
    const result = await userCollection.findOne(query);
    res.send(result);
  })

  app.get("/reviewdata/:id",  async (req, res) => {
    const id = req.params.id;
    const query = {_id: new ObjectId(id)}
    const result = await userCollection.findOne(query);
    res.send(result);
  })

  app.post("/reviews",async(req,res)=> {
    const review = req.body;
    const result = await reviewsCollection.insertOne(review);
    res.send(result);
})


  app.patch("/collegeAdmission", async (req, res) => {
    const updateInfo = req.body;
    const filter = { email: updateInfo.email }
    const updateDoc = {
      $set: {
        name: updateInfo.name,
        photo : updateInfo.photo,
        subject: updateInfo.subject,
        candidateEmail : updateInfo.candidateEmail,
        phoneNumber: updateInfo.phoneNumber,
        birth: updateInfo.birth,
        address: updateInfo.address,
        email: updateInfo.email,
        college_name: updateInfo.collegeName,
        college_image: updateInfo.collegeImage
      },
    };
    const options = { upsert: true };
    const result = await userCollection.updateOne(filter,updateDoc)
    res.send(result)

  })

  app.patch("/updateProfile/:email", async (req, res) => {
    const updateInfo = req.body;
    const filter = { email: updateInfo.email }
    const updateDoc = {
      $set: {
        name: updateInfo.name,
        candidateEmail : updateInfo.candidateEmail,
        address: updateInfo.address,
        college_name: updateInfo.collegeName,
      },
    };
    const options = { upsert: true };
    const result = await userCollection.updateOne(filter,updateDoc)
    res.send(result)

  })
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);

app.get("/graduate",(req,res)=>{
  res.send(graduate);
})

app.get("/", (req, res) => {
  res.send("AdmitHub is running")
})

app.listen(port, () => {
  console.log(`AdmitHub is here on port ${port}`)
})
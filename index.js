const express = require("express");
const cors = require('cors')
const app = express();
require('dotenv').config();
const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY)
const jwt = require('jsonwebtoken');
app.use(cors())
app.use(express.json())
const graduate = require("./data/college.json")

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'no authorization header is send' })
  }
  // if token  in send in headers.authorization the splite it by bearer token
  const token = authorization.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ error: true, message: 'token is not valid' })
    }
    req.decoded = decoded;
    next();
  })
}


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
    const paymentsCollection = client.db("admitHub").collection("payment");
    const admissionUniversity = client.db("admitHub").collection("admissionUniversity");



    //  ----------------------
    //  jwt related api 
    //  ---------------------
    // send the jwt token when user log in or register
    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '24h' })
      res.send({ token });
    })

    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email }
      const user = await userCollection.findOne(query);
      if (user?.role !== "admin") {
        return res.status(403).send({ error: true, message: 'forbidden message' });
      }
      next()
    }

    const verifyStudent = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email }
      const user = await userCollection.findOne(query);
      if (user?.role !== "student") {
        return res.status(403).send({ error: true, message: 'forbidden message' });
      }
      next()
    }





    //  ----------------------
    //  user role verification
    //  ---------------------
    //verify admin 
    app.get('/users/admin/:email', verifyJWT, async (req, res) => {
      const email = req.params.email
      if (req.decoded.email !== email) {
        res.send({ admin: false })
      }
      const query = { email: email }
      const user = await userCollection.findOne(query);
      const result = { admin: user?.role === 'admin' }
      res.send(result);
    })

    // verify user student or not
    app.get('/users/student/:email', verifyJWT, async (req, res) => {
      const email = req.params.email
      if (req.decoded.email !== email) {
        res.send({ student: false })
      }
      const query = { email: email }
      const user = await userCollection.findOne(query);
      const result = { student: user?.role === 'student' }
      res.send(result);
    })


    app.get("/university", async (req, res) => {
      const search = req.query.search || '';
      // Only use $regex when search is a non-empty string
      const query = search
        ? { college_name: { $regex: search, $options: 'i' } }
        : {};
      const result = await university.find(query).project({ college_name: 1, college_image: 1 }).toArray();
      res.send(result)
    })

    app.get("/universitydetails", async (req, res) => {
      const result = await university.find().limit(3).project({ college_name: 1, college_image: 1, admission_data: 1, events: 1, research_history: 1, sports: 1 }).toArray();
      res.send(result)
    })

    app.get("/alluniversitydetails", async (req, res) => {
      const result = await university.find().project({ college_name: 1, college_image: 1, admission_data: 1, events: 1, research_history: 1, sports: 1 }).toArray();
      res.send(result)
    })

    app.get("/reviews", async (req, res) => {
      const result = await reviewsCollection.find().toArray();
      res.send(result)
    })


    app.get("/admission", async (req, res) => {
      const result = await university.find().project({ college_name: 1, college_image: 1 }).toArray();
      res.send(result)
    })

    app.get("/admissiondata/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await university.findOne(query);
      res.send(result)
    })

    app.get("/research", async (req, res) => {
      const result = await university.find().project({ college_name: 1, college_image: 1, research_works: 1 }).toArray();
      res.send(result)
    })

    app.get("/universityDetails/:id", async (req, res) => {
      try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ error: true, message: "Invalid id" });
        }
        const query = { _id: new ObjectId(id) };
        const result = await university.findOne(query);
        res.send(result);
      } catch (err) {
        console.error("universityDetails error:", err);
        res.status(500).send({ error: true, message: "Server error" });
      }
    });

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


    app.get("/addedclass/:email", async (req, res) => {
      const email = req.params.email
      const query = { email: email }
      const result = await userCollection.findOne(query);
      res.send(result);
    })
    app.get("/reviewdata/:id", async (req, res) => {
      try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ error: true, message: "Invalid id" });
        }
        const query = { _id: new ObjectId(id) };
        const result = await userCollection.findOne(query);
        res.send(result);
      } catch (err) {
        console.error("reviewdata error:", err);
        res.status(500).send({ error: true, message: "Server error" });
      }
    });

    app.post("/reviews", async (req, res) => {
      const review = req.body;
      const result = await reviewsCollection.insertOne(review);
      res.send(result);
    })

    app.post("/collegeAdmission", verifyJWT, async (req, res) => {
      try {
        const admissionInfo = req.body;
        console.log("Received admission info:", admissionInfo);
        const authEmail = req.decoded?.email;
        if (!authEmail) return res.status(401).send({ error: true, message: "Unauthorized" });
        if (admissionInfo.email && admissionInfo.email !== authEmail) {
          return res.status(403).send({ error: true, message: "Email mismatch" });
        }

        const userDoc = await userCollection.findOne({ email: authEmail });
        const userId = userDoc?._id;

        const collegeId = admissionInfo.collegeId || admissionInfo.college_id || admissionInfo.college || null;
        const record = {
          userId: userId || null,
          userEmail: authEmail,
          name: admissionInfo.candidateName || admissionInfo.name || "",
          photo: admissionInfo.photoUrl || admissionInfo.photo || "",
          subject: admissionInfo.subject || "",
          candidateEmail: admissionInfo.candidateEmail || authEmail,
          phoneNumber: admissionInfo.phoneNumber || "",
          birth: admissionInfo.birth || "",
          address: admissionInfo.address || "",
          collegeId,
          college_name: admissionInfo.collegeName || admissionInfo.college_name || "",
          college_image: admissionInfo.collegeImage || admissionInfo.college_image || "",
          transactionId: admissionInfo.transactionId || admissionInfo.transaction_id || null,
          paymentRaw: admissionInfo.paymentRaw || null,
          createdAt: new Date(),
          status: admissionInfo.status || "pending"
        };

        const insertResult = await admissionUniversity.insertOne(record);
        res.send({ success: true, insertResult });
      } catch (err) {
        console.error("Error creating admission record:", err);
        res.status(500).send({ error: true, message: "Failed to create admission record" });
      }
    });

    app.patch("/updateProfile/:email", verifyJWT, async (req, res) => {
      try {
        const emailParam = req.params.email;
        const updateInfo = req.body || {};

        // prefer param but fall back to body.email if provided
        const filter = { email: emailParam || updateInfo.email };

        const updateDoc = {
          $set: {
            name: updateInfo.name,
            candidateEmail: updateInfo.candidateEmail,
            subject: updateInfo.subject,
            address: updateInfo.address,
            college_name: updateInfo.collegeName || updateInfo.currentInstitution,
            currentInstitution: updateInfo.currentInstitution,
            educationLevel: updateInfo.educationLevel,
            cgpa: updateInfo.cgpa,
            photoUrl: updateInfo.photoUrl,
            phoneNumber: updateInfo.phoneNumber,
            birth: updateInfo.birth,
            // any other fields you want to persist from the form
          },
        };

        const options = { upsert: true };
        const result = await userCollection.updateOne(filter, updateDoc, options);

        res.json(result);
      } catch (err) {
        console.error("updateProfile error:", err);
        res.status(500).json({ error: "Server error" });
      }
    });

    //create payment intent
    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method_types: ['card']
      });
      console.log(paymentIntent)
      res.send({
        clientSecret: paymentIntent.client_secret
      });
    })

    //payment info store in data base
    app.post('/payments', async (req, res) => {
      try {
        const payment = req.body;
        const insertResult = await paymentsCollection.insertOne(payment);
        return res.send({ insertResult });
      } catch (err) {
        console.error('Error saving payment:', err);
        return res.status(500).send({ error: 'Failed to save payment' });
      }
    })

    app.get('/payments/check', async (req, res) => {
      try {
        const { email, classId } = req.query;
        if (!email || !classId) {
          return res.status(400).send({ paid: false, error: 'email and classId required' });
        }
        const query = { email: email, classId: classId };
        const payment = await paymentsCollection.findOne(query);
        return res.send({ paid: !!payment, payment });
      } catch (err) {
        console.error('Error checking payment:', err);
        return res.status(500).send({ paid: false });
      }
    })
    // Connect the client to the server	(optional starting in v4.7)
    app.get('/admissions', verifyJWT, async (req, res) => {
      try {
        const authEmail = req.decoded?.email;
        if (!authEmail) {
          return res.status(401).send({ error: true, message: 'Unauthorized' });
        }

        // Query by userEmail (stored when admission was created)
        const query = { userEmail: authEmail };
        const admissions = await admissionUniversity.find(query).toArray();

        res.send({ success: true, admissions });
      } catch (err) {
        console.error('Error fetching admissions:', err);
        res.status(500).send({ error: true, message: 'Failed to fetch admissions' });
      }
    });
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }

  // ...existing code...
  // Get admissions for the authenticated user
  // ...existing code...
}
run().catch(console.dir);

app.get("/graduate", (req, res) => {
  res.send(graduate);
})

app.get("/", (req, res) => {
  res.send("AdmitHub is running")
})

app.listen(port, () => {
  console.log(`AdmitHub is here on port ${port}`)
})
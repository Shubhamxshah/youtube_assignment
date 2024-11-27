import express from "express";
import cors from "cors"
import jwt from 'jsonwebtoken';
import {z} from 'zod';
import { authenticate } from "../middleware";

const app = express();
const port = 3000;
app.use(express.json());
app.use(cors());

type user = {
    "id": string,
    "username": string,
    "email": string,
    "password": string,
};
type channel = {
 [key: string] : {
    name: string,
    description: string,
    slug: string,
  }
}
const JWT_SECRET = process.env.JWT_SECRET as string;

const users: user[] = [];
const channels: channel[] = []; 

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  username: z.string().min(1),
})

app.post("/api/auth/signup", (req, res) => {

  try{
    const {email, password, username} = signupSchema.parse(req.body);

    const userExists = users.find(u => u.email === email || u.username === username);
    if (userExists){
      res.status(409).json('username or email already exists')
    }
    const id = Math.random().toString();
    users.push({
        id,
        username,
        email,
        password,
    })
    console.log(users);
    res.status(200).json(`user created successfully`)
  } catch {
   res.status(400).json(`validation error`)
  }
})

const signinSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

app.post("/api/auth/login", (req, res) => {
  try {
    const {email, password} = signinSchema.parse(req.body);
    const user = users.find(u => u.email === email && u.password === password);
    if (!!user) {
      const token = jwt.sign({email}, JWT_SECRET, {expiresIn: '1d'});
      res.cookie("Authentication", token, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 60*60*24*1000,
      })
      const response = {
        access_token: token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        }
      }
      res.status(200).json(response) 
    } else {
      res.status(409).json(`username or password incorrect`)
    }
    
  } catch {
    res.status(400).json("validation errors")
  }
})

// app.get("/api/videos/feed", (req, res) => {
//   const {page = '1', limit = '20', category='all'} = req.params;
// })


const channelSchema = z.object({
  name: z.string(),
  description: z.string(),
  slug: z.string(),
})

app.post("/api/channels", authenticate, (req, res) => {
  
  const email = (req as any).email;
  try{
    const {name, description, slug} = channelSchema.parse(req.body);
    const channelExists = channels.find(ch => {
      const key = Object.keys(ch)[0];
      return key === email;
    })
    if (!!channelExists) {
      res.status(411).json("user already has a channel");
    }

    const slugExists = channels.find(ch => {
      const channelObj = Object.values(ch)[0];
      return channelObj.slug === slug
    })

    if (!!slugExists) {
      res.status(409).json(`slug already exists`)
    }

    channels.push({
     [email] : {
        name,
        description,
        slug,
      }
    })
  } catch {
    res.status(400).json({error:"validation failed"})
  }

})

app.listen(port, () => {
  console.log(`app listening on port http://localhost:${port}`);
})

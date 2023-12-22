import express from "express";
import mongoose from "mongoose";
import "dotenv/config";
import bcrypt from "bcrypt";
import { nanoid } from "nanoid";

// schema
import User from "./Schema/User.js";

const server = express();
const PORT = 3000;

let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;

// middleware
server.use(express.json());
// server.use(cors());

mongoose.connect(process.env.DB_LOCATION, {
  autoIndex: true,
});

const generateUserName = async (email) => {
  let username = email.split("@")[0];
  let isUserNameNotUnique = await User.exists({
    "personal_info.username": username,
  }).then((result) => result);

  isUserNameNotUnique ? (username += nanoid().substring(0, 3)) : "";

  return username;
};

server.post("/signup", (req, res) => {
  const { fullname, email, password } = req.body;

  // validating data from frontend
  if (fullname.length < 3) {
    return res.status(403).json({
      error: "Full name must be 3 letter long.",
    });
  }

  if (!email.length) {
    return res.status(403).json({
      error: "Enter email",
    });
  }

  if (!emailRegex.test(email)) {
    return res.status(403).json({
      error: "Email is invalid.",
    });
  }

  if (!passwordRegex.test(password)) {
    return res.status(403).json({
      error:
        "Password should be 6 to 20 character long with a numeric, 1 lowercase and 1 uppercase letters.",
    });
  }

  bcrypt.hash(password, 10, async (err, hash_password) => {
    let username = await generateUserName(email);
    let user = new User({
      personal_info: {
        fullname,
        email,
        password: hash_password,
        username,
      },
    });

    user
      .save()
      .then((u) => {
        return res.status(200).json({ user: u });
      })
      .catch((err) => {
        if (err.code == 11000) {
          return res.status(500).json({
            error: "Email already exists.",
          });
        }

        return res.status(500).json({
          error: err.message,
        });
      });
  });

  // return res.status(200).json({
  //   status: "ok",
  // });
});

server.listen(PORT, () => {
  console.log(`Listing on port ${PORT}`);
});

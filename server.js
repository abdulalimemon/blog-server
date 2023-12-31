import express from "express";
import mongoose from "mongoose";
import "dotenv/config";
import bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";

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

const formateDataToSend = (user) => {
  const access_token = jwt.sign(
    { id: user._id },
    process.env.SECRET_ACCESS_KEY
  );
  return {
    access_token,
    profile_img: user.personal_info.profile_img,
    username: user.personal_info.username,
    fullname: user.personal_info.fullname,
  };
};

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
        return res.status(200).json(formateDataToSend(u));
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

server.post("/signin", async (req, res) => {
  let { email, password } = req.body;

  User.findOne({ "personal_info.email": email })
    .then((user) => {
      if (!user) {
        return res.status(403).json({
          error: "User not found.",
        });
      }

      bcrypt.compare(password, user.personal_info.password, (err, result) => {
        if (err) {
          return res
            .status(403)
            .json({ error: "Error occured while login please try again." });
        }

        if (!result) {
          return res.status(403).json({ error: "Incorrect password." });
        } else {
          return res.status(200).json(formateDataToSend(user));
        }
      });

      console.log(user);

      // return res.json({
      //   status: "Got user document",
      // });
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({
        error: err.message,
      });
    });
});

server.listen(PORT, () => {
  console.log(`Listing on port ${PORT}`);
});

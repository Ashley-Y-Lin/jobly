"use strict";

const db = require("../db.js");
const User = require("../models/user");
const Company = require("../models/company");
const Job = require("../models/jobs");
const { createToken } = require("../helpers/tokens");

async function commonBeforeAll() {
  // noinspection SqlWithoutWhere
  await db.query("ALTER SEQUENCE jobs_id_seq RESTART WITH 1");
  await db.query("DELETE FROM users");
  await db.query("DELETE FROM companies");
  await db.query("DELETE FROM jobs");
  await db.query("DELETE FROM applications");

  await Company.create({
    handle: "c1",
    name: "C1",
    numEmployees: 1,
    description: "Desc1",
    logoUrl: "http://c1.img",
  });
  await Company.create({
    handle: "c2",
    name: "C2",
    numEmployees: 2,
    description: "Desc2",
    logoUrl: "http://c2.img",
  });
  await Company.create({
    handle: "c3",
    name: "C3",
    numEmployees: 3,
    description: "Desc3",
    logoUrl: "http://c3.img",
  });

  await Job.create({
    title: "t1",
    salary: 5,
    equity: 0.2,
    companyHandle: "c1",
  });
  await Job.create({
    title: "t2",
    salary: 10,
    equity: 0.4,
    companyHandle: "c2",
  });
  await Job.create({
    title: "t3",
    salary: 15,
    equity: 0.6,
    companyHandle: "c3",
  });

  await User.register({
    username: "u1",
    firstName: "U1F",
    lastName: "U1L",
    email: "user1@user.com",
    password: "password1",
    isAdmin: false,
  });
  await User.register({
    username: "u2",
    firstName: "U2F",
    lastName: "U2L",
    email: "user2@user.com",
    password: "password2",
    isAdmin: false,
  });
  await User.register({
    username: "u3",
    firstName: "U3F",
    lastName: "U3L",
    email: "user3@user.com",
    password: "password3",
    isAdmin: true,
  });
  await User.applyForJob("u1", 1);
  await User.applyForJob("u1", 2);
}

async function commonBeforeEach() {
  await db.query("BEGIN");
}

async function commonAfterEach() {
  await db.query("ROLLBACK");
}

async function commonAfterAll() {
  await db.end();
}

const nonAdminToken = createToken({ username: "u1", isAdmin: false });

const adminToken = createToken({ username: "u3", isAdmin: true });

module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  nonAdminToken,
  adminToken,
};

"use strict";

/** Routes for users. */

const jsonschema = require("jsonschema");

const express = require("express");
const {
  ensureLoggedIn,
  ensureUserIsAdmin,
  ensureAdminOrCurrent,
} = require("../middleware/auth");
const { BadRequestError } = require("../expressError");
const User = require("../models/user");
const { createToken } = require("../helpers/tokens");
const userNewSchema = require("../schemas/userNew.json");
const userUpdateSchema = require("../schemas/userUpdate.json");

const router = express.Router();


/** POST / { user }  => { user, token }
 *
 * Adds a new user. This is not the registration endpoint --- instead, this is
 * only for admin users to add new users. The new user being added can be an
 * admin.
 *
 * This returns the newly created user and an authentication token for them:
 *  {user: { username, firstName, lastName, email, isAdmin }, token }
 *
 * Authorization required: logged in, and isAdmin
 **/
router.post(
  "/",
  ensureUserIsAdmin,
  async function (req, res, next) {
    const validator = jsonschema.validate(req.body, userNewSchema, {
      required: true,
    });
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const user = await User.register(req.body);
    const token = createToken(user);
    return res.status(201).json({ user, token });
  }
);


/** GET / => { users: [ {username, firstName, lastName, email, jobs }, ... ] }
 * where jobs => [jobId, jobId, ....]
 *
 * Returns list of all users.
 *
 * Authorization required: login and isAdmin
 **/
router.get(
  "/",
  ensureUserIsAdmin,
  async function (req, res, next) {
    const users = await User.findAll();
    return res.json({ users });
  }
);


/** GET /[username] => { user }
 *
 * Returns { username, firstName, lastName, isAdmin }
 *
 * Authorization required: logged in, and either isAdmin OR user is getting their
 * own information.
 **/
router.get(
  "/:username",
  ensureAdminOrCurrent,
  async function (req, res, next) {
    const user = await User.get(req.params.username);
    return res.json({ user });
  }
);


/** PATCH /[username] { user } => { user }
 *
 * Data can include:
 *   { firstName, lastName, password, email }
 *
 * Returns { username, firstName, lastName, email, isAdmin }
 *
 * Authorization required: logged in, and either isAdmin OR is the user it's
 * trying to update.
 **/
router.patch(
  "/:username",
  ensureAdminOrCurrent,
  async function (req, res, next) {
    const validator = jsonschema.validate(req.body, userUpdateSchema, {
      required: true,
    });
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const user = await User.update(req.params.username, req.body);
    return res.json({ user });
  });


/** DELETE /[username]  =>  { deleted: username }
 *
 * Authorization required: logged in, and either isAdmin OR is the user it's
 * trying to delete.
 **/
router.delete(
  "/:username",
  ensureAdminOrCurrent,
  async function (req, res, next) {
    await User.remove(req.params.username);
    return res.json({ deleted: req.params.username });
  });


/** POST /users/:username/jobs/:id  => { applied: jobId }
 *
 * Allows user to apply for a job, or an admin to do this for them.
 * This returns JSON that looks like: { applied: jobId }
 *
 * Authorization required: isCurrentUser, or isAdmin (loggedin implied)
 **/
router.post(
  "/:username/jobs/:id",
  ensureAdminOrCurrent,
  async function (req, res, next) {
    const { username, id } = req.params;

    const jobApp = await User.applyForJob(username, id);
    return res.status(201).json({ applied: jobApp.jobId });
  }
);

module.exports = router;

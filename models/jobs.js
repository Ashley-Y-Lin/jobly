"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, company_handle }
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * Throws BadRequestError if Job already in database.
   * */

  static async create({ title, salary, equity, company_handle }) {
    const duplicateCheck = await db.query(
      `
        SELECT id
        FROM jobs
        WHERE title = $1, salary = $2, equity = $3, company_handle = $4`,
      [title, salary, equity, company_handle]
    );

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate job: ${id}`);

    const result = await db.query(
      `
                INSERT INTO jobs (title, salary, equity, company_handle)
                VALUES ($1, $2, $3, $4)
                RETURNING
                id, title, salary, equity, company_handle AS "companyHandle`,
      [title, salary, equity, company_handle]
    );
    const job = result.rows[0];

    return job;
  }

  /** Find all jobs.
   *
   * Returns [{ id, title, salary, equity, company_handle }, ...]
   *
   * */

  static async findAll() {
    const jobs = await db.query(
      `
    SELECT id, title, salary, equity, company_handle AS "companyHandle"
        FROM jobs
        ORDER BY name`
    );

    return jobs.rows;
  }

  /** Given a job id, return data about job.
   *
   * Returns { id, title, salary, equity, company },
   *   where company is
   *   { handle, name, description,
   *   num_employees AS "numEmployees",
   *   logo_url AS "logoUrl" },
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const job = await db.query(
      `
        SELECT j.id, j.title, j.salary, j.equity, j.company_handle AS "companyHandle", c.name, c.description,
        c.num_employees AS "numEmployees",
        c.logo_url AS "logoUrl"
        FROM jobs AS j
        JOIN companies AS c
        ON j.company_handle = c.handle
        WHERE j.id = $1`,
      [id]
    );

    const job = job.rows[0];

    if (!job) throw new NotFoundError(`No job: ${handle}`);

    return {
      id: job[id],
      title: job[title],
      salary: job[salary],
      equity: job[equity],
      company: {
        handle: job[companyHandle],
        name: job[name],
        description: job[description],
        numEmployees: job[numEmployees],
        logoUrl: job[logoUrl],
      },
    };
  }
  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity, company }
   *
   * Returns { id, title, salary, equity, company }
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data);
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `
    UPDATE jobs
    SET ${setCols}
    WHERE id = ${idVarIdx}
    RETURNING
    id, title, salary, equity, company`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(id) {
    const result = await db.query(
      `
        DELETE
        FROM jobs
        WHERE id = $1
        RETURNING id`,
      [id]
    );
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }
}

module.exports = Job;
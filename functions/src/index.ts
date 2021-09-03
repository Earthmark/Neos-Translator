import * as functions from "firebase-functions";
// import * as admin from "firebase-admin";
import fetch from "node-fetch";
import * as express from "express";

const app = express();

type JSONType = string | JSONType[] | { [name: string]: JSONType };

/**
 * Recursively encode a json object as a urlencoded object.
 * @param {JSONType} o The object to encode
 * @return {string} the url encoded object.
 */
function encodeRecursive(o: JSONType): string {
  if (Array.isArray(o)) {
    return o.map((k) => encodeURIComponent(encodeRecursive(k))).join("&");
  } else if (typeof o === "object") {
    return Object.keys(o)
      .map(
        (k) =>
          encodeURIComponent(k) +
          "=" +
          encodeURIComponent(encodeRecursive(o[k]))
      )
      .join("&");
  } else {
    return o;
  }
}

app.get("/encode", async (req, res) => {
  functions.logger.info(req.path);
  const body = await fetch(`https://raw.githubusercontent.com/${req.path}`);
  const json = await body.json();
  const urlEncoded = encodeRecursive(json);
  res.send(urlEncoded);
});

app.post("/encode", async (req, res) => {
  const urlEncoded = encodeRecursive(req.body);
  res.send(urlEncoded);
});

function decodeObject(str: string): Record<string, string> {
  if (str === undefined) {
    return {};
  }

  const obj: Record<string, string> = {};
  str
    .split("&")
    .filter((s) => s)
    .forEach((kv: string) => {
      const [key, value] = kv.split("=");
      obj[decodeURIComponent(key)] = decodeURIComponent(value);
    });
  return obj;
}

function decodeArray(str: string): string[] {
  if (str === undefined) {
    return [];
  }

  return str.split("&").map(decodeURIComponent);
}

app.post("/decode", async (req, res) => {
  const body = decodeObject(req.body);
  const translationMsg = {
    localeCode: body.localeCode,
    authors: decodeArray(body.authors),
    messages: decodeObject(body.messages),
  };
  res.send(translationMsg);
});

export const translationDocument = functions.https.onRequest(app);

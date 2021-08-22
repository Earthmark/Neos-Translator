import * as functions from "firebase-functions";
// import * as admin from "firebase-admin";
import fetch from "node-fetch";

type JSONType = string | JSONType[] |{ [name: string]: JSONType }

/**
 * Recursively encode a json object as a urlencoded object.
 * @param {JSONType} o The object to encode
 * @return {string} the url encoded object.
 */
function encodeRecursive(o: JSONType): string {
  if (Array.isArray(o)) {
    return o.map((k) => encodeURIComponent(encodeRecursive(k))).join("&");
  } else if (typeof o === "object") {
    return Object.keys(o).map((k) =>
      encodeURIComponent(k) + "=" +
       encodeURIComponent(encodeRecursive(o[k]))).join("&");
  } else {
    return encodeURIComponent(o);
  }
}

export const githubTranslationDocProxy = functions.https.onRequest(
    async (req, res) => {
      functions.logger.info(req.path);
      const body = await fetch(`https://raw.githubusercontent.com/${req.path}`);
      const json = await body.json();
      const urlEncoded = encodeRecursive(json);
      res.send(urlEncoded);
    });


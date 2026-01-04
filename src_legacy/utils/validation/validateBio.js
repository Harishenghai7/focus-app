/**
 * validateBio
 * Bio length and content validation.
 * @param {string} bio
 * @returns {boolean} valid
 * @example validateBio('Hello world!')
 */
export default function validateBio(bio) {
  return bio.length <= 160 && !/http|www\./i.test(bio);
}
